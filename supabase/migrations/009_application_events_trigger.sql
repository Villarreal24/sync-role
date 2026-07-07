-- Migration 009: trigger that writes an application_event on every
-- INSERT or status change in job_postings.
--
-- Runs with SECURITY DEFINER so the trigger can write to
-- application_events even when the calling user only has
-- INSERT/UPDATE permission on job_postings (no INSERT policy on
-- application_events is defined — the trigger is the only writer).

CREATE OR REPLACE FUNCTION log_application_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO application_events (job_id, user_id, from_status, to_status)
    VALUES (NEW.id, NEW.user_id, NULL, NEW.status);
  ELSIF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO application_events (job_id, user_id, from_status, to_status)
    VALUES (NEW.id, NEW.user_id, OLD.status, NEW.status);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_log_application_event
AFTER INSERT OR UPDATE OF status ON job_postings
FOR EACH ROW EXECUTE FUNCTION log_application_event();
