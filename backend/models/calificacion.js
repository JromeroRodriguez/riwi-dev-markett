const pool = require("../db/connection");

async function obtener_compra_calificable(compra_id, comprador_id) {
  const { rows } = await pool.query(
    `SELECT id, producto_id FROM compras
     WHERE id = $1 AND comprador_id = $2 AND estado_pago = 'completado'`,
    [compra_id, comprador_id]
  );
  return rows[0] || null;
}

async function ya_calificada(compra_id) {
  const { rows } = await pool.query(
    "SELECT 1 FROM calificaciones WHERE compra_id = $1",
    [compra_id]
  );
  return rows.length > 0;
}

async function crear_calificacion(compra_id, puntuacion, comentario) {
  const { rows } = await pool.query(
    `INSERT INTO calificaciones (compra_id, puntuacion, comentario)
     VALUES ($1, $2, $3)
     RETURNING id, compra_id, puntuacion, comentario, fecha`,
    [compra_id, puntuacion, comentario]
  );
  return rows[0];
}

async function listar_por_producto(producto_id) {
  const { rows } = await pool.query(
    `SELECT cal.id, cal.puntuacion, cal.comentario, cal.fecha, u.nombre AS comprador
     FROM calificaciones cal
     JOIN compras co ON co.id = cal.compra_id
     JOIN usuarios u ON u.id = co.comprador_id
     WHERE co.producto_id = $1
     ORDER BY cal.fecha DESC`,
    [producto_id]
  );
  return rows;
}

module.exports = {
  obtener_compra_calificable,
  ya_calificada,
  crear_calificacion,
  listar_por_producto,
};
