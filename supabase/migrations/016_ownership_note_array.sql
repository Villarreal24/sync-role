-- Migration 016: Convert ownership_note from TEXT to JSONB array
-- for multi-note support in the Job Detail Sheet.
--
-- The DEFAULT must be dropped before ALTER TYPE because the
-- old default (''::text) cannot be auto-cast to jsonb.

ALTER TABLE job_postings
  ALTER COLUMN ownership_note DROP DEFAULT;

ALTER TABLE job_postings
  ALTER COLUMN ownership_note SET DATA TYPE JSONB
  USING CASE
    WHEN ownership_note = '' THEN '[]'::jsonb
    ELSE jsonb_build_array(jsonb_build_object(
      'id', gen_random_uuid()::text,
      'title', '',
      'content', ownership_note,
      'createdAt', now()
    ))
  END;

ALTER TABLE job_postings
  ALTER COLUMN ownership_note SET DEFAULT '[]'::jsonb;
