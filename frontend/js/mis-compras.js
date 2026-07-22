function initMisCompras() {
  const usuario = window.RiwiApp?.api?.protegerPagina();
  if (!usuario) return;
  window.RiwiApp?.api?.renderNavbar("mc-nav-links");
  cargarCompras();
}

function skeletonListaCompras() {
  return Array.from({ length: 3 }, () => `<div class="skeleton skeleton-list-item"></div>`).join("");
}

async function cargarCompras() {
  const contenedor = document.getElementById("mc-lista-compras");
  contenedor.innerHTML = skeletonListaCompras();

  try {
    const data = await window.RiwiApp.api.apiFetch("/compras/mias", { auth: true });

    if (!data.compras.length) {
      contenedor.innerHTML = `
        <div class="empty-state">
          <div class="empty-illo"><svg class="icon"><use href="#i-inbox"/></svg></div>
          <h3>Aún no tienes compras</h3>
          <p>Cuando compres un producto en el catálogo, tendrás acceso a su repositorio desde aquí.</p>
          <a href="#/catalogo" class="btn">Explorar catálogo</a>
        </div>
      `;
      return;
    }

    contenedor.innerHTML = data.compras.map((c) => `
      <div class="lista-item">
        <div>
          <p style="font-weight:600;margin:0">${c.titulo}</p>
          <p class="info-secundaria">${c.categoria} · ${c.vendedor} · <span style="font-family:var(--mono);color:var(--color-text)">${window.RiwiApp.api.formatoMoneda(c.monto)}</span></p>
        </div>
        <div class="acciones">
          <button class="secundario" data-action="ver-acceso" data-compra-id="${c.id}">
            <svg class="icon" style="width:14px;height:14px"><use href="#i-external"/></svg> Ver repositorio
          </button>
          ${c.ya_calificada
        ? `<span class="badge-ya-calificado"><svg class="icon" style="width:12px;height:12px"><use href="#i-check"/></svg> Calificado</span>`
        : `<button class="secundario" data-action="abrir-calificacion" data-compra-id="${c.id}" data-producto-id="${c.producto_id}">
                <svg class="icon" style="width:14px;height:14px"><use href="#i-star"/></svg> Calificar
              </button>`}
        </div>
      </div>
      <div id="acceso-${c.id}" style="display:none;margin:-4px 0 12px;padding:14px 16px;background:#fff;border:1px solid var(--color-border);border-radius:var(--radius);font-size:13px"></div>
      <div id="calificar-${c.id}" style="display:none;margin:-4px 0 12px;padding:16px;background:#fff;border:1px solid var(--color-border);border-radius:var(--radius)"></div>
    `).join("");

    contenedor.querySelectorAll("[data-action]").forEach((boton) => {
      boton.addEventListener("click", () => {
        const { action, compraId } = boton.dataset;
        if (action === "ver-acceso") verAcceso(compraId);
        if (action === "abrir-calificacion") abrirCalificacion(compraId, boton.dataset.productoId);
      });
    });
  } catch (err) {
    contenedor.innerHTML = `<p class="vacio">${err.message}</p>`;
  }
}

async function verAcceso(compraId) {
  const el = document.getElementById(`acceso-${compraId}`);
  if (el.style.display === "block") {
    el.style.display = "none";
    return;
  }
  try {
    const data = await window.RiwiApp.api.apiFetch(`/compras/${compraId}/acceso`, { auth: true });
    const url = data.url_repositorio;
    el.innerHTML = `<strong>Repositorio:</strong> <a href="${url}" target="_blank" rel="noopener" style="color:var(--brand-purple);font-weight:600;display:inline-flex;align-items:center;gap:6px"><svg class="icon" style="width:14px;height:14px"><use href="#i-external"/></svg> ${url}</a>`;
    el.style.display = "block";
  } catch (err) {
    el.innerHTML = err.message;
    el.style.display = "block";
  }
}

function abrirCalificacion(compraId, productoId) {
  const el = document.getElementById(`calificar-${compraId}`);
  if (el.style.display === "block") {
    el.style.display = "none";
    return;
  }

  el.innerHTML = `
    <div class="campo">
      <label>Puntuación (1 a 5)</label>
      <select id="puntuacion-${compraId}">
        <option value="5">5 — Excelente</option>
        <option value="4">4 — Muy bueno</option>
        <option value="3">3 — Bueno</option>
        <option value="2">2 — Regular</option>
        <option value="1">1 — Malo</option>
      </select>
    </div>
    <div class="campo">
      <label>Comentario (opcional)</label>
      <textarea id="comentario-${compraId}" rows="2"></textarea>
    </div>
    <button data-action="enviar-calificacion" data-compra-id="${compraId}">Enviar calificación</button>
    <p id="resultado-${compraId}" style="font-size:12px;margin-top:8px"></p>
  `;
  el.style.display = "block";

  el.querySelector("[data-action='enviar-calificacion']").addEventListener("click", () => enviarCalificacion(compraId));
}

async function enviarCalificacion(compraId) {
  const puntuacion = document.getElementById(`puntuacion-${compraId}`).value;
  const comentario = document.getElementById(`comentario-${compraId}`).value.trim();
  const resultado = document.getElementById(`resultado-${compraId}`);

  try {
    await window.RiwiApp.api.apiFetch("/calificaciones", {
      method: "POST",
      auth: true,
      body: { compra_id: compraId, puntuacion, comentario: comentario || null },
    });
    if (typeof alertaToast === "function") alertaToast("¡Calificación enviada!", "success");
    await cargarCompras();
  } catch (err) {
    resultado.style.color = "var(--color-danger)";
    resultado.textContent = err.message;
  }
}

window.RiwiApp = window.RiwiApp || {};
window.RiwiApp.views = window.RiwiApp.views || {};
window.RiwiApp.views.misCompras = initMisCompras;
