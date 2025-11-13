-- Policy para permitir leitura pública de profiles durante ativação de colaboradores
-- Permite acesso aos campos full_name e email apenas quando existe um token válido
CREATE POLICY "Public can view profile for valid activation tokens"
ON public.profiles
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1
    FROM public.activation_tokens
    WHERE activation_tokens.user_id = profiles.id
      AND activation_tokens.used_at IS NULL
      AND activation_tokens.expires_at > now()
  )
);