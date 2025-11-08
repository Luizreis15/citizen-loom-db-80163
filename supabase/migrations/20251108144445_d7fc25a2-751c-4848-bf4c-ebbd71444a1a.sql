-- Fix infinite recursion in tasks policies
-- Drop the problematic collaborator policies we just created
DROP POLICY IF EXISTS "Collaborators can view assigned tasks" ON tasks;
DROP POLICY IF EXISTS "Collaborators can update assigned tasks" ON tasks;
DROP POLICY IF EXISTS "Collaborators can view projects of assigned tasks" ON projects;
DROP POLICY IF EXISTS "Collaborators can view comments on assigned tasks" ON task_comments;
DROP POLICY IF EXISTS "Collaborators can view attachments on assigned tasks" ON task_attachments;

-- Create new collaborator policies that work with existing ones
-- These use OR logic to extend existing permissions instead of creating conflicts

-- For tasks: Extend SELECT policy to include collaborators
CREATE POLICY "Collaborators can view their assigned tasks"
ON tasks FOR SELECT
TO authenticated
USING (
  assignee_id = auth.uid()
  OR (
    has_role(auth.uid(), 'Colaborador')
    AND assignee_id = auth.uid()
  )
);

-- For tasks: Extend UPDATE policy to include collaborators
CREATE POLICY "Collaborators can update their assigned tasks"
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

-- For projects: Allow collaborators to view projects of their tasks
CREATE POLICY "Collaborators can view their task projects"
ON projects FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM tasks
    WHERE tasks.project_id = projects.id
    AND tasks.assignee_id = auth.uid()
    AND has_role(auth.uid(), 'Colaborador')
  )
);

-- For task_comments: Allow collaborators to view comments on their tasks
CREATE POLICY "Collaborators can view their task comments"
ON task_comments FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM tasks
    WHERE tasks.id = task_comments.task_id
    AND tasks.assignee_id = auth.uid()
    AND has_role(auth.uid(), 'Colaborador')
  )
);

-- For task_attachments: Allow collaborators to view attachments on their tasks
CREATE POLICY "Collaborators can view their task attachments"
ON task_attachments FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM tasks
    WHERE tasks.id = task_attachments.task_id
    AND tasks.assignee_id = auth.uid()
    AND has_role(auth.uid(), 'Colaborador')
  )
);