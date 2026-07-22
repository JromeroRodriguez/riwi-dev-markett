require("dotenv").config();
const express = require("express");
const cors = require("cors");
const pool = require("./db/connection");
const bcrypt = require("bcryptjs");

const authRoutes = require("./routes/auth");
const usuarioRoutes = require("./routes/usuario");
const categoriaRoutes = require("./routes/categoria");
const productoRoutes = require("./routes/producto");
const compraRoutes = require("./routes/compra");
const carritoRoutes = require("./routes/carrito");
const calificacionRoutes = require("./routes/calificacion");
const notificacionRoutes = require("./routes/notificacion");
const estadisticaRoutes = require("./routes/estadistica");

const path = require("path");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/auth", authRoutes);
app.use("/api/usuarios", usuarioRoutes);
app.use("/api/categorias", categoriaRoutes);
app.use("/api/productos", productoRoutes);
app.use("/api/compras", compraRoutes);
app.use("/api/carrito", carritoRoutes);
app.use("/api", calificacionRoutes);
app.use("/api/notificaciones", notificacionRoutes);
app.use("/api/estadisticas", estadisticaRoutes);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", servicio: "marketplace-riwi-api" });
});

async function seedAdmin() {
  try {
    const { rows } = await pool.query(
      "SELECT id, password_hash FROM usuarios WHERE email = $1",
      ["admin@riwi.io"]
    );
    const hash = await bcrypt.hash("admin123", 10);

    if (rows.length === 0) {
      await pool.query(
        `INSERT INTO usuarios (nombre, email, password_hash, rol, estado)
         VALUES ($1, $2, $3, $4, $5)`,
        ["Admin RIWI", "admin@riwi.io", hash, "administrador", "activo"]
      );
      console.log("Usuario administrador creado: admin@riwi.io / admin123");
    } else {
      const passwordValido = await bcrypt.compare("admin123", rows[0].password_hash);
      if (!passwordValido) {
        await pool.query(
          "UPDATE usuarios SET password_hash = $1, rol = 'administrador', estado = 'activo' WHERE email = $2",
          [hash, "admin@riwi.io"]
        );
        console.log("Contraseña del administrador actualizada: admin@riwi.io / admin123");
      }
    }
  } catch (err) {
    console.error("Error al sembrar admin:", err.message);
  }
}

async function start() {
  try {
    await pool.query("SELECT 1");
    console.log("Conectado a PostgreSQL");
    await seedAdmin();
    app.listen(PORT, () => {
      console.log(`Servidor corriendo en http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Error al iniciar:", err.message);
    process.exit(1);
  }
}

start();
