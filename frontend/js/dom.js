(function () {
  const app = (window.RiwiApp = window.RiwiApp || {});

  /* ============ Confirm Purchase Modal ============ */

  const BANCOS_SIMULADOS = [
    "Bancolombia",
    "Davivienda",
    "Banco de Bogotá",
    "BBVA Colombia",
    "Banco de Occidente",
    "Scotiabank Colpatria",
    "Banco AV Villas",
    "Banco Popular",
    "Nequi",
    "Daviplata",
  ];

  function generarNumeroCuenta() {
    const banco = BANCOS_SIMULADOS[Math.floor(Math.random() * BANCOS_SIMULADOS.length)];
    const digitos = Array.from({ length: 10 }, () => Math.floor(Math.random() * 10)).join("");
    return { banco, numero: `${digitos.slice(0, 3)}.${digitos.slice(3, 6)}.${digitos.slice(6)}` };
  }

  function formatoTarjeta(value) {
    const nums = value.replace(/\D/g, "").slice(0, 16);
    return nums.replace(/(\d{4})(?=\d)/g, "$1 ");
  }

  function formatoExpiracion(value) {
    const nums = value.replace(/\D/g, "").slice(0, 4);
    if (nums.length >= 3) return nums.slice(0, 2) + " / " + nums.slice(2);
    return nums;
  }

  function toggleFormularioPago(metodo) {
    const tarjetaForm = document.getElementById("pago-form-tarjeta");
    const transferenciaForm = document.getElementById("pago-form-transferencia");
    if (tarjetaForm) tarjetaForm.style.display = metodo === "tarjeta" ? "block" : "none";
    if (transferenciaForm) transferenciaForm.style.display = metodo === "transferencia" ? "block" : "none";
  }

  function validarFormularioPago(metodo) {
    if (metodo === "tarjeta") {
      const numero = document.getElementById("pago-numero-tarjeta")?.value.replace(/\s/g, "");
      const nombre = document.getElementById("pago-nombre-tarjeta")?.value.trim();
      const vencimiento = document.getElementById("pago-vencimiento")?.value.trim();
      const cvv = document.getElementById("pago-cvv")?.value.trim();
      if (!numero || numero.length < 13) return "Ingresa un número de tarjeta válido";
      if (!nombre) return "Ingresa el nombre en la tarjeta";
      if (!vencimiento || vencimiento.length < 5) return "Ingresa la fecha de vencimiento";
      if (!cvv || cvv.length < 3) return "Ingresa el código de seguridad (CVV)";
    } else {
      const banco = document.getElementById("pago-banco")?.value;
      const cuenta = document.getElementById("pago-cuenta")?.value.replace(/\./g, "").trim();
      if (!banco) return "Selecciona un banco";
      if (!cuenta || cuenta.length < 8) return "Ingresa un número de cuenta válido";
    }
    return null;
  }

  async function mostrarConfirmacionCompra(items, total) {
    let itemsHtml = items.map((item) =>
      `<div class="confirmacion-compra-item"><span>${item.titulo}</span><span>${window.RiwiApp?.api?.formatoMoneda(item.precio) || "$" + item.precio}</span></div>`
    ).join("");

    const cuentaInfo = generarNumeroCuenta();

    const bancosOptions = BANCOS_SIMULADOS.map((b) => `<option value="${b}">${b}</option>`).join("");

    const html = `
      <div class="confirmacion-compra-grid">
        ${itemsHtml}
        <div class="confirmacion-compra-total">
          <span>Total</span>
          <span>${window.RiwiApp?.api?.formatoMoneda(total) || "$" + total}</span>
        </div>
        <div class="confirmacion-metodo-pago">
          <label class="metodo-pago-titulo">Método de pago</label>
          <div class="metodo-pago-opciones">
            <label class="metodo-pago-option">
              <input type="radio" name="metodo_pago" value="tarjeta" checked>
              <span class="metodo-pago-label">
                <span class="metodo-pago-icono"><svg class="icon" viewBox="0 0 24 24"><use href="#i-credit-card"/></svg></span>
                <span>Tarjeta</span>
              </span>
            </label>
            <label class="metodo-pago-option">
              <input type="radio" name="metodo_pago" value="transferencia">
              <span class="metodo-pago-label">
                <span class="metodo-pago-icono"><svg class="icon" viewBox="0 0 24 24"><use href="#i-bank"/></svg></span>
                <span>Transferencia</span>
              </span>
            </label>
          </div>

          <div id="pago-form-tarjeta" class="pago-formulario">
            <div class="pago-campo">
              <label>Número de tarjeta</label>
              <input type="text" id="pago-numero-tarjeta" placeholder="0000 0000 0000 0000" maxlength="19" inputmode="numeric">
            </div>
            <div class="pago-campo">
              <label>Nombre en la tarjeta</label>
              <input type="text" id="pago-nombre-tarjeta" placeholder="Como aparece en la tarjeta" maxlength="40">
            </div>
            <div class="pago-fila">
              <div class="pago-campo">
                <label>Vencimiento</label>
                <input type="text" id="pago-vencimiento" placeholder="MM / AA" maxlength="7" inputmode="numeric">
              </div>
              <div class="pago-campo">
                <label>CVV</label>
                <input type="password" id="pago-cvv" placeholder="•••" maxlength="4" inputmode="numeric">
              </div>
            </div>
          </div>

          <div id="pago-form-transferencia" class="pago-formulario" style="display:none">
            <div class="pago-campo">
              <label>Banco destino</label>
              <select id="pago-banco">
                <option value="">Selecciona tu banco</option>
                ${bancosOptions}
              </select>
            </div>
            <div class="pago-campo">
              <label>Cuenta de ahorros</label>
              <input type="text" id="pago-cuenta" placeholder="000.000.000" maxlength="15" inputmode="numeric" value="${cuentaInfo.numero}">
            </div>
            <p class="pago-nota">Se debitará automáticamente de la cuenta <strong>${cuentaInfo.numero}</strong> del banco <strong>${cuentaInfo.banco}</strong>.</p>
          </div>
        </div>
      </div>`;

    let metodoPagoSeleccionado = "tarjeta";

    const result = await Swal.fire({
      title: "Confirmar compra",
      html: html,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Comprar ahora",
      cancelButtonText: "Cancelar",
      confirmButtonColor: SWAL_COLOR_CONFIRMAR,
      cancelButtonColor: SWAL_COLOR_CANCELAR,
      customClass: { popup: "swal-riwi" },
      didOpen: () => {
        const radios = document.querySelectorAll('input[name="metodo_pago"]');
        radios.forEach((r) => {
          r.addEventListener("change", () => {
            metodoPagoSeleccionado = r.value;
            toggleFormularioPago(r.value);
          });
        });

        const numTarjeta = document.getElementById("pago-numero-tarjeta");
        if (numTarjeta) {
          numTarjeta.addEventListener("input", () => {
            numTarjeta.value = formatoTarjeta(numTarjeta.value);
          });
        }

        const vencimiento = document.getElementById("pago-vencimiento");
        if (vencimiento) {
          vencimiento.addEventListener("input", () => {
            vencimiento.value = formatoExpiracion(vencimiento.value);
          });
        }
      },
      preConfirm: () => {
        const error = validarFormularioPago(metodoPagoSeleccionado);
        if (error) {
          Swal.showValidationMessage(error);
          return false;
        }
        return metodoPagoSeleccionado;
      },
    });

    return { confirmado: result.isConfirmed, metodo_pago: result.value || "tarjeta" };
  }

  /* ============ Export ============ */

  app.dom = {
    mostrarConfirmacionCompra,
  };
})();
