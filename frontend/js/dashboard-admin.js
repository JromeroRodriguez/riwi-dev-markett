let filtroEstadoUsuarios = "";

function skeletonListaAdmin(n = 3) {
  return Array.from({ length: n }, () => `<div class="skeleton skeleton-list-item"></div>`).join("");
}

function initDashboardAdmin() {
  const usuario = window.RiwiApp?.api?.protegerPagina(["administrador"]);
  if (!usuario) return;
  window.RiwiApp?.api?.renderNavbar("da-nav-links");

  filtroEstadoUsuarios = "";
  document.querySelectorAll('[data-filtro]').forEach((c) => c.classList.remove("activo"));
  document.querySelector('[data-filtro=""]').classList.add("activo");

  document.getElementById("da-stats-admin").innerHTML = Array.from({ length: 4 }, () => `<div class="skeleton skeleton-stat"></div>`).join("");
  document.getElementById("da-lista-pendientes").innerHTML = skeletonListaAdmin();
  document.getElementById("da-lista-solicitudes").innerHTML = skeletonListaAdmin(2);
  document.getElementById("da-lista-usuarios").innerHTML = skeletonListaAdmin();

  cargarEstadisticasAdmin();
  cargarPendientes();
  cargarSolicitudesVendedor();
  cargarUsuarios();

  document.querySelectorAll('[data-filtro]').forEach((chip) => {
    chip.onclick = () => {
      document.querySelectorAll('[data-filtro]').forEach((c) => c.classList.remove("activo"));
      chip.classList.add("activo");
      filtroEstadoUsuarios = chip.dataset.filtro;
      cargarUsuarios();
    };
    chip.onkeydown = (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); chip.click(); }
    };
  });
}

async function cargarEstadisticasAdmin() {
  try {
    const data = await window.RiwiApp.api.apiFetch("/estadisticas/admin", { auth: true });
    const r = data.resumen;
    document.getElementById("da-stats-admin").innerHTML = `
      <div class="stat-card"><p class="label">Usuarios activos</p><p class="valor">${r.usuarios_activos}</p></div>
      <div class="stat-card"><p class="label">Productos publicados</p><p class="valor">${r.productos_publicados}</p></div>
      <div class="stat-card"><p class="label">Pendientes de revisión</p><p class="valor">${r.pendientes_revision}</p></div>
      <div class="stat-card"><p class="label">Ventas del mes</p><p class="valor">${window.RiwiApp.api.formatoMoneda(r.ingresos_mes_actual)}</p></div>
    `;
  } catch (err) {
    console.error(err);
  }
}

async function cargarPendientes() {
  const contenedor = document.getElementById("da-lista-pendientes");
  try {
    const data = await window.RiwiApp.api.apiFetch("/productos/pendientes", { auth: true });

    if (!data.productos.length) {
      contenedor.innerHTML = `
        <div class="empty-state" style="padding:32px 20px">
          <div class="empty-illo"><svg class="icon"><use href="#i-check-circle"/></svg></div>
          <h3>Todo al día</h3>
          <p>No hay productos pendientes de revisión.</p>
        </div>
      `;
      return;
    }

    const api = window.RiwiApp.api;
    contenedor.innerHTML = data.productos.map((p) => `
      <div class="lista-item">
        <div class="admin-portada-preview">
          <img src="${api.obtenerImagenUrl(p.url_imagen, p.categoria)}" alt="${p.titulo}" class="admin-portada-preview-img">
        </div>
        <div style="flex:1;min-width:0">
          <p style="font-weight:600;margin:0">${p.titulo}</p>
          <p class="info-secundaria">${p.vendedor} · ${p.categoria} · <span style="font-family:var(--mono);color:var(--color-text)">${api.formatoMoneda(p.precio)}</span></p>
        </div>
        <div class="acciones">
          <button data-action="aprobar" data-producto-id="${p.id}">Aprobar</button>
          <button class="peligro" data-action="rechazar" data-producto-id="${p.id}">Rechazar</button>
        </div>
      </div>
    `).join("");

    contenedor.querySelectorAll("[data-action]").forEach((boton) => {
      boton.addEventListener("click", () => {
        const { action, productoId } = boton.dataset;
        if (action === "aprobar") aprobar(productoId);
        if (action === "rechazar") rechazar(productoId);
      });
    });
  } catch (err) {
    contenedor.innerHTML = `<p class="vacio">${err.message}</p>`;
  }
}

async function aprobar(productoId) {
  const confirmado = await alertaConfirmar("El producto pasará a estar visible en el catálogo público.", "¿Aprobar este producto?");
  if (!confirmado) return;
  try {
    await window.RiwiApp.api.apiFetch(`/productos/${productoId}/aprobar`, { method: "PATCH", auth: true });
    toastExito("Producto aprobado");
    cargarPendientes();
    cargarEstadisticasAdmin();
  } catch (err) { alertaError(err.message); }
}

async function rechazar(productoId) {
  const motivo = await alertaInput("Motivo del rechazo", "Explícale al vendedor por qué se rechaza...");
  if (!motivo) return;
  try {
    await window.RiwiApp.api.apiFetch(`/productos/${productoId}/rechazar`, {
      method: "PATCH", auth: true, body: { motivo: motivo.trim() },
    });
    toastExito("Producto rechazado");
    cargarPendientes();
    cargarEstadisticasAdmin();
  } catch (err) { alertaError(err.message); }
}

async function cargarSolicitudesVendedor() {
  const contenedor = document.getElementById("da-lista-solicitudes");
  try {
    const data = await window.RiwiApp.api.apiFetch("/usuarios?estado=pendiente_vendedor", { auth: true });

    if (!data.usuarios.length) {
      contenedor.innerHTML = `<p class="vacio">No hay solicitudes pendientes.</p>`;
      return;
    }

    contenedor.innerHTML = data.usuarios.map((u) => `
      <div class="lista-item">
        <div style="flex:1">
          <p style="font-weight:600;margin:0">${u.nombre}</p>
          <p class="info-secundaria">${u.email}</p>
        </div>
        <div class="acciones">
          <button data-action="aprobar-vendedor" data-usuario-id="${u.id}">Aprobar</button>
          <button class="peligro" data-action="rechazar-vendedor" data-usuario-id="${u.id}">Rechazar</button>
        </div>
      </div>
    `).join("");

    contenedor.querySelectorAll("[data-action]").forEach((boton) => {
      boton.addEventListener("click", () => {
        const { action, usuarioId } = boton.dataset;
        if (action === "aprobar-vendedor") aprobarVendedor(usuarioId);
        if (action === "rechazar-vendedor") rechazarVendedor(usuarioId);
      });
    });
  } catch (err) {
    contenedor.innerHTML = `<p class="vacio">${err.message}</p>`;
  }
}

async function aprobarVendedor(usuarioId) {
  const confirmado = await alertaConfirmar("El usuario podrá empezar a publicar productos.", "¿Aprobar como vendedor?");
  if (!confirmado) return;
  try {
    await window.RiwiApp.api.apiFetch(`/usuarios/${usuarioId}/aprobar-vendedor`, { method: "PATCH", auth: true });
    toastExito("Vendedor aprobado");
    cargarSolicitudesVendedor();
    cargarUsuarios();
  } catch (err) { alertaError(err.message); }
}

async function rechazarVendedor(usuarioId) {
  const confirmado = await alertaConfirmar("El usuario seguirá como comprador.", "¿Rechazar esta solicitud?", true);
  if (!confirmado) return;
  try {
    await window.RiwiApp.api.apiFetch(`/usuarios/${usuarioId}/rechazar-vendedor`, { method: "PATCH", auth: true });
    toastExito("Solicitud rechazada");
    cargarSolicitudesVendedor();
    cargarUsuarios();
  } catch (err) { alertaError(err.message); }
}

function etiquetaRolAdmin(rol) {
  const mapa = { administrador: "Administrador", vendedor: "Vendedor", comprador: "Comprador" };
  return mapa[rol] || rol;
}

async function cargarUsuarios() {
  const contenedor = document.getElementById("da-lista-usuarios");
  const params = filtroEstadoUsuarios ? `?estado=${filtroEstadoUsuarios}` : "";

  try {
    const data = await window.RiwiApp.api.apiFetch(`/usuarios${params}`, { auth: true });

    if (!data.usuarios.length) {
      contenedor.innerHTML = `<p class="vacio">No hay usuarios que coincidan con el filtro.</p>`;
      return;
    }

    contenedor.innerHTML = data.usuarios.map((u) => `
      <div class="lista-item">
        <div style="flex:1;min-width:0">
          <p style="font-weight:600;margin:0;display:flex;align-items:center;gap:8px;flex-wrap:wrap">
            ${u.nombre}
            <span class="badge ${u.estado === 'bloqueado' ? 'bloqueado' : 'activo'}">${u.estado}</span>
          </p>
          <p class="info-secundaria">${u.email} · ${etiquetaRolAdmin(u.rol)}</p>
        </div>
        <div class="acciones">
          ${u.estado === "bloqueado"
            ? `<button class="secundario" data-action="activar-usuario" data-usuario-id="${u.id}">Activar</button>`
            : `<button class="peligro" data-action="bloquear-usuario" data-usuario-id="${u.id}">Bloquear</button>`}
        </div>
      </div>
    `).join("");

    contenedor.querySelectorAll("[data-action]").forEach((boton) => {
      boton.addEventListener("click", () => {
        const { action, usuarioId } = boton.dataset;
        if (action === "activar-usuario") cambiarEstadoUsuario(usuarioId, "activo");
        if (action === "bloquear-usuario") cambiarEstadoUsuario(usuarioId, "bloqueado");
      });
    });
  } catch (err) {
    contenedor.innerHTML = `<p class="vacio">${err.message}</p>`;
  }
}

async function cambiarEstadoUsuario(usuarioId, nuevoEstado) {
  const esBloqueo = nuevoEstado === "bloqueado";
  const confirmado = await alertaConfirmar(
    esBloqueo ? "El usuario no podrá iniciar sesión mientras esté bloqueado." : "El usuario recuperará acceso a la plataforma.",
    esBloqueo ? "¿Bloquear este usuario?" : "¿Activar este usuario?",
    esBloqueo
  );
  if (!confirmado) return;
  try {
    await window.RiwiApp.api.apiFetch(`/usuarios/${usuarioId}/estado`, {
      method: "PATCH", auth: true, body: { estado: nuevoEstado },
    });
    toastExito(esBloqueo ? "Usuario bloqueado" : "Usuario activado");
    cargarUsuarios();
  } catch (err) { alertaError(err.message); }
}

window.RiwiApp = window.RiwiApp || {};
window.RiwiApp.views = window.RiwiApp.views || {};
window.RiwiApp.views.dashboardAdmin = initDashboardAdmin;
