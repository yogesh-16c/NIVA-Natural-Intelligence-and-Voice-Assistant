from __future__ import annotations

from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.conversation_repository import ConversationRepository
from app.repositories.message_repository import MessageRepository


class ChatPersistenceService:
    def __init__(self, session: AsyncSession) -> None:
        self.conversation_repo = ConversationRepository(session)
        self.message_repo = MessageRepository(session)

    async def create_conversation(self, *, user_id: UUID, title: str | None = None, metadata: dict | None = None):
        return await self.conversation_repo.create(user_id=user_id, title=title, metadata=metadata)

    async def save_message(self, *, conversation_id: UUID, user_id: UUID, role: str, content: str, metadata: dict | None = None):
        conversation = await self.conversation_repo.get_for_user(user_id=user_id, conversation_id=conversation_id)
        if conversation is None:
            raise ValueError("Conversation does not belong to the authenticated user.")
        return await self.message_repo.create(
            conversation_id=conversation_id,
            role=role,
            content=content,
            metadata=metadata,
        )

    async def ensure_conversation_access(self, *, user_id: UUID, conversation_id: UUID):
        return await self.conversation_repo.get_for_user(user_id=user_id, conversation_id=conversation_id)
