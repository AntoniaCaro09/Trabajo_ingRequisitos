
CREATE TABLE adjuntos_reportes_anomalias (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    reporte_anomalia_id BIGINT NOT NULL,
    usuario_subida_id BIGINT NOT NULL,

    nombre_archivo VARCHAR(255) NOT NULL,
    ruta_archivo TEXT NOT NULL,
    tipo_mime VARCHAR(100) NOT NULL,
    tamano_bytes BIGINT NOT NULL,

    fecha_subida TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_adjuntos_reporte
        FOREIGN KEY (reporte_anomalia_id)
        REFERENCES reportes_anomalias(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_adjuntos_reporte_usuario
        FOREIGN KEY (usuario_subida_id)
        REFERENCES usuarios(id)
        ON DELETE RESTRICT,

    CONSTRAINT ck_adjuntos_reporte_tamano
        CHECK (tamano_bytes > 0),

    CONSTRAINT ck_adjuntos_reporte_nombre
        CHECK (LENGTH(TRIM(nombre_archivo)) > 0),

    CONSTRAINT ck_adjuntos_reporte_ruta
        CHECK (LENGTH(TRIM(ruta_archivo)) > 0)
);

CREATE INDEX idx_adjuntos_reporte_id
    ON adjuntos_reportes_anomalias(reporte_anomalia_id);

CREATE INDEX idx_adjuntos_reporte_usuario
    ON adjuntos_reportes_anomalias(usuario_subida_id);
