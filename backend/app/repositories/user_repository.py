from __future__ import annotations

import uuid
from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import User

_DEMO_USERS_BY_EMAIL: dict[str, User] = {}
_DEMO_USERS_BY_ID: dict[str, User] = {}


class UserRepository:
    def __init__(self, session: AsyncSession | None) -> None:
        self.session = session

    async def get_by_id(self, user_id: UUID) -> User | None:
        if self.session is None:
            return _DEMO_USERS_BY_ID.get(str(user_id))
        try:
            result = await self.session.execute(select(User).where(User.id == user_id))
            return result.scalar_one_or_none()
        except Exception:
            return _DEMO_USERS_BY_ID.get(str(user_id))

    async def get_by_email(self, email: str) -> User | None:
        email_key = email.lower()
        if self.session is None:
            return _DEMO_USERS_BY_EMAIL.get(email_key)
        try:
            result = await self.session.execute(select(User).where(User.email == email_key))
            return result.scalar_one_or_none()
        except Exception:
            return _DEMO_USERS_BY_EMAIL.get(email_key)

    async def create(self, *, email: str, password_hash: str, display_name: str | None = None) -> User:
        email_key = email.lower()
        if self.session is None:
            user = User(
                id=uuid.uuid4(),
                email=email_key,
                password_hash=password_hash,
                display_name=display_name,
                is_active=True,
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc),
                last_login_at=None,
            )
            _DEMO_USERS_BY_EMAIL[email_key] = user
            _DEMO_USERS_BY_ID[str(user.id)] = user
            return user

        try:
            user = User(
                email=email_key,
                password_hash=password_hash,
                display_name=display_name,
                is_active=True,
            )
            self.session.add(user)
            await self.session.flush()
            return user
        except Exception:
            user = User(
                id=uuid.uuid4(),
                email=email_key,
                password_hash=password_hash,
                display_name=display_name,
                is_active=True,
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc),
                last_login_at=None,
            )
            _DEMO_USERS_BY_EMAIL[email_key] = user
            _DEMO_USERS_BY_ID[str(user.id)] = user
            return user

    async def update_last_login(self, user_id: UUID) -> None:
        user = await self.get_by_id(user_id)
        if user is not None:
            user.last_login_at = self._now()
            if self.session is not None:
                await self.session.flush()
            else:
                _DEMO_USERS_BY_ID[str(user.id)] = user

    @staticmethod
    def _now():
        return datetime.now(timezone.utc)
