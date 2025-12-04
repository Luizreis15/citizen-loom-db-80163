-- Criar tabela de catálogo de serviços
CREATE TABLE public.service_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  tipo_servico TEXT NOT NULL CHECK (tipo_servico IN ('plano_mensal', 'produto_pontual', 'produto_mensal', 'flexivel')),
  eh_plano_principal BOOLEAN DEFAULT false,
  preco_padrao NUMERIC,
  itens_inclusos TEXT[],
  ordem_exibicao INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Criar tabela de serviços contratados pelo cliente
CREATE TABLE public.client_contracted_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.service_catalog(id),
  valor_acordado NUMERIC NOT NULL,
  tipo_cobranca TEXT NOT NULL CHECK (tipo_cobranca IN ('mensal', 'pontual')),
  is_plano_principal BOOLEAN DEFAULT false,
  data_inicio DATE NOT NULL,
  data_fim DATE,
  observacoes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.service_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_contracted_services ENABLE ROW LEVEL SECURITY;

-- Políticas para service_catalog (catálogo é público para leitura)
CREATE POLICY "Anyone can view active services" ON public.service_catalog
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage service catalog" ON public.service_catalog
  FOR ALL USING (has_role(auth.uid(), 'Owner') OR has_role(auth.uid(), 'Admin'));

-- Políticas para client_contracted_services
CREATE POLICY "Admins can manage all contracted services" ON public.client_contracted_services
  FOR ALL USING (has_role(auth.uid(), 'Owner') OR has_role(auth.uid(), 'Admin'));

CREATE POLICY "Clients can view own contracted services" ON public.client_contracted_services
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.client_id = client_contracted_services.client_id
    )
  );

-- Trigger para updated_at
CREATE TRIGGER update_service_catalog_updated_at
  BEFORE UPDATE ON public.service_catalog
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_client_contracted_services_updated_at
  BEFORE UPDATE ON public.client_contracted_services
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir dados iniciais do catálogo
INSERT INTO public.service_catalog (name, description, tipo_servico, eh_plano_principal, preco_padrao, itens_inclusos, ordem_exibicao) VALUES
-- Planos mensais
('Plano Básico – Negócios Locais', 'Plano básico para negócios locais com gestão de tráfego', 'plano_mensal', true, 900.00, 
  ARRAY['Diagnóstico empresarial', 'Gestão de tráfego profissional', 'Reuniões mensais de alinhamento/resultados'], 1),
('Plano Intermediário – Negócios Locais', 'Plano intermediário com gestão de mídias sociais', 'plano_mensal', true, NULL,
  ARRAY['Tudo do Plano Básico', 'Gestão de mídias sociais (Instagram e Facebook)', '2 posts estáticos por semana (1 estático + 1 carrossel)', '1 Reels por semana', 'Reunião mensal'], 2),
('Plano Avançado – Negócios Locais', 'Plano completo com visitas e conteúdo premium', 'plano_mensal', true, NULL,
  ARRAY['Tudo do Plano Intermediário', '2 posts semanais', '2 Reels semanais', '16 criativos/mês', 'Gestão de mídias sociais', 'Visitas ao cliente para captação de conteúdo, roteiros e linha editorial', 'Reunião mensal'], 3),
-- Produtos adicionais
('Criação de site e landing pages', 'Desenvolvimento de site institucional ou landing page', 'produto_pontual', false, 1500.00, 
  ARRAY['Site responsivo', 'Até 5 páginas', 'Formulário de contato', 'Integração com redes sociais'], 10),
('Vídeo institucional (5 minutos)', 'Produção de vídeo institucional profissional', 'produto_pontual', false, 750.00, 
  ARRAY['Roteiro', 'Captação de imagens', 'Edição profissional', 'Trilha sonora'], 11),
('Cobertura de eventos', 'Cobertura fotográfica e de vídeo para eventos', 'produto_pontual', false, NULL, 
  ARRAY['Fotografia profissional', 'Vídeo do evento', 'Edição e entrega digital'], 12),
('Funil de WhatsApp', 'Automação e gestão de funil de vendas no WhatsApp', 'flexivel', false, NULL, 
  ARRAY['Configuração do funil', 'Automação de mensagens', 'Relatórios de conversão'], 13);