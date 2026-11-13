
-- ==========================================
-- Proyecto: App Mantenimiento Planta
-- Archivo: Creacion de tabla equipos
-- Descripcion: Registra los equipos de cada area
-- ==========================================

CREATE TABLE equipos (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    area_id BIGINT NOT NULL,
    codigo_interno VARCHAR(50) NOT NULL,
    codigo_qr UUID NOT NULL DEFAULT gen_random_uuid(),
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    marca VARCHAR(100),
    modelo VARCHAR(100),
    numero_serie VARCHAR(100),
    estado VARCHAR(30) NOT NULL DEFAULT 'operativo',
    fecha_instalacion DATE,
    fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_equipos_area
        FOREIGN KEY (area_id)
        REFERENCES areas(id)
        ON DELETE RESTRICT,

    CONSTRAINT uq_equipos_codigo_area
        UNIQUE (area_id, codigo_interno),

    CONSTRAINT uq_equipos_codigo_qr
        UNIQUE (codigo_qr),

    CONSTRAINT ck_equipos_estado
        CHECK (estado IN (
            'operativo',
            'en_mantenimiento',
            'fuera_de_servicio'
        ))
);

CREATE INDEX idx_equipos_area_id
    ON equipos(area_id);
