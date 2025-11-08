-- Update RLS policies for client_services table to allow Admins/Owners to manage all services

-- Drop existing policies
DROP POLICY IF EXISTS "Users can create services for their clients" ON client_services;
DROP POLICY IF EXISTS "Users can update services of their clients" ON client_services;
DROP POLICY IF EXISTS "Users can delete services of their clients" ON client_services;

-- Recreate INSERT policy - Allow Admins/Owners to create services for any client
CREATE POLICY "Users can create services for their clients"
ON client_services FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'Owner') 
  OR has_role(auth.uid(), 'Admin')
  OR EXISTS (
    SELECT 1 FROM clients
    WHERE clients.id = client_services.client_id 
    AND clients.user_id = auth.uid()
  )
);

-- Recreate UPDATE policy - Allow Admins/Owners to update services for any client
CREATE POLICY "Users can update services of their clients"
ON client_services FOR UPDATE
USING (
  has_role(auth.uid(), 'Owner') 
  OR has_role(auth.uid(), 'Admin')
  OR EXISTS (
    SELECT 1 FROM clients
    WHERE clients.id = client_services.client_id 
    AND clients.user_id = auth.uid()
  )
);

-- Recreate DELETE policy - Allow Admins/Owners to delete services for any client
CREATE POLICY "Users can delete services of their clients"
ON client_services FOR DELETE
USING (
  has_role(auth.uid(), 'Owner') 
  OR has_role(auth.uid(), 'Admin')
  OR EXISTS (
    SELECT 1 FROM clients
    WHERE clients.id = client_services.client_id 
    AND clients.user_id = auth.uid()
  )
);