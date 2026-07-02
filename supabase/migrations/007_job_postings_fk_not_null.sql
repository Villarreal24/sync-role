-- Migration 007: Add FK constraint and NOT NULL on job_postings.user_id
-- Prerequisite: all orphan rows assigned a user_id
ALTER TABLE job_postings ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE job_postings ADD CONSTRAINT fk_job_postings_user
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
