from __future__ import annotations

from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.tool_execution_repository import ToolExecutionRepository


class ToolAuditService:
    def __init__(self, session: AsyncSession) -> None:
        self.repo = ToolExecutionRepository(session)

    async def record_execution(
        self,
        *,
        user_id: UUID,
        tool_name: str,
        status: str,
        arguments: dict | None = None,
        result: dict | None = None,
        error_message: str | None = None,
        conversation_id: UUID | None = None,
        duration_ms: int | None = None,
    ):
        return await self.repo.create(
            user_id=user_id,
            tool_name=tool_name,
            status=status,
            arguments=arguments,
            result=result,
            error_message=error_message,
            conversation_id=conversation_id,
            duration_ms=duration_ms,
        )

    async def list_for_user(self, *, user_id: UUID, limit: int = 100):
        return await self.repo.list_for_user(user_id=user_id, limit=limit)
