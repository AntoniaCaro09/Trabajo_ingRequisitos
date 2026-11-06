-- ==========================================
-- Proyecto: App Mantenimiento Planta
-- Archivo: Creacion de tabla plantas
-- Descripcion: Registra las plantas de cada empresa
-- ==========================================

CREATE TABLE plantas (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    empresa_id BIGINT NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    direccion TEXT,
    fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_plantas_empresa
        FOREIGN KEY (empresa_id)
        REFERENCES empresas(id)
        ON DELETE RESTRICT
);

CREATE INDEX idx_plantas_empresa_id
    ON plantas(empresa_id);