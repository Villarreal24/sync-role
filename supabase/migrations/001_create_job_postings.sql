CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE job_postings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  source_url TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'saved'
    CHECK (status IN ('saved', 'applied', 'interviewing', 'rejected', 'offer')),
  location TEXT NOT NULL DEFAULT '',
  salary TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_job_postings_status ON job_postings(status);
CREATE INDEX idx_job_postings_created_at ON job_postings(created_at DESC);
