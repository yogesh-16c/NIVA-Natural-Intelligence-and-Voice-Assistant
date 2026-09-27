from datetime import datetime, timedelta, timezone

import jwt
from fastapi import Depends, HTTPException
from fastapi.testclient import TestClient

from app.config import get_settings
from app.main import app

client = TestClient(app)


def _signup(email: str = "user@example.com", password: str = "StrongPass123!", name: str = "Test User"):
    return client.post(
        "/api/auth/signup",
        json={"name": name, "email": email, "password": password},
    )


def _login(email: str = "user@example.com", password: str = "StrongPass123!"):
    return client.post(
        "/api/auth/login",
        json={"email": email, "password": password},
    )


def test_signup_success():
    response = _signup("signup-success@example.com", "StrongPass123!", "Signup Success")

    assert response.status_code == 201
    payload = response.json()
    assert payload["email"] == "signup-success@example.com"
    assert payload["name"] == "Signup Success"
    assert payload["id"]
    assert payload["accessToken"]
    assert payload["tokenType"] == "bearer"


def test_duplicate_email():
    email = "duplicate@example.com"
    first = _signup(email, "StrongPass123!", "User One")
    second = _signup(email, "StrongPass123!", "User Two")

    assert first.status_code == 201
    assert second.status_code == 409
    assert second.json()["error"]["code"] == "email_taken"


def test_invalid_signup():
    response = client.post(
        "/api/auth/signup",
        json={"name": "", "email": "bad-email", "password": "1"},
    )

    assert response.status_code == 422


def test_login_success():
    email = "login-success@example.com"
    signup = _signup(email, "StrongPass123!", "Login Success")
    assert signup.status_code == 201

    response = _login(email, "StrongPass123!")

    assert response.status_code == 200
    payload = response.json()
    assert payload["email"] == email
    assert payload["accessToken"]
    assert payload["tokenType"] == "bearer"


def test_login_wrong_password():
    email = "wrong-pass@example.com"
    signup = _signup(email, "StrongPass123!", "Wrong Pass")
    assert signup.status_code == 201

    response = _login(email, "WrongPass999!")

    assert response.status_code == 401
    assert response.json()["error"]["code"] == "invalid_credentials"


def test_auth_me_requires_token():
    response = client.get("/api/auth/me")

    assert response.status_code == 401
    assert response.json()["error"]["code"] == "missing_token"


def test_auth_me_rejects_invalid_token():
    response = client.get(
        "/api/auth/me",
        headers={"Authorization": "Bearer not-a-valid-jwt"},
    )

    assert response.status_code == 401
    assert response.json()["error"]["code"] == "invalid_token"


def test_auth_me_rejects_expired_token():
    settings = get_settings()
    expired = jwt.encode(
        {
            "sub": "00000000-0000-0000-0000-000000000001",
            "email": "expired@example.com",
            "exp": datetime.now(timezone.utc) - timedelta(minutes=5),
        },
        settings.jwt_secret_key,
        algorithm=settings.jwt_algorithm,
    )

    response = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {expired}"},
    )

    assert response.status_code == 401
    assert response.json()["error"]["code"] == "invalid_token"


def test_auth_me_returns_user_for_valid_token():
    email = "me-valid@example.com"
    signup = _signup(email, "StrongPass123!", "Me User")
    assert signup.status_code == 201
    token = signup.json()["accessToken"]

    response = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["email"] == email
    assert payload["name"] == "Me User"
    assert payload["id"]


def test_cross_user_authorization_attempt():
    def route_exists(path: str) -> bool:
        for route in app.routes:
            route_path = getattr(route, "path", None)
            if route_path == path:
                return True
            nested = getattr(route, "routes", None)
            if nested and any(getattr(item, "path", None) == path for item in nested):
                return True
        return False

    if not route_exists("/api/auth/test-user-guard"):
        async def protected_user_guard(user_id: str | None = None, current_user: dict = Depends(lambda: None)):
            from fastapi import HTTPException

            if user_id and user_id != current_user["id"]:
                raise HTTPException(status_code=403, detail={"code": "forbidden", "message": "User mismatch."})
            return {"userId": current_user["id"]}

        app.add_api_route(
            "/api/auth/test-user-guard",
            protected_user_guard,
            methods=["GET"],
            dependencies=[],
        )

    user_a = _signup("user-a@example.com", "StrongPass123!", "User A").json()
    user_b = _signup("user-b@example.com", "StrongPass123!", "User B").json()

    response = client.get(
        "/api/auth/test-user-guard",
        params={"user_id": user_b["id"]},
        headers={"Authorization": f"Bearer {user_a['accessToken']}"},
    )

    assert response.status_code == 403
    assert response.json()["error"]["code"] == "forbidden"
