import type { Activo, EstadoOrden, OrdenMovil, Prioridad, Sesion } from '@/models/offline';
import { File } from 'expo-file-system';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export class ApiHTTPError extends Error {
  constructor(message:string,public readonly status:number){super(message);this.name='ApiHTTPError';}
}

export const SESION_CLAVE = 'mp_session_v1';
const BASE = (process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/$/, '');

export async function leerSesion(): Promise<Sesion | null> {
  if (Platform.OS === 'web') return null;
  const texto = await SecureStore.getItemAsync(SESION_CLAVE);
  if (!texto) return null;
  try {
    const sesion = JSON.parse(texto) as Sesion;
    if (!sesion.token || !sesion.usuario || Date.parse(sesion.expiresAt) <= Date.now()) {
      await SecureStore.deleteItemAsync(SESION_CLAVE);
      return null;
    }
    return sesion;
  } catch { return null; }
}

export async function guardarSesion(sesion: Sesion): Promise<void> {
  if (Platform.OS === 'web') throw new Error('El inicio de sesión seguro requiere Android o iOS.');
  await SecureStore.setItemAsync(SESION_CLAVE, JSON.stringify(sesion));
}
export async function borrarSesion(): Promise<void> {
  if (Platform.OS !== 'web') await SecureStore.deleteItemAsync(SESION_CLAVE);
}

async function ejecutar<T>(ruta: string, init: RequestInit = {}, autenticado = true): Promise<T> {
  const sesion = autenticado ? await leerSesion() : null;
  if (autenticado && !sesion) throw new Error('Sesión vencida: inicia sesión nuevamente.');
  const headers = new Headers(init.headers);
  if (autenticado && sesion) headers.set('Authorization', `Bearer ${sesion.token}`);
  if (init.body && !(init.body instanceof FormData)) headers.set('Content-Type', 'application/json');
  let respuesta: Response;
  try { respuesta = await fetch(`${BASE}${ruta}`, { ...init, headers }); }
  
catch (error) {
  const metodo = init.method ?? 'GET';
  const detalle = error instanceof Error
    ? error.message
    : String(error);

  console.error(
    'Error de conexión API:',
    metodo,
    `${BASE}${ruta}`,
    detalle
  );

  throw new Error(
    `Falló ${metodo} ${ruta}: ${detalle}`
  );
}

  const data: unknown = await respuesta.json().catch(() => null);
  if (!respuesta.ok) {
    const texto = data && typeof data === 'object' && 'error' in data
      ? String((data as { error: unknown }).error) : `Error HTTP ${respuesta.status}`;
    throw new ApiHTTPError(texto,respuesta.status);
  }
  return data as T;
}

export async function autenticar(correo: string, password: string): Promise<Sesion> {
  return ejecutar<Sesion>('/api/mobile/auth/login', {
    method: 'POST', body: JSON.stringify({ correo, password }),
  }, false);
}
export const verificarSesion = () => ejecutar<{ usuario: Sesion['usuario'] }>('/api/mobile/auth/me');
export const descargarActivos = () => ejecutar<Activo[]>('/api/mobile/activos');

export async function enviarReporte(datos: {
  client_uuid: string; equipo_id: string; titulo: string;
  descripcion: string; prioridad: Prioridad;
}): Promise<{ id: string }> {
  return ejecutar<{ id: string }>('/api/mobile/reportes', {
    method:'POST',body:JSON.stringify(datos),
  });
}


export async function subirFotoReporte(
  reporteId: string,
  clientUUID: string,
  fotoURI: string
): Promise<{ id: string }> {

  // Obtener la fotografía real desde el almacenamiento del celular
  const foto = new File(fotoURI);

  // Comprobar que exista
  if (!foto.exists) {
    throw new Error(
      'No se encontró la fotografía guardada en el teléfono.'
    );
  }

  // Verificar el límite obligatorio de 500 KB
  if (
    foto.size <= 0 ||
    foto.size >= 500_000
  ) {
    throw new Error(
      'La fotografía debe pesar menos de 500 KB.'
    );
  }

  // Preparar el envío compatible con Expo SDK 57
  const datos = new FormData();

  datos.append('client_uuid', clientUUID);

  // File implementa Blob: no utilizar { uri, name, type }
  datos.append('foto', foto);

  // Enviar al backend con la sesión autenticada
  return ejecutar<{ id: string }>(
    `/api/mobile/reportes/${encodeURIComponent(reporteId)}/foto`,
    {
      method: 'POST',
      body: datos,
    }
  );
}

export const obtenerOrdenesMoviles = () => ejecutar<OrdenMovil[]>('/api/mobile/ordenes');
export const cambiarOrdenMovil = (id: string, estado: EstadoOrden) =>
  ejecutar<OrdenMovil>(`/api/mobile/ordenes/${encodeURIComponent(id)}/estado`, {
    method:'PATCH',body:JSON.stringify({estado}),
  });
export const obtenerMetricas = () => ejecutar<{ abiertas:number; completadas:number; mttr_horas:number|null }>(
  '/api/mobile/metricas');
