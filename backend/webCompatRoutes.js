'use strict';

/**
 * Adaptador web de App Mantenimiento Planta.
 * Usa el MISMO PostgreSQL y JWT del backend móvil.
 * Solo controla /api/web/*; las rutas antiguas /api/* NO quedan protegidas aquí.
 */
const express = require('express');
const jwt = require('jsonwebtoken');

module.exports = function crearRutasWeb(pool) {
  const router = express.Router();
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET debe tener al menos 32 caracteres en backend/.env');
  }

  const rolesValidos = new Set(['OPERARIO', 'TECNICO', 'SUPERVISOR', 'ADMIN']);
  const prioridadesValidas = new Set(['baja', 'media', 'alta', 'critica']);
  const estadosValidos = new Set(['operativo', 'en_mantenimiento', 'fuera_de_servicio']);
  const idValido = id => /^\d+$/.test(String(id ?? '')) && Number(id) > 0;
  const recortar = (valor, max) => typeof valor === 'string' ? valor.trim().slice(0, max + 1) : '';

  const errorBD = (res, error, accion) => {
    console.error(`[web] ${accion}:`, error.message);
    if (error.code === '23505') return res.status(409).json({ error: 'El código o número de serie ya existe.' });
    if (error.code === '23503') return res.status(409).json({ error: 'El registro tiene referencias relacionadas o no existe el área indicada.' });
    if (error.code === '22P02') return res.status(400).json({ error: 'Uno de los valores enviados no es válido.' });
    return res.status(500).json({ error: 'No se pudo completar la operación en PostgreSQL.' });
  };

  async function verificarJWT(req, res, next) {
    try {
      const header = String(req.headers.authorization || '');
      if (!header.startsWith('Bearer ')) return res.status(401).json({ error: 'Debes iniciar sesión.' });
      const payload = jwt.verify(header.slice(7), secret, { issuer: 'mantenimiento-planta' });
      if (typeof payload === 'string' || !idValido(payload.sub)) {
        return res.status(401).json({ error: 'Token inválido.' });
      }
      // Los permisos se consultan a PostgreSQL EN CADA solicitud:
      // cambiar el rol en la base revoca el acceso sin esperar a que caduque el JWT.
      const r = await pool.query(`
        SELECT u.id::text AS id, u.nombre, u.apellido, u.correo,
        COALESCE(ARRAY(
          SELECT DISTINCT UPPER(ro.codigo)
          FROM public.roles ro
          WHERE ro.codigo IS NOT NULL AND (
            EXISTS (SELECT 1 FROM public.usuario_roles ur
                    WHERE ur.usuario_id=u.id AND ur.rol_id=ro.id)
            OR EXISTS (SELECT 1 FROM public.usuario_empresa_roles uer
                       WHERE uer.usuario_id=u.id AND uer.rol_id=ro.id)
          ) ORDER BY UPPER(ro.codigo)
        ), ARRAY[]::text[]) AS roles
        FROM public.usuarios u WHERE u.id=$1 AND u.estado='activo'
      `, [payload.sub]);
      if (!r.rowCount) return res.status(401).json({ error: 'Usuario inexistente o inactivo.' });
      req.usuario = { ...r.rows[0], roles: r.rows[0].roles.filter(rol => rolesValidos.has(rol)) };
      next();
    } catch (e) {
      if (e.name === 'TokenExpiredError' || e.name === 'JsonWebTokenError' || e.name === 'NotBeforeError') {
        return res.status(401).json({ error: 'Sesión vencida o inválida.' });
      }
      return errorBD(res, e, 'Validación de sesión');
    }
  }

  function permitir(...roles) {
    return (req, res, next) => {
      if (!req.usuario?.roles.some(rol => roles.includes(rol))) {
        return res.status(403).json({ error: 'Tu rol no permite realizar esta operación.' });
      }
      next();
    };
  }

  // Toda la API web requiere JWT válido de las mismas cuentas de la app móvil.
  router.use(verificarJWT);
  router.use(permitir('SUPERVISOR', 'ADMIN'));

  router.get('/datos', async (req, res) => {
    try {
      const [areas, equipos, reportes, ordenes, tecnicos] = await Promise.all([
        pool.query(`SELECT id, nombre FROM public.areas ORDER BY nombre`),
        pool.query(`SELECT id, area_id, codigo_interno, codigo_qr,
                           nombre, marca, modelo, numero_serie, estado
                    FROM public.equipos ORDER BY codigo_interno`),
        pool.query(`SELECT id, equipo_id, titulo, descripcion, prioridad, estado, fecha_reporte
                    FROM public.reportes_anomalias ORDER BY fecha_reporte DESC`),
        pool.query(`SELECT id, reporte_anomalia_id, equipo_id, usuario_asignado_id,
                           titulo, prioridad, estado, fecha_inicio, fecha_finalizacion
                    FROM public.ordenes_trabajo ORDER BY id DESC`),
        pool.query(`SELECT DISTINCT u.id, u.nombre, u.apellido
                    FROM public.usuarios u
                    WHERE u.estado='activo' AND (
                      EXISTS (SELECT 1 FROM public.usuario_roles ur
                              JOIN public.roles ro ON ro.id=ur.rol_id
                              WHERE ur.usuario_id=u.id AND UPPER(ro.codigo)='TECNICO')
                      OR EXISTS (SELECT 1 FROM public.usuario_empresa_roles uer
                                 JOIN public.roles ro ON ro.id=uer.rol_id
                                 WHERE uer.usuario_id=u.id AND UPPER(ro.codigo)='TECNICO')
                    ) ORDER BY nombre, apellido`),
      ]);
      res.set('Cache-Control', 'no-store');
      return res.json({
        areas: areas.rows,
        equipos: equipos.rows,
        reportes: reportes.rows,
        ordenes: ordenes.rows,
        tecnicos: tecnicos.rows,
      });
    } catch (e) { return errorBD(res, e, 'Consultando panel'); }
  });

  router.post('/asignaciones', async (req, res) => {
    const { reporte_id, tecnico_id, prioridad } = req.body || {};
    if (!idValido(reporte_id) || !idValido(tecnico_id) || !prioridadesValidas.has(prioridad)) {
      return res.status(400).json({ error: 'Indica reporte, técnico y prioridad válidos.' });
    }
    let client;
    try {
      client = await pool.connect();
      await client.query('BEGIN');
      const rep = await client.query(`SELECT id, equipo_id, titulo, descripcion, estado
                                     FROM public.reportes_anomalias WHERE id=$1 FOR UPDATE`, [reporte_id]);
      if (!rep.rowCount || rep.rows[0].estado === 'resuelto') {
        await client.query('ROLLBACK');
        return res.status(409).json({ error: 'El reporte no existe o ya fue resuelto.' });
      }
      const tec = await client.query(`SELECT 1 FROM public.usuarios u WHERE u.id=$1 AND u.estado='activo'
        AND (EXISTS(SELECT 1 FROM public.usuario_roles ur JOIN public.roles r ON r.id=ur.rol_id
                    WHERE ur.usuario_id=u.id AND UPPER(r.codigo)='TECNICO')
          OR EXISTS(SELECT 1 FROM public.usuario_empresa_roles ur JOIN public.roles r ON r.id=ur.rol_id
                    WHERE ur.usuario_id=u.id AND UPPER(r.codigo)='TECNICO'))`, [tecnico_id]);
      if (!tec.rowCount) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'El técnico no existe, está inactivo o no tiene el rol TECNICO.' });
      }
      const ot = await client.query(`SELECT id FROM public.ordenes_trabajo
          WHERE reporte_anomalia_id=$1 AND estado NOT IN ('completada','cancelada')
          ORDER BY id DESC FOR UPDATE`, [reporte_id]);
      let orden;
      if (ot.rowCount) {
        const r = await client.query(`UPDATE public.ordenes_trabajo
                    SET usuario_asignado_id=$1, prioridad=$2, estado='asignada'
                    WHERE id=$3 RETURNING id`, [tecnico_id, prioridad, ot.rows[0].id]);
        orden = r.rows[0];
      } else {
        const r = await client.query(`INSERT INTO public.ordenes_trabajo
          (reporte_anomalia_id,equipo_id,usuario_creador_id,usuario_asignado_id,titulo,
           descripcion,tipo,prioridad,estado)
          VALUES ($1,$2,$3,$4,$5,$6,'correctivo',$7,'asignada') RETURNING id`, [
            rep.rows[0].id, rep.rows[0].equipo_id, req.usuario.id, tecnico_id,
            rep.rows[0].titulo, rep.rows[0].descripcion, prioridad,
          ]);
        orden = r.rows[0];
      }
      await client.query(`UPDATE public.reportes_anomalias SET estado='en_revision' WHERE id=$1`, [reporte_id]);
      await client.query('COMMIT');
      return res.json({ ok: true, orden_id: orden.id });
    } catch (e) {
      if (client) await client.query('ROLLBACK').catch(() => {});
      return errorBD(res, e, 'Asignando OT');
    } finally { if (client) client.release(); }
  });

  function validarEquipo(body, requiereEstado) {
    const area_id = body?.area_id;
    const codigo_interno = recortar(body?.codigo_interno, 50);
    const nombre = recortar(body?.nombre, 150);
    const marca = recortar(body?.marca, 100) || null;
    const modelo = recortar(body?.modelo, 100) || null;
    const numero_serie = recortar(body?.numero_serie, 100) || null;
    const estado = body?.estado;
    if (!idValido(area_id) || !codigo_interno || codigo_interno.length > 50 ||
        !nombre || nombre.length > 150 || (marca && marca.length > 100) ||
        (modelo && modelo.length > 100) || (numero_serie && numero_serie.length > 100) ||
        (requiereEstado && !estadosValidos.has(estado))) return null;
    return { area_id, codigo_interno, nombre, marca, modelo, numero_serie, estado };
  }

  router.post('/equipos', permitir('ADMIN'), async (req, res) => {
    const f = validarEquipo(req.body, false);
    if (!f) return res.status(400).json({ error: 'Completa área, código y nombre. Comprueba las longitudes de los campos.' });
    try {
      const r = await pool.query(`INSERT INTO public.equipos
        (area_id,codigo_interno,nombre,marca,modelo,numero_serie)
        VALUES ($1,$2,$3,$4,$5,$6)
        RETURNING id,area_id,codigo_interno,codigo_qr,nombre,marca,modelo,numero_serie,estado`,
        [f.area_id, f.codigo_interno, f.nombre, f.marca, f.modelo, f.numero_serie]);
      return res.status(201).json(r.rows[0]);
    } catch (e) { return errorBD(res, e, 'Creando equipo'); }
  });

  router.patch('/equipos/:id', permitir('ADMIN'), async (req, res) => {
    if (!idValido(req.params.id)) return res.status(400).json({ error: 'ID de equipo inválido.' });
    const f = validarEquipo(req.body, true);
    if (!f) return res.status(400).json({ error: 'Datos o estado del equipo inválidos.' });
    try {
      const r = await pool.query(`UPDATE public.equipos SET
        area_id=$2, codigo_interno=$3, nombre=$4, marca=$5, modelo=$6,
        numero_serie=$7, estado=$8 WHERE id=$1
        RETURNING id,area_id,codigo_interno,codigo_qr,nombre,marca,modelo,numero_serie,estado`,
        [req.params.id, f.area_id, f.codigo_interno, f.nombre, f.marca, f.modelo, f.numero_serie, f.estado]);
      if (!r.rowCount) return res.status(404).json({ error: 'Equipo no encontrado.' });
      return res.json(r.rows[0]);
    } catch (e) { return errorBD(res, e, 'Editando equipo'); }
  });

  router.delete('/equipos/:id', permitir('ADMIN'), async (req, res) => {
    if (!idValido(req.params.id)) return res.status(400).json({ error: 'ID de equipo inválido.' });
    let client;
    try {
      client = await pool.connect();
      await client.query('BEGIN');
      const r = await client.query('SELECT id FROM public.equipos WHERE id=$1 FOR UPDATE', [req.params.id]);
      if (!r.rowCount) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Equipo no encontrado.' });
      }
      const refs = await client.query(`SELECT
        (SELECT COUNT(*)::int FROM public.reportes_anomalias WHERE equipo_id=$1) AS reportes,
        (SELECT COUNT(*)::int FROM public.ordenes_trabajo WHERE equipo_id=$1) AS ordenes`, [req.params.id]);
      if (refs.rows[0].reportes || refs.rows[0].ordenes) {
        await client.query('ROLLBACK');
        return res.status(409).json({ error: 'Este equipo tiene historial. Márcalo como fuera de servicio, no lo elimines.' });
      }
      await client.query('DELETE FROM public.equipos WHERE id=$1', [req.params.id]);
      await client.query('COMMIT');
      return res.json({ ok: true });
    } catch (e) {
      if (client) await client.query('ROLLBACK').catch(() => {});
      return errorBD(res, e, 'Eliminando equipo');
    } finally { if (client) client.release(); }
  });

  return router;
};
