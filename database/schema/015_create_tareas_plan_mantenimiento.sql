
-- ==========================================
-- Proyecto: App Mantenimiento Planta
-- Archivo: Creacion de tabla tareas_plan_mantenimiento
-- Descripcion: Registra las tareas de cada plan preventivo
-- ==========================================

CREATE TABLE tareas_plan_mantenimiento (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    plan_mantenimiento_id BIGINT NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    orden INTEGER NOT NULL,
    es_obligatoria BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_tareas_plan
        FOREIGN KEY (plan_mantenimiento_id)
        REFERENCES planes_mantenimiento(id)
        ON DELETE CASCADE,

    CONSTRAINT ck_tareas_orden
        CHECK (orden > 0),

    CONSTRAINT uq_tareas_orden_plan
        UNIQUE (plan_mantenimiento_id, orden)
);

CREATE INDEX idx_tareas_plan_id
    ON tareas_plan_mantenimiento(plan_mantenimiento_id);
