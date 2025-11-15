-- Permitir upload de arquivos temporários para usuários autenticados
-- Isso resolve o problema de upload na criação de novas solicitações

-- Criar política para permitir INSERT em temp/ para usuários autenticados
CREATE POLICY "Authenticated users can upload to temp folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'client-uploads' 
  AND (storage.foldername(name))[1] = 'temp'
);

-- Criar política para permitir SELECT em temp/ para o próprio uploader
CREATE POLICY "Users can view their temp uploads"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'client-uploads' 
  AND (storage.foldername(name))[1] = 'temp'
  AND owner_id::text = auth.uid()::text
);

-- Criar política para permitir DELETE em temp/ para o próprio uploader
CREATE POLICY "Users can delete their temp uploads"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'client-uploads' 
  AND (storage.foldername(name))[1] = 'temp'
  AND owner_id::text = auth.uid()::text
);