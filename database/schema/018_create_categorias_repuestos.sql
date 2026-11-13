
-- ==========================================
-- Proyecto: App Mantenimiento Planta
-- Archivo: Creacion de tabla categorias_repuestos
-- Descripcion: Clasifica los repuestos de cada empresa
-- ==========================================

CREATE TABLE categorias_repuestos (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    empresa_id BIGINT NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_categorias_repuestos_empresa
        FOREIGN KEY (empresa_id)
        REFERENCES empresas(id)
        ON DELETE RESTRICT,

    CONSTRAINT uq_categorias_repuestos_empresa_nombre
        UNIQUE (empresa_id, nombre),

    CONSTRAINT uq_categorias_repuestos_id_empresa
        UNIQUE (id, empresa_id)
);

CREATE INDEX idx_categorias_repuestos_empresa_id
    ON categorias_repuestos(empresa_id);
