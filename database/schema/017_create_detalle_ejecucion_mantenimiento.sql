
-- ==========================================
-- Proyecto: App Mantenimiento Planta
-- Archivo: Creacion de tabla detalle_ejecucion_mantenimiento
-- Descripcion: Registra los resultados de las tareas ejecutadas
-- ==========================================

CREATE TABLE detalle_ejecucion_mantenimiento (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    ejecucion_id BIGINT NOT NULL,
    tarea_plan_id BIGINT NOT NULL,
    nombre_tarea VARCHAR(150) NOT NULL,
    orden INTEGER NOT NULL,
    resultado VARCHAR(20) NOT NULL DEFAULT 'pendiente',
    observaciones TEXT,
    fecha_registro TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_detalle_ejecucion
        FOREIGN KEY (ejecucion_id)
        REFERENCES ejecuciones_mantenimiento(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_detalle_tarea
        FOREIGN KEY (tarea_plan_id)
        REFERENCES tareas_plan_mantenimiento(id)
        ON DELETE RESTRICT,

    CONSTRAINT ck_detalle_resultado
        CHECK (resultado IN (
            'pendiente',
            'cumplida',
            'no_cumplida',
            'no_aplica'
        )),

    CONSTRAINT ck_detalle_orden
        CHECK (orden > 0),

    CONSTRAINT uq_detalle_tarea_ejecucion
        UNIQUE (ejecucion_id, tarea_plan_id),

    CONSTRAINT uq_detalle_orden_ejecucion
        UNIQUE (ejecucion_id, orden)
);

CREATE INDEX idx_detalle_ejecucion_id
    ON detalle_ejecucion_mantenimiento(ejecucion_id);

CREATE INDEX idx_detalle_tarea_id
    ON detalle_ejecucion_mantenimiento(tarea_plan_id);

CREATE INDEX idx_detalle_resultado
    ON detalle_ejecucion_mantenimiento(resultado);
