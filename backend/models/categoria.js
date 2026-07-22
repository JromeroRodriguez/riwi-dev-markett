const pool = require("../db/connection");

async function listar_categorias() {
  const { rows } = await pool.query("SELECT * FROM categorias ORDER BY nombre");
  return rows;
}

async function crear_categoria(nombre) {
  const { rows } = await pool.query(
    "INSERT INTO categorias (nombre) VALUES ($1) RETURNING id, nombre",
    [nombre]
  );
  return rows[0];
}

module.exports = { listar_categorias, crear_categoria };
