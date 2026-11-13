
-- Permite relacionar el inventario con su empresa
ALTER TABLE inventario_repuestos
ADD CONSTRAINT uq_inventario_id_empresa
UNIQUE (id, empresa_id);

-- Registro de movimientos de inventario
CREATE TABLE movimientos_inventario (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    inventario_id BIGINT NOT NULL,
    empresa_id BIGINT NOT NULL,
    usuario_id BIGINT NOT NULL,

    tipo_movimiento VARCHAR(20) NOT NULL,
    cantidad NUMERIC(14,3) NOT NULL,
    motivo VARCHAR(150),
    observaciones TEXT,

    fecha_movimiento TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_movimientos_inventario
        FOREIGN KEY (inventario_id, empresa_id)
        REFERENCES inventario_repuestos(id, empresa_id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_movimientos_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
        ON DELETE RESTRICT,

    CONSTRAINT ck_movimientos_tipo
        CHECK (tipo_movimiento IN ('entrada', 'salida', 'ajuste')),

    CONSTRAINT ck_movimientos_cantidad
        CHECK (
            (tipo_movimiento IN ('entrada', 'salida') AND cantidad > 0)
            OR
            (tipo_movimiento = 'ajuste' AND cantidad <> 0)
        )
);

CREATE INDEX idx_movimientos_inventario_id
ON movimientos_inventario(inventario_id);

CREATE INDEX idx_movimientos_empresa_id
ON movimientos_inventario(empresa_id);

CREATE INDEX idx_movimientos_usuario_id
ON movimientos_inventario(usuario_id);

CREATE INDEX idx_movimientos_fecha
ON movimientos_inventario(fecha_movimiento);
