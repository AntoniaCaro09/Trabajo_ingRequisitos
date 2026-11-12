const TEC=['Juan Valenzuela','Carlos Muñoz','Pedro Soto','Marta Reyes'];
const PRIO=['Highest','High','Medium','Low'];
let activos=[
 {id:'EQ-001',nombre:'Prensa hidráulica H-01',area:'Envasado',serie:'HY-2201',estado:'Operativo'},
 {id:'EQ-002',nombre:'Compresor de tornillo K-3',area:'Servicios',serie:'AC-0481',estado:'Mantenimiento'},
 {id:'EQ-003',nombre:'Bomba centrífuga B-102',area:'Proceso',serie:'BC-1020',estado:'Operativo'},
 {id:'EQ-004',nombre:'Cinta transportadora C-04',area:'Envasado',serie:'CT-0404',estado:'Operativo'},
 {id:'EQ-005',nombre:'Mezclador continuo M-01',area:'Proceso',serie:'MX-0101',estado:'Fuera de servicio'},
 {id:'EQ-006',nombre:'Paletizador final PAL-05',area:'Despacho',serie:'PL-0505',estado:'Operativo'}];
let reportes=[
 {id:'R-101',activo:'EQ-003',desc:'Fuga de aceite en sello',por:'Op. Carlos M.',fecha:'05/11 08:10',prio:'High',tec:'',estado:'Pendiente'},
 {id:'R-102',activo:'EQ-005',desc:'Se detiene por sobrecarga',por:'Op. Luis S.',fecha:'05/11 07:42',prio:'Highest',tec:'',estado:'Pendiente'},
 {id:'R-103',activo:'EQ-004',desc:'Ruido anormal en rodillo motor',por:'Op. Ana P.',fecha:'04/11 16:20',prio:'Medium',tec:'Pedro Soto',estado:'Asignada'},
 {id:'R-104',activo:'EQ-002',desc:'Cambio de filtro y purga',por:'Op. Diego R.',fecha:'04/11 10:05',prio:'Low',tec:'Juan Valenzuela',estado:'Asignada'},
 {id:'R-105',activo:'EQ-001',desc:'Falla de sensor de presión',por:'Op. Carlos M.',fecha:'03/11 14:30',prio:'High',tec:'Marta Reyes',estado:'Finalizada'}];
let vista='panel',msg='',msgErr=false,fq='',fe='';
const $=s=>document.querySelector(s);
const esc=t=>String(t).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const nom=id=>(activos.find(a=>a.id===id)||{}).nombre||id;
const cls=e=>e.split(' ')[0];

function panel(){
  const ab=reportes.filter(r=>r.estado!=='Finalizada'),op=activos.filter(a=>a.estado==='Operativo').length;
  const sin=reportes.filter(r=>r.estado==='Pendiente').length;
  const cnt=p=>ab.filter(r=>r.prio===p).length,mx=Math.max(1,...PRIO.map(cnt));
  const crit=ab.filter(r=>r.prio==='Highest'||r.prio==='High');
  return `<h1>Panel de planta</h1><p class="sub">Estado de equipos y órdenes de trabajo al día de hoy.</p>
  <div class="kpis">
   <div class="kpi"><b>${ab.length}</b><span>OT abiertas</span></div>
   <div class="kpi"><b>${sin}</b><span>Reportes sin asignar</span></div>
   <div class="kpi"><b>${Math.round(op/activos.length*100)}%</b><span>Equipos operativos</span></div>
   <div class="kpi jef"><b>2,8 h</b><span>MTTR (dato de ejemplo)</span></div>
   <div class="kpi jef"><b>142 h</b><span>MTBF (dato de ejemplo)</span></div></div>
  <div class="two"><div class="box"><h2>OT abiertas por prioridad</h2>
   ${PRIO.map(p=>`<div class="bar"><span>${p}</span><i class="${p}" style="width:${cnt(p)/mx*100}%;min-width:4px"></i><b>${cnt(p)}</b></div>`).join('')}</div>
  <div class="box"><h2>Requieren atención</h2>
   ${crit.map(r=>`<div class="alert"><b>${esc(nom(r.activo))}</b> · ${r.prio}<small>${esc(r.desc)} – ${r.fecha}</small></div>`).join('')||'<p class="sub">No hay alertas críticas.</p>'}</div></div>`;
}
function ot(){
  const f=reportes.map((r,i)=>`<tr><td>${r.id}</td><td>${esc(nom(r.activo))}</td><td>${esc(r.desc)}<br><small class="sub">${esc(r.por)} · ${r.fecha}</small></td>
  <td><select data-p="${i}" ${r.estado==='Finalizada'?'disabled':''} aria-label="Prioridad ${r.id}">${PRIO.map(p=>`<option ${p===r.prio?'selected':''}>${p}</option>`).join('')}</select></td>
  <td><select data-t="${i}" ${r.estado==='Finalizada'?'disabled':''} aria-label="Técnico ${r.id}"><option value="">Elegir técnico</option>${TEC.map(t=>`<option ${t===r.tec?'selected':''}>${t}</option>`).join('')}</select></td>
  <td><span class="chip ${r.estado}">${r.estado}</span></td>
  <td><button class="btn" data-a="${i}" ${r.estado==='Finalizada'?'disabled':''}>Asignar</button></td></tr>`).join('');
  return `<h1>Reportes y órdenes de trabajo</h1><p class="sub">Define la prioridad y el técnico responsable de cada reporte.</p>
  <p class="msg ${msgErr?'err':''}" role="status">${esc(msg)}</p>
  <div class="tw"><table><thead><tr><th>N°</th><th>Equipo</th><th>Falla reportada</th><th>Prioridad</th><th>Técnico</th><th>Estado</th><th></th></tr></thead><tbody>${f}</tbody></table></div>`;
}
function act(){
  const l=activos.filter(a=>(a.nombre+a.id+a.serie).toLowerCase().includes(fq.toLowerCase())&&(!fe||a.estado===fe))
   .map(a=>`<tr><td>${a.id}</td><td>${esc(a.nombre)}</td><td>${esc(a.area)}</td><td>${esc(a.serie)}</td><td><span class="chip ${cls(a.estado)}">${a.estado}</span></td><td><button class="btn sec" data-q="${a.id}">Ver QR</button></td></tr>`).join('');
  return `<h1>Activos de planta</h1><p class="sub">Catálogo de equipos con su código QR.</p>
  <div class="tools"><input id="fq" type="search" placeholder="Buscar por nombre, código o serie" value="${esc(fq)}" aria-label="Buscar activos">
   <select id="fe" aria-label="Filtrar por estado"><option value="">Todos los estados</option>${['Operativo','Mantenimiento','Fuera de servicio'].map(e=>`<option ${e===fe?'selected':''}>${e}</option>`).join('')}</select>
   <button class="btn acc jef" id="nuevo">Agregar activo</button></div>
  <div class="tw"><table><thead><tr><th>Código</th><th>Equipo</th><th>Área</th><th>N° de serie</th><th>Estado</th><th></th></tr></thead><tbody>${l||'<tr><td colspan="6">Ningún equipo coincide con la búsqueda.</td></tr>'}</tbody></table></div>`;
}
function render(){
  $('#main').innerHTML={panel,ot,activos:act}[vista]();
  document.querySelectorAll('.nav').forEach(b=>b.toggleAttribute('aria-current',b.dataset.v===vista)||0);
  document.querySelectorAll('.nav').forEach(b=>{if(b.dataset.v===vista)b.setAttribute('aria-current','page')});
}
function qr(a){
  const d=$('#dlg');
  d.innerHTML=`<h2 style="margin:0 0 4px;font-size:18px">${esc(a.nombre)}</h2><p class="sub" style="margin:0">Código ${a.id} · serie ${esc(a.serie)}</p><div class="qr" id="qrbox"></div><button class="btn sec" id="cerrar">Cerrar</button>`;
  d.showModal();
  try{new QRCode($('#qrbox'),{text:a.id,width:170,height:170})}catch(e){$('#qrbox').textContent=a.id}
  $('#cerrar').onclick=()=>d.close();
}
function nuevo(){
  const d=$('#dlg');
  d.innerHTML=`<h2 style="margin:0 0 4px;font-size:18px">Agregar activo</h2><p class="msg" id="fmsg" role="status"></p>
  <label for="n">Nombre del equipo</label><input id="n"><label for="ar">Área</label><input id="ar"><label for="se">N° de serie</label><input id="se">
  <div style="display:flex;gap:10px;margin-top:16px"><button class="btn acc" id="gd">Guardar activo</button><button class="btn sec" id="cn">Cancelar</button></div>`;
  d.showModal();
  $('#cn').onclick=()=>d.close();
  $('#gd').onclick=()=>{
    const n=$('#n').value.trim(),ar=$('#ar').value.trim(),se=$('#se').value.trim(),m=$('#fmsg');
    m.className='msg err';
    if(!n||!ar||!se){m.textContent='Completa nombre, área y número de serie.';return}
    if(activos.some(a=>a.serie.toLowerCase()===se.toLowerCase())){m.textContent='Ese número de serie ya existe. No se registró el activo.';return}
    const a={id:'EQ-'+String(activos.length+1).padStart(3,'0'),nombre:n,area:ar,serie:se,estado:'Operativo'};
    activos.push(a);render();qr(a);
  };
}
document.addEventListener('click',e=>{
  const t=e.target.closest('button');if(!t)return;
  if(t.dataset.v){vista=t.dataset.v;msg='';render()}
  if(t.dataset.q)qr(activos.find(a=>a.id===t.dataset.q));
  if(t.id==='nuevo')nuevo();
  if(t.dataset.a!==undefined){
    const r=reportes[t.dataset.a];
    if(!r.tec){msg='Elige un técnico antes de asignar '+r.id+'.';msgErr=true}
    else{r.estado='Asignada';msg=r.id+' asignada a '+r.tec+' con prioridad '+r.prio+'.';msgErr=false}
    render();
  }
});
document.addEventListener('change',e=>{
  const t=e.target;
  if(t.dataset.p!==undefined)reportes[t.dataset.p].prio=t.value;
  if(t.dataset.t!==undefined)reportes[t.dataset.t].tec=t.value;
  if(t.id==='fe'){fe=t.value;render()}

});
document.addEventListener('input',e=>{
  if(e.target.id==='fq'){fq=e.target.value;const p=e.target.selectionStart;render();const i=$('#fq');i.focus();i.setSelectionRange(p,p)}
});
const USERS=[
 {mail:'supervisor@planta.cl',pass:'super123',nombre:'Roberto Morales',rol:'supervisor',etq:'Supervisor de mantenimiento'},
 {mail:'jefatura@planta.cl',pass:'jefe123',nombre:'Elena Rivera',rol:'jefatura',etq:'Jefatura de planta'},
 {mail:'tecnico@planta.cl',pass:'tec123',nombre:'Juan Valenzuela',rol:'tecnico',etq:'Técnico de mantenimiento'}];
$('#lf').addEventListener('submit',e=>{
  e.preventDefault();
  const u=USERS.find(x=>x.mail===$('#em').value.trim().toLowerCase()&&x.pass===$('#pw').value),er=$('#lerr');
  if(!u){er.textContent='Correo o contraseña incorrectos. Revisa los datos e intenta de nuevo.';return}
  if(u.rol==='tecnico'){er.textContent='Tu perfil trabaja desde la app móvil. Esta web es solo para supervisión y jefatura.';return}
  er.textContent='';
  document.body.className='es-'+u.rol;
  $('#uname').textContent=u.nombre;$('#urol').textContent=u.etq;
  vista='panel';msg='';
  $('#login').hidden=true;$('.app').hidden=false;render();
});
$('#salir').addEventListener('click',()=>{
  $('#dlg').close();$('.app').hidden=true;$('#login').hidden=false;
  $('#lf').reset();$('#lerr').textContent='';document.body.className='';
});
