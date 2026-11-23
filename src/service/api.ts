// API de demostración local. En un celular físico usa la IP LAN de tu PC.
const BASE = (process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/$/, '');
export const USUARIO_DEMO_ID = process.env.EXPO_PUBLIC_DEMO_USER_ID || '';

export type Equipo = {
  id: string; codigo_interno: string; codigo_qr: string;
  nombre: string; descripcion: string | null; estado: string; area: string;
};
export type Reporte = {
  id: string; equipo_id: string; titulo: string; descripcion: string;
  prioridad: 'baja' | 'media' | 'alta' | 'critica';
  estado: 'pendiente' | 'en_revision' | 'resuelto'; fecha_reporte: string;
};
export type Orden = {
  id: string; reporte_anomalia_id: string | null; equipo_id: string;
  usuario_asignado_id: string | null; titulo: string;
  prioridad: Reporte['prioridad'];
  estado: 'pendiente'|'asignada'|'en_progreso'|'pausada'|'completada'|'cancelada';
  fecha_inicio: string | null; fecha_finalizacion: string | null;
};
export type Tecnico = { id: string; nombre: string; apellido: string };

async function peticion<T>(ruta: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE}${ruta}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    });
  } catch {
    throw new Error('Sin conexión con el servidor. Revisa la dirección de la API y que Node.js esté encendido.');
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.error || `Error del servidor (${res.status})`);
  return data as T;
}

export const obtenerEquipos = () => peticion<Equipo[]>('/api/equipos');
export const obtenerReportes = () => peticion<Reporte[]>('/api/reportes');
export const obtenerOrdenes = () => peticion<Orden[]>('/api/ordenes');
export const obtenerTecnicos = () => peticion<Tecnico[]>('/api/tecnicos');
export const crearReporte = (datos: {
  equipo_id: string; usuario_id: string; titulo: string;
  descripcion: string; prioridad: Reporte['prioridad'];
}) => peticion<Reporte>('/api/reportes', { method: 'POST', body: JSON.stringify(datos) });
export const actualizarEstadoOrden = (id: string, estado: Orden['estado']) =>
  peticion<Orden>(`/api/ordenes/${encodeURIComponent(id)}/estado`, {
    method: 'PATCH', body: JSON.stringify({ estado }),
  });
