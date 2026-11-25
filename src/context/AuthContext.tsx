import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import { abrirDB } from '@/database/sqlite';
import type { Rol, Sesion, UsuarioSesion } from '@/models/offline';
import { ApiHTTPError, autenticar, borrarSesion, guardarSesion, leerSesion, verificarSesion } from '@/services/mobileApi';
import { escucharReconexiones, sincronizarPendientes } from '@/services/syncService';

interface AuthValue {
  usuario: UsuarioSesion | null;
  cargando: boolean;
  ingresar: (correo:string,password:string)=>Promise<void>;
  salir: ()=>Promise<void>;
  tieneRol: (...roles:Rol[])=>boolean;
}
const Auth = createContext<AuthValue | undefined>(undefined);

export function AuthProvider({ children }: React.PropsWithChildren) {
  const [sesion,setSesion] = useState<Sesion|null>(null);
  const [cargando,setCargando] = useState(true);
  useEffect(() => {
    let activo = true;
    (async () => {
      try {
        if (Platform.OS !== 'web') await abrirDB();
        const guardada = await leerSesion();
        if (guardada) {
          // Si no hay conexión, permite acceso offline hasta que expire el token.
          try { const verificada = await verificarSesion();
            if (activo) setSesion({...guardada,usuario:verificada.usuario});
          } catch (e) {
            if (e instanceof ApiHTTPError && (e.status===401 || e.status===403)) {
              await borrarSesion();
            } else if (activo) setSesion(guardada);
          }
        }
      } finally { if (activo) setCargando(false); }
    })().catch(console.warn);
    return () => { activo = false; };
  }, []);

  useEffect(() => {
    if (!sesion || Platform.OS === 'web') return;
    void sincronizarPendientes().catch(console.warn);
    return escucharReconexiones();
  },[sesion]);

  const ingresar = useCallback(async (correo:string,password:string) => {
    const nueva = await autenticar(correo.trim().toLowerCase(),password);
    await guardarSesion(nueva);
    setSesion(nueva);
  },[]);
  const salir = useCallback(async () => { await borrarSesion();setSesion(null); },[]);
  const tieneRol = useCallback((...roles:Rol[]) =>
    Boolean(sesion && roles.some(r => sesion.usuario.roles.includes(r))),[sesion]);
  const valor = useMemo<AuthValue>(() => ({
    usuario:sesion?.usuario ?? null,cargando,ingresar,salir,tieneRol,
  }),[sesion,cargando,ingresar,salir,tieneRol]);
  return <Auth.Provider value={valor}>{children}</Auth.Provider>;
}
export function useAuth(): AuthValue {
  const contexto = useContext(Auth);
  if (!contexto) throw new Error('useAuth requiere AuthProvider');
  return contexto;
}
