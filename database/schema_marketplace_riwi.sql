-- ============================================================
-- Marketplace de Productos Digitales RIWI
-- Script de creación de base de datos (PostgreSQL)
-- ============================================================

-- Extensión para generar UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLA: usuarios
-- ============================================================
CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    rol VARCHAR(20) NOT NULL DEFAULT 'comprador'
        CHECK (rol IN ('administrador', 'vendedor', 'comprador')),
    estado VARCHAR(20) NOT NULL DEFAULT 'activo'
        CHECK (estado IN ('activo', 'bloqueado', 'pendiente_vendedor')),
    fecha_registro TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLA: categorias
-- ============================================================
CREATE TABLE categorias (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(100) NOT NULL UNIQUE
);

-- ============================================================
-- TABLA: productos
-- ============================================================
CREATE TABLE productos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendedor_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    categoria_id UUID NOT NULL REFERENCES categorias(id) ON DELETE RESTRICT,
    titulo VARCHAR(150) NOT NULL,
    descripcion TEXT NOT NULL,
    precio NUMERIC(10, 2) NOT NULL CHECK (precio >= 0),
    url_repositorio VARCHAR(255) NOT NULL,
    url_imagen VARCHAR(255),
    copias_disponibles INTEGER CHECK (copias_disponibles IS NULL OR copias_disponibles >= 0),
    estado VARCHAR(20) NOT NULL DEFAULT 'en_revision'
        CHECK (estado IN ('en_revision', 'aprobado', 'rechazado', 'publicado', 'archivado', 'vendido')),
    motivo_rechazo TEXT,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_productos_vendedor ON productos(vendedor_id);
CREATE INDEX idx_productos_categoria ON productos(categoria_id);
CREATE INDEX idx_productos_estado ON productos(estado);

-- ============================================================
-- TABLA: compras
-- ============================================================
CREATE TABLE compras (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    comprador_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    producto_id UUID NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,
    monto NUMERIC(10, 2) NOT NULL CHECK (monto >= 0),
    estado_pago VARCHAR(20) NOT NULL DEFAULT 'completado'
        CHECK (estado_pago IN ('pendiente', 'completado', 'reembolsado')),
    metodo_pago VARCHAR(20) NOT NULL DEFAULT 'tarjeta'
        CHECK (metodo_pago IN ('tarjeta', 'transferencia')),
    fecha_compra TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_compras_comprador ON compras(comprador_id);
CREATE INDEX idx_compras_producto ON compras(producto_id);

-- ============================================================
-- TABLA: carrito
-- Carrito de compras persistente en BD (viaja con el usuario)
-- ============================================================
CREATE TABLE carrito (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    comprador_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    producto_id UUID NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,
    seleccionado BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_agregado TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (comprador_id, producto_id)
);

CREATE INDEX idx_carrito_comprador ON carrito(comprador_id);
CREATE INDEX idx_carrito_producto ON carrito(producto_id);

-- ============================================================
-- TABLA: calificaciones
-- ============================================================
CREATE TABLE calificaciones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    compra_id UUID NOT NULL UNIQUE REFERENCES compras(id) ON DELETE CASCADE,
    puntuacion SMALLINT NOT NULL CHECK (puntuacion BETWEEN 1 AND 5),
    comentario TEXT,
    fecha TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLA: notificaciones
-- ============================================================
CREATE TABLE notificaciones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    mensaje VARCHAR(255) NOT NULL,
    leida BOOLEAN NOT NULL DEFAULT FALSE,
    fecha TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notificaciones_usuario ON notificaciones(usuario_id);

-- ============================================================
-- DATOS INICIALES (seed) — categorías base
-- ============================================================
INSERT INTO categorias (nombre) VALUES
    ('Apps web'),
    ('APIs'),
    ('Plantillas'),
    ('Automatizaciones');

-- ============================================================
-- USUARIO ADMINISTRADOR INICIAL
-- (el hash se corrige automáticamente al iniciar el servidor)
-- ============================================================
INSERT INTO usuarios (nombre, email, password_hash, rol, estado)
VALUES ('Admin RIWI', 'admin@riwi.io', '$2b$10$tDaJH9wLPyNXJBGnenrjEuqZkJPjbE9EZGN1JP.G3xnvdnU3FdSDq', 'administrador', 'activo');
