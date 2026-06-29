from fastapi.testclient import TestClient

from syncRoleBackend.main import app

client = TestClient(app)


def test_health_check():
    resp = client.get("/")
    assert resp.status_code == 200
    assert resp.json() == {"message": "Welcome to ApplySync API"}


def test_get_jobs_returns_list():
    resp = client.get("/api/v1/jobs")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


def test_create_job():
    payload = {
        "title": "Test Engineer",
        "company": "TestCorp",
        "sourceUrl": "https://test.com/job",
        "status": "applied",
        "location": "Remote",
        "salary": "$100k",
        "description": "A great job",
        "recruiterName": "Jane",
        "publishedAt": "hace 2 días",
        "employmentType": "Remoto",
    }
    resp = client.post("/api/v1/jobs", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["title"] == "Test Engineer"
    assert data["company"] == "TestCorp"
    assert data["status"] == "applied"
    assert data["description"] == "A great job"
    assert data["recruiterName"] == "Jane"
    assert data["publishedAt"] == "hace 2 días"
    assert data["employmentType"] == "Remoto"
    assert "id" in data
    assert "createdAt" in data


def test_create_job_defaults():
    payload = {
        "title": "Minimal Job",
        "company": "MinCorp",
        "sourceUrl": "https://min.com",
    }
    resp = client.post("/api/v1/jobs", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "saved"
    assert data["description"] == ""
    assert data["recruiterName"] == ""
    assert data["publishedAt"] == ""
    assert data["employmentType"] == ""


def test_update_job():
    create_resp = client.post(
        "/api/v1/jobs",
        json={
            "title": "Update Me",
            "company": "UpdCorp",
            "sourceUrl": "https://upd.com",
        },
    )
    job_id = create_resp.json()["id"]

    update_resp = client.patch(
        f"/api/v1/jobs/{job_id}",
        json={"status": "interviewing"},
    )
    assert update_resp.status_code == 200
    assert update_resp.json()["status"] == "interviewing"


def test_delete_job():
    create_resp = client.post(
        "/api/v1/jobs",
        json={
            "title": "Delete Me",
            "company": "DelCorp",
            "sourceUrl": "https://del.com",
        },
    )
    job_id = create_resp.json()["id"]

    delete_resp = client.delete(f"/api/v1/jobs/{job_id}")
    assert delete_resp.status_code == 200
    assert delete_resp.json()["message"] == "Job deleted successfully"


def test_delete_nonexistent_job():
    resp = client.delete("/api/v1/jobs/00000000-0000-0000-0000-000000000000")
    assert resp.status_code == 404


def test_update_nonexistent_job():
    resp = client.patch(
        "/api/v1/jobs/00000000-0000-0000-0000-000000000000",
        json={"status": "offer"},
    )
    assert resp.status_code == 404


def test_scrape_no_openai_key():
    """Without OPENAI_API_KEY set, scrape should return 501."""
    resp = client.post(
        "/api/v1/scrape",
        json={
            "url": "https://example.com/job",
            "page_content": "Some job page content",
        },
    )
    assert resp.status_code == 501
    assert "OpenAI not configured" in resp.json()["detail"]
