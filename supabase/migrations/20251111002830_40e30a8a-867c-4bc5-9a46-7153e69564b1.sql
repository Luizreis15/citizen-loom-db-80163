-- Enable realtime for tasks table
ALTER TABLE tasks REPLICA IDENTITY FULL;

-- Add tasks to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;