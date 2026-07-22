const express = require("express");
const jwt = require("jsonwebtoken");
const router = express.Router();
const usuarioModel = require("../models/usuario");
const { requiereRol } = require("../middleware/auth");

router.post("/registro", async (req, res) => {
  try {
    const { nombre, email, password } = req.body || {};

    if (!nombre || !email || !password) {
      return res.status(400).json({ error: "nombre, email y password son obligatorios" });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "La contraseña debe tener al menos 6 caracteres" });
    }
    if (await usuarioModel.email_existe(email.toLowerCase())) {
      return res.status(409).json({ error: "Ya existe una cuenta registrada con este email" });
    }

    const usuario = await usuarioModel.crear_usuario(nombre.trim(), email.trim().toLowerCase(), password);
    return res.status(201).json({ mensaje: "Usuario registrado exitosamente", usuario });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ error: "email y password son obligatorios" });
    }

    const usuario = await usuarioModel.buscar_por_email(email.trim().toLowerCase());
    if (!usuario || !(await usuarioModel.verificar_password(password, usuario.password_hash))) {
      return res.status(401).json({ error: "Credenciales incorrectas" });
    }
    if (usuario.estado === "bloqueado") {
      return res.status(403).json({ error: "Tu cuenta está bloqueada. Contacta al administrador" });
    }

    const token = jwt.sign(
      { sub: String(usuario.id), rol: usuario.rol, nombre: usuario.nombre },
      process.env.JWT_SECRET_KEY,
      { expiresIn: parseInt(process.env.JWT_EXPIRES_SECONDS) || 86400 }
    );

    return res.json({
      mensaje: "Inicio de sesión exitoso",
      token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.get("/perfil", requiereRol(), async (req, res) => {
  try {
    const usuario = await usuarioModel.buscar_por_id(req.usuario.id);
    if (!usuario) return res.status(404).json({ error: "Usuario no encontrado" });
    return res.json({ usuario });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
});

module.exports = router;
