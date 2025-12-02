-- Adicionar políticas restantes para onboarding-files (ignorando as que já existem)

-- Permitir admins visualizarem todos os arquivos de onboarding
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Admins can view all onboarding files' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Admins can view all onboarding files" 
    ON storage.objects 
    FOR SELECT 
    TO authenticated
    USING (
      bucket_id = 'onboarding-files' 
      AND EXISTS (
        SELECT 1 FROM public.user_roles ur
        JOIN public.roles r ON r.id = ur.role_id
        WHERE ur.user_id = auth.uid()
        AND r.name IN ('Owner', 'Admin')
      )
    );
  END IF;
END $$;

-- Permitir clientes atualizarem/substituírem seus arquivos
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Clients can update own onboarding files' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Clients can update own onboarding files" 
    ON storage.objects 
    FOR UPDATE 
    TO authenticated
    USING (
      bucket_id = 'onboarding-files' 
      AND EXISTS (
        SELECT 1 FROM public.onboarding_instances oi
        JOIN public.clients c ON c.id = oi.client_id
        JOIN public.profiles p ON p.client_id = c.id
        WHERE p.id = auth.uid()
        AND (storage.foldername(name))[1] = oi.id::text
      )
    );
  END IF;
END $$;

-- Permitir clientes deletarem seus arquivos
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Clients can delete own onboarding files' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Clients can delete own onboarding files" 
    ON storage.objects 
    FOR DELETE 
    TO authenticated
    USING (
      bucket_id = 'onboarding-files' 
      AND EXISTS (
        SELECT 1 FROM public.onboarding_instances oi
        JOIN public.clients c ON c.id = oi.client_id
        JOIN public.profiles p ON p.client_id = c.id
        WHERE p.id = auth.uid()
        AND (storage.foldername(name))[1] = oi.id::text
      )
    );
  END IF;
END $$;