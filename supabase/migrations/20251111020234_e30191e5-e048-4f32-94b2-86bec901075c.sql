-- Remover view temporariamente para permitir alteração
DROP VIEW IF EXISTS tasks_with_details CASCADE;

-- Atualizar valores de status existentes
UPDATE tasks SET status = 'Backlog' WHERE status IN ('Pendente', 'To Do');
UPDATE tasks SET status = 'Em Progresso' WHERE status = 'In Progress';
UPDATE tasks SET status = 'Em Revisão' WHERE status = 'In Review';
UPDATE tasks SET status = 'Aguardando Cliente' WHERE status = 'Awaiting Approval';
UPDATE tasks SET status = 'Aprovado' WHERE status IN ('Done', 'Completed', 'Concluído');

-- Garantir que project_id é nullable
ALTER TABLE tasks ALTER COLUMN project_id DROP NOT NULL;

-- Adicionar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_tasks_assignee_status ON tasks(assignee_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_request_id ON tasks(request_id);

-- Recriar a view tasks_with_details
CREATE VIEW tasks_with_details AS
SELECT 
  t.id,
  t.product_id,
  t.project_id,
  t.assignee_id,
  t.status,
  t.due_date,
  t.frozen_price,
  t.frozen_sla_days,
  t.variant_description,
  t.quantity,
  t.created_at,
  t.updated_at,
  p.name as product_name,
  p.description as product_description,
  pr.name as project_name,
  pr.status as project_status,
  c.id as client_owner_id,
  c.name as client_name,
  pf.full_name as assignee_name,
  pf.email as assignee_email
FROM tasks t
LEFT JOIN products p ON t.product_id = p.id
LEFT JOIN projects pr ON t.project_id = pr.id
LEFT JOIN clients c ON pr.client_id = c.id
LEFT JOIN profiles pf ON t.assignee_id = pf.id;