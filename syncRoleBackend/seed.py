from datetime import datetime, timezone
from uuid import uuid4

from syncRoleBackend.database import get_supabase

SEED_JOBS = [
    {
        "title": "Senior Frontend Engineer",
        "company": "Vercel",
        "source_url": "https://vercel.com/careers/senior-frontend",
        "status": "saved",
        "location": "Remote (US)",
        "salary": "$180,000 - $220,000",
    },
    {
        "title": "Staff Backend Engineer",
        "company": "Supabase",
        "source_url": "https://supabase.com/careers/staff-backend",
        "status": "applied",
        "location": "Remote (Global)",
        "salary": "$200,000 - $250,000",
    },
    {
        "title": "Fullstack Developer (React & Python)",
        "company": "Stripe",
        "source_url": "https://stripe.com/careers/fullstack-react-python",
        "status": "interviewing",
        "location": "Remote (USA)",
        "salary": "$160,000 - $210,000",
    },
    {
        "title": "Backend Engineer (FastAPI)",
        "company": "OpenAI",
        "source_url": "https://openai.com/careers/backend-fastapi",
        "status": "interviewing",
        "location": "San Francisco, CA",
        "salary": "$200,000 - $250,000",
    },
    {
        "title": "Software Engineer (Frontend)",
        "company": "Google",
        "source_url": "https://linkedin.com/jobs/google-123",
        "status": "rejected",
        "location": "Mountain View, CA (Hybrid)",
        "salary": "$140,000 - $180,000",
    },
    {
        "title": "Platform Engineer",
        "company": "Fly.io",
        "source_url": "https://fly.io/jobs/platform-engineer",
        "status": "offer",
        "location": "Remote (Global)",
        "salary": "$170,000 - $200,000",
    },
    {
        "title": "AI/ML Engineer",
        "company": "Anthropic",
        "source_url": "https://anthropic.com/careers/ai-ml-engineer",
        "status": "saved",
        "location": "San Francisco, CA",
        "salary": "$250,000 - $350,000",
    },
    {
        "title": "DevOps Engineer",
        "company": "Railway",
        "source_url": "https://railway.app/careers/devops",
        "status": "applied",
        "location": "Remote (US)",
        "salary": "$150,000 - $180,000",
    },
    {
        "title": "Product Engineer",
        "company": "Linear",
        "source_url": "https://linear.app/careers/product-engineer",
        "status": "saved",
        "location": "Remote (Global)",
        "salary": "$160,000 - $190,000",
    },
    {
        "title": "Senior Software Engineer",
        "company": "GitHub",
        "source_url": "https://github.com/careers/senior-software-engineer",
        "status": "applied",
        "location": "Remote (US)",
        "salary": "$175,000 - $225,000",
    },
    {
        "title": "Data Engineer",
        "company": "dbt Labs",
        "source_url": "https://dbtlabs.com/careers/data-engineer",
        "status": "rejected",
        "location": "Remote (Global)",
        "salary": "$140,000 - $170,000",
    },
    {
        "title": "Engineering Manager",
        "company": "Netlify",
        "source_url": "https://netlify.com/careers/engineering-manager",
        "status": "interviewing",
        "location": "San Francisco, CA (Hybrid)",
        "salary": "$200,000 - $240,000",
    },
]


def seed_database():
    db = get_supabase()

    existing = db.table("job_postings").select("id", count="exact").execute()
    if existing.count and existing.count > 0:
        print(f"Database already has {existing.count} job(s). Skipping seed.")
        return

    now = datetime.now(timezone.utc)
    rows = []
    for i, job in enumerate(SEED_JOBS):
        created_at = now.replace(
            hour=9 + (i % 10),
            minute=(i * 7) % 60,
        ).isoformat().replace("+00:00", "Z")

        rows.append({
            "id": str(uuid4()),
            **job,
            "created_at": created_at,
        })

    result = db.table("job_postings").insert(rows).execute()
    print(f"Seeded {len(result.data)} job postings successfully.")

    for job in result.data:
        print(f"  [{job['status']:>14}] {job['title']} @ {job['company']}")


if __name__ == "__main__":
    seed_database()
