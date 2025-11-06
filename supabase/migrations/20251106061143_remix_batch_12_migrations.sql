
-- Migration: 20251106044745
-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to handle new user signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, avatar_url)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- Migration: 20251106044829
-- Create roles table for permission levels
CREATE TABLE public.roles (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read roles
CREATE POLICY "Anyone can view roles" 
ON public.roles 
FOR SELECT 
TO authenticated
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_roles_updated_at
BEFORE UPDATE ON public.roles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default roles
INSERT INTO public.roles (name, description) VALUES
  ('Owner', 'Proprietário do sistema com acesso total'),
  ('Admin', 'Administrador com permissões elevadas'),
  ('Gestor', 'Gestor com permissões de gerenciamento'),
  ('Cliente', 'Cliente com acesso básico');

-- Migration: 20251106044914
-- Create user_roles junction table
CREATE TABLE public.user_roles (
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role_id INTEGER NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, role_id)
);

-- Enable Row Level Security
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Users can view their own roles
CREATE POLICY "Users can view their own roles" 
ON public.user_roles 
FOR SELECT 
USING (auth.uid() = user_id);

-- Create index for better query performance
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_role_id ON public.user_roles(role_id);

-- Create security definer function to check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role_name TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = _user_id
      AND r.name = _role_name
  )
$$;

-- Create helper function to get user's roles
CREATE OR REPLACE FUNCTION public.get_user_roles(_user_id UUID)
RETURNS TABLE(role_id INTEGER, role_name TEXT, role_description TEXT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT r.id, r.name, r.description
  FROM public.user_roles ur
  JOIN public.roles r ON ur.role_id = r.id
  WHERE ur.user_id = _user_id
$$;

-- Migration: 20251106045442
-- Create clients table
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security on clients
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Create policies for clients
CREATE POLICY "Users can view their own clients" 
ON public.clients 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own clients" 
ON public.clients 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own clients" 
ON public.clients 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own clients" 
ON public.clients 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates on clients
CREATE TRIGGER update_clients_updated_at
BEFORE UPDATE ON public.clients
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create brand_identities table
CREATE TABLE public.brand_identities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID UNIQUE NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  color_palette JSONB,
  typography JSONB,
  tone_of_voice TEXT,
  references_links TEXT[],
  rules_and_observations TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security on brand_identities
ALTER TABLE public.brand_identities ENABLE ROW LEVEL SECURITY;

-- Create policies for brand_identities
-- Users can view brand identities for their own clients
CREATE POLICY "Users can view brand identities of their clients" 
ON public.brand_identities 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.clients 
    WHERE clients.id = brand_identities.client_id 
    AND clients.user_id = auth.uid()
  )
);

-- Users can create brand identities for their own clients
CREATE POLICY "Users can create brand identities for their clients" 
ON public.brand_identities 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.clients 
    WHERE clients.id = brand_identities.client_id 
    AND clients.user_id = auth.uid()
  )
);

-- Users can update brand identities for their own clients
CREATE POLICY "Users can update brand identities of their clients" 
ON public.brand_identities 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.clients 
    WHERE clients.id = brand_identities.client_id 
    AND clients.user_id = auth.uid()
  )
);

-- Users can delete brand identities for their own clients
CREATE POLICY "Users can delete brand identities of their clients" 
ON public.brand_identities 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.clients 
    WHERE clients.id = brand_identities.client_id 
    AND clients.user_id = auth.uid()
  )
);

-- Create trigger for automatic timestamp updates on brand_identities
CREATE TRIGGER update_brand_identities_updated_at
BEFORE UPDATE ON public.brand_identities
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_clients_user_id ON public.clients(user_id);
CREATE INDEX idx_brand_identities_client_id ON public.brand_identities(client_id);

-- Migration: 20251106045539
-- Create products table for cataloging services offered
CREATE TABLE public.products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view products
CREATE POLICY "Authenticated users can view products" 
ON public.products 
FOR SELECT 
TO authenticated
USING (true);

-- Only admins and owners can manage products
CREATE POLICY "Admins can insert products" 
ON public.products 
FOR INSERT 
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'Admin') OR 
  public.has_role(auth.uid(), 'Owner')
);

CREATE POLICY "Admins can update products" 
ON public.products 
FOR UPDATE 
TO authenticated
USING (
  public.has_role(auth.uid(), 'Admin') OR 
  public.has_role(auth.uid(), 'Owner')
);

CREATE POLICY "Admins can delete products" 
ON public.products 
FOR DELETE 
TO authenticated
USING (
  public.has_role(auth.uid(), 'Admin') OR 
  public.has_role(auth.uid(), 'Owner')
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default products/services
INSERT INTO public.products (name, description) VALUES
  ('Vídeo curto', 'Produção de vídeos curtos para redes sociais (Reels, TikTok, Shorts)'),
  ('Carrossel', 'Design de posts em formato carrossel para Instagram e LinkedIn'),
  ('Copy', 'Criação de textos persuasivos para posts e anúncios'),
  ('Stories', 'Design de stories para Instagram e Facebook'),
  ('Banner', 'Criação de banners para sites e redes sociais'),
  ('Logo', 'Design de logotipo e identidade visual'),
  ('Post estático', 'Design de post único para redes sociais'),
  ('Edição de vídeo', 'Edição profissional de vídeos longos');

-- Migration: 20251106045726
-- Create client_services table
CREATE TABLE public.client_services (
  id SERIAL PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  negotiated_price DECIMAL(10, 2) NOT NULL,
  sla_days INTEGER NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(client_id, product_id)
);

-- Enable Row Level Security
ALTER TABLE public.client_services ENABLE ROW LEVEL SECURITY;

-- Users can view services for their own clients
CREATE POLICY "Users can view services of their clients" 
ON public.client_services 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.clients 
    WHERE clients.id = client_services.client_id 
    AND clients.user_id = auth.uid()
  )
);

-- Users can create services for their own clients
CREATE POLICY "Users can create services for their clients" 
ON public.client_services 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.clients 
    WHERE clients.id = client_services.client_id 
    AND clients.user_id = auth.uid()
  )
);

-- Users can update services for their own clients
CREATE POLICY "Users can update services of their clients" 
ON public.client_services 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.clients 
    WHERE clients.id = client_services.client_id 
    AND clients.user_id = auth.uid()
  )
);

-- Users can delete services for their own clients
CREATE POLICY "Users can delete services of their clients" 
ON public.client_services 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.clients 
    WHERE clients.id = client_services.client_id 
    AND clients.user_id = auth.uid()
  )
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_client_services_updated_at
BEFORE UPDATE ON public.client_services
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_client_services_client_id ON public.client_services(client_id);
CREATE INDEX idx_client_services_product_id ON public.client_services(product_id);
CREATE INDEX idx_client_services_is_active ON public.client_services(is_active);

-- Migration: 20251106050154
-- Create projects table
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Ativo' CHECK (status IN ('Ativo', 'Pausado', 'Concluído')),
  start_date DATE NOT NULL,
  end_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Users can view projects for their own clients
CREATE POLICY "Users can view projects of their clients" 
ON public.projects 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.clients 
    WHERE clients.id = projects.client_id 
    AND clients.user_id = auth.uid()
  )
);

-- Users can create projects for their own clients
CREATE POLICY "Users can create projects for their clients" 
ON public.projects 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.clients 
    WHERE clients.id = projects.client_id 
    AND clients.user_id = auth.uid()
  )
);

-- Users can update projects for their own clients
CREATE POLICY "Users can update projects of their clients" 
ON public.projects 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.clients 
    WHERE clients.id = projects.client_id 
    AND clients.user_id = auth.uid()
  )
);

-- Users can delete projects for their own clients
CREATE POLICY "Users can delete projects of their clients" 
ON public.projects 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.clients 
    WHERE clients.id = projects.client_id 
    AND clients.user_id = auth.uid()
  )
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_projects_updated_at
BEFORE UPDATE ON public.projects
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_projects_client_id ON public.projects(client_id);
CREATE INDEX idx_projects_status ON public.projects(status);
CREATE INDEX idx_projects_start_date ON public.projects(start_date);

-- Migration: 20251106050436
-- Create tasks table (core of the workflow)
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  assignee_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'Backlog' CHECK (
    status IN (
      'Backlog',
      'Em produção',
      'Revisão interna',
      'Enviado ao cliente',
      'Ajustes',
      'Aprovado',
      'Publicado'
    )
  ),
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  variant_description TEXT,
  frozen_price DECIMAL(10, 2) NOT NULL,
  frozen_sla_days INTEGER NOT NULL CHECK (frozen_sla_days > 0),
  due_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Users can view tasks for projects of their own clients
CREATE POLICY "Users can view tasks of their clients' projects" 
ON public.tasks 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM public.projects 
    JOIN public.clients ON clients.id = projects.client_id
    WHERE projects.id = tasks.project_id 
    AND clients.user_id = auth.uid()
  )
);

-- Users can create tasks for projects of their own clients
CREATE POLICY "Users can create tasks for their clients' projects" 
ON public.tasks 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM public.projects 
    JOIN public.clients ON clients.id = projects.client_id
    WHERE projects.id = tasks.project_id 
    AND clients.user_id = auth.uid()
  )
);

-- Users can update tasks for projects of their own clients
CREATE POLICY "Users can update tasks of their clients' projects" 
ON public.tasks 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 
    FROM public.projects 
    JOIN public.clients ON clients.id = projects.client_id
    WHERE projects.id = tasks.project_id 
    AND clients.user_id = auth.uid()
  )
);

-- Users can delete tasks for projects of their own clients
CREATE POLICY "Users can delete tasks of their clients' projects" 
ON public.tasks 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 
    FROM public.projects 
    JOIN public.clients ON clients.id = projects.client_id
    WHERE projects.id = tasks.project_id 
    AND clients.user_id = auth.uid()
  )
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_tasks_updated_at
BEFORE UPDATE ON public.tasks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_tasks_project_id ON public.tasks(project_id);
CREATE INDEX idx_tasks_product_id ON public.tasks(product_id);
CREATE INDEX idx_tasks_assignee_id ON public.tasks(assignee_id);
CREATE INDEX idx_tasks_status ON public.tasks(status);
CREATE INDEX idx_tasks_due_date ON public.tasks(due_date);
CREATE INDEX idx_tasks_created_at ON public.tasks(created_at);

-- Create a view for easier task querying with related data
CREATE VIEW public.tasks_with_details AS
SELECT 
  t.id,
  t.project_id,
  t.product_id,
  t.assignee_id,
  t.status,
  t.quantity,
  t.variant_description,
  t.frozen_price,
  t.frozen_sla_days,
  t.due_date,
  t.created_at,
  t.updated_at,
  proj.name as project_name,
  proj.status as project_status,
  c.name as client_name,
  c.user_id as client_owner_id,
  prod.name as product_name,
  prod.description as product_description,
  p.full_name as assignee_name,
  p.email as assignee_email
FROM public.tasks t
JOIN public.projects proj ON t.project_id = proj.id
JOIN public.clients c ON proj.client_id = c.id
JOIN public.products prod ON t.product_id = prod.id
LEFT JOIN public.profiles p ON t.assignee_id = p.id;

-- Migration: 20251106050456
-- Enable Row Level Security on the view
ALTER VIEW public.tasks_with_details SET (security_invoker = on);

-- Note: Since views inherit RLS from their underlying tables,
-- and tasks_with_details is based on tasks table which already has RLS,
-- the view will respect the same security policies;

-- Migration: 20251106052156
-- Create task_comments table
CREATE TABLE public.task_comments (
  id SERIAL PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  comment_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for better performance
CREATE INDEX idx_task_comments_task_id ON public.task_comments(task_id);
CREATE INDEX idx_task_comments_user_id ON public.task_comments(user_id);

-- Enable Row Level Security
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view comments on tasks of their clients' projects
CREATE POLICY "Users can view comments on their clients' project tasks"
ON public.task_comments
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.tasks
    JOIN public.projects ON projects.id = tasks.project_id
    JOIN public.clients ON clients.id = projects.client_id
    WHERE tasks.id = task_comments.task_id
      AND clients.user_id = auth.uid()
  )
);

-- Policy: Users can create comments on tasks of their clients' projects
CREATE POLICY "Users can create comments on their clients' project tasks"
ON public.task_comments
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.tasks
    JOIN public.projects ON projects.id = tasks.project_id
    JOIN public.clients ON clients.id = projects.client_id
    WHERE tasks.id = task_comments.task_id
      AND clients.user_id = auth.uid()
  )
  AND auth.uid() = user_id
);

-- Policy: Users can update their own comments
CREATE POLICY "Users can update their own comments"
ON public.task_comments
FOR UPDATE
USING (auth.uid() = user_id);

-- Policy: Users can delete their own comments
CREATE POLICY "Users can delete their own comments"
ON public.task_comments
FOR DELETE
USING (auth.uid() = user_id);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_task_comments_updated_at
BEFORE UPDATE ON public.task_comments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Migration: 20251106053804
-- Create task_attachments table
CREATE TABLE public.task_attachments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id uuid NOT NULL,
  uploader_id uuid NOT NULL,
  file_name text NOT NULL,
  file_url text NOT NULL,
  upload_type text NOT NULL CHECK (upload_type IN ('Entrada', 'Saída')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.task_attachments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can view attachments of their clients' project tasks
CREATE POLICY "Users can view attachments of their clients' project tasks"
ON public.task_attachments
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM tasks
    JOIN projects ON projects.id = tasks.project_id
    JOIN clients ON clients.id = projects.client_id
    WHERE tasks.id = task_attachments.task_id
      AND clients.user_id = auth.uid()
  )
);

-- Users can create attachments on their clients' project tasks
CREATE POLICY "Users can create attachments on their clients' project tasks"
ON public.task_attachments
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM tasks
    JOIN projects ON projects.id = tasks.project_id
    JOIN clients ON clients.id = projects.client_id
    WHERE tasks.id = task_attachments.task_id
      AND clients.user_id = auth.uid()
  )
  AND auth.uid() = uploader_id
);

-- Users can update their own attachments
CREATE POLICY "Users can update their own attachments"
ON public.task_attachments
FOR UPDATE
USING (auth.uid() = uploader_id);

-- Users can delete their own attachments
CREATE POLICY "Users can delete their own attachments"
ON public.task_attachments
FOR DELETE
USING (auth.uid() = uploader_id);

-- Create trigger for automatic updated_at timestamp
CREATE TRIGGER update_task_attachments_updated_at
  BEFORE UPDATE ON public.task_attachments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_task_attachments_task_id ON public.task_attachments(task_id);
CREATE INDEX idx_task_attachments_uploader_id ON public.task_attachments(uploader_id);

-- Migration: 20251106053918
-- Add client_id to profiles to link users with their client account
ALTER TABLE public.profiles 
ADD COLUMN client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL;

-- Create index for better performance
CREATE INDEX idx_profiles_client_id ON public.profiles(client_id);

-- Drop existing policies on projects table
DROP POLICY IF EXISTS "Users can view projects of their clients" ON public.projects;
DROP POLICY IF EXISTS "Users can create projects for their clients" ON public.projects;
DROP POLICY IF EXISTS "Users can update projects of their clients" ON public.projects;
DROP POLICY IF EXISTS "Users can delete projects of their clients" ON public.projects;

-- Create new policies for projects that include client user access
CREATE POLICY "Users can view projects of their clients or if they are the client"
ON public.projects
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM clients
    WHERE clients.id = projects.client_id
      AND clients.user_id = auth.uid()
  )
  OR
  (
    has_role(auth.uid(), 'Cliente') 
    AND EXISTS (
      SELECT 1
      FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.client_id = projects.client_id
    )
  )
);

CREATE POLICY "Users can create projects for their clients"
ON public.projects
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM clients
    WHERE clients.id = projects.client_id
      AND clients.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update projects of their clients"
ON public.projects
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM clients
    WHERE clients.id = projects.client_id
      AND clients.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete projects of their clients"
ON public.projects
FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM clients
    WHERE clients.id = projects.client_id
      AND clients.user_id = auth.uid()
  )
);

-- Drop existing policies on tasks table
DROP POLICY IF EXISTS "Users can view tasks of their clients' projects" ON public.tasks;
DROP POLICY IF EXISTS "Users can create tasks for their clients' projects" ON public.tasks;
DROP POLICY IF EXISTS "Users can update tasks of their clients' projects" ON public.tasks;
DROP POLICY IF EXISTS "Users can delete tasks of their clients' projects" ON public.tasks;

-- Create new policies for tasks that include client user access
CREATE POLICY "Users can view tasks of their clients' projects or if they are the client"
ON public.tasks
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM projects
    JOIN clients ON clients.id = projects.client_id
    WHERE projects.id = tasks.project_id
      AND clients.user_id = auth.uid()
  )
  OR
  (
    has_role(auth.uid(), 'Cliente')
    AND EXISTS (
      SELECT 1
      FROM projects
      JOIN profiles ON profiles.client_id = projects.client_id
      WHERE projects.id = tasks.project_id
        AND profiles.id = auth.uid()
    )
  )
);

CREATE POLICY "Users can create tasks for their clients' projects"
ON public.tasks
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM projects
    JOIN clients ON clients.id = projects.client_id
    WHERE projects.id = tasks.project_id
      AND clients.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update tasks of their clients' projects"
ON public.tasks
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM projects
    JOIN clients ON clients.id = projects.client_id
    WHERE projects.id = tasks.project_id
      AND clients.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete tasks of their clients' projects"
ON public.tasks
FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM projects
    JOIN clients ON clients.id = projects.client_id
    WHERE projects.id = tasks.project_id
      AND clients.user_id = auth.uid()
  )
);

-- Drop existing policies on task_comments table
DROP POLICY IF EXISTS "Users can view comments on their clients' project tasks" ON public.task_comments;
DROP POLICY IF EXISTS "Users can create comments on their clients' project tasks" ON public.task_comments;

-- Create new policies for task_comments that include client user access
CREATE POLICY "Users can view comments on their clients' project tasks or if they are the client"
ON public.task_comments
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM tasks
    JOIN projects ON projects.id = tasks.project_id
    JOIN clients ON clients.id = projects.client_id
    WHERE tasks.id = task_comments.task_id
      AND clients.user_id = auth.uid()
  )
  OR
  (
    has_role(auth.uid(), 'Cliente')
    AND EXISTS (
      SELECT 1
      FROM tasks
      JOIN projects ON projects.id = tasks.project_id
      JOIN profiles ON profiles.client_id = projects.client_id
      WHERE tasks.id = task_comments.task_id
        AND profiles.id = auth.uid()
    )
  )
);

CREATE POLICY "Users can create comments on their clients' project tasks or if they are the client"
ON public.task_comments
FOR INSERT
WITH CHECK (
  (
    EXISTS (
      SELECT 1
      FROM tasks
      JOIN projects ON projects.id = tasks.project_id
      JOIN clients ON clients.id = projects.client_id
      WHERE tasks.id = task_comments.task_id
        AND clients.user_id = auth.uid()
    )
    AND auth.uid() = user_id
  )
  OR
  (
    has_role(auth.uid(), 'Cliente')
    AND EXISTS (
      SELECT 1
      FROM tasks
      JOIN projects ON projects.id = tasks.project_id
      JOIN profiles ON profiles.client_id = projects.client_id
      WHERE tasks.id = task_comments.task_id
        AND profiles.id = auth.uid()
    )
    AND auth.uid() = user_id
  )
);

-- Drop existing policies on task_attachments table
DROP POLICY IF EXISTS "Users can view attachments of their clients' project tasks" ON public.task_attachments;
DROP POLICY IF EXISTS "Users can create attachments on their clients' project tasks" ON public.task_attachments;

-- Create new policies for task_attachments that include client user access
CREATE POLICY "Users can view attachments of their clients' project tasks or if they are the client"
ON public.task_attachments
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM tasks
    JOIN projects ON projects.id = tasks.project_id
    JOIN clients ON clients.id = projects.client_id
    WHERE tasks.id = task_attachments.task_id
      AND clients.user_id = auth.uid()
  )
  OR
  (
    has_role(auth.uid(), 'Cliente')
    AND EXISTS (
      SELECT 1
      FROM tasks
      JOIN projects ON projects.id = tasks.project_id
      JOIN profiles ON profiles.client_id = projects.client_id
      WHERE tasks.id = task_attachments.task_id
        AND profiles.id = auth.uid()
    )
  )
);

CREATE POLICY "Users can create attachments on their clients' project tasks or if they are the client"
ON public.task_attachments
FOR INSERT
WITH CHECK (
  (
    EXISTS (
      SELECT 1
      FROM tasks
      JOIN projects ON projects.id = tasks.project_id
      JOIN clients ON clients.id = projects.client_id
      WHERE tasks.id = task_attachments.task_id
        AND clients.user_id = auth.uid()
    )
    AND auth.uid() = uploader_id
  )
  OR
  (
    has_role(auth.uid(), 'Cliente')
    AND EXISTS (
      SELECT 1
      FROM tasks
      JOIN projects ON projects.id = tasks.project_id
      JOIN profiles ON profiles.client_id = projects.client_id
      WHERE tasks.id = task_attachments.task_id
        AND profiles.id = auth.uid()
    )
    AND auth.uid() = uploader_id
  )
);
