import uuid

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest.mark.asyncio
async def test_create_debug_session_success():
    payload = {
        "title": "Bug in average calculation",
        "language": "python",
        "files": [
            {
                "filename": "main.py",
                "content": "def calculate_average(nums):\n    return sum(nums) / len(nums)\n",
            }
        ],
        "task_description": "Fix ZeroDivisionError when nums is empty",
        "max_repair_attempts": 2,
    }

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post("/api/v1/debug/sessions", json=payload)

    assert response.status_code == 201
    data = response.json()
    assert "id" in data
    assert data["status"] == "queued"
    assert data["language"] == "python"
    assert len(data["files"]) == 1
    assert data["files"][0]["filename"] == "main.py"
    session_id = data["id"]

    # Now retrieve session
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        get_res = await ac.get(f"/api/v1/debug/sessions/{session_id}")
    assert get_res.status_code == 200
    assert get_res.json()["id"] == session_id

    # Retrieve events
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        events_res = await ac.get(f"/api/v1/debug/sessions/{session_id}/events")
    assert events_res.status_code == 200
    events = events_res.json()
    assert len(events) >= 1
    assert events[0]["event_type"] == "session.created"


@pytest.mark.asyncio
async def test_path_traversal_rejected():
    payload = {
        "title": "Malicious session",
        "language": "python",
        "files": [
            {
                "filename": "../../etc/passwd",
                "content": "malicious content",
            }
        ],
    }

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post("/api/v1/debug/sessions", json=payload)

    # Path traversal should be rejected with 422 or 400
    assert response.status_code in (400, 422)


@pytest.mark.asyncio
async def test_session_not_found():
    random_id = str(uuid.uuid4())
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get(f"/api/v1/debug/sessions/{random_id}")
    assert response.status_code == 404
    assert "not found" in response.json()["message"].lower()


@pytest.mark.asyncio
async def test_report_not_yet_available():
    payload = {
        "title": "Fresh session",
        "language": "python",
        "files": [{"filename": "calc.py", "content": "x = 1"}],
    }
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        create_res = await ac.post("/api/v1/debug/sessions", json=payload)
        session_id = create_res.json()["id"]

        report_res = await ac.get(f"/api/v1/debug/sessions/{session_id}/report")
    assert report_res.status_code == 404
    assert "not yet available" in report_res.json()["message"]
