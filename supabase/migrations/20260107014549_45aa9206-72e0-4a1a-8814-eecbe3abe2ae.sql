-- Update source_type constraint to allow new types
ALTER TABLE activity_embeddings 
DROP CONSTRAINT IF EXISTS activity_embeddings_source_type_check;

ALTER TABLE activity_embeddings 
ADD CONSTRAINT activity_embeddings_source_type_check 
CHECK (source_type IN (
  'journal_entry', 'quick_task', 'habit_log', 'focus_session',
  'goal', 'week_review', 'vision', 'big_ten_project', 'reset_audit'
));