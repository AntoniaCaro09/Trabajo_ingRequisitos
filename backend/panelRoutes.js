'use strict';

// Rutas del panel web para una demostración LOCAL, sin autenticación.
// No publicar en internet sin añadir autenticación, autorización y reglas CORS estrictas.
const express = require('express');

module.exports = function crearRutasPanel(pool) {
  const router = express.Router();
  const soloDesarrollo = (req, res, next) => {
    if (process.env.ENABLE_DEMO_WRITES !== 'true') {
      return res.status(403).json({ error: 'Escrituras desactivadas. Configura ENABLE_DEMO_WRITES=true solo para pruebas locales.' });
    }
    next();
  };
  const enviarError = (res, error, etiqueta) => {
    console.error(etiqueta, error.message);
    if (error.code === '23505') return res.status(409).json({ error: 'Ese código ya está registrado en el área indicada.' });
    if (error.code === '23503') return res.status(400).json({ error: 'El área o usuario indicado no existe.' });
    return res.status(500).json({ error: 'No se pudo completar la operación.' });
  };
  const idValido = n => /^\d+$/.test(String(n ?? '')) && Number(n) > 0;
  const prioridadValida = p => ['baja', 'media', 'alta', 'critica'].includes(p);

  router.get('/reportes', async (req, res) => {
    try {
      const r = await pool.query(`SELECT id, equipo_id, titulo, descripcion, prioridad, estado, fecha_reporte
                                  FROM public.reportes_anomalias ORDER BY fecha_reporte DESC`);
      res.json(r.rows);
    } catch (e) { enviarError(res, e, 'Error consultando reportes:'); }
  });


  // Crear reporte de falla desde el panel (solo laboratorio local).
  router.post('/reportes', soloDesarrollo, async (req, res) => {
    const { equipo_id, usuario_id, titulo, descripcion, prioridad } = req.body || {};
    const nombre = String(titulo || '').trim();
    const detalle = String(descripcion || '').trim();
    if (!idValido(equipo_id) || !idValido(usuario_id) || !nombre || !detalle ||
        nombre.length > 150 || detalle.length > 3000 || !prioridadValida(prioridad)) {
      return res.status(400).json({ error: 'Indica equipo, usuario, título (máximo 150), descripción (máximo 3000) y prioridad válidos.' });
    }
    try {
      const r = await pool.query(`INSERT INTO public.reportes_anomalias
        (equipo_id,usuario_id,titulo,descripcion,prioridad)
        SELECT $1,$2,$3,$4,$5
        WHERE EXISTS(SELECT 1 FROM public.equipos WHERE id=$1)
          AND EXISTS(SELECT 1 FROM public.usuarios WHERE id=$2 AND estado='activo')
        RETURNING id,equipo_id,usuario_id,titulo,descripcion,prioridad,estado,fecha_reporte`,
        [equipo_id, usuario_id, nombre, detalle, prioridad]);
      if (!r.rowCount) return res.status(400).json({ error: 'Equipo o usuario de prueba inexistente/inactivo.' });
      return res.status(201).json(r.rows[0]);
    } catch (e) { enviarError(res, e, 'Error creando reporte:'); }
  });

  router.get('/ordenes', async (req, res) => {
    try {
      const r = await pool.query(`SELECT id, reporte_anomalia_id, equipo_id, usuario_asignado_id,
                                         titulo, prioridad, estado, fecha_inicio, fecha_finalizacion
                                  FROM public.ordenes_trabajo ORDER BY fecha_creacion DESC`);
      res.json(r.rows);
    } catch (e) { enviarError(res, e, 'Error consultando órdenes:'); }
  });

  router.get('/tecnicos', async (req, res) => {
    try {
      const r = await pool.query(`SELECT DISTINCT u.id, u.nombre, u.apellido
        FROM public.usuarios u
        WHERE u.estado = 'activo' AND (
          EXISTS (SELECT 1 FROM public.usuario_roles ur JOIN public.roles ro ON ro.id=ur.rol_id
                  WHERE ur.usuario_id=u.id AND UPPER(ro.codigo)='TECNICO')
          OR EXISTS (SELECT 1 FROM public.usuario_empresa_roles uer JOIN public.roles ro ON ro.id=uer.rol_id
                     WHERE uer.usuario_id=u.id AND UPPER(ro.codigo)='TECNICO')
        ) ORDER BY nombre, apellido`);
      res.json(r.rows);
    } catch (e) { enviarError(res, e, 'Error consultando técnicos:'); }
  });

  router.post('/equipos', soloDesarrollo, async (req, res) => {
    const { area_id, codigo_interno, nombre, numero_serie } = req.body || {};
    if (!idValido(area_id) || !String(codigo_interno || '').trim() || !String(nombre || '').trim() ||
        String(codigo_interno).trim().length > 50 || String(nombre).trim().length > 150 ||
        String(numero_serie || '').length > 100) {
      return res.status(400).json({ error: 'Revisa área, código (máximo 50), nombre (máximo 150) y serie (máximo 100).' });
    }
    try {
      const r = await pool.query(`INSERT INTO public.equipos(area_id,codigo_interno,nombre,numero_serie)
         VALUES ($1,$2,$3,$4) RETURNING id,area_id,codigo_interno,codigo_qr,nombre,numero_serie,estado`,
        [area_id, String(codigo_interno).trim(), String(nombre).trim(), numero_serie ? String(numero_serie).trim() : null]);
      res.status(201).json(r.rows[0]);
    } catch (e) { enviarError(res, e, 'Error creando equipo:'); }
  });

  // Asignar un reporte en una transacción: actualizar orden y reporte de manera atómica.
  router.post('/asignaciones', soloDesarrollo, async (req, res) => {
    const { reporte_id, tecnico_id, prioridad, usuario_creador_id } = req.body || {};
    if (![reporte_id, tecnico_id, usuario_creador_id].every(idValido) || !prioridadValida(prioridad)) {
      return res.status(400).json({ error: 'Indica reporte, técnico, creador y prioridad válidos.' });
    }
    const client = await pool.connect().catch(e => { console.error('Error de conexión:',e.message); return null; });
    if (!client) return res.status(500).json({ error: 'No se pudo conectar a PostgreSQL.' });
    try {
      await client.query('BEGIN');
      const rep = await client.query(`SELECT id,equipo_id,titulo,descripcion,estado FROM public.reportes_anomalias
                                      WHERE id=$1 FOR UPDATE`, [reporte_id]);
      if (!rep.rowCount || rep.rows[0].estado === 'resuelto') {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'No existe el reporte o ya está resuelto.' });
      }
      const tec = await client.query(`SELECT 1 FROM public.usuarios u WHERE u.id=$1 AND u.estado='activo'
        AND (EXISTS(SELECT 1 FROM public.usuario_roles ur JOIN public.roles r ON r.id=ur.rol_id
                    WHERE ur.usuario_id=u.id AND UPPER(r.codigo)='TECNICO')
          OR EXISTS(SELECT 1 FROM public.usuario_empresa_roles ur JOIN public.roles r ON r.id=ur.rol_id
                    WHERE ur.usuario_id=u.id AND UPPER(r.codigo)='TECNICO'))`, [tecnico_id]);
      const creador = await client.query('SELECT 1 FROM public.usuarios WHERE id=$1 AND estado=$2', [usuario_creador_id, 'activo']);
      if (!tec.rowCount || !creador.rowCount) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'El técnico o usuario creador no existe o está inactivo.' });
      }
      const ordenes = await client.query(`SELECT id FROM public.ordenes_trabajo
          WHERE reporte_anomalia_id=$1 AND estado NOT IN ('completada','cancelada')
          ORDER BY id DESC FOR UPDATE`, [reporte_id]);
      let orden;
      if (ordenes.rowCount) {
        const r = await client.query(`UPDATE public.ordenes_trabajo SET usuario_asignado_id=$1, prioridad=$2, estado='asignada'
                                      WHERE id=$3 RETURNING id`, [tecnico_id, prioridad, ordenes.rows[0].id]);
        orden = r.rows[0];
      } else {
        const rep0 = rep.rows[0];
        const r = await client.query(`INSERT INTO public.ordenes_trabajo
          (reporte_anomalia_id,equipo_id,usuario_creador_id,usuario_asignado_id,titulo,descripcion,tipo,prioridad,estado)
          VALUES ($1,$2,$3,$4,$5,$6,'correctivo',$7,'asignada') RETURNING id`,
          [rep0.id, rep0.equipo_id, usuario_creador_id, tecnico_id, rep0.titulo, rep0.descripcion, prioridad]);
        orden = r.rows[0];
      }
      await client.query(`UPDATE public.reportes_anomalias SET estado='en_revision' WHERE id=$1`, [reporte_id]);
      await client.query('COMMIT');
      res.json({ ok: true, orden_id: orden.id });
    } catch (e) {
      await client.query('ROLLBACK').catch(()=>{});
      enviarError(res, e, 'Error asignando reporte:');
    } finally { client.release(); }
  });

  // Actualización de avance de OT, disponible SOLO en laboratorio local.
  // Transacción para mantener consistente el estado de la OT y del reporte.
  
  // Actualizar el estado de una orden de trabajo
  router.patch('/ordenes/:id/estado', soloDesarrollo, async (req, res) => {
    const id = req.params.id;
    const nuevo = req.body?.estado;

    const permitidas = {
      pendiente: ['en_progreso', 'cancelada'],
      asignada: ['en_progreso', 'cancelada'],
      en_progreso: ['pausada', 'completada'],
      pausada: ['en_progreso', 'cancelada'],
      completada: [],
      cancelada: []
    };

    if (!idValido(id) || typeof nuevo !== 'string') {
      return res.status(400).json({
        error: 'Orden o estado inválido.'
      });
    }

    const client = await pool.connect().catch(error => {
      console.error('Error de conexión:', error.message);
      return null;
    });

    if (!client) {
      return res.status(500).json({
        error: 'Sin conexión con PostgreSQL.'
      });
    }

    try {
      await client.query('BEGIN');

      // Buscar y bloquear solamente la orden seleccionada
      const actual = await client.query(
        `SELECT id, estado, reporte_anomalia_id, fecha_inicio
         FROM public.ordenes_trabajo
         WHERE id = $1
         FOR UPDATE`,
        [id]
      );

      if (!actual.rowCount) {
        await client.query('ROLLBACK');

        return res.status(404).json({
          error: 'Orden no encontrada.'
        });
      }

      const orden = actual.rows[0];

      // Validar que el cambio de estado esté permitido
      if (!(permitidas[orden.estado] || []).includes(nuevo)) {
        await client.query('ROLLBACK');

        return res.status(409).json({
          error: `No se permite pasar de ${orden.estado} a ${nuevo}.`
        });
      }

      // $2 actualiza el estado.
      // $3 se utiliza exclusivamente para las comparaciones de texto.
      const resultado = await client.query(
        `UPDATE public.ordenes_trabajo
         SET
           estado = $2,
           fecha_inicio = CASE
             WHEN $3::text = 'en_progreso'
                  AND fecha_inicio IS NULL
             THEN CURRENT_TIMESTAMP
             ELSE fecha_inicio
           END,
           fecha_finalizacion = CASE
             WHEN $3::text = 'completada'
             THEN CURRENT_TIMESTAMP
             ELSE fecha_finalizacion
           END
         WHERE id = $1
         RETURNING
           id,
           reporte_anomalia_id,
           equipo_id,
           usuario_asignado_id,
           titulo,
           prioridad,
           estado,
           fecha_inicio,
           fecha_finalizacion`,
        [id, nuevo, nuevo]
      );

      // Al completar la orden, resolver el reporte asociado
      if (
        orden.reporte_anomalia_id &&
        nuevo === 'completada'
      ) {
        await client.query(
          `UPDATE public.reportes_anomalias
           SET estado = 'resuelto'
           WHERE id = $1`,
          [orden.reporte_anomalia_id]
        );
      }

      await client.query('COMMIT');

      return res.json(resultado.rows[0]);

    } catch (error) {
      await client.query('ROLLBACK').catch(() => {});

      enviarError(
        res,
        error,
        'Error actualizando orden:'
      );

    } finally {
      client.release();
    }
  });


  return router;
};
