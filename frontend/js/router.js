(function () {
  const app = (window.RiwiApp = window.RiwiApp || {});
  app.views = app.views || {};

  const router = {
    navegarA(ruta) {
      window.location.hash = `#/${ruta}`;
    },

    parseHash() {
      const hash = window.location.hash.replace(/^#\/?/, "");
      const [ruta, parametro] = hash.split("/");
      return { ruta: ruta || "landing", parametro };
    },

    mostrarVista() {
      const { ruta, parametro } = router.parseHash();
      const idVista = `view-${ruta}`;

      const vistas = document.querySelectorAll(".view");
      const destino = document.getElementById(idVista);

      vistas.forEach((v) => v.classList.remove("active"));

      if (!destino) {
        document.getElementById("view-landing").classList.add("active");
        return;
      }

      if (ruta === "landing" && window.RiwiApp?.api?.obtenerUsuario()) {
        router.navegarA("catalogo");
        return;
      }

      destino.classList.add("active");
      window.scrollTo(0, 0);

      const handlers = {
        landing: () => { },
        login: () => app.views.login?.(),
        registro: () => app.views.registro?.(),
        catalogo: () => app.views.catalogo?.(),
        producto: () => app.views.producto?.(parametro),
        "mis-compras": () => app.views.misCompras?.(),
        carrito: () => app.views.carrito?.(),
        perfil: () => app.views.perfil?.(),
        "dashboard-vendedor": () => app.views.dashboardVendedor?.(),
        "dashboard-admin": () => app.views.dashboardAdmin?.(),
      };

      const iniciarVista = handlers[ruta] || handlers.landing;
      iniciarVista();
    },
  };

  app.router = router;
  window.navegarA = router.navegarA;
  window.addEventListener("hashchange", router.mostrarVista);
  window.addEventListener("DOMContentLoaded", router.mostrarVista);
})();
