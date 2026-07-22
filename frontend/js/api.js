(function () {
  const app = (window.RiwiApp = window.RiwiApp || {});

  const api = {
    API_BASE_URL: "http://localhost:5000/api",

    obtenerToken() {
      try { return localStorage.getItem("token"); } catch { return null; }
    },

    obtenerUsuario() {
      try {
        const data = localStorage.getItem("usuario");
        return data ? JSON.parse(data) : null;
      } catch { return null; }
    },

    guardarSesion(token, usuario) {
      localStorage.setItem("token", token);
      localStorage.setItem("usuario", JSON.stringify(usuario));
    },

    cerrarSesion() {
      localStorage.removeItem("token");
      localStorage.removeItem("usuario");
      if (window.RiwiApp?.carrito?.actualizarBadge) {
        window.RiwiApp.carrito.actualizarBadge();
      }
      window.location.hash = "#/";
    },

    navegarA(ruta) {
      const router = app.router;
      if (router && typeof router.navegarA === "function") {
        router.navegarA(ruta);
        return;
      }
      window.location.hash = `#/${ruta}`;
    },

    async apiFetch(endpoint, { method = "GET", body = null, auth = false, authOptional = false } = {}) {
      const headers = {};
      if (!(body instanceof FormData)) {
        headers["Content-Type"] = "application/json";
      }

      if (auth) {
        const token = this.obtenerToken();
        if (!token) {
          this.navegarA("login");
          throw new Error("Debes iniciar sesión para continuar");
        }
        headers["Authorization"] = `Bearer ${token}`;
      } else if (authOptional) {
        const token = this.obtenerToken();
        if (token) headers["Authorization"] = `Bearer ${token}`;
      }

      const opciones = { method, headers };
      if (body) {
        opciones.body = body instanceof FormData ? body : JSON.stringify(body);
      }

      const respuesta = await fetch(`${this.API_BASE_URL}${endpoint}`, opciones);
      const datos = await respuesta.json().catch(() => ({}));

      if (respuesta.status === 401) {
        if (auth) {
          this.cerrarSesion();
          throw new Error("Tu sesión expiró. Por favor inicia sesión de nuevo.");
        }
        throw new Error(datos.error || "Credenciales incorrectas");
      }

      if (!respuesta.ok) {
        throw new Error(datos.error || "Ocurrió un error al comunicarse con el servidor");
      }

      return datos;
    },

    protegerPagina(rolesPermitidos = []) {
      const usuario = this.obtenerUsuario();
      if (!usuario || !this.obtenerToken()) {
        this.navegarA("login");
        return null;
      }
      if (rolesPermitidos.length && !rolesPermitidos.includes(usuario.rol)) {
        if (typeof alertaError === "function") {
          alertaError("No tienes permisos para acceder a esta página", "Acceso denegado");
        }
        this.navegarA("catalogo");
        return null;
      }
      return usuario;
    },

    mostrarError(mensaje, contenedorId = "mensaje-error") {
      const el = document.getElementById(contenedorId);
      if (el) {
        el.textContent = mensaje;
        el.style.display = "block";
      } else if (typeof alertaError === "function") {
        alertaError(mensaje);
      }
    },

    formatoMoneda(valor) {
      return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(valor);
    },

    iconoCategoria(categoria) {
      const mapa = {
        "Apps web": "i-monitor",
        "APIs": "i-api",
        "Plantillas": "i-layout",
        "Automatizaciones": "i-zap",
      };
      return mapa[categoria] || "i-package";
    },

    obtenerImagenUrl(url_imagen, categoria) {
      if (url_imagen) {
        if (url_imagen.startsWith("/")) {
          return `http://localhost:5000${url_imagen}`;
        }
        return url_imagen;
      }

      const gradientes = {
        "Apps web":          { de: "#6366f1", a: "#a855f7",   icono: "monitor"   },
        "APIs":              { de: "#10b981", a: "#3b82f6",   icono: "api"       },
        "Plantillas":        { de: "#f59e0b", a: "#ef4444",   icono: "layout"    },
        "Automatizaciones":  { de: "#ec4899", a: "#8b5cf6",   icono: "zap"       },
      };
      const t = gradientes[categoria] || { de: "#6b7280", a: "#9ca3af", icono: "package" };

      const iconos = {
        monitor:  `<g stroke='rgba(255,255,255,0.95)' stroke-width='6' stroke-linecap='round' stroke-linejoin='round' fill='none'><rect x='82' y='58' width='236' height='128' rx='10'/><line x1='118' y1='208' x2='282' y2='208'/><line x1='200' y1='186' x2='200' y2='208'/></g>`,
        api:      `<g stroke='rgba(255,255,255,0.95)' stroke-width='6' stroke-linecap='round' stroke-linejoin='round' fill='none'><path d='M96 78 V66 a8 8 0 0 1 8 -8 h22'/><path d='M304 78 V66 a8 8 0 0 0 -8 -8 h-22'/><path d='M96 222 v12 a8 8 0 0 0 8 8 h22'/><path d='M304 222 v12 a8 8 0 0 1 -8 8 h-22'/><line x1='130' y1='150' x2='270' y2='150'/><line x1='200' y1='110' x2='200' y2='190'/></g>`,
        layout:   `<g stroke='rgba(255,255,255,0.95)' stroke-width='6' stroke-linecap='round' stroke-linejoin='round' fill='none'><rect x='74' y='68' width='252' height='164' rx='10'/><line x1='74' y1='118' x2='326' y2='118'/><line x1='166' y1='232' x2='166' y2='118'/></g>`,
        zap:      `<polygon points='212 60 122 162 188 162 168 244 268 138 202 138 232 60' fill='rgba(255,255,255,0.95)'/>`,
        package:  `<g stroke='rgba(255,255,255,0.95)' stroke-width='6' stroke-linecap='round' stroke-linejoin='round' fill='none'><line x1='180' y1='110' x2='320' y2='55'/><path d='M236 230 V130 a8 8 0 0 0 -4 -7 L146 73 a8 8 0 0 0 -8 0 L74 130 a8 8 0 0 0 -4 7 v100 a8 8 0 0 0 4 7 l86 50 a8 8 0 0 0 8 0 l82 -47 a8 8 0 0 0 4 -7'/><polyline points='74 130 200 198 326 130'/><line x1='200' y1='252' x2='200' y2='152'/></g>`,
      };

      const label = (categoria || "Producto").toUpperCase();
      const glyph = iconos[t.icono] || iconos.package;
      const uid = Math.random().toString(36).slice(2, 8);

      const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300' preserveAspectRatio='xMidYMid slice'>
        <defs>
          <linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
            <stop offset='0%' stop-color='${t.de}'/><stop offset='100%' stop-color='${t.a}'/>
          </linearGradient>
          <radialGradient id='glow-${uid}' cx='50%' cy='35%' r='55%'>
            <stop offset='0%' stop-color='rgba(255,255,255,0.30)'/>
            <stop offset='100%' stop-color='rgba(255,255,255,0)'/>
          </radialGradient>
          <pattern id='dots-${uid}' x='0' y='0' width='22' height='22' patternUnits='userSpaceOnUse'>
            <circle cx='2' cy='2' r='1' fill='rgba(255,255,255,0.10)'/>
          </pattern>
        </defs>
        <rect width='400' height='300' fill='url(%23g)'/>
        <rect width='400' height='300' fill='url(%23dots-${uid})'/>
        <rect width='400' height='300' fill='url(%23glow-${uid})'/>
        <g transform='translate(86 30)'>${glyph}</g>
        <text x='50%' y='74%' text-anchor='middle' font-family='Inter, system-ui, sans-serif' font-size='17' font-weight='700' fill='rgba(255,255,255,0.92)' letter-spacing='1'>${label}</text>
        <line x1='44%' y1='79%' x2='56%' y2='79%' stroke='rgba(255,255,255,0.4)' stroke-width='1'/>
        <text x='50%' y='86%' text-anchor='middle' font-family='JetBrains Mono, monospace' font-size='10' fill='rgba(255,255,255,0.55)' letter-spacing='3'>RIWI · MARKET</text>
      </svg>`;
      return `data:image/svg+xml;utf8,${svg.replace(/#/g, "%23").replace(/\n\s*/g, "")}`;
    },

    iniciales(nombre) {
      return nombre
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((p) => p[0].toUpperCase())
        .join("");
    },

    renderNavbar(contenedorId) {
      const contenedor = document.getElementById(contenedorId);
      if (!contenedor) return;

      const usuario = this.obtenerUsuario();

      if (!usuario) {
        contenedor.innerHTML = `
          <div class="navbar-actions">
            <a href="#/login" class="btn-navbar-outline">Iniciar sesión</a>
            <a href="#/registro" class="btn-navbar-cta">Registrarse</a>
          </div>
        `;
        this._insertarLinkCatalogo(contenedor);
        return;
      }

      const rolLabel = { administrador: "Admin", vendedor: "Vendedor", comprador: "Comprador" };

      contenedor.innerHTML = `
        <div class="navbar-actions">
          <div class="navbar-perfil" id="navbar-perfil-${contenedorId}">
            <button class="navbar-perfil-btn reset" id="navbar-perfil-btn-${contenedorId}" aria-haspopup="true" aria-expanded="false">
              <span class="navbar-avatar">${this.iniciales(usuario.nombre)}</span>
              <span class="navbar-nombre">${usuario.nombre.split(" ")[0]}</span>
              <span class="navbar-chevron"><svg class="icon"><use href="#i-chevron-down"/></svg></span>
            </button>
            <div class="navbar-dropdown" id="navbar-dropdown-${contenedorId}" role="menu">
              <div class="navbar-dropdown-header">
                <span class="navbar-avatar navbar-avatar-lg">${this.iniciales(usuario.nombre)}</span>
                <div>
                  <div class="navbar-dropdown-name">${usuario.nombre}</div>
                  <div class="navbar-dropdown-rol">${rolLabel[usuario.rol] || usuario.rol}</div>
                </div>
              </div>
              <a href="#/perfil" class="navbar-dropdown-item" role="menuitem" title="Ir a mi perfil">
                <svg class="icon" aria-hidden="true"><use href="#i-user"/></svg>
                <span class="navbar-dropdown-item-label">Mi perfil</span>
              </a>
              <a href="#/mis-compras" class="navbar-dropdown-item" role="menuitem" title="Ir a mis compras">
                <svg class="icon" aria-hidden="true"><use href="#i-cart"/></svg>
                <span class="navbar-dropdown-item-label">Mis compras</span>
              </a>
              ${(usuario.rol === "vendedor" || usuario.rol === "administrador") ? `
              <a href="#/dashboard-vendedor" class="navbar-dropdown-item" role="menuitem" title="Ir a vender">
                <svg class="icon" aria-hidden="true"><use href="#i-star"/></svg>
                <span class="navbar-dropdown-item-label">Vender</span>
              </a>` : ""}
              ${usuario.rol === "administrador" ? `
              <a href="#/dashboard-admin" class="navbar-dropdown-item" role="menuitem" title="Ir a admin">
                <svg class="icon" aria-hidden="true"><use href="#i-shield"/></svg>
                <span class="navbar-dropdown-item-label">Admin</span>
              </a>` : ""}
              <div class="navbar-dropdown-divider"></div>
              <button class="navbar-dropdown-item navbar-dropdown-item--danger reset" id="btn-logout-${contenedorId}" role="menuitem" title="Cerrar sesión">
                <svg class="icon" aria-hidden="true"><use href="#i-logout"/></svg>
                <span class="navbar-dropdown-item-label">Cerrar sesión</span>
              </button>
            </div>
          </div>
        </div>
      `;

      const perfilBtn = document.getElementById(`navbar-perfil-btn-${contenedorId}`);
      const dropdown = document.getElementById(`navbar-dropdown-${contenedorId}`);

      perfilBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        const isOpen = dropdown.classList.toggle("open");
        perfilBtn.setAttribute("aria-expanded", isOpen ? "true" : "false");
        perfilBtn.parentElement.classList.toggle("open", isOpen);
      });

      document.addEventListener("click", () => {
        dropdown.classList.remove("open");
        perfilBtn.setAttribute("aria-expanded", "false");
        perfilBtn.parentElement.classList.remove("open");
      });

      dropdown.addEventListener("click", (e) => e.stopPropagation());

      const logoutButton = document.getElementById(`btn-logout-${contenedorId}`);
      if (logoutButton) {
        logoutButton.addEventListener("click", (e) => {
          e.preventDefault();
          this.cerrarSesion();
        });
      }

      if (window.RiwiApp?.carrito?.actualizarBadge) {
        window.RiwiApp.carrito.actualizarBadge();
      }
      this._insertarLinkCatalogo(contenedor);
    },

    _insertarLinkCatalogo(contenedor) {
      const navbar = contenedor.closest(".navbar");
      if (!navbar) return;
      navbar.querySelector(".navbar-catalogo-link")?.remove();
      const logo = navbar.querySelector(".logo");
      if (logo) {
        const link = document.createElement("a");
        link.href = "#/catalogo";
        link.className = "navbar-catalogo-link";
        link.textContent = "Catálogo";
        logo.after(link);
      }
    },
  };

  const resetStyle = document.createElement("style");
  resetStyle.textContent = `button.reset { all: unset; box-sizing: border-box; cursor: pointer; }`;
  document.head.appendChild(resetStyle);

  app.api = api;
})();
