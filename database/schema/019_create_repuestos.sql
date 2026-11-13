
-- ==========================================
-- Proyecto: App Mantenimiento Planta
-- Archivo: Creacion de tabla repuestos
-- Descripcion: Registra los repuestos disponibles para cada empresa
-- ==========================================

CREATE TABLE repuestos (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    empresa_id BIGINT NOT NULL,
    categoria_id BIGINT NOT NULL,
    codigo_interno VARCHAR(50) NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    marca VARCHAR(100),
    modelo VARCHAR(100),
    unidad_medida VARCHAR(30) NOT NULL DEFAULT 'unidad',
    fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_repuestos_empresa
        FOREIGN KEY (empresa_id)
        REFERENCES empresas(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_repuestos_categoria_empresa
        FOREIGN KEY (categoria_id, empresa_id)
        REFERENCES categorias_repuestos(id, empresa_id)
        ON DELETE RESTRICT,

    CONSTRAINT uq_repuestos_codigo_empresa
        UNIQUE (empresa_id, codigo_interno),

    CONSTRAINT uq_repuestos_id_empresa
        UNIQUE (id, empresa_id)
);

CREATE INDEX idx_repuestos_empresa_id
    ON repuestos(empresa_id);

CREATE INDEX idx_repuestos_categoria_id
    ON repuestos(categoria_id);
