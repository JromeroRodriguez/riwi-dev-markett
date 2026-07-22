let categoriaActiva = "";
let terminoBusqueda = "";
let temporizadorBusqueda = null;
let paginaActual = 1;
let totalPaginas = 1;

function skeletonGrid(cantidad = 8) {
  return Array.from({ length: cantidad }, () => `
    <div class="skeleton-card">
      <div class="skeleton skeleton-img"></div>
      <div class="skeleton skeleton-line short"></div>
      <div class="skeleton skeleton-line long"></div>
      <div class="skeleton-footer">
        <div class="skeleton skeleton-line"></div>
        <div class="skeleton skeleton-line"></div>
      </div>
    </div>
  `).join("");
}

function initCatalogo() {
  const api = window.RiwiApp?.api;
  api?.renderNavbar("catalogo-nav-links");
  categoriaActiva = "";
  terminoBusqueda = "";
  paginaActual = 1;
  totalPaginas = 1;
  document.getElementById("catalogo-busqueda").value = "";

  const filtros = document.getElementById("catalogo-filtros-categoria");
  filtros.innerHTML = `<span class="chip activo" data-categoria="" tabindex="0" role="tab" aria-selected="true">Todas</span>`;
  const chipTodas = filtros.querySelector('[data-categoria=""]');
  chipTodas.addEventListener("click", (e) => seleccionarCategoria("", e.target));
  chipTodas.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); seleccionarCategoria("", e.target); }
  });

  cargarCategorias();
  cargarProductos();

  const busquedaInput = document.getElementById("catalogo-busqueda");
  const indicador = document.getElementById("catalogo-search-indicador");
  busquedaInput.oninput = (e) => {
    clearTimeout(temporizadorBusqueda);
    indicador?.classList.add("activo");
    temporizadorBusqueda = setTimeout(() => {
      terminoBusqueda = e.target.value.trim();
      paginaActual = 1;
      cargarProductos();
    }, 350);
  };

  const btnLimpiar = document.getElementById("catalogo-limpiar");
  btnLimpiar.onclick = () => {
    terminoBusqueda = "";
    categoriaActiva = "";
    paginaActual = 1;
    busquedaInput.value = "";
    document.querySelectorAll("#catalogo-filtros-categoria .chip").forEach((c) => c.classList.remove("activo"));
    filtros.querySelector('[data-categoria=""]').classList.add("activo");
    cargarProductos();
  };
}

async function cargarCategorias() {
  try {
    const data = await window.RiwiApp.api.apiFetch("/categorias");
    const contenedor = document.getElementById("catalogo-filtros-categoria");

    data.categorias.forEach((cat) => {
      const chip = document.createElement("span");
      chip.className = "chip";
      chip.dataset.categoria = cat.id;
      chip.textContent = cat.nombre;
      chip.tabIndex = 0;
      chip.setAttribute("role", "tab");
      chip.addEventListener("click", () => seleccionarCategoria(cat.id, chip));
      chip.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); seleccionarCategoria(cat.id, chip); }
      });
      contenedor.appendChild(chip);
    });
  } catch (err) {
    console.error(err);
  }
}

function seleccionarCategoria(categoriaId, chipEl) {
  categoriaActiva = categoriaId;
  paginaActual = 1;
  document.querySelectorAll("#catalogo-filtros-categoria .chip").forEach((c) => {
    c.classList.remove("activo");
    c.setAttribute("aria-selected", "false");
  });
  chipEl.classList.add("activo");
  chipEl.setAttribute("aria-selected", "true");
  cargarProductos();
}

function actualizarBotonLimpiar() {
  const btn = document.getElementById("catalogo-limpiar");
  if (!btn) return;
  btn.style.display = (categoriaActiva || terminoBusqueda) ? "inline-flex" : "none";
}

function irPagina(pagina) {
  paginaActual = pagina;
  cargarProductos();
  document.getElementById("catalogo-grid-productos")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderPaginacion() {
  const contenedor = document.getElementById("catalogo-paginacion");
  if (!contenedor || totalPaginas <= 1) { contenedor.style.display = "none"; return; }

  contenedor.innerHTML = "";
  contenedor.style.display = "flex";

  function crearBtn(pagina, contenido, extraClase, ariaLabel) {
    const btn = document.createElement("button");
    btn.className = "btn-pagina" + (extraClase ? " " + extraClase : "");
    btn.innerHTML = contenido;
    btn.addEventListener("click", () => irPagina(pagina));
    if (ariaLabel) btn.setAttribute("aria-label", ariaLabel);
    if (pagina === paginaActual) btn.classList.add("activo");
    if (pagina < 1 || pagina > totalPaginas) btn.disabled = true;
    return btn;
  }

  const rango = 2;
  const inicio = Math.max(1, paginaActual - rango);
  const fin = Math.min(totalPaginas, paginaActual + rango);

  contenedor.appendChild(crearBtn(paginaActual - 1,
    '<svg class="icon" style="width:16px;height:16px"><use href="#i-chevron-left"/></svg>',
    "", "Página anterior"));

  if (inicio > 1) {
    contenedor.appendChild(crearBtn(1, "1"));
    if (inicio > 2) {
      const ellipsis = document.createElement("span");
      ellipsis.className = "paginacion-ellipsis";
      ellipsis.textContent = "···";
      contenedor.appendChild(ellipsis);
    }
  }

  for (let i = inicio; i <= fin; i++) {
    contenedor.appendChild(crearBtn(i, String(i)));
  }

  if (fin < totalPaginas) {
    if (fin < totalPaginas - 1) {
      const ellipsis = document.createElement("span");
      ellipsis.className = "paginacion-ellipsis";
      ellipsis.textContent = "···";
      contenedor.appendChild(ellipsis);
    }
    contenedor.appendChild(crearBtn(totalPaginas, String(totalPaginas)));
  }

  contenedor.appendChild(crearBtn(paginaActual + 1,
    '<svg class="icon" style="width:16px;height:16px"><use href="#i-chevron-left"/></svg>',
    "", "Página siguiente"));
}

async function cargarProductos() {
  const params = new URLSearchParams();
  if (categoriaActiva) params.set("categoria_id", categoriaActiva);
  if (terminoBusqueda) params.set("q", terminoBusqueda);
  params.set("page", paginaActual);

  const grid = document.getElementById("catalogo-grid-productos");
  const vacio = document.getElementById("catalogo-vacio");
  const paginacion = document.getElementById("catalogo-paginacion");
  const indicador = document.getElementById("catalogo-search-indicador");

  actualizarBotonLimpiar();
  vacio.style.display = "none";
  paginacion.style.display = "none";
  grid.innerHTML = skeletonGrid(8);

  try {
    const data = await window.RiwiApp.api.apiFetch(`/productos?${params.toString()}`, { authOptional: true });
    indicador?.classList.remove("activo");
    grid.innerHTML = "";
    totalPaginas = data.totalPages || 1;

    if (!data.productos.length) {
      const busqueda = terminoBusqueda ? ` para "${terminoBusqueda}"` : "";
      vacio.innerHTML = `
        <div class="empty-state">
          <div class="empty-illo"><svg class="icon"><use href="#i-search"/></svg></div>
          <h3>Sin resultados${busqueda}</h3>
          <p>Prueba con otra palabra clave, cambia el filtro de categoría o explora todo el catálogo.</p>
          <button type="button" class="btn-outline" id="catalogo-btn-limpiar-vacio">Limpiar filtros</button>
        </div>
      `;
      const btnLimpiarVacio = document.getElementById("catalogo-btn-limpiar-vacio");
      if (btnLimpiarVacio) btnLimpiarVacio.addEventListener("click", () => document.getElementById("catalogo-limpiar")?.click());
      vacio.style.display = "block";
      return;
    }

    const api = window.RiwiApp.api;
    data.productos.forEach((p) => {
      const card = document.createElement("div");
      card.className = "card-producto";
      card.tabIndex = 0;
      card.setAttribute("role", "button");
      card.setAttribute("aria-label", `Ver ${p.titulo}`);
      const abrir = () => window.RiwiApp.router.navegarA(`producto/${p.id}`);
      card.addEventListener("click", abrir);
      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); abrir(); }
      });

      const promedio = Number(p.calificacion_vendedor).toFixed(1);

      card.innerHTML = `
        <div class="portada-contenedor">
          <img class="portada-img" src="${api.obtenerImagenUrl(p.url_imagen, p.categoria)}" alt="Portada de ${p.titulo}" loading="lazy">
        </div>
        <p class="categoria">${p.categoria}</p>
        <p class="titulo">${p.titulo}</p>
        <div class="vendedor-card">
          <svg class="icon"><use href="#i-user"/></svg>
          <span>${p.vendedor}</span>
          ${p.total_calificaciones_vendedor > 0 ? `<span class="vendedor-rating"><svg class="icon"><use href="#i-star"/></svg>${promedio}</span>` : ""}
        </div>
        <div class="footer-card">
          <span class="precio">${api.formatoMoneda(p.precio)}</span>
        </div>
      `;
      grid.appendChild(card);
    });

    renderPaginacion();
  } catch (err) {
    indicador?.classList.remove("activo");
    grid.innerHTML = "";
    vacio.innerHTML = `
      <div class="empty-state">
        <div class="empty-illo"><svg class="icon"><use href="#i-close"/></svg></div>
        <h3>No pudimos cargar el catálogo</h3>
        <p>${err.message}</p>
        <button type="button" class="btn" onclick="location.reload()">Reintentar</button>
      </div>
    `;
    vacio.style.display = "block";
    console.error(err);
  }
}

window.RiwiApp = window.RiwiApp || {};
window.RiwiApp.views = window.RiwiApp.views || {};
window.RiwiApp.views.catalogo = initCatalogo;
