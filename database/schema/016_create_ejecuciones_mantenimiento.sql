
-- ==========================================
-- Proyecto: App Mantenimiento Planta
-- Archivo: Creacion de tabla ejecuciones_mantenimiento
-- Descripcion: Registra las ejecuciones de los planes preventivos
-- ==========================================

CREATE TABLE ejecuciones_mantenimiento (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    plan_mantenimiento_id BIGINT NOT NULL,
    orden_trabajo_id BIGINT,
    usuario_responsable_id BIGINT NOT NULL,
    fecha_programada DATE NOT NULL,
    fecha_inicio TIMESTAMPTZ,
    fecha_finalizacion TIMESTAMPTZ,
    estado VARCHAR(30) NOT NULL DEFAULT 'pendiente',
    observaciones TEXT,
    fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_ejecuciones_plan
        FOREIGN KEY (plan_mantenimiento_id)
        REFERENCES planes_mantenimiento(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_ejecuciones_orden
        FOREIGN KEY (orden_trabajo_id)
        REFERENCES ordenes_trabajo(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_ejecuciones_usuario
        FOREIGN KEY (usuario_responsable_id)
        REFERENCES usuarios(id)
        ON DELETE RESTRICT,

    CONSTRAINT ck_ejecuciones_estado
        CHECK (estado IN (
            'pendiente',
            'en_progreso',
            'completada',
            'cancelada'
        )),

    CONSTRAINT ck_ejecuciones_fechas
        CHECK (
            fecha_finalizacion IS NULL
            OR fecha_inicio IS NULL
            OR fecha_finalizacion >= fecha_inicio
        )
);

CREATE INDEX idx_ejecuciones_plan_id
    ON ejecuciones_mantenimiento(plan_mantenimiento_id);

CREATE INDEX idx_ejecuciones_orden_id
    ON ejecuciones_mantenimiento(orden_trabajo_id);

CREATE INDEX idx_ejecuciones_usuario_id
    ON ejecuciones_mantenimiento(usuario_responsable_id);

CREATE INDEX idx_ejecuciones_estado
    ON ejecuciones_mantenimiento(estado);

CREATE INDEX idx_ejecuciones_fecha_programada
    ON ejecuciones_mantenimiento(fecha_programada);
