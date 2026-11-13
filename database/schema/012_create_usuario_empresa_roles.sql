
-- ==========================================
-- Proyecto: App Mantenimiento Planta
-- Archivo: Relacion entre usuarios, empresas y roles
-- Descripcion: Asigna roles a usuarios dentro de cada empresa
-- ==========================================

CREATE TABLE usuario_empresa_roles (
    usuario_id BIGINT NOT NULL,
    empresa_id BIGINT NOT NULL,
    rol_id BIGINT NOT NULL,
    fecha_asignacion TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_usuario_empresa_roles
        PRIMARY KEY (usuario_id, empresa_id, rol_id),

    CONSTRAINT fk_uer_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_uer_empresa
        FOREIGN KEY (empresa_id)
        REFERENCES empresas(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_uer_rol
        FOREIGN KEY (rol_id)
        REFERENCES roles(id)
        ON DELETE RESTRICT
);

CREATE INDEX idx_uer_empresa_id
    ON usuario_empresa_roles(empresa_id);

CREATE INDEX idx_uer_rol_id
    ON usuario_empresa_roles(rol_id);
