
-- ==========================================
-- Proyecto: App Mantenimiento Planta
-- Archivo: Creacion de tabla historial_ordenes_trabajo
-- Descripcion: Registra los cambios y observaciones de las ordenes
-- ==========================================

CREATE TABLE historial_ordenes_trabajo (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    orden_trabajo_id BIGINT NOT NULL,
    usuario_id BIGINT NOT NULL,
    estado_anterior VARCHAR(30),
    estado_nuevo VARCHAR(30),
    comentario TEXT,
    fecha_registro TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_historial_orden
        FOREIGN KEY (orden_trabajo_id)
        REFERENCES ordenes_trabajo(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_historial_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
        ON DELETE RESTRICT,

    CONSTRAINT ck_historial_estado_anterior
        CHECK (
            estado_anterior IS NULL
            OR estado_anterior IN (
                'pendiente',
                'asignada',
                'en_progreso',
                'pausada',
                'completada',
                'cancelada'
            )
        ),

    CONSTRAINT ck_historial_estado_nuevo
        CHECK (
            estado_nuevo IS NULL
            OR estado_nuevo IN (
                'pendiente',
                'asignada',
                'en_progreso',
                'pausada',
                'completada',
                'cancelada'
            )
        ),

    CONSTRAINT ck_historial_contenido
        CHECK (
            estado_anterior IS NOT NULL
            OR estado_nuevo IS NOT NULL
            OR comentario IS NOT NULL
        )
);

CREATE INDEX idx_historial_orden_id
    ON historial_ordenes_trabajo(orden_trabajo_id);

CREATE INDEX idx_historial_usuario_id
    ON historial_ordenes_trabajo(usuario_id);

CREATE INDEX idx_historial_fecha
    ON historial_ordenes_trabajo(fecha_registro);
