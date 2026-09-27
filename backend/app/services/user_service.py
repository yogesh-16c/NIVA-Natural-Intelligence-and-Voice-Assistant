from __future__ import annotations

from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.user_repository import UserRepository


class UserService:
    def __init__(self, session: AsyncSession) -> None:
        self.repo = UserRepository(session)

    async def get_user_by_id(self, user_id: UUID):
        return await self.repo.get_by_id(user_id)

    async def get_user_by_email(self, email: str):
        return await self.repo.get_by_email(email)

    async def create_user(self, *, email: str, password_hash: str, display_name: str | None = None):
        return await self.repo.create(email=email, password_hash=password_hash, display_name=display_name)

    async def update_last_login(self, user_id: UUID) -> None:
        await self.repo.update_last_login(user_id)
