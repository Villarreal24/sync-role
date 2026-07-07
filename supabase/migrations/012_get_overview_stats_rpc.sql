-- Migration 012: get_overview_stats(p_user_id) RPC.
-- Returns the full Overview dashboard payload in a single round-trip.
-- STABLE so Postgres can cache the plan; SECURITY DEFINER so the
-- function bypasses RLS (it filters by p_user_id explicitly).

CREATE OR REPLACE FUNCTION get_overview_stats(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_totals          JSON;
  v_funnel          JSON;
  v_top_tech        JSON;
  v_top_work_modes  JSON;
  v_top_seniorities JSON;
  v_activity        JSON;
BEGIN
  -- 1) Totals: counts by status + companies + this-week-added
  SELECT json_build_object(
    'saved',          COUNT(*) FILTER (WHERE status = 'saved'),
    'applied',        COUNT(*) FILTER (WHERE status = 'applied'),
    'interviewing',   COUNT(*) FILTER (WHERE status = 'interviewing'),
    'rejected',       COUNT(*) FILTER (WHERE status = 'rejected'),
    'offer',          COUNT(*) FILTER (WHERE status = 'offer'),
    'companies',      COUNT(DISTINCT company),
    'this_week_added', COUNT(*) FILTER (WHERE created_at >= now() - INTERVAL '7 days')
  ) INTO v_totals
  FROM job_postings
  WHERE user_id = p_user_id;

  -- 2) Funnel: percentage of jobs that advanced from each stage.
  --    "advanced out of stage X" counts every job NOT currently in X.
  SELECT json_build_object(
    'saved_to_applied',
      ROUND(100.0 *
        COUNT(*) FILTER (WHERE status IN ('applied','interviewing','rejected','offer'))::numeric
        / NULLIF(COUNT(*), 0)::numeric, 1),
    'applied_to_interviewing',
      ROUND(100.0 *
        COUNT(*) FILTER (WHERE status IN ('interviewing','offer','rejected'))::numeric
        / NULLIF(COUNT(*) FILTER (WHERE status IN ('applied','interviewing','rejected','offer')), 0)::numeric, 1),
    'interviewing_to_offer',
      ROUND(100.0 *
        COUNT(*) FILTER (WHERE status = 'offer')::numeric
        / NULLIF(COUNT(*) FILTER (WHERE status IN ('interviewing','offer','rejected')), 0)::numeric, 1)
  ) INTO v_funnel
  FROM job_postings
  WHERE user_id = p_user_id;

  -- 3) Top 5 technologies (unnest the array and count)
  SELECT COALESCE(json_agg(row ORDER BY row.count DESC), '[]'::json) INTO v_top_tech
  FROM (
    SELECT json_build_object('name', t.technology, 'count', COUNT(*)::int) AS row
    FROM job_postings, unnest(technologies) AS t(technology)
    WHERE user_id = p_user_id AND t.technology <> ''
    GROUP BY t.technology
    ORDER BY COUNT(*) DESC
    LIMIT 5
  ) sub;

  -- 4) Top 3 work_modes
  SELECT COALESCE(json_agg(row ORDER BY row.count DESC), '[]'::json) INTO v_top_work_modes
  FROM (
    SELECT json_build_object('name', work_mode, 'count', COUNT(*)::int) AS row
    FROM job_postings
    WHERE user_id = p_user_id AND work_mode <> ''
    GROUP BY work_mode
    ORDER BY COUNT(*) DESC
    LIMIT 3
  ) sub;

  -- 5) Top 3 seniorities
  SELECT COALESCE(json_agg(row ORDER BY row.count DESC), '[]'::json) INTO v_top_seniorities
  FROM (
    SELECT json_build_object('name', seniority, 'count', COUNT(*)::int) AS row
    FROM job_postings
    WHERE user_id = p_user_id AND seniority <> ''
    GROUP BY seniority
    ORDER BY COUNT(*) DESC
    LIMIT 3
  ) sub;

  -- 6) Activity: last 8 weeks. generate_series fills weeks with 0 events
  --    so the FE chart always has a continuous x-axis.
  SELECT COALESCE(json_agg(row ORDER BY row.week_start), '[]'::json) INTO v_activity
  FROM (
    SELECT
      to_char(gs.week_start, 'YYYY-MM-DD') AS week_start,
      COALESCE(COUNT(e.id), 0)::int AS count
    FROM generate_series(
      date_trunc('week', now() - INTERVAL '7 weeks'),
      date_trunc('week', now()),
      INTERVAL '1 week'
    ) AS gs(week_start)
    LEFT JOIN application_events e
      ON e.user_id = p_user_id
      AND date_trunc('week', e.created_at) = gs.week_start
    GROUP BY gs.week_start
  ) sub;

  -- 7) Final assembly
  RETURN json_build_object(
    'totals',           v_totals,
    'funnel',           v_funnel,
    'top_technologies',  v_top_tech,
    'top_work_modes',    v_top_work_modes,
    'top_seniorities',   v_top_seniorities,
    'activity',          v_activity,
    'generated_at',      to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
  );
END;
$$;

-- Only authenticated users can call the RPC, and the function
-- itself filters by p_user_id so RLS on the underlying tables is
-- effectively bypassed in a controlled, parameterized way.
GRANT EXECUTE ON FUNCTION get_overview_stats(UUID) TO authenticated;
