
-- ==========================================
-- Proyecto: App Mantenimiento Planta
-- Archivo: Relacion entre usuarios y plantas
-- Descripcion: Define las plantas a las que puede acceder cada usuario
-- ==========================================

CREATE TABLE usuario_plantas (
    usuario_id BIGINT NOT NULL,
    planta_id BIGINT NOT NULL,
    fecha_asignacion TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_usuario_plantas
        PRIMARY KEY (usuario_id, planta_id),

    CONSTRAINT fk_usuario_plantas_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_usuario_plantas_planta
        FOREIGN KEY (planta_id)
        REFERENCES plantas(id)
        ON DELETE CASCADE
);

CREATE INDEX idx_usuario_plantas_planta_id
    ON usuario_plantas(planta_id);
