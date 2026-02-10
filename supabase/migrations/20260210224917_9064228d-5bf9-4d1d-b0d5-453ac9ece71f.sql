
CREATE OR REPLACE FUNCTION public.auto_create_onboarding_instance()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = 'public'
AS $$
DECLARE
  template_uuid UUID;
BEGIN
  IF NEW.client_type IS NOT NULL THEN
    SELECT id INTO template_uuid 
    FROM onboarding_templates 
    WHERE client_type = NEW.client_type AND is_active = true
    LIMIT 1;
    
    IF template_uuid IS NOT NULL THEN
      INSERT INTO onboarding_instances (client_id, template_id, status, current_step)
      VALUES (NEW.id, template_uuid, 'Nao_Iniciado', 1)
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_client_created_create_onboarding
  AFTER INSERT ON clients
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_onboarding_instance();

CREATE TRIGGER on_client_type_updated_create_onboarding
  AFTER UPDATE OF client_type ON clients
  FOR EACH ROW
  WHEN (OLD.client_type IS NULL AND NEW.client_type IS NOT NULL)
  EXECUTE FUNCTION auto_create_onboarding_instance();
