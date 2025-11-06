-- Add missing columns to clients table
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS start_date date,
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'Ativo';

-- Set start_date to created_at for existing records
UPDATE public.clients 
SET start_date = created_at::date 
WHERE start_date IS NULL;

-- Insert missing roles
INSERT INTO public.roles (name, description)
VALUES 
  ('Creator (Designer/Editor)', 'Responsável pela criação de conteúdo visual e edição'),
  ('Social Media', 'Responsável pelas redes sociais e publicações'),
  ('Finance', 'Responsável pela gestão financeira'),
  ('Viewer', 'Apenas visualização, sem permissões de edição')
ON CONFLICT (name) DO NOTHING;

-- Clear existing products and insert correct ones
DELETE FROM public.products;

INSERT INTO public.products (name, description)
VALUES 
  ('Vídeo curto', 'Produção de vídeo curto para redes sociais'),
  ('Vídeo longo', 'Produção de vídeo longo formato'),
  ('Carrossel (por página)', 'Criação de carrossel, preço por página'),
  ('Capa de Reels', 'Design de capa para Reels'),
  ('Feed estático (1:1 e 4:5)', 'Post estático para feed nas proporções 1:1 e 4:5'),
  ('Sequência de Stories (por card)', 'Criação de stories, preço por card'),
  ('Copy (post/legend)', 'Redação de texto para posts e legendas'),
  ('Publicação/agendamento', 'Serviço de publicação e agendamento de conteúdo');