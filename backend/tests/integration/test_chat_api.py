import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_chat_endpoint_success():
    payload = {
        "messages": [
            {"role": "user", "content": "Hello AETHERION, answer with 'Ready'."}
        ],
        "context": {
            "active_file_path": "WorkoutController.java",
            "language": "springboot",
            "project_name": "TestProject"
        }
    }
    response = client.post("/api/v1/chat", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["role"] == "assistant"
    assert len(data["content"]) > 0
    assert "model" in data
