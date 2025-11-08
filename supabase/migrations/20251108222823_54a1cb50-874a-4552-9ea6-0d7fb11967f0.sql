-- 1. Drop TODAS as políticas de UPDATE existentes na tabela activation_tokens
DROP POLICY IF EXISTS "Anyone can mark valid tokens as used" ON activation_tokens;
DROP POLICY IF EXISTS "Service role can update tokens" ON activation_tokens;

-- 2. Recriar UMA política PERMISSIVE para usuários públicos
CREATE POLICY "Public can mark valid tokens as used"
ON activation_tokens
FOR UPDATE
TO public
USING ((used_at IS NULL) AND (expires_at > now()))
WITH CHECK (used_at IS NOT NULL);

-- 3. Criar política separada PERMISSIVE para service role
CREATE POLICY "Service role can update all tokens"
ON activation_tokens
FOR UPDATE  
TO service_role
USING (true)
WITH CHECK (true);