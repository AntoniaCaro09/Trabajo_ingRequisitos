// Capa de datos: es el ÚNICO archivo que habla con la base. Las pantallas (app.js) solo usan Datos.*
(function () {
  const C = window.CONFIG || {};
  const sb = C.SUPABASE_URL && window.supabase ? window.supabase.createClient(C.SUPABASE_URL, C.SUPABASE_ANON_KEY) : null;
  const DUP = 'Ya existe un equipo con ese código interno en esa área.', ASOC = 'No se puede eliminar: tiene reportes u órdenes de trabajo asociados.';
  const ok = r => { if (r.error) throw new Error(r.error.message); return r.data; };
  const hace = h => new Date(Date.now() - h * 36e5).toISOString();

  // ---- Datos de ejemplo, con los mismos campos que las tablas ----
  const M = {
    areas: [{ id: 1, nombre: 'Envasado' }, { id: 2, nombre: 'Proceso' }, { id: 3, nombre: 'Servicios' }, { id: 4, nombre: 'Despacho' }],
    usuarios: [{ id: 1, nombre: 'Roberto', apellido: 'Morales' }, { id: 2, nombre: 'Juan', apellido: 'Valenzuela' }, { id: 3, nombre: 'Pedro', apellido: 'Soto' }, { id: 4, nombre: 'Marta', apellido: 'Reyes' }],
    equipos: [
      [1, 1, 'EQ-001', 'Prensa hidráulica H-01', 'HY-2201', 'operativo'], [2, 3, 'EQ-002', 'Compresor de tornillo K-3', 'AC-0481', 'en_mantenimiento'],
      [3, 2, 'EQ-003', 'Bomba centrífuga B-102', 'BC-1020', 'operativo'], [4, 1, 'EQ-004', 'Cinta transportadora C-04', 'CT-0404', 'operativo'],
      [5, 2, 'EQ-005', 'Mezclador continuo M-01', 'MX-0101', 'fuera_de_servicio'], [6, 4, 'EQ-006', 'Paletizador final PAL-05', 'PL-0505', 'operativo']
    ].map(([id, area_id, codigo_interno, nombre, numero_serie, estado]) => ({ id, area_id, codigo_interno, codigo_qr: crypto.randomUUID(), nombre, numero_serie, estado })),
    reportes: [
      { id: 1, equipo_id: 3, titulo: 'Fuga de aceite en sello', descripcion: 'Gotea bajo la bomba', prioridad: 'alta', estado: 'pendiente', fecha_reporte: hace(3) },
      { id: 2, equipo_id: 5, titulo: 'Se detiene por sobrecarga', descripcion: 'Salta el térmico', prioridad: 'critica', estado: 'pendiente', fecha_reporte: hace(4) },
      { id: 3, equipo_id: 4, titulo: 'Ruido anormal en rodillo', descripcion: 'Ruido metálico al girar', prioridad: 'media', estado: 'en_revision', fecha_reporte: hace(20) },
      { id: 4, equipo_id: 1, titulo: 'Falla de sensor de presión', descripcion: 'Lectura en cero', prioridad: 'alta', estado: 'resuelto', fecha_reporte: hace(70) }
    ],
    ordenes: [
      { id: 1, reporte_anomalia_id: 3, equipo_id: 4, usuario_asignado_id: 3, titulo: 'Ruido anormal en rodillo', prioridad: 'media', estado: 'asignada', fecha_inicio: null, fecha_finalizacion: null },
      { id: 2, reporte_anomalia_id: 4, equipo_id: 1, usuario_asignado_id: 4, titulo: 'Falla de sensor de presión', prioridad: 'alta', estado: 'completada', fecha_inicio: hace(66), fecha_finalizacion: hace(63.5) }
    ]
  };

  function armar(d) {
    const A = Object.fromEntries(d.areas.map(a => [a.id, a.nombre])), E = Object.fromEntries(d.equipos.map(e => [e.id, e.nombre]));
    return {
      areas: d.areas, tecnicos: d.tecnicos,
      equipos: d.equipos.map(e => ({ ...e, area: A[e.area_id] })),
      ordenes: d.ordenes.map(o => ({ ...o, equipo: E[o.equipo_id] })),
      reportes: d.reportes.map(r => ({ ...r, equipo: E[r.equipo_id], orden: d.ordenes.filter(o => o.reporte_anomalia_id === r.id).sort((a, b) => b.id - a.id)[0] || null }))
    };
  }

  // Técnicos = usuarios activos con el rol TECNICO, ya sea en usuario_roles o en usuario_empresa_roles
  async function tecnicos() {
    const q = await Promise.all(['usuario_roles', 'usuario_empresa_roles'].map(t =>
      sb.from(t).select('usuario_id,roles!inner(codigo)').eq('roles.codigo', 'TECNICO')));
    const ids = [...new Set(q.map(ok).flat().map(x => x.usuario_id))];
    if (!ids.length) return [];
    return ok(await sb.from('usuarios').select('id,nombre,apellido').eq('estado', 'activo').in('id', ids).order('nombre'));
  }

  async function cargar() {
    if (!sb) return armar({ ...M, tecnicos: M.usuarios.filter(u => u.id !== 1) });
    const [equipos, reportes, ordenes, areas] = (await Promise.all([
      sb.from('equipos').select('id,area_id,codigo_interno,codigo_qr,nombre,marca,modelo,numero_serie,estado').order('codigo_interno'),
      sb.from('reportes_anomalias').select('id,equipo_id,titulo,descripcion,prioridad,estado,fecha_reporte').order('fecha_reporte', { ascending: false }),
      sb.from('ordenes_trabajo').select('id,reporte_anomalia_id,equipo_id,usuario_asignado_id,titulo,prioridad,estado,fecha_inicio,fecha_finalizacion'),
      sb.from('areas').select('id,nombre').order('nombre')
    ])).map(ok);
    return armar({ equipos, reportes, ordenes, areas, tecnicos: await tecnicos() });
  }

  // Asignar = crear (o actualizar) la orden de trabajo del reporte y pasar el reporte a "en_revision"
  async function asignar(r, tecnicoId, prioridad) {
    const o = r.orden && !['completada', 'cancelada'].includes(r.orden.estado) ? r.orden : null;
    if (!sb) {
      if (o) Object.assign(M.ordenes.find(x => x.id === o.id), { usuario_asignado_id: tecnicoId, prioridad });
      else M.ordenes.push({ id: Date.now(), reporte_anomalia_id: r.id, equipo_id: r.equipo_id, usuario_asignado_id: tecnicoId, titulo: r.titulo, prioridad, estado: 'asignada', fecha_inicio: null, fecha_finalizacion: null });
      M.reportes.find(x => x.id === r.id).estado = 'en_revision';
      return;
    }
    if (o) ok(await sb.from('ordenes_trabajo').update({ usuario_asignado_id: tecnicoId, prioridad }).eq('id', o.id));
    else ok(await sb.from('ordenes_trabajo').insert({ reporte_anomalia_id: r.id, equipo_id: r.equipo_id, usuario_creador_id: C.USUARIO_ID, usuario_asignado_id: tecnicoId, titulo: r.titulo, descripcion: r.descripcion, tipo: 'correctivo', prioridad, estado: 'asignada' }));
    ok(await sb.from('reportes_anomalias').update({ estado: 'en_revision' }).eq('id', r.id));
  }

  // El código QR (UUID) lo genera la base de datos
  async function crearEquipo(f) {
    const dup = DUP;
    if (!sb) {
      if (M.equipos.some(e => e.area_id === f.area_id && e.codigo_interno.toLowerCase() === f.codigo_interno.toLowerCase())) throw new Error(dup);
      const e = { id: Date.now(), ...f, codigo_qr: crypto.randomUUID(), estado: 'operativo' };
      M.equipos.push(e); return e;
    }
    const r = await sb.from('equipos').insert({ ...f, estado: 'operativo' }).select().single();
    if (r.error) throw new Error(r.error.code === '23505' ? dup : r.error.message);
    return r.data;
  }

  async function editarEquipo(id, f) {
    if (!sb) {
      if (M.equipos.some(x => x.id !== id && x.area_id === f.area_id && x.codigo_interno.toLowerCase() === f.codigo_interno.toLowerCase())) throw new Error(DUP);
      Object.assign(M.equipos.find(x => x.id === id), f); return;
    }
    const r = await sb.from('equipos').update(f).eq('id', id).select();
    if (r.error) throw new Error(r.error.code === '23505' ? DUP : r.error.message);
    if (!r.data.length) throw new Error('No se pudo guardar: el equipo no existe o no hay permiso para modificarlo.');
  }

  async function eliminarEquipo(id) {
    if (!sb) {
      if (M.reportes.some(r => r.equipo_id === id) || M.ordenes.some(o => o.equipo_id === id)) throw new Error(ASOC);
      M.equipos.splice(M.equipos.findIndex(x => x.id === id), 1); return;
    }
    const r = await sb.from('equipos').delete().eq('id', id).select();
    if (r.error) throw new Error(r.error.code === '23503' ? ASOC : r.error.message);
    if (!r.data.length) throw new Error('No se pudo eliminar: el equipo no existe o no hay permiso para borrarlo.');
  }

  window.Datos = { cargar, asignar, crearEquipo, editarEquipo, eliminarEquipo, conectado: !!sb };
})();
