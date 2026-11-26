/**
 * Capa de datos de la web, compatible con las pantallas actuales:
 * Datos.cargar / asignar / crearEquipo / editarEquipo / eliminarEquipo.
 * Comparte cuentas/JWT con la app móvil y lee la MISMA BD PostgreSQL.
 * No depende de Supabase ni mantiene datos ficticios.
 */
(function () {
  'use strict';
  const C = window.CONFIG || {};
  const API = String(C.API_BASE_URL || 'http://127.0.0.1:3001').replace(/\/+$/, '');
  let token = null;
  let usuario = null;
  let esperandoSesion = null;
  let resolverSesion = null;
  let dialogo = null;

  function montarLogin() {
    if (dialogo) return;
    const style = document.createElement('style');
    style.textContent = `
      #web-login-overlay { position:fixed; inset:0; z-index:9999;
        background:rgba(10,20,38,.88); display:grid; place-items:center; padding:20px; }
      #web-login-overlay[hidden] { display:none!important; }
      #web-login-overlay .web-login-box { max-width:430px; width:100%; background:#fff;
        color:#142b45; border-radius:14px; padding:30px; box-shadow:0 20px 65px #0005;
        font-family:Inter,system-ui,sans-serif; }
      #web-login-overlay h2 { margin:0 0 6px; font-size:23px; }
      #web-login-overlay p { color:#5e6e82; line-height:1.45; }
      #web-login-overlay label { display:block; margin:15px 0 6px; font-weight:600; }
      #web-login-overlay input { display:block; width:100%; box-sizing:border-box;
        border:1px solid #94a3b8; background:#fff; color:#142b45;
        padding:12px; border-radius:7px; font:inherit; min-height:48px; }
      #web-login-overlay button { width:100%; min-height:48px; margin-top:20px;
        background:#142b45; color:white; border:0; border-radius:7px;
        cursor:pointer; font:inherit; font-weight:600; }
      #web-login-overlay button:disabled { opacity:.65; cursor:wait; }
      #web-login-error { min-height:24px; margin-top:14px!important; color:#b42318!important; }
    `;
    document.head.appendChild(style);
    dialogo = document.createElement('div');
    dialogo.id = 'web-login-overlay';
    dialogo.hidden = true;
    dialogo.innerHTML = `<form class="web-login-box" id="web-login-form">
      <h2>Acceso al panel</h2>
      <p>Ingresa con una cuenta de <b>Supervisor</b> o <b>Administrador</b>
      de Mantenimiento Planta. Es la misma base de usuarios de la aplicación móvil.</p>
      <label for="web-login-correo">Correo</label>
      <input id="web-login-correo" type="email" autocomplete="username" required maxlength="150">
      <label for="web-login-password">Contraseña</label>
      <input id="web-login-password" type="password" autocomplete="current-password" required>
      <button type="submit" id="web-login-submit">Iniciar sesión</button>
      <p id="web-login-error" role="alert"></p>
    </form>`;
    document.body.appendChild(dialogo);
    dialogo.querySelector('#web-login-form').addEventListener('submit', async event => {
      event.preventDefault();
      const boton = dialogo.querySelector('#web-login-submit');
      const error = dialogo.querySelector('#web-login-error');
      const correo = dialogo.querySelector('#web-login-correo').value.trim();
      const password = dialogo.querySelector('#web-login-password').value;
      boton.disabled = true;
      error.textContent = '';
      try {
        const resp = await fetch(`${API}/api/mobile/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ correo, password }),
          cache: 'no-store',
        });
        const data = await leerJSON(resp);
        if (!resp.ok) throw new Error(data.error || `Inicio de sesión rechazado (${resp.status}).`);
        const roles = Array.isArray(data.usuario?.roles) ? data.usuario.roles : [];
        if (!roles.some(r => r === 'SUPERVISOR' || r === 'ADMIN')) {
          throw new Error('Esta cuenta no tiene permisos para ingresar al panel web.');
        }
        token = data.token;
        usuario = data.usuario;
        actualizarRolesVisibles();
        dialogo.querySelector('#web-login-password').value = '';
        dialogo.hidden = true;
        if (resolverSesion) resolverSesion(token);
        resolverSesion = null;
        esperandoSesion = null;
      } catch (e) {
        error.textContent = e.message || 'Error de inicio de sesión.';
      } finally {
        boton.disabled = false;
      }
    });
  }

  function actualizarRolesVisibles() {
    // La selección por rol de la web es VISUAL. La autorización real está en el servidor.
    // Deshabilitamos la opción Administrador si el JWT no tiene ese rol.
    for (const b of document.querySelectorAll('.rolcard[data-rol]')) {
      const permitido = b.dataset.rol === 'administrador'
        ? usuario?.roles?.includes('ADMIN')
        : usuario?.roles?.some(r => r === 'ADMIN' || r === 'SUPERVISOR');
      b.disabled = !permitido;
      b.style.opacity = permitido ? '' : '0.45';
      b.title = permitido ? '' : 'Tu cuenta no tiene este rol';
    }
    // Compatibilidad con la versión antigua del selector por rol:
    const combo = document.getElementById('rol');
    if (combo) {
      const admin = [...combo.options].find(o => /jefatura|administrador/i.test(o.value));
      if (admin) admin.disabled = !usuario?.roles?.includes('ADMIN');
    }
  }

  function pedirSesion() {
    if (token) return Promise.resolve(token);
    if (esperandoSesion) return esperandoSesion;
    montarLogin();
    dialogo.hidden = false;
    esperandoSesion = new Promise(resolve => { resolverSesion = resolve; });
    setTimeout(() => dialogo.querySelector('#web-login-correo').focus(), 0);
    return esperandoSesion;
  }

  async function leerJSON(resp) {
    const txt = await resp.text();
    if (!txt) return {};
    try { return JSON.parse(txt); }
    catch { return { error: 'El servidor respondió con un formato inesperado.' }; }
  }

  async function solicitar(path, opciones = {}, reintentar = true) {
    await pedirSesion();
    let resp;
    try {
      resp = await fetch(`${API}/api/web${path}`, {
        ...opciones,
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
          ...(opciones.headers || {}),
          Authorization: `Bearer ${token}`,
        },
      });
    } catch {
      throw new Error(`No se pudo conectar con Node.js en ${API}. Verifica que node server.js esté encendido.`);
    }
    if (resp.status === 401 && reintentar) {
      token = null;
      usuario = null;
      return solicitar(path, opciones, false);
    }
    const data = await leerJSON(resp);
    if (!resp.ok) throw new Error(data.error || `Error ${resp.status} en ${path}`);
    return data;
  }

  function armar(d) {
    const areas = Array.isArray(d.areas) ? d.areas : [];
    const equipos = Array.isArray(d.equipos) ? d.equipos : [];
    const ordenes = Array.isArray(d.ordenes) ? d.ordenes : [];
    const reportes = Array.isArray(d.reportes) ? d.reportes : [];
    const A = Object.fromEntries(areas.map(a => [String(a.id), a.nombre]));
    const E = Object.fromEntries(equipos.map(e => [String(e.id), e.nombre]));
    const porReporte = new Map();
    for (const o of [...ordenes].sort((a, b) => Number(b.id) - Number(a.id))) {
      const id = String(o.reporte_anomalia_id);
      if (!porReporte.has(id)) porReporte.set(id, o);
    }
    return {
      areas,
      tecnicos: Array.isArray(d.tecnicos) ? d.tecnicos : [],
      equipos: equipos.map(e => ({ ...e, area: A[String(e.area_id)] || 'Sin área' })),
      ordenes: ordenes.map(o => ({ ...o, equipo: E[String(o.equipo_id)] || 'Sin equipo' })),
      reportes: reportes.map(r => ({
        ...r,
        equipo: E[String(r.equipo_id)] || 'Sin equipo',
        orden: porReporte.get(String(r.id)) || null,
      })),
    };
  }

  async function cargar() { return armar(await solicitar('/datos')); }
  async function asignar(reporte, tecnicoId, prioridad) {
    return solicitar('/asignaciones', {
      method: 'POST',
      body: JSON.stringify({ reporte_id: reporte.id, tecnico_id: tecnicoId, prioridad }),
    });
  }
  async function crearEquipo(f) {
    return solicitar('/equipos', { method: 'POST', body: JSON.stringify(f) });
  }
  async function editarEquipo(id, f) {
    return solicitar(`/equipos/${encodeURIComponent(id)}`, {
      method: 'PATCH', body: JSON.stringify(f),
    });
  }
  async function eliminarEquipo(id) {
    return solicitar(`/equipos/${encodeURIComponent(id)}`, { method: 'DELETE' });
  }

  window.Datos = {
    cargar, asignar, crearEquipo, editarEquipo, eliminarEquipo,
    conectado: true,
  };
})();
