
-- ==========================================
-- Proyecto: App Mantenimiento Planta
-- Archivo: Creacion de tabla inventario_repuestos
-- Descripcion: Controla las existencias de repuestos por planta
-- ==========================================

CREATE TABLE inventario_repuestos (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    empresa_id BIGINT NOT NULL,
    planta_id BIGINT NOT NULL,
    repuesto_id BIGINT NOT NULL,
    cantidad NUMERIC(14,3) NOT NULL DEFAULT 0,
    stock_minimo NUMERIC(14,3) NOT NULL DEFAULT 0,
    ubicacion VARCHAR(100),
    fecha_actualizacion TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_inventario_planta_empresa
        FOREIGN KEY (planta_id, empresa_id)
        REFERENCES plantas(id, empresa_id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_inventario_repuesto_empresa
        FOREIGN KEY (repuesto_id, empresa_id)
        REFERENCES repuestos(id, empresa_id)
        ON DELETE RESTRICT,

    CONSTRAINT uq_inventario_planta_repuesto
        UNIQUE (planta_id, repuesto_id),

    CONSTRAINT ck_inventario_cantidad
        CHECK (cantidad >= 0),

    CONSTRAINT ck_inventario_stock_minimo
        CHECK (stock_minimo >= 0)
);

CREATE INDEX idx_inventario_empresa_id
    ON inventario_repuestos(empresa_id);

CREATE INDEX idx_inventario_planta_id
    ON inventario_repuestos(planta_id);

CREATE INDEX idx_inventario_repuesto_id
    ON inventario_repuestos(repuesto_id);
