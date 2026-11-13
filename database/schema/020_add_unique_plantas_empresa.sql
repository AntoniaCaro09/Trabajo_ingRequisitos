
-- ==========================================
-- Proyecto: App Mantenimiento Planta
-- Archivo: Mejora de relacion plantas y empresas
-- Descripcion: Permite validar relaciones compuestas
-- ==========================================

ALTER TABLE plantas
ADD CONSTRAINT uq_plantas_id_empresa
UNIQUE (id, empresa_id);
