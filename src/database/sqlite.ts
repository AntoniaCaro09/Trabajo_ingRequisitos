import type { Activo, EntradaCola, Prioridad, ReporteLocal } from '@/models/offline';
import * as Crypto from 'expo-crypto';
import * as SQLite from 'expo-sqlite';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;
export async function abrirDB(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync('mantenimiento_planta.db');
      await db.execAsync(`
        PRAGMA journal_mode = WAL;
        CREATE TABLE IF NOT EXISTS activos (
          id TEXT PRIMARY KEY, area_id TEXT NOT NULL,
          codigo_interno TEXT NOT NULL, codigo_qr TEXT NOT NULL UNIQUE,
          nombre TEXT NOT NULL, descripcion TEXT,
          estado TEXT NOT NULL, area TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_activos_codigo ON activos(codigo_interno);
        CREATE TABLE IF NOT EXISTS reportes (
          id_local TEXT PRIMARY KEY,
          id_servidor TEXT UNIQUE,
          equipo_id TEXT NOT NULL, usuario_id TEXT NOT NULL,
          titulo TEXT NOT NULL, descripcion TEXT NOT NULL,
          prioridad TEXT NOT NULL, estado TEXT NOT NULL DEFAULT 'pendiente',
          fecha_reporte TEXT NOT NULL, foto_uri TEXT,
          sincronizado INTEGER NOT NULL DEFAULT 0 CHECK (sincronizado IN (0,1))
        );
        CREATE TABLE IF NOT EXISTS sync_queue (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          tipo TEXT NOT NULL CHECK(tipo IN ('crear_reporte','subir_foto')),
          referencia_local TEXT NOT NULL,
          usuario_id TEXT NOT NULL,
          payload TEXT NOT NULL,
          intentos INTEGER NOT NULL DEFAULT 0,
          proximo_intento INTEGER NOT NULL DEFAULT 0,
          UNIQUE(tipo,referencia_local)
        );
        CREATE INDEX IF NOT EXISTS idx_cola_proxima ON sync_queue(proximo_intento,id);
      `);
      return db;
    })().catch(error => { dbPromise = null; throw error; });
  }
  return dbPromise;
}

export async function guardarActivos(activos: Activo[]): Promise<void> {
  const db = await abrirDB();
  await db.withExclusiveTransactionAsync(async tx => {
    for (const a of activos) {
      await tx.runAsync(`INSERT INTO activos
        (id,area_id,codigo_interno,codigo_qr,nombre,descripcion,estado,area)
        VALUES (?,?,?,?,?,?,?,?)
        ON CONFLICT(id) DO UPDATE SET
        area_id=excluded.area_id,codigo_interno=excluded.codigo_interno,
        codigo_qr=excluded.codigo_qr,nombre=excluded.nombre,
        descripcion=excluded.descripcion,estado=excluded.estado,area=excluded.area`,
      [String(a.id),String(a.area_id),a.codigo_interno,a.codigo_qr,a.nombre,a.descripcion,a.estado,a.area]);
    }
  });
}

export async function obtenerActivosLocales(): Promise<Activo[]> {
  return (await abrirDB()).getAllAsync<Activo>('SELECT * FROM activos ORDER BY codigo_interno');
}

export async function buscarActivoPorQR(valorQR: string): Promise<Activo | null> {
  const qr = valorQR.trim();
  return (await abrirDB()).getFirstAsync<Activo>(
    'SELECT * FROM activos WHERE LOWER(codigo_qr)=LOWER(?) LIMIT 1', [qr]);
}

export async function crearReporteOffline(datos: {
  equipo_id: string; usuario_id: string; titulo: string;
  descripcion: string; prioridad: Prioridad; foto_uri: string | null;
}): Promise<ReporteLocal> {
  const reporte: ReporteLocal = {
    ...datos, id_local: Crypto.randomUUID(), id_servidor: null,
    estado: 'pendiente', fecha_reporte: new Date().toISOString(), sincronizado: 0,
  };
  const db = await abrirDB();
  await db.withExclusiveTransactionAsync(async tx => {
    await tx.runAsync(`INSERT INTO reportes
      (id_local,id_servidor,equipo_id,usuario_id,titulo,descripcion,prioridad,estado,fecha_reporte,foto_uri,sincronizado)
      VALUES (?,?,?,?,?,?,?,?,?,?,0)`, [
      reporte.id_local,null,reporte.equipo_id,reporte.usuario_id,reporte.titulo,
      reporte.descripcion,reporte.prioridad,reporte.estado,reporte.fecha_reporte,reporte.foto_uri,
    ]);
    await tx.runAsync(`INSERT INTO sync_queue(tipo,referencia_local,usuario_id,payload)
       VALUES (?,?,?,?)`, ['crear_reporte',reporte.id_local,reporte.usuario_id,
      JSON.stringify({client_uuid:reporte.id_local,equipo_id:reporte.equipo_id,
        titulo:reporte.titulo,descripcion:reporte.descripcion,prioridad:reporte.prioridad})]);
    if (reporte.foto_uri) {
      await tx.runAsync(`INSERT INTO sync_queue(tipo,referencia_local,usuario_id,payload)
        VALUES (?,?,?,?)`, ['subir_foto',reporte.id_local,reporte.usuario_id,
        JSON.stringify({foto_uri:reporte.foto_uri, client_uuid:reporte.id_local})]);
    }
  });
  return reporte;
}

export async function obtenerReportesLocales(usuarioId: string): Promise<ReporteLocal[]> {
  return (await abrirDB()).getAllAsync<ReporteLocal>(
    'SELECT * FROM reportes WHERE usuario_id=? ORDER BY fecha_reporte DESC', [usuarioId]);
}

export async function listarCola(usuarioId: string): Promise<EntradaCola[]> {
  return (await abrirDB()).getAllAsync<EntradaCola>(
    'SELECT * FROM sync_queue WHERE usuario_id=? AND proximo_intento<=? ORDER BY id',
    [usuarioId,Date.now()]);
}

export async function obtenerReporteLocal(idLocal: string): Promise<ReporteLocal | null> {
  return (await abrirDB()).getFirstAsync<ReporteLocal>(
    'SELECT * FROM reportes WHERE id_local=?', [idLocal]);
}

export async function marcarReporteSubido(idLocal: string, servidorId: string, queueId: number): Promise<void> {
  const db = await abrirDB();
  await db.withExclusiveTransactionAsync(async tx => {
    await tx.runAsync('UPDATE reportes SET id_servidor=? WHERE id_local=?', [servidorId,idLocal]);
    await tx.runAsync('DELETE FROM sync_queue WHERE id=?', [queueId]);
    await tx.runAsync(`UPDATE reportes SET sincronizado=1 WHERE id_local=?
      AND NOT EXISTS(SELECT 1 FROM sync_queue WHERE referencia_local=?)`, [idLocal,idLocal]);
  });
}

export async function marcarFotoSubida(idLocal: string, queueId: number): Promise<void> {
  const db = await abrirDB();
  await db.withExclusiveTransactionAsync(async tx => {
    await tx.runAsync('DELETE FROM sync_queue WHERE id=?', [queueId]);
    await tx.runAsync(`UPDATE reportes SET sincronizado=1 WHERE id_local=?
      AND id_servidor IS NOT NULL
      AND NOT EXISTS(SELECT 1 FROM sync_queue WHERE referencia_local=?)`, [idLocal,idLocal]);
  });
}

export async function reintentarCola(id: number, intentos: number): Promise<void> {
  const demora = Math.min(60_000 * (2 ** Math.min(intentos,6)), 3_600_000);
  await (await abrirDB()).runAsync(
    'UPDATE sync_queue SET intentos=?,proximo_intento=? WHERE id=?',
    [intentos,Date.now()+demora,id]);
}

export async function reactivarCola(usuarioId:string):Promise<void>{
  await (await abrirDB()).runAsync('UPDATE sync_queue SET proximo_intento=0 WHERE usuario_id=?',[usuarioId]);
}
