const $ = s => document.querySelector(s);
const esc = t => String(t ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const etq = s => s === 'critica' ? 'Crítica' : (s = String(s).replace(/_/g, ' ')).charAt(0).toUpperCase() + s.slice(1);
const fecha = f => new Date(f).toLocaleString('es-CL', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
const PRIO = ['critica', 'alta', 'media', 'baja'];
const ABIERTAS = ['pendiente', 'asignada', 'en_progreso', 'pausada'];
const CERRADAS = ['completada', 'cancelada'];
const ESTADOS = ['operativo', 'en_mantenimiento', 'fuera_de_servicio'];
let D = null, vista = 'panel', msg = '', msgErr = false, fq = '', fe = '';

async function recargar() {
  try { D = await Datos.cargar(); } catch (e) { D = null; msg = 'No se pudo cargar la base de datos: ' + e.message; msgErr = true; }
  render();
}

function panel() {
  const ab = D.ordenes.filter(o => ABIERTAS.includes(o.estado));
  const sin = D.reportes.filter(r => r.estado === 'pendiente' && !r.orden).length;
  const op = D.equipos.filter(e => e.estado === 'operativo').length;
  const hs = D.ordenes.filter(o => o.estado === 'completada' && o.fecha_inicio && o.fecha_finalizacion).map(o => (new Date(o.fecha_finalizacion) - new Date(o.fecha_inicio)) / 36e5);
  const mttr = hs.length ? (hs.reduce((a, b) => a + b, 0) / hs.length).toFixed(1).replace('.', ',') + ' h' : 'Sin datos';
  const cnt = p => ab.filter(o => o.prioridad === p).length, mx = Math.max(1, ...PRIO.map(cnt));
  const crit = ab.filter(o => o.prioridad === 'critica' || o.prioridad === 'alta');
  return `<h1>Panel de planta</h1><p class="sub">Estado de equipos y órdenes de trabajo.</p>
  <div class="kpis">
   <div class="kpi"><b>${ab.length}</b><span>OT abiertas</span></div>
   <div class="kpi"><b>${sin}</b><span>Reportes sin asignar</span></div>
   <div class="kpi"><b>${D.equipos.length ? Math.round(op / D.equipos.length * 100) : 0}%</b><span>Equipos operativos</span></div>
   <div class="kpi adm"><b>${mttr}</b><span>MTTR (OT completadas)</span></div>
   <div class="kpi adm"><b>—</b><span>MTBF (por calcular)</span></div></div>
  <div class="two"><div class="box"><h2>OT abiertas por prioridad</h2>
   ${PRIO.map(p => `<div class="bar"><span>${etq(p)}</span><i class="${p}" style="width:${cnt(p) / mx * 100}%;min-width:4px"></i><b>${cnt(p)}</b></div>`).join('')}</div>
  <div class="box"><h2>Requieren atención</h2>
   ${crit.map(o => `<div class="alert"><b>${esc(o.equipo)}</b> · ${etq(o.prioridad)}<small>${esc(o.titulo)}</small></div>`).join('') || '<p class="sub">No hay OT críticas ni altas abiertas.</p>'}</div></div>`;
}

function ot() {
  const f = D.reportes.map((r, i) => {
    const o = r.orden, cerr = r.estado === 'resuelto' || (o && CERRADAS.includes(o.estado));
    const est = o ? o.estado : r.estado, pr = o ? o.prioridad : r.prioridad, dis = cerr ? 'disabled' : '';
    return `<tr><td>${r.id}</td><td>${esc(r.equipo)}</td><td>${esc(r.titulo)}<br><small class="sub">${esc(r.descripcion)} · ${fecha(r.fecha_reporte)}</small></td>
    <td><select data-p ${dis} aria-label="Prioridad del reporte ${r.id}">${PRIO.map(p => `<option value="${p}" ${p === pr ? 'selected' : ''}>${etq(p)}</option>`).join('')}</select></td>
    <td><select data-t ${dis} aria-label="Técnico del reporte ${r.id}"><option value="">${D.tecnicos.length ? 'Elegir técnico' : 'Sin técnicos registrados'}</option>${D.tecnicos.map(u => `<option value="${u.id}" ${o && u.id === o.usuario_asignado_id ? 'selected' : ''}>${esc(u.nombre + ' ' + u.apellido)}</option>`).join('')}</select></td>
    <td><span class="chip ${est}">${etq(est)}</span></td>
    <td><button class="btn" data-a="${i}" ${dis}>${o && !cerr ? 'Reasignar' : 'Asignar'}</button></td></tr>`;
  }).join('');
  return `<h1>Reportes y órdenes de trabajo</h1><p class="sub">Define la prioridad y el técnico responsable de cada reporte.</p>
  <p class="msg ${msgErr ? 'err' : ''}" role="status">${esc(msg)}</p>
  <div class="tw"><table><thead><tr><th>N°</th><th>Equipo</th><th>Falla reportada</th><th>Prioridad</th><th>Técnico</th><th>Estado</th><th></th></tr></thead><tbody>${f || '<tr><td colspan="7">No hay reportes.</td></tr>'}</tbody></table></div>`;
}

function act() {
  const l = D.equipos.filter(e => (e.nombre + e.codigo_interno + (e.numero_serie || '')).toLowerCase().includes(fq.toLowerCase()) && (!fe || e.estado === fe))
    .map(e => `<tr><td>${esc(e.codigo_interno)}</td><td>${esc(e.nombre)}</td><td>${esc(e.area)}</td><td>${esc(e.numero_serie || '—')}</td><td><span class="chip ${e.estado}">${etq(e.estado)}</span></td><td class="acc"><button class="btn sec" data-q="${e.id}">Ver QR</button> <button class="btn sec adm" data-ed="${e.id}">Editar</button> <button class="btn del adm" data-del="${e.id}">Eliminar</button></td></tr>`).join('');
  return `<h1>Activos de planta</h1><p class="sub">Catálogo de equipos con su código QR.</p>
  <div class="tools"><input id="fq" type="search" placeholder="Buscar por nombre, código o serie" value="${esc(fq)}" aria-label="Buscar activos">
   <select id="fe" aria-label="Filtrar por estado"><option value="">Todos los estados</option>${['operativo', 'en_mantenimiento', 'fuera_de_servicio'].map(e => `<option value="${e}" ${e === fe ? 'selected' : ''}>${etq(e)}</option>`).join('')}</select>
   <button class="btn acc adm" id="nuevo">Agregar activo</button></div>
  <div class="tw"><table><thead><tr><th>Código</th><th>Equipo</th><th>Área</th><th>N° de serie</th><th>Estado</th><th></th></tr></thead><tbody>${l || '<tr><td colspan="6">Ningún equipo coincide con la búsqueda.</td></tr>'}</tbody></table></div>`;
}

function render() {
  $('.logo small').textContent = Datos.conectado ? 'Conectado a la base de datos' : 'Datos de ejemplo';
  $('#main').innerHTML = D ? { panel, ot, activos: act }[vista]() : `<h1>Sin conexión</h1><p class="msg err" role="alert">${esc(msg)}</p><button class="btn" id="reint">Reintentar</button>`;
  document.querySelectorAll('.nav').forEach(b => b.dataset.v === vista ? b.setAttribute('aria-current', 'page') : b.removeAttribute('aria-current'));
}

function qr(e) {
  const d = $('#dlg');
  d.innerHTML = `<h2 style="margin:0 0 4px;font-size:18px">${esc(e.nombre)}</h2><p class="sub" style="margin:0">Código ${esc(e.codigo_interno)} · serie ${esc(e.numero_serie || '—')}</p><div class="qr" id="qrbox"></div><div style="display:flex;gap:10px"><button class="btn" id="imp">Imprimir QR</button><button class="btn sec" id="cerrar">Cerrar</button></div>`;
  d.showModal();
  try { new QRCode($('#qrbox'), { text: e.codigo_qr, width: 170, height: 170 }); } catch (x) { $('#qrbox').textContent = e.codigo_qr; }
  $('#cerrar').onclick = () => d.close();
  $('#imp').onclick = () => {
    const el = $('#qrbox img') || $('#qrbox canvas'), src = el ? (el.src || el.toDataURL()) : '', w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`<title>QR ${esc(e.codigo_interno)}</title><body style="font-family:sans-serif;text-align:center"><h2>${esc(e.nombre)}</h2><p>${esc(e.codigo_interno)}</p><img src="${src}" width="260" onload="print()">`);
    w.document.close();
  };
}

const serieDup = (s, id) => s && D.equipos.some(x => x.id !== id && (x.numero_serie || '').trim().toLowerCase() === s.toLowerCase());

function formEquipo(e) {
  const ed = !!e, d = $('#dlg'), v = k => esc(e ? e[k] ?? '' : '');
  d.innerHTML = `<h2 style="margin:0 0 4px;font-size:18px">${ed ? 'Editar activo' : 'Agregar activo'}</h2><p class="msg" id="fmsg" role="status"></p>
  <label for="ar">Área</label><select id="ar" style="width:100%"><option value="">Elegir área</option>${D.areas.map(a => `<option value="${a.id}" ${ed && a.id === e.area_id ? 'selected' : ''}>${esc(a.nombre)}</option>`).join('')}</select>
  <label for="cod">Código interno</label><input id="cod" value="${v('codigo_interno')}">
  <label for="n">Nombre del equipo</label><input id="n" value="${v('nombre')}">
  <label for="ma">Marca (opcional)</label><input id="ma" value="${v('marca')}">
  <label for="mo">Modelo (opcional)</label><input id="mo" value="${v('modelo')}">
  <label for="se">N° de serie (opcional)</label><input id="se" value="${v('numero_serie')}">
  ${ed ? `<label for="es">Estado</label><select id="es" style="width:100%">${ESTADOS.map(s => `<option value="${s}" ${s === e.estado ? 'selected' : ''}>${etq(s)}</option>`).join('')}</select>` : ''}
  <div style="display:flex;gap:10px;margin-top:16px"><button class="btn acc" id="gd">Guardar</button><button class="btn sec" id="cn">Cancelar</button></div>`;
  d.showModal();
  $('#cn').onclick = () => d.close();
  $('#gd').onclick = async () => {
    const m = $('#fmsg'), f = { area_id: +$('#ar').value, codigo_interno: $('#cod').value.trim(), nombre: $('#n').value.trim(), marca: $('#ma').value.trim() || null, modelo: $('#mo').value.trim() || null, numero_serie: $('#se').value.trim() || null };
    m.className = 'msg err';
    if (!f.area_id || !f.codigo_interno || !f.nombre) { m.textContent = 'Completa área, código interno y nombre.'; return; }
    if (serieDup(f.numero_serie, e && e.id)) { m.textContent = 'Ese número de serie ya existe. No se guardó el activo.'; return; }
    try {
      if (ed) { await Datos.editarEquipo(e.id, { ...f, estado: $('#es').value }); d.close(); D = await Datos.cargar(); render(); }
      else { const n = await Datos.crearEquipo(f); D = await Datos.cargar(); render(); qr(D.equipos.find(x => x.id === n.id) || n); }
    } catch (x) { m.textContent = x.message; }
  };
}

function borrar(e) {
  const d = $('#dlg'), nr = D.reportes.filter(r => r.equipo_id === e.id).length, no = D.ordenes.filter(o => o.equipo_id === e.id).length;
  d.innerHTML = nr || no
    ? `<h2 style="margin:0 0 8px;font-size:18px">No se puede eliminar</h2><p>${esc(e.nombre)} tiene ${nr} reporte(s) y ${no} orden(es) de trabajo asociados, y borrarlo dejaría ese historial sin equipo. Si ya no se usa, edítalo y márcalo como “Fuera de servicio”.</p><button class="btn sec" id="cn">Entendido</button>`
    : `<h2 style="margin:0 0 8px;font-size:18px">Eliminar activo</h2><p class="msg" id="fmsg" role="status"></p><p>¿Eliminar <b>${esc(e.codigo_interno)} · ${esc(e.nombre)}</b>? Esta acción no se puede deshacer.</p><div style="display:flex;gap:10px;margin-top:16px"><button class="btn del" id="ok">Eliminar</button><button class="btn sec" id="cn">Cancelar</button></div>`;
  d.showModal();
  $('#cn').onclick = () => d.close();
  if ($('#ok')) $('#ok').onclick = async () => {
    try { await Datos.eliminarEquipo(e.id); d.close(); D = await Datos.cargar(); render(); }
    catch (x) { $('#fmsg').className = 'msg err'; $('#fmsg').textContent = x.message; }
  };
}

document.addEventListener('click', async e => {
  const t = e.target.closest('button'); if (!t) return;
  if (t.dataset.v) { vista = t.dataset.v; msg = ''; render(); }
  if (t.dataset.q) qr(D.equipos.find(x => x.id == t.dataset.q));
  if (t.id === 'nuevo') formEquipo();
  if (t.dataset.ed) formEquipo(D.equipos.find(x => x.id == t.dataset.ed));
  if (t.dataset.del) borrar(D.equipos.find(x => x.id == t.dataset.del));
  if (t.id === 'reint') recargar();
  if (t.dataset.a !== undefined) {
    const r = D.reportes[t.dataset.a], tr = t.closest('tr'), pr = tr.querySelector('[data-p]').value, tec = tr.querySelector('[data-t]').value;
    if (!tec) { msg = 'Elige un técnico antes de asignar el reporte ' + r.id + '.'; msgErr = true; render(); return; }
    t.disabled = true;
    try { await Datos.asignar(r, +tec, pr); msg = 'Reporte ' + r.id + ' asignado con prioridad ' + etq(pr).toLowerCase() + '.'; msgErr = false; D = await Datos.cargar(); }
    catch (x) { msg = 'No se pudo asignar: ' + x.message; msgErr = true; }
    render();
  }
});
document.addEventListener('change', e => { if (e.target.id === 'fe') { fe = e.target.value; render(); } });
document.addEventListener('input', e => {
  if (e.target.id === 'fq') { fq = e.target.value; const p = e.target.selectionStart; render(); const i = $('#fq'); i.focus(); i.setSelectionRange(p, p); }
});
const ROLES = { administrador: 'Administrador', supervisor: 'Supervisor' };
document.querySelectorAll('.rolcard').forEach(b => b.addEventListener('click', () => {
  document.body.className = 'es-' + b.dataset.rol; $('#urol').textContent = ROLES[b.dataset.rol];
  vista = 'panel'; msg = ''; fq = ''; fe = '';
  $('#inicio').hidden = true; $('.app').hidden = false; render(); window.scrollTo(0, 0);
}));
$('#cambiar').addEventListener('click', () => {
  $('#dlg').close(); $('.app').hidden = true; $('#inicio').hidden = false; document.body.className = '';
});
recargar();
