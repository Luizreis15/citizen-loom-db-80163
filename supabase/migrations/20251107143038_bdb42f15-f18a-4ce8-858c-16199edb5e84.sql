-- Make user_id nullable in clients table (pending clients don't have user_id yet)
ALTER TABLE clients 
ALTER COLUMN user_id DROP NOT NULL;

-- Clear the incorrect user_id link for Rafael
UPDATE clients 
SET user_id = NULL, 
    status = 'Pendente',
    activated_at = NULL
WHERE id = 'cee617f7-6f8a-429f-aeb4-5d096f4fd6d8';