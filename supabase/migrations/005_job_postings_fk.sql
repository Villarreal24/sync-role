-- Migration 005: Add FK constraint on job_postings.user_id + RLS policies
-- Prerequisite: all existing rows must have a user_id before applying NOT NULL

-- Step 1: Add ownership_note for provenance tracking
ALTER TABLE job_postings ADD COLUMN IF NOT EXISTS ownership_note TEXT NOT NULL DEFAULT '';

-- Step 2: Create RLS policies for job_postings
-- RLS is already enabled on this table (migration 001), but no policies exist.

CREATE POLICY "users_read_own_postings"
  ON job_postings FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "users_insert_own_postings"
  ON job_postings FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "users_update_own_postings"
  ON job_postings FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "users_delete_own_postings"
  ON job_postings FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Note: Service role bypasses RLS automatically — no policy needed for scrape.

-- Step 3: Handle orphan rows and add FK constraint
-- The backend will assign orphan rows to the first registered user.
-- These steps are idempotent and safe to run after orphan assignment.
-- DO NOT run step 3 until orphan rows are assigned:
--   UPDATE job_postings SET user_id = <first_user_id>, ownership_note = 'legacy_migration'
--   WHERE user_id IS NULL;

-- ALTER TABLE job_postings ALTER COLUMN user_id SET NOT NULL;
-- ALTER TABLE job_postings ADD CONSTRAINT fk_job_postings_user
--   FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
