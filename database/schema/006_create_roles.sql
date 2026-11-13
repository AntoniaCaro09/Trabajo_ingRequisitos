
-- ==========================================
-- Proyecto: App Mantenimiento Planta
-- Archivo: Creacion de tabla roles
-- Descripcion: Define los roles de los usuarios
-- ==========================================

CREATE TABLE roles (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    codigo VARCHAR(50) NOT NULL,
    descripcion TEXT,
    fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_roles_nombre
        UNIQUE (nombre),

    CONSTRAINT uq_roles_codigo
        UNIQUE (codigo)
);
