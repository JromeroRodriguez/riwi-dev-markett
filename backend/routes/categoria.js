const express = require("express");
const router = express.Router();
const categoriaModel = require("../models/categoria");
const { requiereRol } = require("../middleware/auth");

router.get("/", async (req, res) => {
  try {
    const categorias = await categoriaModel.listar_categorias();
    return res.json({ categorias });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.post("/", requiereRol("administrador"), async (req, res) => {
  try {
    const nombre = (req.body.nombre || "").trim();
    if (!nombre) return res.status(400).json({ error: "El nombre de la categoría es obligatorio" });
    const categoria = await categoriaModel.crear_categoria(nombre);
    return res.status(201).json({ mensaje: "Categoría creada", categoria });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
});

module.exports = router;
