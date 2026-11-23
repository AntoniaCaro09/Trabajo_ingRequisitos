const $ = s => document.querySelector(s);
const esc = t => String(t ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const etq = s => s === 'critica' ? 'Crítica' : (s = String(s).replace(/_/g, ' ')).charAt(0).toUpperCase() + s.slice(1);
const fecha = f => new Date(f).toLocaleString('es-CL', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
const PRIO = ['critica', 'alta', 'media', 'baja'];
const ABIERTAS = ['pendiente', 'asignada', 'en_progreso', 'pausada'];
const CERRADAS = ['completada', 'cancelada'];
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
   <div class="kpi jef"><b>${mttr}</b><span>MTTR (OT completadas)</span></div>
   <div class="kpi jef"><b>—</b><span>MTBF (por calcular)</span></div></div>
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
  <button class="btn acc" id="nuevoReporte" style="margin-bottom:14px">Reportar falla</button>
  <div class="tw"><table><thead><tr><th>N°</th><th>Equipo</th><th>Falla reportada</th><th>Prioridad</th><th>Técnico</th><th>Estado</th><th></th></tr></thead><tbody>${f || '<tr><td colspan="7">No hay reportes.</td></tr>'}</tbody></table></div>`;
}

function act() {
  const l = D.equipos.filter(e => (e.nombre + e.codigo_interno + (e.numero_serie || '')).toLowerCase().includes(fq.toLowerCase()) && (!fe || e.estado === fe))
    .map(e => `<tr><td>${esc(e.codigo_interno)}</td><td>${esc(e.nombre)}</td><td>${esc(e.area)}</td><td>${esc(e.numero_serie || '—')}</td><td><span class="chip ${e.estado}">${etq(e.estado)}</span></td><td><button class="btn sec" data-q="${e.id}">Ver QR</button></td></tr>`).join('');
  return `<h1>Activos de planta</h1><p class="sub">Catálogo de equipos con su código QR.</p>
  <div class="tools"><input id="fq" type="search" placeholder="Buscar por nombre, código o serie" value="${esc(fq)}" aria-label="Buscar activos">
   <select id="fe" aria-label="Filtrar por estado"><option value="">Todos los estados</option>${['operativo', 'en_mantenimiento', 'fuera_de_servicio'].map(e => `<option value="${e}" ${e === fe ? 'selected' : ''}>${etq(e)}</option>`).join('')}</select>
   <button class="btn acc jef" id="nuevo">Agregar activo</button></div>
  <div class="tw"><table><thead><tr><th>Código</th><th>Equipo</th><th>Área</th><th>N° de serie</th><th>Estado</th><th></th></tr></thead><tbody>${l || '<tr><td colspan="6">Ningún equipo coincide con la búsqueda.</td></tr>'}</tbody></table></div>`;
}

function render() {
  $('.logo small').textContent = Datos.conectado ? 'Conectado a la base de datos' : 'Datos de ejemplo';
  $('#main').innerHTML = D ? { panel, ot, activos: act }[vista]() : `<h1>Sin conexión</h1><p class="msg err" role="alert">${esc(msg)}</p><button class="btn" id="reint">Reintentar</button>`;
  document.querySelectorAll('.nav').forEach(b => b.dataset.v === vista ? b.setAttribute('aria-current', 'page') : b.removeAttribute('aria-current'));
}

function qr(e) {
  const d = $('#dlg');
  d.innerHTML = `<h2 style="margin:0 0 4px;font-size:18px">${esc(e.nombre)}</h2><p class="sub" style="margin:0">Código ${esc(e.codigo_interno)} · serie ${esc(e.numero_serie || '—')}</p><div class="qr" id="qrbox"></div><button class="btn sec" id="cerrar">Cerrar</button>`;
  d.showModal();
  try { new QRCode($('#qrbox'), { text: e.codigo_qr, width: 170, height: 170 }); } catch (x) { $('#qrbox').textContent = e.codigo_qr; }
  $('#cerrar').onclick = () => d.close();
}

function nuevoReporte() {
  const d = $('#dlg');
  d.innerHTML = `<h2 style="margin:0 0 4px;font-size:18px">Reportar falla de equipo</h2>
  <p class="msg" id="fmsg" role="status"></p>
  <label for="repEquipo">Equipo</label>
  <select id="repEquipo" style="width:100%"><option value="">Elegir equipo</option>${D.equipos.map(e => `<option value="${e.id}">${esc(e.codigo_interno + ' · ' + e.nombre)}</option>`).join('')}</select>
  <label for="repTitulo">Título de la falla</label><input id="repTitulo" maxlength="150">
  <label for="repDetalle">Descripción</label><textarea id="repDetalle" maxlength="3000" rows="4" style="width:100%;box-sizing:border-box;padding:10px;border:1px solid #b9cae7;border-radius:4px"></textarea>
  <label for="repPrio">Prioridad</label><select id="repPrio" style="width:100%">${PRIO.map(p => `<option value="${p}" ${p === 'media' ? 'selected' : ''}>${etq(p)}</option>`).join('')}</select>
  <div style="display:flex;gap:10px;margin-top:16px"><button class="btn acc" id="guardarReporte">Guardar reporte</button><button class="btn sec" id="cancelarReporte">Cancelar</button></div>`;
  d.showModal();
  $('#cancelarReporte').onclick = () => d.close();
  $('#guardarReporte').onclick = async () => {
    const m = $('#fmsg');
    const f = { equipo_id: Number($('#repEquipo').value), titulo: $('#repTitulo').value.trim(),
      descripcion: $('#repDetalle').value.trim(), prioridad: $('#repPrio').value };
    m.className = 'msg err';
    if (!f.equipo_id || !f.titulo || !f.descripcion) { m.textContent = 'Completa equipo, título y descripción.'; return; }
    $('#guardarReporte').disabled = true;
    try {
      const nuevo = await Datos.crearReporte(f);
      d.close();
      msg = 'Reporte ' + nuevo.id + ' registrado. Ahora puedes asignarlo a un técnico.';
      msgErr = false;
      D = await Datos.cargar();
      render();
    } catch (e) {
      m.textContent = e.message;
      $('#guardarReporte').disabled = false;
    }
  };
}

function nuevo() {
  const d = $('#dlg');
  d.innerHTML = `<h2 style="margin:0 0 4px;font-size:18px">Agregar activo</h2><p class="msg" id="fmsg" role="status"></p>
  <label for="ar">Área</label><select id="ar" style="width:100%"><option value="">Elegir área</option>${D.areas.map(a => `<option value="${a.id}">${esc(a.nombre)}</option>`).join('')}</select>
  <label for="cod">Código interno</label><input id="cod"><label for="n">Nombre del equipo</label><input id="n"><label for="se">N° de serie (opcional)</label><input id="se">
  <div style="display:flex;gap:10px;margin-top:16px"><button class="btn acc" id="gd">Guardar activo</button><button class="btn sec" id="cn">Cancelar</button></div>`;
  d.showModal();
  $('#cn').onclick = () => d.close();
  $('#gd').onclick = async () => {
    const m = $('#fmsg'), a = +$('#ar').value, c = $('#cod').value.trim(), n = $('#n').value.trim(), s = $('#se').value.trim();
    m.className = 'msg err';
    if (!a || !c || !n) { m.textContent = 'Completa área, código interno y nombre.'; return; }
    try {
      const e = await Datos.crearEquipo({ area_id: a, codigo_interno: c, nombre: n, numero_serie: s || null });
      D = await Datos.cargar(); render(); qr(D.equipos.find(x => x.id === e.id) || e);
    } catch (x) { m.textContent = x.message; }
  };
}

document.addEventListener('click', async e => {
  const t = e.target.closest('button'); if (!t) return;
  if (t.dataset.v) { vista = t.dataset.v; msg = ''; render(); }
  if (t.dataset.q) qr(D.equipos.find(x => x.id == t.dataset.q));
  if (t.id === 'nuevo') nuevo();
  if (t.id === 'nuevoReporte') nuevoReporte();
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
$('#rol').addEventListener('change', e => { document.body.className = 'es-' + e.target.value; });
recargar();
