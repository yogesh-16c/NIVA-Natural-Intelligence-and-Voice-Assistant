from __future__ import annotations

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Conversation


class ConversationRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_for_user(self, *, user_id: UUID, conversation_id: UUID) -> Conversation | None:
        result = await self.session.execute(
            select(Conversation).where(
                Conversation.id == conversation_id,
                Conversation.user_id == user_id,
            )
        )
        return result.scalar_one_or_none()

    async def list_for_user(self, *, user_id: UUID, limit: int = 50) -> list[Conversation]:
        result = await self.session.execute(
            select(Conversation)
            .where(Conversation.user_id == user_id)
            .order_by(Conversation.updated_at.desc())
            .limit(limit)
        )
        return list(result.scalars().all())

   async def create(
    self,
    *,
    user_id: UUID,
    title: str | None = None,
    status: str = "active",
    metadata: dict | None = None,
) -> Conversation:
    conversation = Conversation(
        user_id=user_id,
        title=title,
        status=status,
        extra_metadata=metadata,
    )
    self.session.add(conversation)
    await self.session.flush()
    return conversation

    async def update_last_message(self, conversation_id: UUID) -> None:
        conversation = await self.session.get(Conversation, conversation_id)
        if conversation is not None:
            conversation.updated_at = self._now()
            conversation.last_message_at = self._now()
            await self.session.flush()

    @staticmethod
    def _now():
        from datetime import datetime, timezone

        return datetime.now(timezone.utc)
