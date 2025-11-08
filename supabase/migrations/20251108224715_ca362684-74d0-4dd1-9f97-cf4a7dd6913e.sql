-- Adicionar política que permite ativar clientes pendentes
CREATE POLICY "Allow activation of pending clients"
ON clients
FOR UPDATE
TO authenticated
USING (status = 'Pendente')
WITH CHECK (status = 'Ativo' AND user_id = auth.uid());