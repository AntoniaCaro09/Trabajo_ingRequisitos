
-- ==========================================
-- Proyecto: App Mantenimiento Planta
-- Archivo: Relacion entre usuarios y roles
-- Descripcion: Asigna roles a los usuarios
-- ==========================================

CREATE TABLE usuario_roles (
    usuario_id BIGINT NOT NULL,
    rol_id BIGINT NOT NULL,
    fecha_asignacion TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_usuario_roles
        PRIMARY KEY (usuario_id, rol_id),

    CONSTRAINT fk_usuario_roles_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_usuario_roles_rol
        FOREIGN KEY (rol_id)
        REFERENCES roles(id)
        ON DELETE CASCADE
);

CREATE INDEX idx_usuario_roles_rol_id
    ON usuario_roles(rol_id);
