-- Create an index on created_at for faster queries
CREATE INDEX IF NOT EXISTS idx_templates_created_at ON templates(created_at);
