
-- ==========================================
-- Proyecto: App Mantenimiento Planta
-- Archivo: Creacion de tabla usuarios
-- Descripcion: Registra los usuarios del sistema
-- ==========================================

CREATE TABLE usuarios (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    correo VARCHAR(150) NOT NULL,
    telefono VARCHAR(20),
    estado VARCHAR(20) NOT NULL DEFAULT 'activo',
    fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_usuarios_correo
        UNIQUE (correo),

    CONSTRAINT ck_usuarios_estado
        CHECK (estado IN ('activo', 'inactivo'))
);
