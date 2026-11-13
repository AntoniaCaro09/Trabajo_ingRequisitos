
CREATE TABLE consumo_repuestos_ordenes (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    orden_trabajo_id BIGINT NOT NULL,
    inventario_id BIGINT NOT NULL,
    usuario_id BIGINT NOT NULL,

    cantidad NUMERIC(14,3) NOT NULL,
    observaciones TEXT,

    fecha_registro TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_consumo_orden
        FOREIGN KEY (orden_trabajo_id)
        REFERENCES ordenes_trabajo(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_consumo_inventario
        FOREIGN KEY (inventario_id)
        REFERENCES inventario_repuestos(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_consumo_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
        ON DELETE RESTRICT,

    CONSTRAINT ck_consumo_cantidad
        CHECK (cantidad > 0)
);

CREATE INDEX idx_consumo_orden_id
ON consumo_repuestos_ordenes(orden_trabajo_id);

CREATE INDEX idx_consumo_inventario_id
ON consumo_repuestos_ordenes(inventario_id);

CREATE INDEX idx_consumo_usuario_id
ON consumo_repuestos_ordenes(usuario_id);
