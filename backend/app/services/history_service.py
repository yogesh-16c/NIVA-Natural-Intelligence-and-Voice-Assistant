from __future__ import annotations

from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.conversation_repository import ConversationRepository
from app.repositories.message_repository import MessageRepository
from app.repositories.tool_execution_repository import ToolExecutionRepository


class HistoryService:
    def __init__(self, session: AsyncSession) -> None:
        self.conversation_repo = ConversationRepository(session)
        self.message_repo = MessageRepository(session)
        self.tool_repo = ToolExecutionRepository(session)

    async def list_conversations_for_user(self, *, user_id: UUID) -> list:
        return await self.conversation_repo.list_for_user(user_id=user_id)

    async def get_conversation_for_user(self, *, user_id: UUID, conversation_id: UUID):
        return await self.conversation_repo.get_for_user(user_id=user_id, conversation_id=conversation_id)

    async def list_messages_for_conversation(self, *, conversation_id: UUID, user_id: UUID) -> list:
        return await self.message_repo.list_for_conversation(conversation_id=conversation_id, user_id=user_id)

    async def list_tool_executions_for_conversation(self, *, conversation_id: UUID, user_id: UUID) -> list:
        return await self.tool_repo.list_for_conversation(conversation_id=conversation_id, user_id=user_id)
