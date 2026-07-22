function marcarCampo(field, valido, mensaje) {
  const wrap = document.querySelector(`[data-field="${field}"]`);
  if (!wrap) return;
  wrap.classList.toggle("invalido", !valido);
  wrap.classList.toggle("valido", valido && wrap.querySelector("input").value.length > 0);
  if (mensaje) {
    const err = wrap.querySelector(".error-inline");
    if (err) err.textContent = mensaje;
  }
}

function validarEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }

function evaluarPassword(v) {
  const checks = {
    len: v.length >= 6,
    upper: /[A-Z]/.test(v),
    digit: /\d/.test(v),
    special: /[^A-Za-z0-9]/.test(v),
  };
  const nivel = Object.values(checks).filter(Boolean).length;
  return { checks, nivel };
}

function bindLiveValidation(formId) {
  const form = document.getElementById(formId);
  if (!form) return;

  const email = form.querySelector('[type="email"]');
  const pass = form.querySelector('[type="password"]');
  const nombre = form.querySelector('[data-field="nombre"] input');

  if (nombre) {
    nombre.addEventListener("blur", () => {
      marcarCampo("nombre", nombre.value.trim().length >= 2);
    });
    nombre.addEventListener("input", () => {
      if (nombre.value.trim().length >= 2) marcarCampo("nombre", true);
    });
  }

  if (email) {
    email.addEventListener("blur", () => marcarCampo("email", validarEmail(email.value.trim())));
    email.addEventListener("input", () => {
      if (validarEmail(email.value.trim())) marcarCampo("email", true);
    });
  }

  if (pass) {
    const bar = document.getElementById("registro-password-bar");
    const checksList = document.getElementById("registro-password-checks");

    pass.addEventListener("input", () => {
      const { checks, nivel } = evaluarPassword(pass.value);
      if (bar) bar.dataset.nivel = nivel;
      if (checksList) {
        checksList.querySelectorAll("li").forEach((li) => {
          li.classList.toggle("ok", !!checks[li.dataset.check]);
        });
      }
      if (pass.value.length >= 6) marcarCampo("password", true);
    });
    pass.addEventListener("blur", () => marcarCampo("password", pass.value.length >= 6));
  }
}

function initLogin() {
  const formLogin = document.getElementById("login-form");
  if (!formLogin) return;

  if (formLogin.dataset.bound !== "true") {
    formLogin.dataset.bound = "true";
    bindLiveValidation("login-form");

    formLogin.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("login-email").value.trim();
      const password = document.getElementById("login-password").value;

      let ok = true;
      if (!validarEmail(email)) { marcarCampo("email", false); ok = false; }
      if (!password) { marcarCampo("password", false, "Ingresa tu contraseña."); ok = false; }
      if (!ok) return;

      alertaCargando("Iniciando sesión...");
      try {
        const data = await window.RiwiApp.api.apiFetch("/auth/login", {
          method: "POST", body: { email, password },
        });
        window.RiwiApp.api.guardarSesion(data.token, data.usuario);

        await Swal.fire({
          icon: "success",
          title: `¡Bienvenido, ${data.usuario.nombre.split(" ")[0]}!`,
          customClass: { popup: "swal-riwi" },
          timer: 1200,
          showConfirmButton: false,
        });

        window.RiwiApp.router.navegarA("catalogo");
      } catch (err) {
        alertaError(err.message, "No se pudo iniciar sesión");
      }
    });
  }
}

function initRegistro() {
  const formRegistro = document.getElementById("registro-form");
  if (!formRegistro) return;

  if (formRegistro.dataset.bound !== "true") {
    formRegistro.dataset.bound = "true";
    bindLiveValidation("registro-form");

    formRegistro.addEventListener("submit", async (e) => {
      e.preventDefault();
      const nombre = document.getElementById("registro-nombre").value.trim();
      const email = document.getElementById("registro-email").value.trim();
      const password = document.getElementById("registro-password").value;

      let ok = true;
      if (nombre.length < 2) { marcarCampo("nombre", false); ok = false; }
      if (!validarEmail(email)) { marcarCampo("email", false); ok = false; }
      if (password.length < 6) { marcarCampo("password", false); ok = false; }
      if (!ok) return;

      alertaCargando("Creando tu cuenta...");
      try {
        await window.RiwiApp.api.apiFetch("/auth/registro", {
          method: "POST", body: { nombre, email, password },
        });

        await Swal.fire({
          icon: "success",
          title: "Cuenta creada con éxito",
          text: "Ahora inicia sesión para continuar.",
          customClass: { popup: "swal-riwi" },
          confirmButtonColor: SWAL_COLOR_CONFIRMAR,
        });

        window.RiwiApp.router.navegarA("login");
      } catch (err) {
        alertaError(err.message, "No se pudo crear la cuenta");
      }
    });
  }
}

window.RiwiApp = window.RiwiApp || {};
window.RiwiApp.views = window.RiwiApp.views || {};
window.RiwiApp.views.login = initLogin;
window.RiwiApp.views.registro = initRegistro;

initLogin();
initRegistro();
