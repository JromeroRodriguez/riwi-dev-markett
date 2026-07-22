const express = require("express");
const router = express.Router();
const notificacionModel = require("../models/notificacion");
const { requiereRol } = require("../middleware/auth");

router.get("/", requiereRol(), async (req, res) => {
  try {
    const notificaciones = await notificacionModel.listar_por_usuario(req.usuario.id);
    return res.json({ notificaciones });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.patch("/:notificacion_id/leida", requiereRol(), async (req, res) => {
  try {
    const resultado = await notificacionModel.marcar_como_leida(req.params.notificacion_id, req.usuario.id);
    if (!resultado) return res.status(404).json({ error: "Notificación no encontrada" });
    return res.json({ mensaje: "Notificación marcada como leída" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
});

module.exports = router;
