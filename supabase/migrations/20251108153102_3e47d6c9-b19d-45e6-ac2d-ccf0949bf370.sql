-- Permitir que Owners e Admins vejam todos os perfis
CREATE POLICY "Owners and Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'Owner') OR 
  has_role(auth.uid(), 'Admin')
);

-- Permitir que Owners e Admins atualizem todos os perfis
CREATE POLICY "Owners and Admins can update all profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'Owner') OR 
  has_role(auth.uid(), 'Admin')
)
WITH CHECK (
  has_role(auth.uid(), 'Owner') OR 
  has_role(auth.uid(), 'Admin')
);