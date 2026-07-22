function initProducto(productoId) {
  window.RiwiApp?.api?.renderNavbar("producto-nav-links");
  const contenedor = document.getElementById("producto-contenedor");

  if (!productoId) {
    contenedor.innerHTML = `<p class="vacio">Producto no especificado.</p>`;
    return;
  }

  contenedor.innerHTML = skeletonProducto();
  cargarProducto(productoId);
}

function skeletonProducto() {
  return `
    <div class="producto-layout">
      <div class="skeleton" style="aspect-ratio:4/3;border-radius:16px"></div>
      <div>
        <div class="skeleton skeleton-line" style="width:40%;height:14px;margin-bottom:14px"></div>
        <div class="skeleton skeleton-line" style="width:80%;height:28px;margin-bottom:12px"></div>
        <div class="skeleton skeleton-line" style="width:60%;height:12px;margin-bottom:28px"></div>
        <div class="skeleton" style="height:140px;border-radius:12px;margin-bottom:16px"></div>
        <div class="skeleton skeleton-line" style="width:100%;height:40px"></div>
      </div>
    </div>
  `;
}

async function cargarProducto(productoId) {
  const contenedor = document.getElementById("producto-contenedor");
  try {
    const [dataProducto, dataCalificaciones] = await Promise.all([
      window.RiwiApp.api.apiFetch(`/productos/${productoId}`),
      window.RiwiApp.api.apiFetch(`/productos/${productoId}/calificaciones`),
    ]);

    renderProducto(dataProducto.producto, dataCalificaciones.calificaciones);
  } catch (err) {
    contenedor.innerHTML = `<p class="vacio">${err.message}</p>`;
  }
}

function renderProducto(p, calificaciones) {
  const contenedor = document.getElementById("producto-contenedor");
  const api = window.RiwiApp.api;
  const usuario = api.obtenerUsuario();
  const esDueno = usuario && usuario.id === p.vendedor_id;

  const promedio = calificaciones.length
    ? (calificaciones.reduce((acc, c) => acc + c.puntuacion, 0) / calificaciones.length).toFixed(1)
    : null;

  contenedor.innerHTML = `
    <nav class="breadcrumb" aria-label="Migas de pan">
      <a href="#/catalogo">Catálogo</a>
      <svg class="icon sep" style="width:12px;height:12px"><use href="#i-chevron-right"/></svg>
      <a href="#/catalogo">${p.categoria}</a>
      <svg class="icon sep" style="width:12px;height:12px"><use href="#i-chevron-right"/></svg>
      <span class="current">${p.titulo}</span>
    </nav>

    <div class="producto-layout">
      <div>
        <div class="detalle-portada-contenedor">
          <img src="${api.obtenerImagenUrl(p.url_imagen, p.categoria)}" alt="Portada de ${p.titulo}" class="detalle-portada-img">
        </div>
      </div>

      <div>
        <div class="producto-header">
          <span class="categoria-tag">${p.categoria}</span>
          <h1>${p.titulo}</h1>
          <div class="producto-vendedor">
            <span class="navbar-avatar">${api.iniciales(p.vendedor)}</span>
            <span>Vendido por <strong style="color:var(--color-text)">${p.vendedor}</strong></span>
          </div>
        </div>

        <div class="producto-precio-box">
          <div class="producto-precio">${api.formatoMoneda(p.precio)}</div>
          <div class="producto-rating-line">
            ${promedio
      ? `<svg class="icon"><use href="#i-star"/></svg> <strong style="color:var(--color-text)">${promedio}</strong> · ${calificaciones.length} calificación(es)`
      : `<span>Sin calificaciones aún</span>`}
          </div>

          <div id="producto-mensaje-error" class="mensaje-error"></div>
          <div id="producto-mensaje-exito" class="mensaje-exito"></div>
          <div id="producto-zona-accion"></div>

          <div class="trust-signals">
            <div class="trust-signal">
              <svg class="icon"><use href="#i-lock"/></svg>
              <span><strong>Acceso inmediato al repositorio</strong> tras confirmar la compra.</span>
            </div>
            <div class="trust-signal">
              <svg class="icon"><use href="#i-check-circle"/></svg>
              <span><strong>Producto verificado</strong> por el equipo RIWI antes de publicarse.</span>
            </div>
            <div class="trust-signal">
              <svg class="icon"><use href="#i-shield"/></svg>
              <span>Solo compradores reales pueden calificar al vendedor.</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="producto-descripcion">
      <h3>Descripción</h3>
      <p>${p.descripcion}</p>
    </div>

    <div class="producto-calificaciones">
      <h3>Calificaciones (${calificaciones.length})</h3>
      <div id="producto-lista-calificaciones"></div>
    </div>
  `;

  renderCalificaciones(calificaciones);
  renderZonaAccion(p, usuario, esDueno);
}

function renderCalificaciones(calificaciones) {
  const lista = document.getElementById("producto-lista-calificaciones");
  if (!calificaciones.length) {
    lista.innerHTML = `<p class="vacio" style="padding:20px 0">Este producto todavía no tiene calificaciones.</p>`;
    return;
  }
  lista.innerHTML = calificaciones.map((c) => `
    <div class="calif-item">
      <div class="calif-item-header">
        <span class="calif-item-nombre">${c.comprador}</span>
        <span class="calif-item-rating"><svg class="icon"><use href="#i-star"/></svg> ${c.puntuacion}</span>
      </div>
      ${c.comentario ? `<p class="calif-item-comentario">${c.comentario}</p>` : ""}
    </div>
  `).join("");
}

function renderZonaAccion(producto, usuario, esDueno) {
  const zona = document.getElementById("producto-zona-accion");
  zona.innerHTML = "";
  zona.style.marginTop = "16px";

  if (esDueno) {
    if (producto.estado === "vendido") {
      zona.textContent = "Este producto ya fue vendido y ya no aparece en el catálogo.";
      zona.className = "subtitle";
    } else {
      zona.innerHTML = `
        <p class="subtitle" style="margin-bottom:12px">Este es tu propio producto.</p>
        <div style="display:flex;gap:10px">
          <a href="#/dashboard-vendedor" class="btn" style="flex:1">
            <svg class="icon" style="width:15px;height:15px"><use href="#i-edit"/></svg>
            Editar
          </a>
          <button class="btn btn-danger btn-outline" id="btn-eliminar-producto" style="flex:1">
            <svg class="icon" style="width:15px;height:15px"><use href="#i-trash-2"/></svg>
            Eliminar
          </button>
        </div>
      `;
      document.getElementById("btn-eliminar-producto")?.addEventListener("click", async () => {
        const confirmado = await alertaConfirmar(
          `¿Estás seguro de eliminar "${producto.titulo}"? Esta acción no se puede deshacer.`,
          "Eliminar producto",
          true
        );
        if (!confirmado) return;
        try {
          await window.RiwiApp.api.apiFetch(`/productos/${producto.id}`, { method: "DELETE", auth: true });
          await alertaExito("Producto eliminado correctamente.", "Eliminado");
          window.RiwiApp.router.navegarA("catalogo");
        } catch (err) {
          alertaError(err.message, "No se pudo eliminar el producto");
        }
      });
    }
    return;
  }

  if (producto.estado !== "publicado") {
    zona.textContent = "Este producto ya no está disponible (fue vendido).";
    zona.className = "subtitle";
    return;
  }

  if (!usuario) {
    zona.innerHTML = '<a href="#/login" class="btn btn-block">Inicia sesión para comprar</a>';
    return;
  }

  const enCarrito = window.RiwiApp?.carrito?.estaEnCarrito?.(producto.id);

  if (enCarrito) {
    zona.innerHTML = `<a href="#/carrito" class="btn btn-block"><svg class="icon" style="width:16px;height:16px"><use href="#i-cart"/></svg> Ver en el carrito</a>`;
    return;
  }

  const btn = document.createElement("button");
  btn.className = "btn-block";
  btn.innerHTML = `<svg class="icon" style="width:16px;height:16px"><use href="#i-cart"/></svg> Agregar al carrito`;
  btn.addEventListener("click", async () => {
    btn.disabled = true;
    const agregado = await window.RiwiApp?.carrito?.agregar?.({
      id: producto.id,
      titulo: producto.titulo,
      precio: producto.precio,
      categoria: producto.categoria,
      vendedor: producto.vendedor,
    });
    if (agregado) renderZonaAccion(producto, usuario, esDueno);
    else btn.disabled = false;
  });
  zona.appendChild(btn);
}

window.RiwiApp = window.RiwiApp || {};
window.RiwiApp.views = window.RiwiApp.views || {};
window.RiwiApp.views.producto = initProducto;
