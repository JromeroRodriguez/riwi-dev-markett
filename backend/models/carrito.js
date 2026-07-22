const pool = require("../db/connection");

async function obtenerPorComprador(comprador_id) {
  const { rows } = await pool.query(
    `SELECT c.producto_id, c.seleccionado, c.fecha_agregado,
            p.titulo, p.precio, p.url_repositorio,
            cat.nombre AS categoria, u.nombre AS vendedor,
            p.vendedor_id
     FROM carrito c
     JOIN productos p ON p.id = c.producto_id
     JOIN categorias cat ON cat.id = p.categoria_id
     JOIN usuarios u ON u.id = p.vendedor_id
     WHERE c.comprador_id = $1 AND p.estado = 'publicado'
     ORDER BY c.fecha_agregado DESC`,
    [comprador_id]
  );
  return rows;
}

async function yaExiste(comprador_id, producto_id) {
  const { rows } = await pool.query(
    "SELECT 1 FROM carrito WHERE comprador_id = $1 AND producto_id = $2",
    [comprador_id, producto_id]
  );
  return rows.length > 0;
}

async function agregar(comprador_id, producto_id) {
  const { rows } = await pool.query(
    `INSERT INTO carrito (comprador_id, producto_id, seleccionado)
     VALUES ($1, $2, TRUE)
     ON CONFLICT (comprador_id, producto_id)
     DO UPDATE SET seleccionado = TRUE
     RETURNING id`,
    [comprador_id, producto_id]
  );
  return rows[0] || null;
}

async function eliminar(comprador_id, producto_id) {
  const { rowCount } = await pool.query(
    "DELETE FROM carrito WHERE comprador_id = $1 AND producto_id = $2",
    [comprador_id, producto_id]
  );
  return rowCount > 0;
}

async function toggleSeleccion(comprador_id, producto_id) {
  const { rows } = await pool.query(
    `UPDATE carrito SET seleccionado = NOT seleccionado
     WHERE comprador_id = $1 AND producto_id = $2
     RETURNING seleccionado`,
    [comprador_id, producto_id]
  );
  return rows[0] || null;
}

async function limpiar(comprador_id, producto_ids) {
  await pool.query(
    "DELETE FROM carrito WHERE comprador_id = $1 AND producto_id = ANY($2)",
    [comprador_id, producto_ids]
  );
}

async function productoDisponible(producto_id, comprador_id) {
  const { rows } = await pool.query(
    `SELECT 1
     FROM productos p
     WHERE p.id = $1 AND p.estado = 'publicado' AND p.vendedor_id <> $2`,
    [producto_id, comprador_id]
  );
  return rows.length > 0;
}

async function yaComprado(comprador_id, producto_id) {
  const { rows } = await pool.query(
    `SELECT 1 FROM compras
     WHERE comprador_id = $1 AND producto_id = $2 AND estado_pago = 'completado'`,
    [comprador_id, producto_id]
  );
  return rows.length > 0;
}

module.exports = {
  obtenerPorComprador,
  yaExiste,
  agregar,
  eliminar,
  toggleSeleccion,
  limpiar,
  productoDisponible,
  yaComprado,
};
