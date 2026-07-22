(function () {
  const app = (window.RiwiApp = window.RiwiApp || {});

  let cacheCarrito = null;

  async function cargarDesdeBackend() {
    if (!app.api?.obtenerUsuario()) {
      cacheCarrito = [];
      return cacheCarrito;
    }
    const data = await app.api.apiFetch("/carrito", { auth: true });
    cacheCarrito = data.carrito || [];
    return cacheCarrito;
  }

  function obtenerCarrito() {
    return cacheCarrito || [];
  }

  async function agregar(producto) {
    const usuario = app.api?.obtenerUsuario();
    if (!usuario) {
      if (typeof alertaError === "function") {
        alertaError("Debes iniciar sesión para agregar productos al carrito");
      }
      return false;
    }

    try {
      await app.api.apiFetch("/carrito", {
        method: "POST",
        auth: true,
        body: { producto_id: producto.id },
      });
    } catch (err) {
      if (err.message.includes("ya está en tu carrito")) {
        if (typeof alertaToast === "function") alertaToast("Este producto ya está en tu carrito", "info");
        return false;
      }
      if (typeof alertaError === "function") alertaError(err.message);
      return false;
    }

    await cargarDesdeBackend();
    actualizarBadge();

    if (typeof alertaToast === "function") alertaToast("Producto agregado al carrito", "success");
    return true;
  }

  async function eliminar(productoId) {
    await app.api.apiFetch(`/carrito/${productoId}`, { method: "DELETE", auth: true });
    await cargarDesdeBackend();
    actualizarBadge();
  }

  async function toggleSeleccion(productoId) {
    await app.api.apiFetch(`/carrito/${productoId}/seleccion`, { method: "PATCH", auth: true });
    await cargarDesdeBackend();
  }

  async function seleccionarTodos(estado) {
    const carrito = obtenerCarrito();
    for (const item of carrito) {
      if (item.seleccionado !== estado) {
        await app.api.apiFetch(`/carrito/${item.producto_id}/seleccion`, { method: "PATCH", auth: true });
      }
    }
    await cargarDesdeBackend();
  }

  function totalCarrito() {
    return obtenerCarrito()
      .filter((item) => item.seleccionado)
      .reduce((suma, item) => suma + Number(item.precio), 0);
  }

  function cantidadCarrito() {
    return obtenerCarrito().length;
  }

  function cantidadSeleccionados() {
    return obtenerCarrito().filter((item) => item.seleccionado).length;
  }

  function estaEnCarrito(productoId) {
    return obtenerCarrito().some((item) => item.producto_id === productoId);
  }

  function actualizarBadge() {
    const fab = document.getElementById("fab-carrito");
    const usuario = app.api?.obtenerUsuario();
    if (fab) fab.style.display = usuario ? "flex" : "none";

    const badges = document.querySelectorAll(".carrito-badge");
    const cantidad = cantidadCarrito();
    badges.forEach((badge) => {
      badge.textContent = cantidad;
      badge.style.display = cantidad > 0 ? "flex" : "none";
      badge.classList.remove("carrito-bounce");
      void badge.offsetWidth;
      if (cantidad > 0) badge.classList.add("carrito-bounce");
    });
  }

  async function initCarrito() {
    const usuario = app.api?.protegerPagina();
    if (!usuario) return;

    app.api.renderNavbar("carrito-nav-links");
    await cargarDesdeBackend();
    renderCarrito();
  }

  async function renderCarrito() {
    const contenedor = document.getElementById("carrito-lista");
    const resumenEl = document.getElementById("carrito-resumen");
    const vacioEl = document.getElementById("carrito-vacio");
    const accionesEl = document.getElementById("carrito-acciones");
    const carrito = obtenerCarrito();

    if (carrito.length === 0) {
      contenedor.innerHTML = "";
      resumenEl.style.display = "none";
      accionesEl.style.display = "none";
      vacioEl.style.display = "block";
      return;
    }

    vacioEl.style.display = "none";
    resumenEl.style.display = "block";
    accionesEl.style.display = "block";

    const todosSeleccionados = carrito.every((item) => item.seleccionado);

    contenedor.innerHTML = `
      <div class="carrito-header">
        <label class="carrito-check-all">
          <input type="checkbox" id="carrito-check-todos" ${todosSeleccionados ? "checked" : ""}>
          <span>Seleccionar todo</span>
        </label>
        <span class="carrito-count">${cantidadSeleccionados()} de ${carrito.length} productos</span>
      </div>
    `;

    carrito.forEach((item) => {
      const fila = document.createElement("div");
      fila.className = "carrito-item";
      fila.innerHTML = `
        <label class="carrito-item-check">
          <input type="checkbox" data-id="${item.producto_id}" ${item.seleccionado ? "checked" : ""}>
        </label>
        <a href="#/producto/${item.producto_id}" class="carrito-item-info">
          <span class="carrito-item-tipo">${item.categoria}</span>
          <span class="carrito-item-titulo">${item.titulo}</span>
          <span class="carrito-item-meta">${item.vendedor}</span>
        </a>
        <span class="carrito-item-precio">${app.api.formatoMoneda(item.precio)}</span>
        <button class="carrito-item-eliminar reset" data-id="${item.producto_id}" aria-label="Eliminar del carrito" title="Eliminar del carrito">
          <svg class="icon"><use href="#i-close"/></svg>
        </button>
      `;
      contenedor.appendChild(fila);
    });

    document.getElementById("carrito-check-todos").addEventListener("change", async (e) => {
      await seleccionarTodos(e.target.checked);
      renderCarrito();
    });

    contenedor.querySelectorAll(".carrito-item-check input").forEach((cb) => {
      cb.addEventListener("change", async () => {
        await toggleSeleccion(cb.dataset.id);
        renderCarrito();
      });
    });

    contenedor.querySelectorAll(".carrito-item-eliminar").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        e.preventDefault();
        await eliminar(btn.dataset.id);
        renderCarrito();
      });
    });

    renderResumen();
  }

  function renderResumen() {
    const total = totalCarrito();
    const seleccionados = cantidadSeleccionados();
    document.getElementById("carrito-total-monto").textContent = app.api.formatoMoneda(total);
    document.getElementById("carrito-total-items").textContent =
      seleccionados === 0 ? "Sin productos seleccionados" : `${seleccionados} producto(s) seleccionado(s)`;

    const btnComprar = document.getElementById("carrito-btn-comprar");
    btnComprar.disabled = seleccionados === 0;
  }

  async function comprarCarrito() {
    const carrito = obtenerCarrito();
    const seleccionados = carrito.filter((item) => item.seleccionado);
    if (seleccionados.length === 0) return;

    const total = totalCarrito();
    const items = seleccionados.map((item) => ({
      titulo: item.producto?.titulo || item.titulo || `Producto #${item.producto_id}`,
      precio: item.precio,
    }));

    const { confirmado, metodo_pago } = await app.dom.mostrarConfirmacionCompra(items, total);
    if (!confirmado) return;

    alertaCargando("Procesando tus compras...");

    try {
      const producto_ids = seleccionados.map((item) => item.producto_id);
      const resultado = await app.api.apiFetch("/compras/lote", {
        method: "POST",
        auth: true,
        body: { producto_ids, metodo_pago },
      });

      const comprasRealizadas = resultado.compras?.length || 0;
      const noDisponibles = resultado.productos_no_disponibles || [];

      let mensaje = `${comprasRealizadas} compra(s) realizada(s) con éxito.`;
      if (noDisponibles.length > 0) {
        mensaje += `\n\n${noDisponibles.length} producto(s) ya no estaban disponible(s) y fue(ron) eliminado(s) del carrito.`;
      }

      await cargarDesdeBackend();
      actualizarBadge();

      const resultadoSwal = await Swal.fire({
        icon: "success",
        title: "¡Compra realizada!",
        text: mensaje,
        confirmButtonText: "Ver mis compras",
        showCancelButton: true,
        cancelButtonText: "Seguir explorando",
        confirmButtonColor: SWAL_COLOR_CONFIRMAR,
        cancelButtonColor: SWAL_COLOR_CANCELAR,
        customClass: { popup: "swal-riwi" },
      });

      if (resultadoSwal.isConfirmed) {
        window.RiwiApp.router.navegarA("mis-compras");
      } else {
        renderCarrito();
      }
    } catch (err) {
      alertaError(err.message);
    }
  }

  app.carrito = {
    agregar,
    eliminar,
    estaEnCarrito,
    cantidad: cantidadCarrito,
    actualizarBadge,
    cargar: cargarDesdeBackend,
    obtener: obtenerCarrito,
    comprar: comprarCarrito,
  };

  window.RiwiApp.comprarCarrito = comprarCarrito;

  app.views = app.views || {};
  app.views.carrito = initCarrito;

  window.addEventListener("DOMContentLoaded", actualizarBadge);
})();
