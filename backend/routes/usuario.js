const express = require("express");
const router = express.Router();
const usuarioModel = require("../models/usuario");
const notificacionModel = require("../models/notificacion");
const { requiereRol } = require("../middleware/auth");

const ESTADOS_MANUALES_VALIDOS = ["activo", "bloqueado"];

router.post("/solicitud-vendedor", requiereRol("comprador"), async (req, res) => {
  try {
    const usuario = await usuarioModel.solicitar_rol_vendedor(req.usuario.id);
    if (!usuario) {
      return res.status(409).json({ error: "Ya tienes una solicitud pendiente o no cumples los requisitos" });
    }
    return res.json({ mensaje: "Solicitud enviada. Un administrador la revisará pronto.", usuario });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.get("/", requiereRol("administrador"), async (req, res) => {
  try {
    const { rol, estado } = req.query;
    const usuarios = await usuarioModel.listar_usuarios(rol || null, estado || null);
    return res.json({ usuarios });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.patch("/:usuario_id/estado", requiereRol("administrador"), async (req, res) => {
  try {
    const { estado } = req.body || {};
    if (!ESTADOS_MANUALES_VALIDOS.includes(estado)) {
      return res.status(400).json({ error: `estado debe ser uno de: ${ESTADOS_MANUALES_VALIDOS.join(", ")}` });
    }
    const usuario = await usuarioModel.cambiar_estado(req.params.usuario_id, estado);
    if (!usuario) return res.status(404).json({ error: "Usuario no encontrado" });
    return res.json({ mensaje: "Estado actualizado", usuario });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.patch("/:usuario_id/aprobar-vendedor", requiereRol("administrador"), async (req, res) => {
  try {
    const usuario = await usuarioModel.aprobar_solicitud_vendedor(req.params.usuario_id);
    if (!usuario) return res.status(404).json({ error: "El usuario no tiene una solicitud pendiente" });
    await notificacionModel.crear_notificacion(usuario.id, "¡Tu solicitud para ser vendedor fue aprobada! Ya puedes publicar productos.");
    return res.json({ mensaje: "Solicitud aprobada", usuario });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.patch("/:usuario_id/rechazar-vendedor", requiereRol("administrador"), async (req, res) => {
  try {
    const usuario = await usuarioModel.rechazar_solicitud_vendedor(req.params.usuario_id);
    if (!usuario) return res.status(404).json({ error: "El usuario no tiene una solicitud pendiente" });
    await notificacionModel.crear_notificacion(usuario.id, "Tu solicitud para ser vendedor fue rechazada.");
    return res.json({ mensaje: "Solicitud rechazada", usuario });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
});

module.exports = router;
