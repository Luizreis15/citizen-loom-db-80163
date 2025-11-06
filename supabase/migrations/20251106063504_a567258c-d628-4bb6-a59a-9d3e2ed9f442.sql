-- Trigger types regeneration
-- Add a comment to force schema update
COMMENT ON TABLE public.clients IS 'Table for storing client information';
COMMENT ON TABLE public.projects IS 'Table for storing project information';
COMMENT ON TABLE public.tasks IS 'Table for storing task information';
COMMENT ON TABLE public.products IS 'Table for storing product information';
COMMENT ON TABLE public.profiles IS 'Table for storing user profile information';
COMMENT ON TABLE public.brand_identities IS 'Table for storing brand identity information';
COMMENT ON TABLE public.client_services IS 'Table for storing client service information';
COMMENT ON TABLE public.task_attachments IS 'Table for storing task attachment information';
COMMENT ON TABLE public.task_comments IS 'Table for storing task comment information';
COMMENT ON TABLE public.user_roles IS 'Table for storing user role assignments';
COMMENT ON TABLE public.roles IS 'Table for storing available roles';