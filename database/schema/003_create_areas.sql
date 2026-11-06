-- ==========================================
-- Proyecto: App Mantenimiento Planta
-- Archivo: Creacion de tabla areas
-- Descripcion: Registra las areas de cada planta
-- ==========================================

CREATE TABLE areas (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    planta_id BIGINT NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_areas_planta
        FOREIGN KEY (planta_id)
        REFERENCES plantas(id)
        ON DELETE RESTRICT,

    CONSTRAINT uq_areas_nombre_planta
        UNIQUE (planta_id, nombre)
);

CREATE INDEX idx_areas_planta_id
    ON areas(planta_id);