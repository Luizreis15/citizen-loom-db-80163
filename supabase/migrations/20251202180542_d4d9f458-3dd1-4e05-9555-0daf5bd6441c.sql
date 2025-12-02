-- =============================================
-- MÓDULO DE ONBOARDING DE CLIENTES - FASE 1
-- =============================================

-- 1. Adicionar campo client_type na tabela clients
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS client_type text DEFAULT NULL;

-- 2. Criar tabela de templates de onboarding
CREATE TABLE public.onboarding_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  client_type text NOT NULL,
  schema jsonb NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 3. Criar tabela de instâncias de onboarding (uma por cliente)
CREATE TABLE public.onboarding_instances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  template_id uuid NOT NULL REFERENCES public.onboarding_templates(id),
  status text NOT NULL DEFAULT 'Nao_Iniciado',
  current_step integer NOT NULL DEFAULT 1,
  completed_at timestamp with time zone,
  approved_at timestamp with time zone,
  approved_by uuid REFERENCES auth.users(id),
  reopened_at timestamp with time zone,
  reopened_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(client_id)
);

-- 4. Criar tabela de respostas do onboarding
CREATE TABLE public.onboarding_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  onboarding_instance_id uuid NOT NULL REFERENCES public.onboarding_instances(id) ON DELETE CASCADE,
  section text NOT NULL,
  field_key text NOT NULL,
  value text,
  is_sensitive boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(onboarding_instance_id, field_key)
);

-- 5. Criar tabela de anexos do onboarding
CREATE TABLE public.onboarding_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  onboarding_instance_id uuid NOT NULL REFERENCES public.onboarding_instances(id) ON DELETE CASCADE,
  section text NOT NULL,
  field_key text NOT NULL,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_type text,
  file_size bigint,
  uploaded_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 6. Criar tabela de audit log para campos sensíveis
CREATE TABLE public.onboarding_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  onboarding_instance_id uuid NOT NULL REFERENCES public.onboarding_instances(id) ON DELETE CASCADE,
  field_key text NOT NULL,
  action text NOT NULL,
  user_id uuid REFERENCES auth.users(id),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 7. Criar índices para performance
CREATE INDEX idx_onboarding_instances_client ON public.onboarding_instances(client_id);
CREATE INDEX idx_onboarding_instances_status ON public.onboarding_instances(status);
CREATE INDEX idx_onboarding_responses_instance ON public.onboarding_responses(onboarding_instance_id);
CREATE INDEX idx_onboarding_attachments_instance ON public.onboarding_attachments(onboarding_instance_id);
CREATE INDEX idx_onboarding_audit_log_instance ON public.onboarding_audit_log(onboarding_instance_id);

-- 8. Triggers para updated_at
CREATE TRIGGER update_onboarding_templates_updated_at
  BEFORE UPDATE ON public.onboarding_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_onboarding_instances_updated_at
  BEFORE UPDATE ON public.onboarding_instances
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_onboarding_responses_updated_at
  BEFORE UPDATE ON public.onboarding_responses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- RLS POLICIES
-- =============================================

-- Enable RLS
ALTER TABLE public.onboarding_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_audit_log ENABLE ROW LEVEL SECURITY;

-- onboarding_templates: Admins podem tudo, clientes podem ver templates ativos
CREATE POLICY "Admins can manage templates" ON public.onboarding_templates
  FOR ALL USING (has_role(auth.uid(), 'Owner') OR has_role(auth.uid(), 'Admin'));

CREATE POLICY "Authenticated can view active templates" ON public.onboarding_templates
  FOR SELECT USING (is_active = true);

-- onboarding_instances: Admins podem tudo, clientes podem ver/atualizar própria instância
CREATE POLICY "Admins can manage all instances" ON public.onboarding_instances
  FOR ALL USING (has_role(auth.uid(), 'Owner') OR has_role(auth.uid(), 'Admin'));

CREATE POLICY "Clients can view own instance" ON public.onboarding_instances
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.client_id = onboarding_instances.client_id
    )
  );

CREATE POLICY "Clients can update own instance" ON public.onboarding_instances
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.client_id = onboarding_instances.client_id
    )
  );

-- onboarding_responses: Admins podem ver tudo, clientes podem CRUD próprias respostas
CREATE POLICY "Admins can manage all responses" ON public.onboarding_responses
  FOR ALL USING (has_role(auth.uid(), 'Owner') OR has_role(auth.uid(), 'Admin'));

CREATE POLICY "Clients can view own responses" ON public.onboarding_responses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.onboarding_instances oi
      JOIN public.profiles p ON p.client_id = oi.client_id
      WHERE oi.id = onboarding_responses.onboarding_instance_id AND p.id = auth.uid()
    )
  );

CREATE POLICY "Clients can insert own responses" ON public.onboarding_responses
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.onboarding_instances oi
      JOIN public.profiles p ON p.client_id = oi.client_id
      WHERE oi.id = onboarding_responses.onboarding_instance_id AND p.id = auth.uid()
    )
  );

CREATE POLICY "Clients can update own responses" ON public.onboarding_responses
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.onboarding_instances oi
      JOIN public.profiles p ON p.client_id = oi.client_id
      WHERE oi.id = onboarding_responses.onboarding_instance_id AND p.id = auth.uid()
    )
  );

-- onboarding_attachments: Admins podem tudo, clientes podem CRUD próprios anexos
CREATE POLICY "Admins can manage all attachments" ON public.onboarding_attachments
  FOR ALL USING (has_role(auth.uid(), 'Owner') OR has_role(auth.uid(), 'Admin'));

CREATE POLICY "Clients can view own attachments" ON public.onboarding_attachments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.onboarding_instances oi
      JOIN public.profiles p ON p.client_id = oi.client_id
      WHERE oi.id = onboarding_attachments.onboarding_instance_id AND p.id = auth.uid()
    )
  );

CREATE POLICY "Clients can insert own attachments" ON public.onboarding_attachments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.onboarding_instances oi
      JOIN public.profiles p ON p.client_id = oi.client_id
      WHERE oi.id = onboarding_attachments.onboarding_instance_id AND p.id = auth.uid()
    )
  );

CREATE POLICY "Clients can delete own attachments" ON public.onboarding_attachments
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.onboarding_instances oi
      JOIN public.profiles p ON p.client_id = oi.client_id
      WHERE oi.id = onboarding_attachments.onboarding_instance_id AND p.id = auth.uid()
    )
  );

-- onboarding_audit_log: Apenas admins podem ver, sistema pode inserir
CREATE POLICY "Admins can view audit log" ON public.onboarding_audit_log
  FOR SELECT USING (has_role(auth.uid(), 'Owner') OR has_role(auth.uid(), 'Admin'));

CREATE POLICY "System can insert audit log" ON public.onboarding_audit_log
  FOR INSERT WITH CHECK (true);

-- =============================================
-- INSERIR TEMPLATE COMPLETO INICIAL
-- =============================================

INSERT INTO public.onboarding_templates (name, client_type, schema, is_active) VALUES (
  'Template Completo',
  'Completo',
  '{
    "sections": [
      {
        "id": "dados_gerais",
        "title": "Dados Gerais",
        "step": 1,
        "fields": [
          {"key": "nome_empresa", "label": "Nome da empresa / marca", "type": "text", "required": true},
          {"key": "nome_fantasia", "label": "Nome fantasia", "type": "text", "required": false},
          {"key": "cnpj", "label": "CNPJ", "type": "text", "required": false},
          {"key": "site_atual", "label": "Site atual (URL)", "type": "url", "required": false},
          {"key": "cidade_estado", "label": "Cidade / Estado", "type": "text", "required": true},
          {"key": "contato_nome", "label": "Nome do contato principal", "type": "text", "required": true},
          {"key": "contato_email", "label": "E-mail do contato", "type": "email", "required": true},
          {"key": "contato_telefone", "label": "Telefone do contato", "type": "phone", "required": true}
        ]
      },
      {
        "id": "contas_acessos",
        "title": "Contas & Acessos",
        "step": 2,
        "fields": [
          {"key": "facebook_link", "label": "Link da página no Facebook", "type": "url", "required": false},
          {"key": "instagram_arroba", "label": "@ do Instagram oficial", "type": "text", "required": false},
          {"key": "meta_email_admin", "label": "E-mail administrador das páginas Meta", "type": "email", "required": false},
          {"key": "meta_preferencia_acesso", "label": "Preferência de acesso Meta", "type": "radio", "required": false, "options": ["Adicionar Hera como administradora", "Compartilhar usuário/senha"]},
          {"key": "meta_usuario", "label": "Usuário/e-mail de login Meta", "type": "text", "required": false, "showIf": {"field": "meta_preferencia_acesso", "value": "Compartilhar usuário/senha"}},
          {"key": "meta_senha", "label": "Senha Meta", "type": "password", "required": false, "sensitive": true, "showIf": {"field": "meta_preferencia_acesso", "value": "Compartilhar usuário/senha"}},
          {"key": "google_email_admin", "label": "E-mail administrador Google", "type": "email", "required": false},
          {"key": "google_perfil_link", "label": "Link do perfil Google Meu Negócio", "type": "url", "required": false},
          {"key": "google_usuario", "label": "Usuário Google", "type": "text", "required": false},
          {"key": "google_senha", "label": "Senha Google", "type": "password", "required": false, "sensitive": true},
          {"key": "site_url", "label": "URL do site atual", "type": "url", "required": false},
          {"key": "hospedagem_provedor", "label": "Provedor de hospedagem", "type": "select", "required": false, "options": ["Hostinger", "GoDaddy", "Locaweb", "HostGator", "Outro"]},
          {"key": "hospedagem_provedor_outro", "label": "Outro provedor de hospedagem", "type": "text", "required": false, "showIf": {"field": "hospedagem_provedor", "value": "Outro"}},
          {"key": "hospedagem_painel_url", "label": "URL do painel da hospedagem", "type": "url", "required": false},
          {"key": "hospedagem_usuario", "label": "Usuário da hospedagem", "type": "text", "required": false},
          {"key": "hospedagem_senha", "label": "Senha da hospedagem", "type": "password", "required": false, "sensitive": true},
          {"key": "dominio_provedor", "label": "Provedor do domínio (se separado)", "type": "text", "required": false},
          {"key": "dominio_painel_url", "label": "URL do painel de domínio (DNS)", "type": "url", "required": false},
          {"key": "dominio_usuario", "label": "Usuário do domínio", "type": "text", "required": false},
          {"key": "dominio_senha", "label": "Senha do domínio", "type": "password", "required": false, "sensitive": true},
          {"key": "email_institucional", "label": "E-mail oficial de marketing/comercial", "type": "email", "required": false},
          {"key": "emails_relatorios", "label": "E-mails para relatórios e aprovações", "type": "textarea", "required": false, "placeholder": "Um e-mail por linha"}
        ]
      },
      {
        "id": "whatsapp_funil",
        "title": "WhatsApp Comercial & Funil",
        "step": 3,
        "fields": [
          {"key": "whatsapp_numero", "label": "Número do WhatsApp comercial", "type": "phone", "required": false},
          {"key": "whatsapp_exclusivo", "label": "Esse número é exclusivo do setor comercial?", "type": "radio", "required": false, "options": ["Sim", "Não"]},
          {"key": "whatsapp_horario", "label": "Horário oficial de atendimento", "type": "text", "required": false, "placeholder": "Ex: Seg-Sex 9h às 18h"},
          {"key": "whatsapp_nome_exibicao", "label": "Nome de exibição no WhatsApp Business", "type": "text", "required": false},
          {"key": "whatsapp_descricao", "label": "Descrição desejada no perfil", "type": "textarea", "required": false},
          {"key": "whatsapp_ferramenta", "label": "Ferramenta usada para atendimento", "type": "select", "required": false, "options": ["Nenhuma", "Whaticket", "API oficial", "Outra"]},
          {"key": "whatsapp_ferramenta_outra", "label": "Qual ferramenta?", "type": "text", "required": false, "showIf": {"field": "whatsapp_ferramenta", "value": "Outra"}}
        ]
      },
      {
        "id": "marca_branding",
        "title": "Marca & Branding",
        "step": 4,
        "fields": [
          {"key": "logo_principal", "label": "Logo principal (PNG, fundo transparente)", "type": "file", "required": false, "accept": ".png,.jpg,.jpeg,.svg"},
          {"key": "logos_secundarias", "label": "Versões secundárias (horizontal, vertical, PB)", "type": "file", "required": false, "multiple": true, "accept": ".png,.jpg,.jpeg,.svg,.zip"},
          {"key": "manual_marca", "label": "Manual de marca (PDF)", "type": "file", "required": false, "accept": ".pdf"},
          {"key": "paleta_cores", "label": "Paleta de cores (códigos hex)", "type": "textarea", "required": false, "placeholder": "Ex: #8B5CF6, #FFFFFF, #1A1A2E"},
          {"key": "tipografia", "label": "Tipografia usada (títulos e textos)", "type": "textarea", "required": false, "placeholder": "Ex: Montserrat para títulos, Open Sans para textos"},
          {"key": "percepcao_marca", "label": "Como você quer que sua marca seja percebida?", "type": "textarea", "required": false},
          {"key": "marcas_referencia", "label": "Marcas de referência / inspiração", "type": "textarea", "required": false}
        ]
      },
      {
        "id": "redes_sociais_conteudo",
        "title": "Redes Sociais & Conteúdo",
        "step": 5,
        "fields": [
          {"key": "canais_ativos", "label": "Quais canais estão ativos?", "type": "checkbox", "required": false, "options": ["Instagram", "Facebook", "TikTok", "YouTube", "LinkedIn"]},
          {"key": "instagram_link", "label": "Link do Instagram", "type": "url", "required": false},
          {"key": "facebook_page_link", "label": "Link da página Facebook", "type": "url", "required": false},
          {"key": "tiktok_link", "label": "Link do TikTok", "type": "url", "required": false},
          {"key": "youtube_link", "label": "Link do YouTube", "type": "url", "required": false},
          {"key": "linkedin_link", "label": "Link do LinkedIn", "type": "url", "required": false},
          {"key": "banco_imagens", "label": "Banco de imagens", "type": "file", "required": false, "multiple": true, "accept": ".png,.jpg,.jpeg,.zip"},
          {"key": "banco_imagens_link", "label": "Ou link para pasta (Drive/WeTransfer)", "type": "url", "required": false},
          {"key": "temas_prioridade", "label": "Quais temas são prioridade na comunicação?", "type": "textarea", "required": false},
          {"key": "temas_proibidos", "label": "Existe algum tema proibido/sensível?", "type": "textarea", "required": false}
        ]
      },
      {
        "id": "metas_observacoes",
        "title": "Metas & Observações",
        "step": 6,
        "fields": [
          {"key": "metas_principais", "label": "Metas principais para os próximos 3-6 meses", "type": "textarea", "required": false},
          {"key": "observacoes_finais", "label": "Observações finais e informações adicionais", "type": "textarea", "required": false},
          {"key": "confirmacao_dados", "label": "Confirmo que as informações fornecidas são verdadeiras e autorizo o uso pela Hera Digital para fins de gestão de marketing.", "type": "checkbox_single", "required": true}
        ]
      }
    ]
  }'::jsonb,
  true
);

-- Inserir templates para outros tipos de cliente (baseados no Completo)
INSERT INTO public.onboarding_templates (name, client_type, schema, is_active) VALUES (
  'Template Expert',
  'Expert',
  '{
    "sections": [
      {
        "id": "dados_gerais",
        "title": "Dados Gerais",
        "step": 1,
        "fields": [
          {"key": "nome_empresa", "label": "Nome da empresa / marca", "type": "text", "required": true},
          {"key": "nome_fantasia", "label": "Nome fantasia", "type": "text", "required": false},
          {"key": "site_atual", "label": "Site atual (URL)", "type": "url", "required": false},
          {"key": "cidade_estado", "label": "Cidade / Estado", "type": "text", "required": true},
          {"key": "contato_nome", "label": "Nome do contato principal", "type": "text", "required": true},
          {"key": "contato_email", "label": "E-mail do contato", "type": "email", "required": true},
          {"key": "contato_telefone", "label": "Telefone do contato", "type": "phone", "required": true}
        ]
      },
      {
        "id": "contas_acessos",
        "title": "Contas & Acessos",
        "step": 2,
        "fields": [
          {"key": "instagram_arroba", "label": "@ do Instagram oficial", "type": "text", "required": false},
          {"key": "meta_email_admin", "label": "E-mail administrador das páginas Meta", "type": "email", "required": false},
          {"key": "meta_preferencia_acesso", "label": "Preferência de acesso Meta", "type": "radio", "required": false, "options": ["Adicionar Hera como administradora", "Compartilhar usuário/senha"]},
          {"key": "meta_usuario", "label": "Usuário/e-mail de login Meta", "type": "text", "required": false, "showIf": {"field": "meta_preferencia_acesso", "value": "Compartilhar usuário/senha"}},
          {"key": "meta_senha", "label": "Senha Meta", "type": "password", "required": false, "sensitive": true, "showIf": {"field": "meta_preferencia_acesso", "value": "Compartilhar usuário/senha"}}
        ]
      },
      {
        "id": "marca_branding",
        "title": "Marca & Branding",
        "step": 3,
        "fields": [
          {"key": "logo_principal", "label": "Logo principal (PNG, fundo transparente)", "type": "file", "required": false, "accept": ".png,.jpg,.jpeg,.svg"},
          {"key": "paleta_cores", "label": "Paleta de cores (códigos hex)", "type": "textarea", "required": false},
          {"key": "percepcao_marca", "label": "Como você quer que sua marca seja percebida?", "type": "textarea", "required": false}
        ]
      },
      {
        "id": "metas_observacoes",
        "title": "Metas & Observações",
        "step": 4,
        "fields": [
          {"key": "metas_principais", "label": "Metas principais para os próximos 3-6 meses", "type": "textarea", "required": false},
          {"key": "observacoes_finais", "label": "Observações finais e informações adicionais", "type": "textarea", "required": false},
          {"key": "confirmacao_dados", "label": "Confirmo que as informações fornecidas são verdadeiras e autorizo o uso pela Hera Digital.", "type": "checkbox_single", "required": true}
        ]
      }
    ]
  }'::jsonb,
  true
);

INSERT INTO public.onboarding_templates (name, client_type, schema, is_active) VALUES (
  'Template Negócio Local',
  'Negocio_Local',
  '{
    "sections": [
      {
        "id": "dados_gerais",
        "title": "Dados Gerais",
        "step": 1,
        "fields": [
          {"key": "nome_empresa", "label": "Nome da empresa / marca", "type": "text", "required": true},
          {"key": "nome_fantasia", "label": "Nome fantasia", "type": "text", "required": false},
          {"key": "cnpj", "label": "CNPJ", "type": "text", "required": false},
          {"key": "site_atual", "label": "Site atual (URL)", "type": "url", "required": false},
          {"key": "cidade_estado", "label": "Cidade / Estado", "type": "text", "required": true},
          {"key": "contato_nome", "label": "Nome do contato principal", "type": "text", "required": true},
          {"key": "contato_email", "label": "E-mail do contato", "type": "email", "required": true},
          {"key": "contato_telefone", "label": "Telefone do contato", "type": "phone", "required": true}
        ]
      },
      {
        "id": "contas_acessos",
        "title": "Contas & Acessos",
        "step": 2,
        "fields": [
          {"key": "instagram_arroba", "label": "@ do Instagram oficial", "type": "text", "required": false},
          {"key": "google_email_admin", "label": "E-mail administrador Google", "type": "email", "required": false},
          {"key": "google_perfil_link", "label": "Link do perfil Google Meu Negócio", "type": "url", "required": false},
          {"key": "google_usuario", "label": "Usuário Google", "type": "text", "required": false},
          {"key": "google_senha", "label": "Senha Google", "type": "password", "required": false, "sensitive": true}
        ]
      },
      {
        "id": "whatsapp_funil",
        "title": "WhatsApp Comercial",
        "step": 3,
        "fields": [
          {"key": "whatsapp_numero", "label": "Número do WhatsApp comercial", "type": "phone", "required": false},
          {"key": "whatsapp_horario", "label": "Horário oficial de atendimento", "type": "text", "required": false}
        ]
      },
      {
        "id": "marca_branding",
        "title": "Marca & Branding",
        "step": 4,
        "fields": [
          {"key": "logo_principal", "label": "Logo principal", "type": "file", "required": false, "accept": ".png,.jpg,.jpeg,.svg"},
          {"key": "paleta_cores", "label": "Paleta de cores", "type": "textarea", "required": false}
        ]
      },
      {
        "id": "metas_observacoes",
        "title": "Metas & Observações",
        "step": 5,
        "fields": [
          {"key": "metas_principais", "label": "Metas principais", "type": "textarea", "required": false},
          {"key": "observacoes_finais", "label": "Observações finais", "type": "textarea", "required": false},
          {"key": "confirmacao_dados", "label": "Confirmo que as informações são verdadeiras.", "type": "checkbox_single", "required": true}
        ]
      }
    ]
  }'::jsonb,
  true
);

INSERT INTO public.onboarding_templates (name, client_type, schema, is_active) VALUES (
  'Template Gestão de Tráfego',
  'Gestao_Trafego',
  '{
    "sections": [
      {
        "id": "dados_gerais",
        "title": "Dados Gerais",
        "step": 1,
        "fields": [
          {"key": "nome_empresa", "label": "Nome da empresa / marca", "type": "text", "required": true},
          {"key": "site_atual", "label": "Site atual (URL)", "type": "url", "required": true},
          {"key": "cidade_estado", "label": "Cidade / Estado", "type": "text", "required": true},
          {"key": "contato_nome", "label": "Nome do contato principal", "type": "text", "required": true},
          {"key": "contato_email", "label": "E-mail do contato", "type": "email", "required": true},
          {"key": "contato_telefone", "label": "Telefone do contato", "type": "phone", "required": true}
        ]
      },
      {
        "id": "contas_acessos",
        "title": "Contas & Acessos",
        "step": 2,
        "fields": [
          {"key": "meta_email_admin", "label": "E-mail administrador Meta Ads", "type": "email", "required": true},
          {"key": "meta_preferencia_acesso", "label": "Preferência de acesso", "type": "radio", "required": true, "options": ["Adicionar Hera como administradora", "Compartilhar usuário/senha"]},
          {"key": "meta_usuario", "label": "Usuário Meta", "type": "text", "required": false, "showIf": {"field": "meta_preferencia_acesso", "value": "Compartilhar usuário/senha"}},
          {"key": "meta_senha", "label": "Senha Meta", "type": "password", "required": false, "sensitive": true, "showIf": {"field": "meta_preferencia_acesso", "value": "Compartilhar usuário/senha"}},
          {"key": "google_email_admin", "label": "E-mail administrador Google Ads", "type": "email", "required": false},
          {"key": "google_usuario", "label": "Usuário Google Ads", "type": "text", "required": false},
          {"key": "google_senha", "label": "Senha Google Ads", "type": "password", "required": false, "sensitive": true}
        ]
      },
      {
        "id": "metas_observacoes",
        "title": "Metas & Observações",
        "step": 3,
        "fields": [
          {"key": "orcamento_mensal", "label": "Orçamento mensal para anúncios", "type": "text", "required": false},
          {"key": "metas_principais", "label": "Metas principais de conversão", "type": "textarea", "required": true},
          {"key": "observacoes_finais", "label": "Observações finais", "type": "textarea", "required": false},
          {"key": "confirmacao_dados", "label": "Confirmo que as informações são verdadeiras.", "type": "checkbox_single", "required": true}
        ]
      }
    ]
  }'::jsonb,
  true
);

INSERT INTO public.onboarding_templates (name, client_type, schema, is_active) VALUES (
  'Template Social Media',
  'Social_Media',
  '{
    "sections": [
      {
        "id": "dados_gerais",
        "title": "Dados Gerais",
        "step": 1,
        "fields": [
          {"key": "nome_empresa", "label": "Nome da empresa / marca", "type": "text", "required": true},
          {"key": "nome_fantasia", "label": "Nome fantasia", "type": "text", "required": false},
          {"key": "cidade_estado", "label": "Cidade / Estado", "type": "text", "required": true},
          {"key": "contato_nome", "label": "Nome do contato principal", "type": "text", "required": true},
          {"key": "contato_email", "label": "E-mail do contato", "type": "email", "required": true},
          {"key": "contato_telefone", "label": "Telefone do contato", "type": "phone", "required": true}
        ]
      },
      {
        "id": "contas_acessos",
        "title": "Contas & Acessos",
        "step": 2,
        "fields": [
          {"key": "instagram_arroba", "label": "@ do Instagram oficial", "type": "text", "required": true},
          {"key": "meta_email_admin", "label": "E-mail administrador", "type": "email", "required": true},
          {"key": "meta_preferencia_acesso", "label": "Preferência de acesso", "type": "radio", "required": true, "options": ["Adicionar Hera como administradora", "Compartilhar usuário/senha"]},
          {"key": "meta_usuario", "label": "Usuário", "type": "text", "required": false, "showIf": {"field": "meta_preferencia_acesso", "value": "Compartilhar usuário/senha"}},
          {"key": "meta_senha", "label": "Senha", "type": "password", "required": false, "sensitive": true, "showIf": {"field": "meta_preferencia_acesso", "value": "Compartilhar usuário/senha"}}
        ]
      },
      {
        "id": "marca_branding",
        "title": "Marca & Branding",
        "step": 3,
        "fields": [
          {"key": "logo_principal", "label": "Logo principal", "type": "file", "required": false, "accept": ".png,.jpg,.jpeg,.svg"},
          {"key": "paleta_cores", "label": "Paleta de cores", "type": "textarea", "required": false},
          {"key": "tipografia", "label": "Tipografia", "type": "textarea", "required": false},
          {"key": "percepcao_marca", "label": "Como você quer que sua marca seja percebida?", "type": "textarea", "required": false}
        ]
      },
      {
        "id": "redes_sociais_conteudo",
        "title": "Redes Sociais & Conteúdo",
        "step": 4,
        "fields": [
          {"key": "canais_ativos", "label": "Quais canais estão ativos?", "type": "checkbox", "required": false, "options": ["Instagram", "Facebook", "TikTok", "YouTube", "LinkedIn"]},
          {"key": "banco_imagens_link", "label": "Link para banco de imagens (Drive/WeTransfer)", "type": "url", "required": false},
          {"key": "temas_prioridade", "label": "Quais temas são prioridade?", "type": "textarea", "required": false},
          {"key": "temas_proibidos", "label": "Temas proibidos/sensíveis", "type": "textarea", "required": false}
        ]
      },
      {
        "id": "metas_observacoes",
        "title": "Metas & Observações",
        "step": 5,
        "fields": [
          {"key": "metas_principais", "label": "Metas principais", "type": "textarea", "required": false},
          {"key": "observacoes_finais", "label": "Observações finais", "type": "textarea", "required": false},
          {"key": "confirmacao_dados", "label": "Confirmo que as informações são verdadeiras.", "type": "checkbox_single", "required": true}
        ]
      }
    ]
  }'::jsonb,
  true
);

-- =============================================
-- STORAGE BUCKET PARA ANEXOS DE ONBOARDING
-- =============================================

INSERT INTO storage.buckets (id, name, public) VALUES ('onboarding-files', 'onboarding-files', false)
ON CONFLICT (id) DO NOTHING;

-- Policies para storage
CREATE POLICY "Admins can manage all onboarding files" ON storage.objects
  FOR ALL USING (bucket_id = 'onboarding-files' AND (has_role(auth.uid(), 'Owner') OR has_role(auth.uid(), 'Admin')));

CREATE POLICY "Clients can upload own onboarding files" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'onboarding-files' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Clients can view own onboarding files" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'onboarding-files' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Clients can delete own onboarding files" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'onboarding-files' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );