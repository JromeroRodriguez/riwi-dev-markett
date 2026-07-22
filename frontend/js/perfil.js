function initPerfil() {
  const api = window.RiwiApp?.api;
  const usuarioActual = api?.protegerPagina();
  if (!usuarioActual) return;
  api?.renderNavbar("perfil-nav-links");
  cargarPerfil();
}

function etiquetaRolPerfil(rol) {
  const mapa = { administrador: "Administrador", vendedor: "Vendedor", comprador: "Comprador" };
  return mapa[rol] || rol;
}

async function cargarPerfil() {
  try {
    const data = await window.RiwiApp.api.apiFetch("/auth/perfil", { auth: true });
    const u = data.usuario;
    const api = window.RiwiApp.api;

    api.guardarSesion(api.obtenerToken(), u);

    document.getElementById("perfil-info-perfil").innerHTML = `
      <div style="display:flex;align-items:center;gap:16px">
        <span class="navbar-avatar navbar-avatar-lg" style="width:56px;height:56px;font-size:18px;background:var(--brand-purple)">${api.iniciales(u.nombre)}</span>
        <div>
          <p style="margin:0;font-size:18px;font-weight:600">${u.nombre}</p>
          <p class="info-secundaria" style="margin:2px 0 0">${u.email}</p>
          <p style="margin-top:6px"><span class="badge activo">${etiquetaRolPerfil(u.rol)}</span></p>
        </div>
      </div>
    `;

    renderZonaVendedor(u);
  } catch (err) {
    alertaError(err.message);
  }
}

function renderZonaVendedor(u) {
  const zona = document.getElementById("perfil-zona-vendedor");

  if (u.rol === "vendedor" || u.rol === "administrador") {
    zona.innerHTML = `
      <h3 style="margin:0 0 8px">Tu zona de vendedor</h3>
      <p class="subtitle" style="margin:0 0 16px">Ya tienes acceso para publicar productos.</p>
      <a href="#/dashboard-vendedor" class="btn">Ir al panel de vendedor</a>
    `;
    return;
  }

  if (u.estado === "pendiente_vendedor") {
    zona.innerHTML = `
      <h3 style="margin:0 0 8px">Solicitud enviada</h3>
      <p class="subtitle">Tu solicitud para ser vendedor está pendiente de revisión por un administrador.</p>
    `;
    return;
  }

  zona.innerHTML = `
    <h3 style="margin:0 0 8px">¿Quieres vender tus productos?</h3>
    <p class="subtitle" style="margin:0 0 16px">Publica y monetiza los proyectos digitales que ya construiste durante tu formación.</p>
    <button id="btn-solicitar">Solicitar convertirme en vendedor</button>
  `;

  document.getElementById("btn-solicitar").addEventListener("click", solicitarVendedor);
}

async function solicitarVendedor() {
  const confirmado = await alertaConfirmar(
    "Un administrador revisará tu solicitud antes de darte acceso para publicar productos.",
    "¿Solicitar convertirte en vendedor?"
  );
  if (!confirmado) return;

  alertaCargando("Enviando solicitud...");
  try {
    await window.RiwiApp.api.apiFetch("/usuarios/solicitud-vendedor", { method: "POST", auth: true });
    await alertaExito("Un administrador la revisará pronto.", "Solicitud enviada");
    cargarPerfil();
  } catch (err) {
    alertaError(err.message);
  }
}

window.RiwiApp = window.RiwiApp || {};
window.RiwiApp.views = window.RiwiApp.views || {};
window.RiwiApp.views.perfil = initPerfil;
