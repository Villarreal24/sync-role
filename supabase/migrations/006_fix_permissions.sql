-- Migration 006: Grant base table permissions to authenticated role
-- and ensure RLS is enabled on job_postings.
--
-- PostgREST requires the authenticated role to have explicit GRANTs on tables
-- before RLS policies can filter rows. Without these grants, the role gets
-- "permission denied for table job_postings" (42501).

-- 1. Ensure RLS is enabled on job_postings
--    (migration 001 created the table but didn't enable RLS)
ALTER TABLE job_postings ENABLE ROW LEVEL SECURITY;

-- 2. Grant base DML permissions to the authenticated role
--    RLS policies (from migration 005) will then filter which rows each user sees
GRANT SELECT, INSERT, UPDATE, DELETE ON job_postings TO authenticated;

-- 3. Also grant permissions on profiles (for consistency)
--    (migration 004 already has RLS policies)
GRANT SELECT, INSERT, UPDATE ON profiles TO authenticated;
