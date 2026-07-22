const pool = require("../db/connection");
const bcrypt = require("bcryptjs");

async function crear_usuario(nombre, email, password, rol = "comprador") {
  const password_hash = await bcrypt.hash(password, 10);
  const { rows } = await pool.query(
    `INSERT INTO usuarios (nombre, email, password_hash, rol)
     VALUES ($1, $2, $3, $4)
     RETURNING id, nombre, email, rol, estado, fecha_registro`,
    [nombre, email, password_hash, rol]
  );
  return rows[0];
}

async function buscar_por_email(email) {
  const { rows } = await pool.query("SELECT * FROM usuarios WHERE email = $1", [email]);
  return rows[0] || null;
}

async function buscar_por_id(usuario_id) {
  const { rows } = await pool.query(
    "SELECT id, nombre, email, rol, estado, fecha_registro FROM usuarios WHERE id = $1",
    [usuario_id]
  );
  return rows[0] || null;
}

async function verificar_password(password_plano, password_hash) {
  return bcrypt.compare(password_plano, password_hash);
}

async function email_existe(email) {
  const { rows } = await pool.query("SELECT 1 FROM usuarios WHERE email = $1", [email]);
  return rows.length > 0;
}

async function listar_usuarios(rol = null, estado = null) {
  const condiciones = [];
  const valores = [];
  let idx = 1;

  if (rol) {
    condiciones.push(`rol = $${idx++}`);
    valores.push(rol);
  }
  if (estado) {
    condiciones.push(`estado = $${idx++}`);
    valores.push(estado);
  }

  const where = condiciones.length ? `WHERE ${condiciones.join(" AND ")}` : "";
  const { rows } = await pool.query(
    `SELECT id, nombre, email, rol, estado, fecha_registro
     FROM usuarios ${where}
     ORDER BY fecha_registro DESC`,
    valores
  );
  return rows;
}

async function solicitar_rol_vendedor(usuario_id) {
  const { rows } = await pool.query(
    `UPDATE usuarios SET estado = 'pendiente_vendedor'
     WHERE id = $1 AND rol = 'comprador' AND estado = 'activo'
     RETURNING id, nombre, email, rol, estado`,
    [usuario_id]
  );
  return rows[0] || null;
}

async function aprobar_solicitud_vendedor(usuario_id) {
  const { rows } = await pool.query(
    `UPDATE usuarios SET rol = 'vendedor', estado = 'activo'
     WHERE id = $1 AND estado = 'pendiente_vendedor'
     RETURNING id, nombre, email, rol, estado`,
    [usuario_id]
  );
  return rows[0] || null;
}

async function rechazar_solicitud_vendedor(usuario_id) {
  const { rows } = await pool.query(
    `UPDATE usuarios SET estado = 'activo'
     WHERE id = $1 AND estado = 'pendiente_vendedor'
     RETURNING id, nombre, email, rol, estado`,
    [usuario_id]
  );
  return rows[0] || null;
}

async function cambiar_estado(usuario_id, nuevo_estado) {
  const { rows } = await pool.query(
    `UPDATE usuarios SET estado = $1
     WHERE id = $2
     RETURNING id, nombre, email, rol, estado`,
    [nuevo_estado, usuario_id]
  );
  return rows[0] || null;
}

module.exports = {
  crear_usuario,
  buscar_por_email,
  buscar_por_id,
  verificar_password,
  email_existe,
  listar_usuarios,
  solicitar_rol_vendedor,
  aprobar_solicitud_vendedor,
  rechazar_solicitud_vendedor,
  cambiar_estado,
};
