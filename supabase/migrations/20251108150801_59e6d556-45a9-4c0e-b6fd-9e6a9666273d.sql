-- Atualizar nomes das roles para português simplificado

-- Atualizar roles existentes
UPDATE roles 
SET name = 'Editor de Vídeo', 
    description = 'Responsável pela edição de vídeos' 
WHERE name = 'Creator (Designer/Editor)';

UPDATE roles 
SET name = 'Social Mídia', 
    description = 'Gerencia redes sociais e publicações' 
WHERE name = 'Social Media';

UPDATE roles 
SET name = 'Administrativo', 
    description = 'Funções administrativas gerais' 
WHERE name = 'Gestor';

-- Adicionar Webdesigner se não existir
INSERT INTO roles (name, description)
VALUES ('Webdesigner', 'Responsável por design e desenvolvimento web')
ON CONFLICT DO NOTHING;

-- Remover Viewer se existir
DELETE FROM user_roles WHERE role_id IN (SELECT id FROM roles WHERE name = 'Viewer');
DELETE FROM roles WHERE name = 'Viewer';