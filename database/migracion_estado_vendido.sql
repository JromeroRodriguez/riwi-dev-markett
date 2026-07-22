-- ============================================================
-- Migración: agregar el estado 'vendido' a productos
-- (venta única: al comprarse, el producto sale del catálogo)
--
-- Ejecutar este script UNA VEZ sobre una base de datos que ya
-- exista (creada antes de este cambio). Si vas a crear la base
-- de datos desde cero, no lo necesitas: ya está incluido en
-- schema_marketplace_riwi.sql
-- ============================================================

ALTER TABLE productos DROP CONSTRAINT IF EXISTS productos_estado_check;

ALTER TABLE productos ADD CONSTRAINT productos_estado_check
    CHECK (estado IN ('en_revision', 'aprobado', 'rechazado', 'publicado', 'archivado', 'vendido'));
