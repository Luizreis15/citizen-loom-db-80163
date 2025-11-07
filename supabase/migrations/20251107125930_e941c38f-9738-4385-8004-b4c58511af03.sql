-- Move a extensão pg_net do schema public para extensions
-- Isso corrige o aviso de segurança sobre extensões no schema público

-- Primeiro, drop a extensão do schema public
DROP EXTENSION IF EXISTS pg_net;

-- Recria a extensão no schema extensions (onde deveria estar)
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;