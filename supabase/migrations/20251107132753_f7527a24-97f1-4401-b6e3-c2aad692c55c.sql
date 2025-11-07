-- Allow anyone to mark valid activation tokens as used during account activation
CREATE POLICY "Anyone can mark valid tokens as used"
ON public.activation_tokens
FOR UPDATE
TO public
USING (
  -- Only allow updating tokens that haven't been used yet and haven't expired
  used_at IS NULL 
  AND expires_at > now()
)
WITH CHECK (
  -- Only allow setting used_at (prevents modifying other fields)
  used_at IS NOT NULL
);