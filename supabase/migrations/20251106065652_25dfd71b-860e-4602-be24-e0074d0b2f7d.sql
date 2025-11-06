-- Enable pg_net extension for HTTP requests from triggers
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Enable realtime for task_comments to trigger notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.task_comments;

-- Create function to notify on new comment
CREATE OR REPLACE FUNCTION public.notify_new_comment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  request_id bigint;
BEGIN
  -- Call edge function asynchronously
  SELECT net.http_post(
    url := current_setting('app.settings.api_url') || '/functions/v1/send-comment-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body := jsonb_build_object(
      'comment_id', NEW.id,
      'task_id', NEW.task_id,
      'user_id', NEW.user_id,
      'comment_text', NEW.comment_text
    )
  ) INTO request_id;
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't fail the insert
  RAISE WARNING 'Error calling send-comment-notification: %', SQLERRM;
  RETURN NEW;
END;
$$;

-- Create trigger for new comments
DROP TRIGGER IF EXISTS on_comment_created ON public.task_comments;
CREATE TRIGGER on_comment_created
  AFTER INSERT ON public.task_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_comment();