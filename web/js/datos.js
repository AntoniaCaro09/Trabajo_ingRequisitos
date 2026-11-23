// Adaptación de la capa Datos.* del panel original a la API local Node.js/PostgreSQL.
// Mantiene el contrato que utiliza app.js: cargar(), asignar(), crearEquipo().
(function () {
  'use strict';
  const C = window.CONFIG || {};
  const API = (C.API_URL || 'http://localhost:3001').replace(/\/$/, '');

  async function solicitud(ruta, opciones = {}) {
    let respuesta;
    try {
      respuesta = await fetch(`${API}${ruta}`, {
        ...opciones,
        headers: { 'Content-Type': 'application/json', ...(opciones.headers || {}) }
      });
    } catch (e) {
      throw new Error('No se pudo contactar la API. Comprueba que node server.js esté encendido.');
    }
    let datos;
    try { datos = await respuesta.json(); }
    catch { throw new Error(`Respuesta inválida de la API (${respuesta.status})`); }
    if (!respuesta.ok) throw new Error(datos.error || `Error HTTP ${respuesta.status}`);
    return datos;
  }

  // Esta transformación conserva el formato que espera el panel de tu compañera.
  function armar(d) {
    const A = Object.fromEntries(d.areas.map(a => [String(a.id), a.nombre]));
    const E = Object.fromEntries(d.equipos.map(e => [String(e.id), e.nombre]));
    return {
      areas: d.areas, tecnicos: d.tecnicos,
      equipos: d.equipos.map(e => ({ ...e, area: A[String(e.area_id)] || e.area || 'Sin área' })),
      ordenes: d.ordenes.map(o => ({ ...o, equipo: E[String(o.equipo_id)] || 'Equipo desconocido' })),
      reportes: d.reportes.map(r => ({ ...r,
        equipo: E[String(r.equipo_id)] || 'Equipo desconocido',
        orden: d.ordenes.filter(o => String(o.reporte_anomalia_id) === String(r.id))
          .sort((a, b) => Number(b.id) - Number(a.id))[0] || null
      }))
    };
  }

  async function cargar() {
    const [equiposAPI, areasAPI, reportes, ordenes, tecnicos] = await Promise.all([
      solicitud('/api/equipos'), solicitud('/api/areas'), solicitud('/api/reportes'),
      solicitud('/api/ordenes'), solicitud('/api/tecnicos')
    ]);
    const areas = areasAPI.map(a => ({ ...a, id: Number(a.id) }));
    const equipos = equiposAPI.map(e => {
      const area = areas.find(a => a.nombre === e.area);
      return { ...e, id: Number(e.id), area_id: area ? area.id : null,
        numero_serie: e.numero_serie || '' };
    });
    return armar({ equipos, areas,
      reportes: reportes.map(r => ({ ...r, id: Number(r.id), equipo_id: Number(r.equipo_id) })),
      ordenes: ordenes.map(o => ({ ...o, id: Number(o.id), equipo_id: Number(o.equipo_id),
        reporte_anomalia_id: o.reporte_anomalia_id == null ? null : Number(o.reporte_anomalia_id),
        usuario_asignado_id: o.usuario_asignado_id == null ? null : Number(o.usuario_asignado_id) })),
      tecnicos: tecnicos.map(t => ({ ...t, id: Number(t.id) }))
    });
  }

  // Esta operación requiere usuario creador real y ENABLE_DEMO_WRITES=true en backend/.env.
  async function asignar(reporte, tecnicoId, prioridad) {
    if (!C.USUARIO_ID) throw new Error('Configura un USUARIO_ID real en config.js.');
    return solicitud('/api/asignaciones', {
      method: 'POST',
      body: JSON.stringify({ reporte_id: reporte.id, tecnico_id: tecnicoId,
        prioridad, usuario_creador_id: C.USUARIO_ID })
    });
  }

  async function crearReporte(f) {
    if (!C.USUARIO_ID) throw new Error('Configura un USUARIO_ID real en config.js.');
    return solicitud('/api/reportes', {
      method: 'POST', body: JSON.stringify({ ...f, usuario_id: C.USUARIO_ID })
    });
  }

  async function crearEquipo(f) {
    return solicitud('/api/equipos', { method: 'POST', body: JSON.stringify(f) });
  }

  window.Datos = { cargar, asignar, crearEquipo, crearReporte, conectado: true };
})();
