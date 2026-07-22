const jwt = require("jsonwebtoken");

function verificarToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token no proporcionado" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    req.usuario = { id: decoded.sub, rol: decoded.rol, nombre: decoded.nombre };
    next();
  } catch (err) {
    return res.status(401).json({ error: "Token inválido o expirado" });
  }
}

function verificarTokenOpcional(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    try {
      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
      req.usuario = { id: decoded.sub, rol: decoded.rol, nombre: decoded.nombre };
    } catch (err) {
      // Token inválido, continuar sin usuario
    }
  }
  next();
}

function requiereRol(...rolesPermitidos) {
  return (req, res, next) => {
    verificarToken(req, res, () => {
      if (rolesPermitidos.length && !rolesPermitidos.includes(req.usuario.rol)) {
        return res.status(403).json({ error: "No tienes permisos para realizar esta acción" });
      }
      next();
    });
  };
}

module.exports = { verificarToken, verificarTokenOpcional, requiereRol };
