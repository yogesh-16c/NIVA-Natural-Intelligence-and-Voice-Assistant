import logging
from datetime import UTC, datetime, timedelta
from typing import Any
from uuid import UUID

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.db.models import User
from app.repositories.user_repository import UserRepository

logger = logging.getLogger("niva.api")
security = HTTPBearer(auto_error=False)


def _hash_password(password: str) -> str:
    import bcrypt

    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def _verify_password(password: str, hashed_password: str) -> bool:
    import bcrypt

    try:
        return bcrypt.checkpw(password.encode("utf-8"), hashed_password.encode("utf-8"))
    except ValueError:
        return False


class AuthService:
    def __init__(self, session: AsyncSession | None = None) -> None:
        self.session = session

    async def create_session(self, *, email: str | None = None, name: str | None = None, user_id: str | None = None) -> dict[str, Any]:
        logger.info("Auth session creation requested for user_id=%s", user_id)
        return {
            "status": "pending",
            "provider": "local-backend",
            "sessionId": None,
            "user": {
                "id": user_id,
                "name": name,
                "email": email,
            },
        }

    async def signup(self, *, email: str, password: str, name: str) -> User:
        if not email or not password or not name:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail={"code": "invalid_signup", "message": "Email, password, and name are required."})

        repo = UserRepository(self.session)
        try:
            if await repo.get_by_email(email.lower()):
                raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail={"code": "email_taken", "message": "An account with this email already exists."})

            user = await repo.create(
                email=email.lower(),
                password_hash=_hash_password(password),
                display_name=name.strip(),
            )
            if self.session is not None:
                await self.session.flush()
            return user
        except HTTPException:
            raise
        except Exception:
            fallback_repo = UserRepository(None)
            if await fallback_repo.get_by_email(email.lower()):
                raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail={"code": "email_taken", "message": "An account with this email already exists."})
            user = await fallback_repo.create(
                email=email.lower(),
                password_hash=_hash_password(password),
                display_name=name.strip(),
            )
            return user

    async def authenticate(self, *, email: str, password: str) -> User:
        repo = UserRepository(self.session)
        try:
            user = await repo.get_by_email(email.lower())
        except Exception:
            user = await UserRepository(None).get_by_email(email.lower())

        if user is None or not _verify_password(password, user.password_hash):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail={"code": "invalid_credentials", "message": "Invalid email or password."})

        return user

    def issue_access_token(self, user: User) -> str:
        settings = get_settings()
        expires_at = datetime.now(UTC) + timedelta(minutes=settings.jwt_access_token_expire_minutes)
        payload = {
            "sub": str(user.id),
            "email": user.email,
            "name": user.display_name or user.email,
            "exp": expires_at,
        }
        return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


async def get_current_user(credentials: HTTPAuthorizationCredentials | None = Depends(security)) -> dict[str, Any]:
    settings = get_settings()
    if credentials is None or not credentials.credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail={"code": "missing_token", "message": "Authentication token is required."})

    token = credentials.credentials
    try:
        payload = jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
    except jwt.PyJWTError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail={"code": "invalid_token", "message": "The provided token is invalid or expired."}) from exc

    user_id = payload.get("sub")
    email = payload.get("email")
    name = payload.get("name")
    if not user_id or not email:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail={"code": "invalid_token", "message": "The provided token is invalid or expired."})

    created_at = payload.get("createdAt")
    return {
        "id": str(user_id),
        "email": str(email),
        "name": str(name or email),
        "createdAt": created_at,
    }


async def get_current_user_id(current_user: dict[str, Any] = Depends(get_current_user)) -> UUID:
    return UUID(current_user["id"])
