function skeletonStats(n = 4) {
  return Array.from({ length: n }, () => `<div class="skeleton skeleton-stat"></div>`).join("");
}
function skeletonLista(n = 3) {
  return Array.from({ length: n }, () => `<div class="skeleton skeleton-list-item"></div>`).join("");
}

function initDashboardVendedor() {
  const usuario = window.RiwiApp?.api?.protegerPagina(["vendedor", "administrador"]);
  if (!usuario) return;
  window.RiwiApp?.api?.renderNavbar("dv-nav-links");

  document.getElementById("dv-stats-vendedor").innerHTML = skeletonStats();
  document.getElementById("dv-lista-mis-productos").innerHTML = skeletonLista();

  cargarEstadisticasVendedor();
  cargarCategoriasSelect();
  cargarMisProductos();

  const formProducto = document.getElementById("dv-form-producto");
  const formContenedor = document.getElementById("dv-form-nuevo-producto");
  const btnPublicar = document.getElementById("dv-btn-publicar");
  const btnCerrar = document.getElementById("dv-btn-cerrar-form");

  if (formProducto) {
    formProducto.reset();
    const msgError = document.getElementById("dv-mensaje-error");
    const msgExito = document.getElementById("dv-mensaje-exito");
    if (msgError) { msgError.textContent = ""; msgError.style.display = "none"; }
    if (msgExito) { msgExito.textContent = ""; msgExito.style.display = "none"; }
    if (btnPublicar) btnPublicar.style.display = "";
    if (formContenedor) formContenedor.style.display = "none";
  }

  let productoEditandoId = null;

  function abrirFormularioEdicion(producto) {
    if (!formProducto) return;
    const grupoGithub = document.getElementById("dv-grupo-github");
    const grupoZip = document.getElementById("dv-grupo-zip");
    const inputUrl = document.getElementById("dv-url_repositorio");
    const inputZip = document.getElementById("dv-archivo_zip");
    document.getElementById("dv-titulo").value = producto.titulo;
    document.getElementById("dv-descripcion").value = producto.descripcion;
    document.getElementById("dv-categoria_id").value = producto.categoria_id;
    document.getElementById("dv-precio").value = producto.precio;
    if (producto.url_repositorio) {
      const radio = document.querySelector('input[name="dv-tipo-entrega"][value="github"]');
      if (radio) radio.checked = true;
      if (grupoGithub) grupoGithub.style.display = "block";
      if (grupoZip) grupoZip.style.display = "none";
      if (inputUrl) { inputUrl.value = producto.url_repositorio; inputUrl.setAttribute("required", "true"); }
      if (inputZip) inputZip.removeAttribute("required");
    } else {
      const radio = document.querySelector('input[name="dv-tipo-entrega"][value="zip"]');
      if (radio) radio.checked = true;
      if (grupoGithub) grupoGithub.style.display = "none";
      if (grupoZip) grupoZip.style.display = "block";
      if (inputUrl) inputUrl.removeAttribute("required");
      if (inputZip) inputZip.removeAttribute("required");
    }
    productoEditandoId = producto.id;
    const btnSubmit = formProducto.querySelector('button[type="submit"]');
    if (btnSubmit) btnSubmit.textContent = "Guardar cambios";
    if (btnPublicar) btnPublicar.style.display = "none";
    if (formContenedor) {
      formContenedor.style.display = "block";
      formContenedor.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  window.RiwiApp.abrirFormularioEdicion = abrirFormularioEdicion;

  if (!formProducto || formProducto.dataset.bound === "true") return;
  formProducto.dataset.bound = "true";

  const radiosTipo = formProducto.querySelectorAll('input[name="dv-tipo-entrega"]');
  const grupoGithub = document.getElementById("dv-grupo-github");
  const grupoZip = document.getElementById("dv-grupo-zip");
  const inputUrl = document.getElementById("dv-url_repositorio");
  const inputZip = document.getElementById("dv-archivo_zip");

  function abrirFormulario() {
    formProducto.reset();
    grupoGithub.style.display = "block";
    grupoZip.style.display = "none";
    inputUrl.setAttribute("required", "true");
    inputZip.removeAttribute("required");
    const msgError = document.getElementById("dv-mensaje-error");
    const msgExito = document.getElementById("dv-mensaje-exito");
    if (msgError) { msgError.textContent = ""; msgError.style.display = "none"; }
    if (msgExito) { msgExito.textContent = ""; msgExito.style.display = "none"; }
    btnPublicar.style.display = "none";
    formContenedor.style.display = "block";
    formContenedor.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function cerrarFormulario() {
    formContenedor.style.display = "none";
    btnPublicar.style.display = "";
    productoEditandoId = null;
    const btnSubmit = formProducto.querySelector('button[type="submit"]');
    if (btnSubmit) btnSubmit.textContent = "Publicar producto";
  }

  if (btnPublicar) {
    btnPublicar.onclick = null;
    btnPublicar.addEventListener("click", () => {
      productoEditandoId = null;
      const btnSubmit = formProducto.querySelector('button[type="submit"]');
      if (btnSubmit) btnSubmit.textContent = "Publicar producto";
      abrirFormulario();
    });
  }
  if (btnCerrar) btnCerrar.addEventListener("click", () => {
    productoEditandoId = null;
    cerrarFormulario();
  });

  radiosTipo.forEach((r) => {
    r.addEventListener("change", (e) => {
      if (e.target.value === "github") {
        grupoGithub.style.display = "block";
        grupoZip.style.display = "none";
        inputUrl.setAttribute("required", "true");
        inputZip.removeAttribute("required");
      } else {
        grupoGithub.style.display = "none";
        grupoZip.style.display = "block";
        inputUrl.removeAttribute("required");
        inputZip.setAttribute("required", "true");
      }
    });
  });

  formProducto.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("titulo", document.getElementById("dv-titulo").value.trim());
    formData.append("descripcion", document.getElementById("dv-descripcion").value.trim());
    formData.append("categoria_id", document.getElementById("dv-categoria_id").value);
    formData.append("precio", parseFloat(document.getElementById("dv-precio").value));

    const tipoEntrega = formProducto.querySelector('input[name="dv-tipo-entrega"]:checked').value;
    if (tipoEntrega === "github") {
      formData.append("url_repositorio", inputUrl.value.trim());
    } else {
      const archivoZip = inputZip.files[0];
      if (!archivoZip) { alertaError("Debe seleccionar un archivo ZIP", "Error de validación"); return; }
      formData.append("archivo_zip", archivoZip);
    }

    const imagenPortada = document.getElementById("dv-imagen_portada").files[0];
    if (imagenPortada) {
      if (!/(\.jpg|\.jpeg|\.png|\.webp)$/i.test(imagenPortada.name)) {
        alertaError("La imagen de portada debe ser JPG, PNG o WebP.", "Error de validación"); return;
      }
      if (imagenPortada.size > 2 * 1024 * 1024) {
        alertaError("La imagen de portada no debe superar 2 MB.", "Error de validación"); return;
      }
      formData.append("imagen_portada", imagenPortada);
    }

    const esEdicion = productoEditandoId !== null;
    alertaCargando(esEdicion ? "Actualizando producto..." : "Publicando producto...");

    try {
      if (esEdicion) {
        await window.RiwiApp.api.apiFetch(`/productos/${productoEditandoId}`, { method: "PUT", auth: true, body: formData });
        await alertaExito("Tu producto ha sido actualizado y enviado a revisión.", "Producto actualizado");
      } else {
        await window.RiwiApp.api.apiFetch("/productos", { method: "POST", auth: true, body: formData });
        await alertaExito("Queda pendiente de revisión por el administrador.", "Producto publicado");
      }
      formProducto.reset();
      productoEditandoId = null;
      cerrarFormulario();
      cargarMisProductos();
      cargarEstadisticasVendedor();
    } catch (err) {
      alertaError(err.message, esEdicion ? "No se pudo actualizar el producto" : "No se pudo publicar el producto");
    }
  });
}

async function cargarEstadisticasVendedor() {
  try {
    const data = await window.RiwiApp.api.apiFetch("/estadisticas/vendedor", { auth: true });
    const r = data.resumen;
    document.getElementById("dv-stats-vendedor").innerHTML = `
      <div class="stat-card"><p class="label">Productos publicados</p><p class="valor">${r.productos_publicados}</p></div>
      <div class="stat-card"><p class="label">Ventas totales</p><p class="valor">${r.total_ventas}</p></div>
      <div class="stat-card"><p class="label">Ingresos totales</p><p class="valor">${window.RiwiApp.api.formatoMoneda(r.ingresos_totales)}</p></div>
      <div class="stat-card"><p class="label">Calificación promedio</p><p class="valor">${Number(r.calificacion_promedio).toFixed(1)} ★</p></div>
    `;
  } catch (err) {
    console.error(err);
  }
}

async function cargarCategoriasSelect() {
  const data = await window.RiwiApp.api.apiFetch("/categorias");
  const select = document.getElementById("dv-categoria_id");
  select.innerHTML = data.categorias.map((c) => `<option value="${c.id}">${c.nombre}</option>`).join("");
}

async function cargarMisProductos() {
  const contenedor = document.getElementById("dv-lista-mis-productos");
  try {
    const data = await window.RiwiApp.api.apiFetch("/productos/mios", { auth: true });

    if (!data.productos.length) {
      contenedor.innerHTML = `
        <div class="empty-state">
          <div class="empty-illo"><svg class="icon"><use href="#i-package"/></svg></div>
          <h3>Aún no has publicado productos</h3>
          <p>Publica tu primer producto digital y empieza a vender a la comunidad.</p>
        </div>
      `;
      return;
    }

    contenedor.innerHTML = data.productos.map((p) => `
      <div class="lista-item">
        <div style="flex:1;min-width:0">
          <p style="font-weight:600;margin:0">${p.titulo}</p>
          <p class="info-secundaria">${p.categoria} · <span style="font-family:var(--mono);color:var(--color-text)">${window.RiwiApp.api.formatoMoneda(p.precio)}</span></p>
          ${p.estado === "rechazado" && p.motivo_rechazo ? `<p class="info-secundaria" style="color:var(--color-danger);margin-top:4px">Motivo: ${p.motivo_rechazo}</p>` : ""}
        </div>
        <div class="lista-item-acciones">
          <span class="badge ${p.estado}">${etiquetaEstado(p.estado)}</span>
          ${p.estado !== "vendido" ? `
            <button class="btn btn-sm btn-outline editar-producto" data-id="${p.id}" title="Editar producto">
              <svg class="icon" style="width:14px;height:14px"><use href="#i-edit"/></svg>
            </button>
            <button class="btn btn-sm btn-outline btn-danger eliminar-producto" data-id="${p.id}" title="Eliminar producto">
              <svg class="icon" style="width:14px;height:14px"><use href="#i-trash-2"/></svg>
            </button>
          ` : ""}
        </div>
      </div>
    `).join("");

    contenedor.querySelectorAll(".editar-producto").forEach((btn) => {
      btn.addEventListener("click", () => {
        const producto = data.productos.find((p) => p.id === btn.dataset.id);
        if (producto) window.RiwiApp.abrirFormularioEdicion(producto);
      });
    });

    contenedor.querySelectorAll(".eliminar-producto").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const producto = data.productos.find((p) => p.id === btn.dataset.id);
        if (!producto) return;
        const confirmado = await alertaConfirmar(
          `¿Estás seguro de eliminar "${producto.titulo}"? Esta acción no se puede deshacer.`,
          "Eliminar producto",
          true
        );
        if (!confirmado) return;
        try {
          await window.RiwiApp.api.apiFetch(`/productos/${producto.id}`, { method: "DELETE", auth: true });
          await alertaExito("Producto eliminado correctamente.", "Eliminado");
          cargarMisProductos();
          cargarEstadisticasVendedor();
        } catch (err) {
          alertaError(err.message, "No se pudo eliminar el producto");
        }
      });
    });
  } catch (err) {
    contenedor.innerHTML = `<p class="vacio">${err.message}</p>`;
  }
}

function etiquetaEstado(estado) {
  const etiquetas = {
    en_revision: "En revisión", publicado: "Publicado", vendido: "Vendido",
    rechazado: "Rechazado", archivado: "Archivado",
  };
  return etiquetas[estado] || estado;
}

window.RiwiApp = window.RiwiApp || {};
window.RiwiApp.views = window.RiwiApp.views || {};
window.RiwiApp.views.dashboardVendedor = initDashboardVendedor;
