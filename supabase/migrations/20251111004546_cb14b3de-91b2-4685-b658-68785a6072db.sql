-- Create function to clean up unconfirmed users older than 1 hour
CREATE OR REPLACE FUNCTION public.cleanup_unconfirmed_users()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- This function is designed to be called by pg_cron
  -- It deletes users from auth.users where:
  -- 1. email_confirmed_at is NULL (email not confirmed)
  -- 2. created_at is more than 1 hour ago
  
  DELETE FROM auth.users 
  WHERE email_confirmed_at IS NULL 
    AND created_at < now() - interval '1 hour';
    
  RAISE NOTICE 'Cleaned up unconfirmed users older than 1 hour';
END;
$$;

-- Note: To schedule this function to run automatically, you need to set up pg_cron
-- Example cron job (run every hour):
-- SELECT cron.schedule(
--   'cleanup-unconfirmed-users',
--   '0 * * * *',
--   $$SELECT public.cleanup_unconfirmed_users()$$
-- );