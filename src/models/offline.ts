// Correspondencia local con PostgreSQL (equipos / reportes_anomalias).
export type Rol = 'OPERARIO' | 'TECNICO' | 'SUPERVISOR' | 'ADMIN';
export type Prioridad = 'baja' | 'media' | 'alta' | 'critica';
export type EstadoReporte = 'pendiente' | 'en_revision' | 'resuelto';
export type EstadoOrden = 'pendiente' | 'asignada' | 'en_progreso' | 'pausada' | 'completada' | 'cancelada';

export interface Activo {
  id: string;
  area_id: string;
  codigo_interno: string;
  codigo_qr: string;
  nombre: string;
  descripcion: string | null;
  estado: string;
  area: string;
}

export interface ReporteLocal {
  id_local: string;
  id_servidor: string | null;
  equipo_id: string;
  usuario_id: string;
  titulo: string;
  descripcion: string;
  prioridad: Prioridad;
  estado: EstadoReporte;
  fecha_reporte: string;
  foto_uri: string | null;
  sincronizado: number; // SQLite 0/1, equivalente a boolean
}

export type TipoCola = 'crear_reporte' | 'subir_foto';
export interface EntradaCola {
  id: number;
  tipo: TipoCola;
  referencia_local: string;
  usuario_id: string;
  payload: string;
  intentos: number;
  proximo_intento: number;
}

export interface UsuarioSesion {
  id: string;
  nombre: string;
  apellido: string;
  correo: string;
  roles: Rol[];
}
export interface Sesion {
  token: string;
  expiresAt: string;
  usuario: UsuarioSesion;
}

export interface OrdenMovil {
  id: string;
  equipo_id: string;
  reporte_anomalia_id: string | null;
  titulo: string;
  prioridad: Prioridad;
  estado: EstadoOrden;
  usuario_asignado_id: string | null;
}
