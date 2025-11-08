-- Fix infinite recursion in RLS policies
-- The issue: projects table has a policy that queries tasks, and tasks queries projects

-- 1. Drop the problematic policy on projects that creates recursion
DROP POLICY IF EXISTS "Collaborators can view their task projects" ON public.projects;

-- 2. Simplify the collaborator policies on tasks to avoid complex joins
-- Drop existing collaborator policies
DROP POLICY IF EXISTS "Collaborators can view their assigned tasks" ON public.tasks;
DROP POLICY IF EXISTS "Collaborators can update their assigned tasks" ON public.tasks;

-- 3. Create simpler collaborator policies that don't cause recursion
-- Collaborators can view tasks assigned to them (simple check, no recursion)
CREATE POLICY "Collaborators can view assigned tasks"
ON public.tasks
FOR SELECT
TO authenticated
USING (assignee_id = auth.uid());

-- Collaborators can update tasks assigned to them (simple check, no recursion)
CREATE POLICY "Collaborators can update assigned tasks"
ON public.tasks
FOR UPDATE
TO authenticated
USING (assignee_id = auth.uid())
WITH CHECK (assignee_id = auth.uid());

-- 4. Create a new safe policy for collaborators to view projects
-- Use a security definer function to avoid recursion
CREATE OR REPLACE FUNCTION public.user_is_assigned_to_project(_user_id uuid, _project_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM tasks
    WHERE project_id = _project_id
      AND assignee_id = _user_id
  )
$$;

-- Add policy for collaborators to view projects they're assigned to
CREATE POLICY "Collaborators can view assigned projects"
ON public.projects
FOR SELECT
TO authenticated
USING (user_is_assigned_to_project(auth.uid(), id));