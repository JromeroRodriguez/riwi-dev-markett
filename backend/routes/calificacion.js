const express = require("express");
const router = express.Router();
const calificacionModel = require("../models/calificacion");
const { requiereRol } = require("../middleware/auth");

router.post("/calificaciones", requiereRol(), async (req, res) => {
  try {
    const { compra_id, puntuacion, comentario } = req.body || {};

    if (!compra_id || puntuacion === undefined) {
      return res.status(400).json({ error: "compra_id y puntuacion son obligatorios" });
    }

    const puntNum = parseInt(puntuacion);
    if (isNaN(puntNum) || puntNum < 1 || puntNum > 5) {
      return res.status(400).json({ error: "puntuacion debe ser un número entero entre 1 y 5" });
    }

    const compra = await calificacionModel.obtener_compra_calificable(compra_id, req.usuario.id);
    if (!compra) return res.status(404).json({ error: "La compra no existe o no te pertenece" });
    if (await calificacionModel.ya_calificada(compra_id)) {
      return res.status(409).json({ error: "Ya calificaste esta compra" });
    }

    const comentarioLimpio = comentario ? comentario.trim() : null;
    const calificacion = await calificacionModel.crear_calificacion(compra_id, puntNum, comentarioLimpio);
    return res.status(201).json({ mensaje: "Calificación registrada", calificacion });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.get("/productos/:producto_id/calificaciones", async (req, res) => {
  try {
    const calificaciones = await calificacionModel.listar_por_producto(req.params.producto_id);
    return res.json({ calificaciones });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
});

module.exports = router;
