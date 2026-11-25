import {
    abrirDB, guardarActivos, listarCola, marcarFotoSubida, marcarReporteSubido,
    obtenerReporteLocal, reactivarCola, reintentarCola,
} from '@/database/sqlite';
import NetInfo from '@react-native-community/netinfo';
import * as FileSystem from 'expo-file-system/legacy';
import { AppState, Platform } from 'react-native';
import { descargarActivos, enviarReporte, leerSesion, subirFotoReporte } from './mobileApi';

let sincronizando = false;
let ultimaError: string | null = null;

export async function sincronizarPendientes(): Promise<{procesados:number;error:string|null}> {
  if (Platform.OS === 'web' || sincronizando) return {procesados:0,error:ultimaError};
  const conexion = await NetInfo.fetch();
  // La API puede estar disponible en LAN aunque no exista salida a Internet.
  if (conexion.isConnected !== true) {
    return {procesados:0,error:null};
  }
  const sesion = await leerSesion();
  if (!sesion) return {procesados:0,error:'Necesitas iniciar sesión para sincronizar.'};
  sincronizando = true;
  ultimaError = null;
  let procesados = 0;
  try {
    await abrirDB();
    // Copia de activos para consultar QR aun sin red.
    try { await guardarActivos(await descargarActivos()); }
    catch (e) { ultimaError = e instanceof Error ? e.message : 'No se pudieron descargar los activos'; }
    // Orden de inserción: reporte primero, fotografía después.
    const cola = await listarCola(sesion.usuario.id);
    for (const item of cola) {
      try {
        const reporte = await obtenerReporteLocal(item.referencia_local);
        if (!reporte || reporte.usuario_id !== sesion.usuario.id) {
          throw new Error('Reporte local inexistente o perteneciente a otro usuario.');
        }
        if (item.tipo === 'crear_reporte') {
          const datos = JSON.parse(item.payload) as {
            client_uuid:string; equipo_id:string; titulo:string; descripcion:string;
            prioridad:'baja'|'media'|'alta'|'critica';
          };
          const recibido = await enviarReporte(datos);
          await marcarReporteSubido(item.referencia_local, String(recibido.id),item.id);
        } else {
          if (!reporte.id_servidor) continue; // Dependencia aún sin sincronizar.
          const foto = JSON.parse(item.payload) as {foto_uri:string;client_uuid:string};
          const info = await FileSystem.getInfoAsync(foto.foto_uri);
          if (!info.exists || !('size' in info) || !info.size || info.size >= 500_000) {
            throw new Error('La foto no existe o supera el límite de 500 KB.');
          }
          await subirFotoReporte(reporte.id_servidor, foto.client_uuid, foto.foto_uri);
          await marcarFotoSubida(item.referencia_local,item.id);
        }
        procesados++;
      } catch (error) {
        ultimaError = error instanceof Error ? error.message : 'Fallo de sincronización';
        await reintentarCola(item.id,item.intentos+1);
        // Si el servidor falla, se conserva el registro; se reintentará con la misma UUID.
      }
    }
  } finally { sincronizando = false; }
  return {procesados,error:ultimaError};
}

export function escucharReconexiones(onSync?:()=>void):()=>void {
  // Se suscribe una sola vez desde AuthContext mientras haya sesión.
  let estabaSinRed = false;
  const unsubscribe = NetInfo.addEventListener(estado => {
    const conectado = estado.isConnected === true;
    if (!conectado) {estabaSinRed=true;return;}
    void (async()=>{
      if(estabaSinRed){
        const sesion=await leerSesion();
        if(sesion)await reactivarCola(sesion.usuario.id);
        estabaSinRed=false;
      }
      await sincronizarPendientes();onSync?.();
    })().catch(console.warn);
  });
  const appState = AppState.addEventListener('change', estado => {
    if(estado==='active')void sincronizarPendientes().catch(console.warn);
  });
  // Mientras permanezca abierto, reintenta trabajos pendientes tras fallos transitorios.
  const timer = setInterval(() => {
    void sincronizarPendientes().then(() => onSync?.()).catch(console.warn);
  }, 60_000);
  return () => { unsubscribe();appState.remove();clearInterval(timer); };
}
