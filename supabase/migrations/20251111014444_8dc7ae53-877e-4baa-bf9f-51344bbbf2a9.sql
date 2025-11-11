-- Criar trigger para sync automático de profiles quando cliente for ativado
CREATE OR REPLACE FUNCTION trigger_sync_client_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF NEW.status = 'Ativo' AND NEW.user_id IS NOT NULL AND (OLD.user_id IS NULL OR OLD.user_id != NEW.user_id) THEN
    -- Cliente acabou de ser ativado, garantir que profile e role estão corretos
    PERFORM sync_client_profiles();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS after_client_activated ON clients;
CREATE TRIGGER after_client_activated
AFTER UPDATE ON clients
FOR EACH ROW
WHEN (NEW.status = 'Ativo' AND NEW.user_id IS NOT NULL)
EXECUTE FUNCTION trigger_sync_client_profile();