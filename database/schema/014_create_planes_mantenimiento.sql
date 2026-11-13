
-- ==========================================
-- Proyecto: App Mantenimiento Planta
-- Archivo: Creacion de tabla planes_mantenimiento
-- Descripcion: Registra los planes de mantenimiento preventivo
-- ==========================================

CREATE TABLE planes_mantenimiento (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    equipo_id BIGINT NOT NULL,
    usuario_creador_id BIGINT NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    frecuencia_tipo VARCHAR(20) NOT NULL,
    frecuencia_valor INTEGER NOT NULL DEFAULT 1,
    fecha_inicio DATE NOT NULL,
    fecha_proxima DATE,
    fecha_ultima_ejecucion DATE,
    estado VARCHAR(20) NOT NULL DEFAULT 'activo',
    fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_planes_equipo
        FOREIGN KEY (equipo_id)
        REFERENCES equipos(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_planes_usuario
        FOREIGN KEY (usuario_creador_id)
        REFERENCES usuarios(id)
        ON DELETE RESTRICT,

    CONSTRAINT ck_planes_frecuencia
        CHECK (frecuencia_tipo IN (
            'diaria',
            'semanal',
            'mensual',
            'anual'
        )),

    CONSTRAINT ck_planes_frecuencia_valor
        CHECK (frecuencia_valor > 0),

    CONSTRAINT ck_planes_estado
        CHECK (estado IN (
            'activo',
            'pausado',
            'finalizado'
        ))
);

CREATE INDEX idx_planes_equipo_id
    ON planes_mantenimiento(equipo_id);

CREATE INDEX idx_planes_estado
    ON planes_mantenimiento(estado);

CREATE INDEX idx_planes_fecha_proxima
    ON planes_mantenimiento(fecha_proxima);
