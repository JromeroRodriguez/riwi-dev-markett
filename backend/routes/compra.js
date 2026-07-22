const express = require("express");
const router = express.Router();
const compraModel = require("../models/compra");
const notificacionModel = require("../models/notificacion");
const carritoModel = require("../models/carrito");
const { requiereRol } = require("../middleware/auth");

router.post("/", requiereRol(), async (req, res) => {
  try {
    const { producto_id, metodo_pago } = req.body || {};
    if (!producto_id) return res.status(400).json({ error: "producto_id es obligatorio" });
    if (metodo_pago && !compraModel.METODOS_PAGO.includes(metodo_pago)) {
      return res.status(400).json({ error: "metodo_pago debe ser 'tarjeta' o 'transferencia'" });
    }

    const producto = await compraModel.obtener_producto_publicado(producto_id);
    if (!producto) return res.status(404).json({ error: "Producto no encontrado" });
    if (producto.vendedor_id === req.usuario.id) {
      return res.status(400).json({ error: "No puedes comprar tu propio producto" });
    }

    const compra = await compraModel.crear_compra(
      req.usuario.id,
      producto_id,
      producto.precio,
      metodo_pago
    );
    if (!compra) return res.status(409).json({ error: "Este producto ya no está disponible" });

    await notificacionModel.crear_notificacion(
      producto.vendedor_id,
      "¡Has realizado una nueva venta! Revisa tu panel para más detalles."
    );

    return res.status(201).json({ mensaje: "Compra realizada con éxito", compra });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.post("/lote", requiereRol(), async (req, res) => {
  try {
    const { producto_ids, metodo_pago } = req.body || {};
    if (!Array.isArray(producto_ids) || producto_ids.length === 0) {
      return res.status(400).json({ error: "producto_ids es obligatorio y debe ser un array" });
    }
    if (metodo_pago && !compraModel.METODOS_PAGO.includes(metodo_pago)) {
      return res.status(400).json({ error: "metodo_pago debe ser 'tarjeta' o 'transferencia'" });
    }

    const idsUnicos = [...new Set(producto_ids)];
    const productos = await compraModel.obtener_productos_para_lote(idsUnicos);

    const productosValidos = [];
    const productosNoDisponibles = [];

    for (const id of idsUnicos) {
      const p = productos.find((x) => x.id === id);
      if (!p) {
        productosNoDisponibles.push({ id, motivo: "no encontrado" });
      } else if (p.estado !== "publicado") {
        productosNoDisponibles.push({ id, motivo: "no disponible" });
      } else if (p.vendedor_id === req.usuario.id) {
        productosNoDisponibles.push({ id, motivo: "es tu propio producto" });
      } else {
        productosValidos.push({ producto_id: p.id, monto: p.precio });
      }
    }

    if (productosValidos.length === 0) {
      return res.status(400).json({
        error: "Ninguno de los productos está disponible para compra",
        productos_no_disponibles: productosNoDisponibles,
      });
    }

    const resultado = await compraModel.crear_compra_lote(req.usuario.id, productosValidos, metodo_pago);

    if (!resultado.exito) {
      return res.status(409).json({
        error: `El producto ${resultado.producto_id} ya no está disponible`,
      });
    }

    for (const { producto_id } of productosValidos) {
      const producto = productos.find((p) => p.id === producto_id);
      await notificacionModel.crear_notificacion(
        producto.vendedor_id,
        "¡Has realizado una nueva venta! Revisa tu panel para más detalles."
      );
    }

    await carritoModel.limpiar(req.usuario.id, productosValidos.map((p) => p.producto_id));

    return res.status(201).json({
      mensaje: `${resultado.compras.length} compra(s) realizada(s) con éxito`,
      compras: resultado.compras,
      productos_no_disponibles: productosNoDisponibles,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.get("/mias", requiereRol(), async (req, res) => {
  try {
    const compras = await compraModel.listar_por_comprador(req.usuario.id);
    return res.json({ compras });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.get("/:compra_id/acceso", requiereRol(), async (req, res) => {
  try {
    const compra = await compraModel.obtener_compra_propia(req.params.compra_id, req.usuario.id);
    if (!compra) return res.status(404).json({ error: "Compra no encontrada o no te pertenece" });
    return res.json({
      producto: compra.titulo,
      url_repositorio: compra.url_repositorio,
      fecha_compra: compra.fecha_compra,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
});

module.exports = router;
