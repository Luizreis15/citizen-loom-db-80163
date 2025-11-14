-- Adicionar flag para indicar se precisa trocar senha
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS require_password_change BOOLEAN DEFAULT false;

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_profiles_require_password_change ON profiles(require_password_change) WHERE require_password_change = true;