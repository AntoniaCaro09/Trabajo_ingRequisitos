-- Ejecutar una sola vez sobre app_mantenimiento_planta después de respaldar la BD.
-- Compatible con tablas 005,009 y 024 existentes en este proyecto.
ALTER TABLE public.usuarios
  ADD COLUMN IF NOT EXISTS password_hash TEXT;

ALTER TABLE public.reportes_anomalias
  ADD COLUMN IF NOT EXISTS cliente_uuid UUID;
CREATE UNIQUE INDEX IF NOT EXISTS uq_reportes_cliente_uuid
  ON public.reportes_anomalias(cliente_uuid) WHERE cliente_uuid IS NOT NULL;

ALTER TABLE public.adjuntos_reportes_anomalias
  ADD COLUMN IF NOT EXISTS cliente_uuid UUID;
CREATE UNIQUE INDEX IF NOT EXISTS uq_adjuntos_reporte_cliente_uuid
  ON public.adjuntos_reportes_anomalias(cliente_uuid) WHERE cliente_uuid IS NOT NULL;
