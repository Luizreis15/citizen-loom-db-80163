-- 1. Corrigir o cliente "Colegio SR" existente
DO $$
DECLARE
  cliente_role_id INTEGER;
BEGIN
  -- Pegar o role_id de Cliente
  SELECT id INTO cliente_role_id FROM roles WHERE name = 'Cliente';
  
  -- Atualizar profile existente com client_id (ao invés de inserir)
  UPDATE profiles
  SET client_id = 'e7a9691f-1ef1-4bb8-816d-a0179f39e57a',
      full_name = 'Simone Ribeiro'
  WHERE id = '2bc16a9e-04e1-42ab-b3ff-46a68dc32669';

  -- Atribuir role Cliente
  INSERT INTO user_roles (user_id, role_id)
  VALUES ('2bc16a9e-04e1-42ab-b3ff-46a68dc32669', cliente_role_id)
  ON CONFLICT (user_id, role_id) DO NOTHING;

  -- Atualizar cliente com activated_at
  UPDATE clients
  SET activated_at = now()
  WHERE id = 'e7a9691f-1ef1-4bb8-816d-a0179f39e57a' AND activated_at IS NULL;
  
  RAISE NOTICE 'Cliente Colegio SR corrigido com sucesso';
END $$;

-- 2. Criar função para sincronizar profiles de clientes automaticamente
CREATE OR REPLACE FUNCTION public.sync_client_profiles()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  client_record RECORD;
  cliente_role_id INTEGER;
BEGIN
  -- Buscar role_id de Cliente
  SELECT id INTO cliente_role_id FROM roles WHERE name = 'Cliente';
  
  IF cliente_role_id IS NULL THEN
    RAISE EXCEPTION 'Role Cliente não encontrada';
  END IF;
  
  -- Para cada cliente Ativo com user_id mas sem profile correto
  FOR client_record IN 
    SELECT c.id as client_id, c.user_id, c.name, c.email
    FROM clients c
    WHERE c.status = 'Ativo' 
      AND c.user_id IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM profiles p 
        WHERE p.id = c.user_id AND p.client_id = c.id
      )
  LOOP
    -- Atualizar profile existente ou criar novo
    INSERT INTO profiles (id, full_name, email, client_id)
    VALUES (client_record.user_id, client_record.name, client_record.email, client_record.client_id)
    ON CONFLICT (id) DO UPDATE
    SET client_id = client_record.client_id,
        full_name = client_record.name;
    
    -- Atribuir role Cliente
    INSERT INTO user_roles (user_id, role_id)
    VALUES (client_record.user_id, cliente_role_id)
    ON CONFLICT (user_id, role_id) DO NOTHING;
    
    RAISE NOTICE 'Profile sincronizado para cliente: %', client_record.name;
  END LOOP;
  
  RAISE NOTICE 'Sincronização de profiles de clientes concluída';
END;
$$;