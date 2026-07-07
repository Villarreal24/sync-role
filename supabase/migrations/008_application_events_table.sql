-- Migration 008: application_events table
-- Audit log of every status transition per job. Used by the Overview
-- dashboard to compute funnel, top-N lists and the weekly activity
-- timeseries.

CREATE TABLE application_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id      UUID NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL,                              -- denormalized for fast per-user queries
  from_status TEXT CHECK (from_status IN ('saved','applied','interviewing','rejected','offer')),
  to_status   TEXT NOT NULL CHECK (to_status IN ('saved','applied','interviewing','rejected','offer')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes (one per query pattern the dashboard needs)
CREATE INDEX idx_application_events_user_created
  ON application_events (user_id, created_at DESC);     -- activity feed + backfill
CREATE INDEX idx_application_events_job_created
  ON application_events (job_id, created_at DESC);     -- future job history endpoint
CREATE INDEX idx_application_events_user_to_created
  ON application_events (user_id, to_status, created_at DESC); -- "applied this week" style filters
