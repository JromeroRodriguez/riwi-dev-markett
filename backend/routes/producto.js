const express = require("express");
const router = express.Router();
const productoModel = require("../models/producto");
const notificacionModel = require("../models/notificacion");
const { requiereRol } = require("../middleware/auth");
const { verificarTokenOpcional } = require("../middleware/auth");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.fieldname === "archivo_zip") {
      if (file.mimetype === "application/zip" || file.mimetype === "application/x-zip-compressed" || file.originalname.toLowerCase().endsWith(".zip")) {
        cb(null, true);
      } else {
        cb(new Error("Solo se permiten archivos .zip"), false);
      }
    } else if (file.fieldname === "imagen_portada") {
      const allowedExts = /jpe?g|png|webp/i;
      const isExtOk = allowedExts.test(path.extname(file.originalname));
      const isMimeOk = /image\/(jpeg|png|webp)/i.test(file.mimetype);
      if (isExtOk && isMimeOk) {
        cb(null, true);
      } else {
        cb(new Error("La imagen de portada debe ser en formato JPG, PNG o WebP"), false);
      }
    } else {
      cb(new Error("Campo de archivo no válido"), false);
    }
  }
});

const cpUpload = upload.fields([
  { name: "archivo_zip", maxCount: 1 },
  { name: "imagen_portada", maxCount: 1 }
]);

const cpUploadMiddleware = (req, res, next) => {
  cpUpload(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    next();
  });
};

const deleteUploadedFiles = (files) => {
  if (!files) return;
  if (files.archivo_zip && files.archivo_zip[0]) {
    fs.unlink(files.archivo_zip[0].path, () => {});
  }
  if (files.imagen_portada && files.imagen_portada[0]) {
    fs.unlink(files.imagen_portada[0].path, () => {});
  }
};

router.get("/", verificarTokenOpcional, async (req, res) => {
  try {
    const { categoria_id, precio_max, q, page, limit } = req.query;
    const comprador_id = req.usuario?.id || null;
    const pagina = Math.max(1, parseInt(page) || 1);
    const limite = Math.min(48, Math.max(1, parseInt(limit) || 12));
    const { rows: productos, total } = await productoModel.listar_publicados(
      categoria_id || null,
      precio_max ? parseFloat(precio_max) : null,
      q || null,
      comprador_id,
      pagina,
      limite
    );
    return res.json({
      productos,
      total,
      page: pagina,
      limit: limite,
      totalPages: Math.ceil(total / limite),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.get("/pendientes", requiereRol("administrador"), async (req, res) => {
  try {
    const productos = await productoModel.listar_pendientes();
    return res.json({ productos });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.get("/mios", requiereRol("vendedor", "administrador"), async (req, res) => {
  try {
    const productos = await productoModel.listar_por_vendedor(req.usuario.id);
    return res.json({ productos });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.get("/:producto_id", async (req, res) => {
  try {
    const producto = await productoModel.obtener_por_id(req.params.producto_id);
    if (!producto) return res.status(404).json({ error: "Producto no encontrado" });
    return res.json({ producto });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.post("/", requiereRol("vendedor", "administrador"), cpUploadMiddleware, async (req, res) => {
  try {
    const { titulo, descripcion, categoria_id } = req.body || {};
    const precio = parseFloat(req.body?.precio);
    let { url_repositorio } = req.body || {};

    const campos_obligatorios = ["titulo", "descripcion", "categoria_id", "precio"];
    const faltantes = campos_obligatorios.filter((c) => !req.body[c] && req.body[c] !== 0);

    const files = req.files || {};
    const zipFile = files.archivo_zip ? files.archivo_zip[0] : null;
    const imagenFile = files.imagen_portada ? files.imagen_portada[0] : null;

    if (faltantes.length) {
      deleteUploadedFiles(files);
      return res.status(400).json({ error: `Campos obligatorios faltantes: ${faltantes.join(", ")}` });
    }
    if (isNaN(precio) || precio < 0) {
      deleteUploadedFiles(files);
      return res.status(400).json({ error: "El precio debe ser un número válido y no puede ser negativo" });
    }

    if (imagenFile && imagenFile.size > 2 * 1024 * 1024) {
      deleteUploadedFiles(files);
      return res.status(400).json({ error: "La imagen de portada no debe superar los 2 MB" });
    }

    if (zipFile) {
      url_repositorio = `/uploads/${zipFile.filename}`;
    } else {
      if (!url_repositorio || !url_repositorio.trim()) {
        deleteUploadedFiles(files);
        return res.status(400).json({ error: "Debe proporcionar un enlace de repositorio de GitHub o subir un archivo .zip" });
      }
    }

    const url_imagen = imagenFile ? `/uploads/${imagenFile.filename}` : null;

    const producto = await productoModel.crear_producto(
      req.usuario.id, categoria_id, titulo.trim(), descripcion.trim(), precio, url_repositorio.trim(), url_imagen
    );
    return res.status(201).json({ mensaje: "Producto creado, pendiente de revisión", producto });
  } catch (err) {
    console.error(err);
    deleteUploadedFiles(req.files);
    return res.status(500).json({ error: err.message || "Error interno del servidor" });
  }
});

router.put("/:producto_id", requiereRol("vendedor", "administrador"), cpUploadMiddleware, async (req, res) => {
  try {
    if (req.usuario.rol !== "administrador" && !(await productoModel.es_propietario(req.params.producto_id, req.usuario.id))) {
      deleteUploadedFiles(req.files);
      return res.status(403).json({ error: "No tienes permiso para editar este producto" });
    }

    const files = req.files || {};
    const zipFile = files.archivo_zip ? files.archivo_zip[0] : null;
    const imagenFile = files.imagen_portada ? files.imagen_portada[0] : null;

    if (imagenFile && imagenFile.size > 2 * 1024 * 1024) {
      deleteUploadedFiles(files);
      return res.status(400).json({ error: "La imagen de portada no debe superar los 2 MB" });
    }

    const campos = { ...req.body };
    if (zipFile) {
      campos.url_repositorio = `/uploads/${zipFile.filename}`;
    }
    if (imagenFile) {
      campos.url_imagen = `/uploads/${imagenFile.filename}`;
    }

    const producto = await productoModel.actualizar_producto(req.params.producto_id, req.usuario.id, campos);
    if (!producto) {
      deleteUploadedFiles(files);
      return res.status(400).json({ error: "No se enviaron campos válidos para actualizar o el producto no existe" });
    }
    return res.json({ mensaje: "Producto actualizado, pendiente de nueva revisión", producto });
  } catch (err) {
    console.error(err);
    deleteUploadedFiles(req.files);
    return res.status(500).json({ error: err.message || "Error interno del servidor" });
  }
});

router.delete("/:producto_id", requiereRol("vendedor", "administrador"), async (req, res) => {
  try {
    if (req.usuario.rol !== "administrador" && !(await productoModel.es_propietario(req.params.producto_id, req.usuario.id))) {
      return res.status(403).json({ error: "No tienes permiso para eliminar este producto" });
    }
    const resultado = await productoModel.eliminar_producto(req.params.producto_id, req.usuario.id);
    return res.json({ mensaje: `Producto ${resultado.accion} correctamente` });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.patch("/:producto_id/aprobar", requiereRol("administrador"), async (req, res) => {
  try {
    const producto = await productoModel.aprobar_producto(req.params.producto_id);
    if (!producto) return res.status(404).json({ error: "Producto no encontrado o no está en revisión" });
    await notificacionModel.crear_notificacion(
      producto.vendedor_id,
      `Tu producto '${producto.titulo}' fue aprobado y ya está publicado.`
    );
    return res.json({ mensaje: "Producto aprobado", producto });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.patch("/:producto_id/rechazar", requiereRol("administrador"), async (req, res) => {
  try {
    const motivo = (req.body.motivo || "").trim();
    if (!motivo) return res.status(400).json({ error: "Debes indicar un motivo de rechazo" });
    const producto = await productoModel.rechazar_producto(req.params.producto_id, motivo);
    if (!producto) return res.status(404).json({ error: "Producto no encontrado o no está en revisión" });
    await notificacionModel.crear_notificacion(
      producto.vendedor_id,
      `Tu producto '${producto.titulo}' fue rechazado. Motivo: ${motivo}`
    );
    return res.json({ mensaje: "Producto rechazado", producto });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
});

module.exports = router;
