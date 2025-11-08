-- Drop política atual que está causando conflito
DROP POLICY IF EXISTS "Anyone can mark valid tokens as used" ON activation_tokens;

-- Recriar como PERMISSIVE (padrão) em vez de RESTRICTIVE
CREATE POLICY "Anyone can mark valid tokens as used"
ON activation_tokens
FOR UPDATE
TO public
USING ((used_at IS NULL) AND (expires_at > now()))
WITH CHECK (used_at IS NOT NULL);