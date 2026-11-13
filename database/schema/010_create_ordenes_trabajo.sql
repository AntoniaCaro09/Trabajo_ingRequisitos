
-- ==========================================
-- Proyecto: App Mantenimiento Planta
-- Archivo: Creacion de tabla ordenes_trabajo
-- Descripcion: Registra y gestiona las ordenes de mantenimiento
-- ==========================================

CREATE TABLE ordenes_trabajo (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    reporte_anomalia_id BIGINT,
    equipo_id BIGINT NOT NULL,
    usuario_creador_id BIGINT NOT NULL,
    usuario_asignado_id BIGINT,
    titulo VARCHAR(150) NOT NULL,
    descripcion TEXT,
    tipo VARCHAR(30) NOT NULL DEFAULT 'correctivo',
    prioridad VARCHAR(20) NOT NULL DEFAULT 'media',
    estado VARCHAR(30) NOT NULL DEFAULT 'pendiente',
    fecha_programada TIMESTAMPTZ,
    fecha_inicio TIMESTAMPTZ,
    fecha_finalizacion TIMESTAMPTZ,
    fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_ordenes_reporte
        FOREIGN KEY (reporte_anomalia_id)
        REFERENCES reportes_anomalias(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_ordenes_equipo
        FOREIGN KEY (equipo_id)
        REFERENCES equipos(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_ordenes_creador
        FOREIGN KEY (usuario_creador_id)
        REFERENCES usuarios(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_ordenes_asignado
        FOREIGN KEY (usuario_asignado_id)
        REFERENCES usuarios(id)
        ON DELETE RESTRICT,

    CONSTRAINT ck_ordenes_tipo
        CHECK (tipo IN ('preventivo', 'correctivo')),

    CONSTRAINT ck_ordenes_prioridad
        CHECK (prioridad IN ('baja', 'media', 'alta', 'critica')),

    CONSTRAINT ck_ordenes_estado
        CHECK (estado IN (
            'pendiente',
            'asignada',
            'en_progreso',
            'pausada',
            'completada',
            'cancelada'
        )),

    CONSTRAINT ck_ordenes_fechas
        CHECK (
            fecha_finalizacion IS NULL
            OR fecha_inicio IS NULL
            OR fecha_finalizacion >= fecha_inicio
        )
);

CREATE INDEX idx_ordenes_equipo_id
    ON ordenes_trabajo(equipo_id);

CREATE INDEX idx_ordenes_reporte_id
    ON ordenes_trabajo(reporte_anomalia_id);

CREATE INDEX idx_ordenes_asignado_id
    ON ordenes_trabajo(usuario_asignado_id);

CREATE INDEX idx_ordenes_estado
    ON ordenes_trabajo(estado);
