-- 1. Tornar project_id opcional na tabela tasks
ALTER TABLE tasks ALTER COLUMN project_id DROP NOT NULL;

-- 2. Adicionar request_id na tabela tasks para vincular à solicitação original
ALTER TABLE tasks ADD COLUMN request_id UUID REFERENCES client_requests(id);

-- 3. Adicionar protocol_number na tabela client_requests
ALTER TABLE client_requests ADD COLUMN protocol_number TEXT UNIQUE;

-- 4. Criar função para gerar próximo número de protocolo
CREATE OR REPLACE FUNCTION generate_protocol_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_number INTEGER;
  year_suffix TEXT;
  protocol TEXT;
BEGIN
  year_suffix := TO_CHAR(NOW(), 'YYYY');
  
  -- Buscar último número do ano atual
  SELECT COALESCE(
    MAX(
      CAST(
        SUBSTRING(protocol_number FROM 'HER-' || year_suffix || '-(\d+)')
        AS INTEGER
      )
    ),
    0
  ) INTO next_number
  FROM client_requests
  WHERE protocol_number LIKE 'HER-' || year_suffix || '-%';
  
  next_number := next_number + 1;
  protocol := 'HER-' || year_suffix || '-' || LPAD(next_number::TEXT, 3, '0');
  
  RETURN protocol;
END;
$$;

-- 5. Criar trigger para gerar protocol_number automaticamente ao inserir nova solicitação
CREATE OR REPLACE FUNCTION set_protocol_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.protocol_number IS NULL THEN
    NEW.protocol_number := generate_protocol_number();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_protocol_number_trigger
BEFORE INSERT ON client_requests
FOR EACH ROW
EXECUTE FUNCTION set_protocol_number();

-- 6. Gerar protocol_number para solicitações existentes usando CTE
WITH numbered_requests AS (
  SELECT 
    id,
    'HER-' || TO_CHAR(created_at, 'YYYY') || '-' || LPAD(ROW_NUMBER() OVER (PARTITION BY EXTRACT(YEAR FROM created_at) ORDER BY created_at)::TEXT, 3, '0') as new_protocol
  FROM client_requests
  WHERE protocol_number IS NULL
)
UPDATE client_requests cr
SET protocol_number = nr.new_protocol
FROM numbered_requests nr
WHERE cr.id = nr.id;