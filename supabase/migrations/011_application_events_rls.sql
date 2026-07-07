-- Migration 011: RLS on application_events.
-- The user can only SELECT their own events. No INSERT/UPDATE/DELETE
-- policies: the only writer is the SECURITY DEFINER trigger, which
-- bypasses RLS automatically.

ALTER TABLE application_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_read_own_events"
  ON application_events FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());
