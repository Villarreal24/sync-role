"""Helper script to apply Supabase migration.
Opens the Supabase SQL editor URL for manual execution.

Steps:
1. Go to: https://supabase.com/dashboard/project/kicwqgyzxygujewlvxpv/sql/new
2. Paste the SQL below
3. Click "Run"
"""

MIGRATION_SQL = """\
ALTER TABLE job_postings
  ADD COLUMN IF NOT EXISTS description TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS recruiter_name TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS published_at TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS employment_type TEXT NOT NULL DEFAULT '';
"""

if __name__ == "__main__":
    print("=" * 60)
    print("Supabase Migration Helper")
    print("=" * 60)
    print()
    print("1. Open your Supabase project dashboard:")
    print("   https://supabase.com/dashboard/project/kicwqgyzxygujewlvxpv/sql/new")
    print()
    print("2. Copy and paste this SQL:")
    print()
    print(MIGRATION_SQL)
    print()
    print("3. Click 'Run' to apply the migration.")
    print("4. Run `make test` to verify all tests pass.")
