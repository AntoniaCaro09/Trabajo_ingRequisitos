
-- ==========================================
-- Proyecto: App Mantenimiento Planta
-- Archivo: Insercion de roles iniciales
-- Descripcion: Registra los roles del sistema
-- ==========================================

INSERT INTO roles (nombre, codigo, descripcion)
VALUES
    ('Administrador', 'ADMIN', 'Gestiona la configuracion general y los usuarios'),
    ('Supervisor', 'SUPERVISOR', 'Coordina y supervisa las actividades de mantenimiento'),
    ('Tecnico', 'TECNICO', 'Realiza y registra trabajos de mantenimiento'),
    ('Operario', 'OPERARIO', 'Reporta anomalías y consulta información de equipos');
