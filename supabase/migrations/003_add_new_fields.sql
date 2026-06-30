-- Migration 003: Add work_mode, seniority, technologies, user_id
-- Split existing employment_type into work_mode + employment_type

ALTER TABLE job_postings
  ADD COLUMN IF NOT EXISTS work_mode TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS seniority TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS technologies TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS user_id UUID DEFAULT NULL;

-- Migrate existing data: move work-mode values from employment_type to work_mode
UPDATE job_postings
SET
  work_mode = CASE
    WHEN employment_type IN ('Remoto', 'Remote') THEN 'Remote'
    WHEN employment_type IN ('Híbrido', 'Hybrid') THEN 'Hybrid'
    WHEN employment_type IN ('Presencial', 'On-site') THEN 'On-site'
    ELSE ''
  END,
  employment_type = CASE
    WHEN employment_type IN ('Remoto', 'Remote', 'Híbrido', 'Hybrid', 'Presencial', 'On-site') THEN ''
    ELSE employment_type
  END;

CREATE INDEX IF NOT EXISTS idx_job_postings_user_id ON job_postings(user_id);
CREATE INDEX IF NOT EXISTS idx_job_postings_work_mode ON job_postings(work_mode);
CREATE INDEX IF NOT EXISTS idx_job_postings_seniority ON job_postings(seniority);
