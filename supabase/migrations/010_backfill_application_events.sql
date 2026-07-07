-- Migration 010: backfill one INSERT event per existing job.
--
-- Represents the moment the user added the job to their tracker.
-- NOT idempotent — running this twice will duplicate events. Run
-- exactly once after migrations 008 + 009.

INSERT INTO application_events (job_id, user_id, from_status, to_status, created_at)
SELECT id, user_id, NULL, status, created_at
FROM job_postings
WHERE user_id IS NOT NULL;
