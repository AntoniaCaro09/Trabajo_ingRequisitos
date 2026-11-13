
-- ==========================================
-- Proyecto: App Mantenimiento Planta
-- Archivo: Creacion de tabla reportes_anomalias
-- Descripcion: Registra fallas y problemas en equipos
-- ==========================================

CREATE TABLE reportes_anomalias (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    equipo_id BIGINT NOT NULL,
    usuario_id BIGINT NOT NULL,
    titulo VARCHAR(150) NOT NULL,
    descripcion TEXT NOT NULL,
    prioridad VARCHAR(20) NOT NULL DEFAULT 'media',
    estado VARCHAR(30) NOT NULL DEFAULT 'pendiente',
    fecha_reporte TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_reportes_equipo
        FOREIGN KEY (equipo_id)
        REFERENCES equipos(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_reportes_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
        ON DELETE RESTRICT,

    CONSTRAINT ck_reportes_prioridad
        CHECK (prioridad IN ('baja', 'media', 'alta', 'critica')),

    CONSTRAINT ck_reportes_estado
        CHECK (estado IN ('pendiente', 'en_revision', 'resuelto'))
);

CREATE INDEX idx_reportes_equipo_id
    ON reportes_anomalias(equipo_id);

CREATE INDEX idx_reportes_usuario_id
    ON reportes_anomalias(usuario_id);

CREATE INDEX idx_reportes_estado
    ON reportes_anomalias(estado);
