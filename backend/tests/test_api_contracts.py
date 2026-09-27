from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_auth_session_stub_returns_placeholder_payload():
    response = client.post(
        "/api/auth/session",
        json={"email": "user@example.com", "name": "Test User", "userId": "u-123"},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "pending"
    assert payload["provider"] == "local-backend"
    assert payload["sessionId"] is None
    assert payload["user"]["id"] == "u-123"


def test_live_token_requires_session_id():
    response = client.post(
        "/api/live/token",
        json={"sessionId": "", "model": "models/gemini-3.8-live"},
    )

    assert response.status_code == 401
    assert response.json()["error"]["code"] == "session_required"


def test_history_conversations_returns_empty_list():
    response = client.get("/api/history/conversations")

    assert response.status_code == 200
    assert response.json() == []
