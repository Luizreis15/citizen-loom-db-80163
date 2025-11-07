-- FASE 1: Criar tabela activation_tokens
CREATE TABLE public.activation_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_activation_tokens_token ON public.activation_tokens(token);
CREATE INDEX idx_activation_tokens_client_id ON public.activation_tokens(client_id);
CREATE INDEX idx_activation_tokens_expires_at ON public.activation_tokens(expires_at);

-- FASE 2: Modificar tabela clients - adicionar campo activated_at
ALTER TABLE public.clients ADD COLUMN activated_at TIMESTAMP WITH TIME ZONE;

-- FASE 3: Criar RLS policies para activation_tokens
ALTER TABLE public.activation_tokens ENABLE ROW LEVEL SECURITY;

-- Admins podem ver tokens
CREATE POLICY "Admins can view tokens" ON public.activation_tokens
  FOR SELECT USING (has_role(auth.uid(), 'Admin') OR has_role(auth.uid(), 'Owner'));

-- Service role pode criar tokens (via Edge Function)
CREATE POLICY "Service role can insert tokens" ON public.activation_tokens
  FOR INSERT WITH CHECK (true);

-- Service role pode atualizar tokens
CREATE POLICY "Service role can update tokens" ON public.activation_tokens
  FOR UPDATE USING (true);

-- Permitir acesso público para validação de tokens na página de ativação
CREATE POLICY "Anyone can view valid tokens for activation" ON public.activation_tokens
  FOR SELECT USING (used_at IS NULL AND expires_at > NOW());

-- FASE 4: Atualizar dados existentes - clientes "Ativo" recebem activated_at
UPDATE public.clients 
SET activated_at = created_at,
    status = 'Ativo'
WHERE status = 'Ativo' AND activated_at IS NULL;