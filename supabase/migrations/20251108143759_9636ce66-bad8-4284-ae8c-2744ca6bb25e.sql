-- RLS Policies para Colaboradores visualizarem apenas suas tarefas atribuídas

-- Permitir colaboradores verem tarefas atribuídas a eles
CREATE POLICY "Collaborators can view assigned tasks"
ON tasks FOR SELECT
TO authenticated
USING (
  assignee_id = auth.uid() 
  AND has_role(auth.uid(), 'Colaborador')
);

-- Permitir colaboradores atualizarem status das tarefas atribuídas
CREATE POLICY "Collaborators can update assigned tasks"
ON tasks FOR UPDATE
TO authenticated
USING (
  assignee_id = auth.uid() 
  AND has_role(auth.uid(), 'Colaborador')
)
WITH CHECK (
  assignee_id = auth.uid() 
  AND has_role(auth.uid(), 'Colaborador')
);

-- Permitir colaboradores verem projetos das suas tarefas
CREATE POLICY "Collaborators can view projects of assigned tasks"
ON projects FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'Colaborador')
  AND EXISTS (
    SELECT 1 FROM tasks
    WHERE tasks.project_id = projects.id
    AND tasks.assignee_id = auth.uid()
  )
);

-- Permitir colaboradores visualizarem comentários das suas tarefas
CREATE POLICY "Collaborators can view comments on assigned tasks"
ON task_comments FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'Colaborador')
  AND EXISTS (
    SELECT 1 FROM tasks
    WHERE tasks.id = task_comments.task_id
    AND tasks.assignee_id = auth.uid()
  )
);

-- Permitir colaboradores visualizarem anexos das suas tarefas
CREATE POLICY "Collaborators can view attachments on assigned tasks"
ON task_attachments FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'Colaborador')
  AND EXISTS (
    SELECT 1 FROM tasks
    WHERE tasks.id = task_attachments.task_id
    AND tasks.assignee_id = auth.uid()
  )
);