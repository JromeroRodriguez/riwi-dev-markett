-- Migración: método de pago simulado en compras
-- Ejecutar una vez si la base ya existía sin esta columna.

ALTER TABLE compras ADD COLUMN IF NOT EXISTS metodo_pago VARCHAR(20) NOT NULL DEFAULT 'tarjeta';

ALTER TABLE compras DROP CONSTRAINT IF EXISTS compras_metodo_pago_check;

ALTER TABLE compras ADD CONSTRAINT compras_metodo_pago_check
    CHECK (metodo_pago IN ('tarjeta', 'transferencia'));
