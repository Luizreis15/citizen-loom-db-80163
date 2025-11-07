-- Policy para Owner/Admin verem todas as tarefas
CREATE POLICY "Owners and Admins can view all tasks"
ON public.tasks
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'Owner') OR 
  has_role(auth.uid(), 'Admin')
);

-- Policy para Owner/Admin verem todos os projetos
CREATE POLICY "Owners and Admins can view all projects"
ON public.projects
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'Owner') OR 
  has_role(auth.uid(), 'Admin')
);

-- Policy para Owner/Admin verem todos os clientes
CREATE POLICY "Owners and Admins can view all clients"
ON public.clients
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'Owner') OR 
  has_role(auth.uid(), 'Admin')
);

-- Policy para Owner/Admin verem todos os comentários
CREATE POLICY "Owners and Admins can view all comments"
ON public.task_comments
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'Owner') OR 
  has_role(auth.uid(), 'Admin')
);

-- Policy para Owner/Admin verem todos os anexos
CREATE POLICY "Owners and Admins can view all attachments"
ON public.task_attachments
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'Owner') OR 
  has_role(auth.uid(), 'Admin')
);