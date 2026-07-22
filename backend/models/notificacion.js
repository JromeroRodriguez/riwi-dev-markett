const pool = require("../db/connection");

async function crear_notificacion(usuario_id, mensaje) {
  const { rows } = await pool.query(
    `INSERT INTO notificaciones (usuario_id, mensaje)
     VALUES ($1, $2)
     RETURNING id, usuario_id, mensaje, leida, fecha`,
    [usuario_id, mensaje]
  );
  return rows[0];
}

async function listar_por_usuario(usuario_id) {
  const { rows } = await pool.query(
    "SELECT * FROM notificaciones WHERE usuario_id = $1 ORDER BY fecha DESC",
    [usuario_id]
  );
  return rows;
}

async function marcar_como_leida(notificacion_id, usuario_id) {
  const { rows } = await pool.query(
    `UPDATE notificaciones SET leida = TRUE
     WHERE id = $1 AND usuario_id = $2
     RETURNING id`,
    [notificacion_id, usuario_id]
  );
  return rows[0] || null;
}

module.exports = { crear_notificacion, listar_por_usuario, marcar_como_leida };
