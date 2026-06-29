ALTER TABLE job_postings
  ADD COLUMN description TEXT NOT NULL DEFAULT '',
  ADD COLUMN recruiter_name TEXT NOT NULL DEFAULT '',
  ADD COLUMN published_at TEXT NOT NULL DEFAULT '',
  ADD COLUMN employment_type TEXT NOT NULL DEFAULT '';
