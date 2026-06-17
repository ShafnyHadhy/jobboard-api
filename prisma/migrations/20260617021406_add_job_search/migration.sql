-- Create a GIN index for full-text search on Job title and description.
-- to_tsvector('english', ...) converts text into searchable word tokens.
-- GIN index pre-computes the word list for fast lookups.
-- 'english' applies stemming: "running" matches "run", "developer" matches "develop".

CREATE INDEX job_search_idx ON "Job"
USING GIN (to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, '')));