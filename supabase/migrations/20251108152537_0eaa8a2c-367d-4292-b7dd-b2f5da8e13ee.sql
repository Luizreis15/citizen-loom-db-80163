-- Tornar client_id nullable para suportar colaboradores sem cliente específico
ALTER TABLE activation_tokens 
ALTER COLUMN client_id DROP NOT NULL;

-- Adicionar coluna user_id para associar token diretamente ao usuário
ALTER TABLE activation_tokens 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Adicionar coluna para tipo de usuário
ALTER TABLE activation_tokens 
ADD COLUMN IF NOT EXISTS user_type text DEFAULT 'client' CHECK (user_type IN ('client', 'collaborator'));

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_activation_tokens_token ON activation_tokens(token) WHERE used_at IS NULL;

-- Criar índice para user_id
CREATE INDEX IF NOT EXISTS idx_activation_tokens_user_id ON activation_tokens(user_id);

-- Atualizar política RLS para permitir visualização de tokens de colaboradores
CREATE POLICY "Collaborators can view their own activation tokens"
ON activation_tokens
FOR SELECT
USING (user_id = auth.uid() AND user_type = 'collaborator');