
CREATE TABLE adjuntos_ordenes_trabajo (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    orden_trabajo_id BIGINT NOT NULL,
    usuario_subida_id BIGINT NOT NULL,

    nombre_archivo VARCHAR(255) NOT NULL,
    ruta_archivo TEXT NOT NULL,
    tipo_mime VARCHAR(100) NOT NULL,
    tamano_bytes BIGINT NOT NULL,

    fecha_subida TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_adjuntos_orden
        FOREIGN KEY (orden_trabajo_id)
        REFERENCES ordenes_trabajo(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_adjuntos_orden_usuario
        FOREIGN KEY (usuario_subida_id)
        REFERENCES usuarios(id)
        ON DELETE RESTRICT,

    CONSTRAINT ck_adjuntos_orden_tamano
        CHECK (tamano_bytes > 0),

    CONSTRAINT ck_adjuntos_orden_nombre
        CHECK (LENGTH(TRIM(nombre_archivo)) > 0),

    CONSTRAINT ck_adjuntos_orden_ruta
        CHECK (LENGTH(TRIM(ruta_archivo)) > 0)
);

CREATE INDEX idx_adjuntos_orden_id
    ON adjuntos_ordenes_trabajo(orden_trabajo_id);

CREATE INDEX idx_adjuntos_orden_usuario
    ON adjuntos_ordenes_trabajo(usuario_subida_id);
