-- Adiciona policy para permitir acesso a clientes através de tokens de ativação válidos
CREATE POLICY "Anyone can view clients through valid activation tokens"
ON clients FOR SELECT
TO public
USING (
  id IN (
    SELECT client_id 
    FROM activation_tokens 
    WHERE used_at IS NULL 
    AND expires_at > now()
  )
);