const express = require("express");
const router = express.Router();
const carritoModel = require("../models/carrito");
const { requiereRol } = require("../middleware/auth");

router.get("/", requiereRol(), async (req, res) => {
  try {
    const items = await carritoModel.obtenerPorComprador(req.usuario.id);
    return res.json({ carrito: items });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.post("/", requiereRol(), async (req, res) => {
  try {
    const { producto_id } = req.body || {};
    if (!producto_id) {
      return res.status(400).json({ error: "producto_id es obligatorio" });
    }

    const yaEnCarrito = await carritoModel.yaExiste(req.usuario.id, producto_id);
    if (yaEnCarrito) {
      return res.status(409).json({ error: "Este producto ya está en tu carrito" });
    }

    const disponible = await carritoModel.productoDisponible(producto_id, req.usuario.id);
    if (!disponible) {
      return res.status(400).json({ error: "El producto no está disponible o es tuyo" });
    }

    const yaComprado = await carritoModel.yaComprado(req.usuario.id, producto_id);
    if (yaComprado) {
      return res.status(400).json({ error: "Ya compraste este producto" });
    }

    await carritoModel.agregar(req.usuario.id, producto_id);
    return res.status(201).json({ mensaje: "Producto agregado al carrito" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.delete("/:producto_id", requiereRol(), async (req, res) => {
  try {
    const eliminado = await carritoModel.eliminar(req.usuario.id, req.params.producto_id);
    if (!eliminado) {
      return res.status(404).json({ error: "El producto no está en tu carrito" });
    }
    return res.json({ mensaje: "Producto eliminado del carrito" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.patch("/:producto_id/seleccion", requiereRol(), async (req, res) => {
  try {
    const resultado = await carritoModel.toggleSeleccion(req.usuario.id, req.params.producto_id);
    if (!resultado) {
      return res.status(404).json({ error: "El producto no está en tu carrito" });
    }
    return res.json({ mensaje: "Selección actualizada", seleccionado: resultado.seleccionado });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
});

module.exports = router;
