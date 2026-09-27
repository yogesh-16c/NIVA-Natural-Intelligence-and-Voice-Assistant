from __future__ import annotations

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Conversation, Message


class MessageRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

   async def create(
    self,
    *,
    conversation_id: UUID,
    role: str,
    content: str,
    metadata: dict | None = None,
) -> Message:
    message = Message(
        conversation_id=conversation_id,
        role=role,
        content=content,
        extra_metadata=metadata,
    )
    self.session.add(message)
    await self.session.flush()
    return message

    async def list_for_conversation(self, *, conversation_id: UUID, user_id: UUID) -> list[Message]:
        result = await self.session.execute(
            select(Message)
            .join(Conversation, Message.conversation_id == Conversation.id)
            .where(
                Message.conversation_id == conversation_id,
                Conversation.user_id == user_id,
            )
            .order_by(Message.created_at.asc())
        )
        return list(result.scalars().all())
