from __future__ import annotations

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import ToolExecution


class ToolExecutionRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def create(
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
    ) -> ToolExecution:
        execution = ToolExecution(
            user_id=user_id,
            conversation_id=conversation_id,
            tool_name=tool_name,
            status=status,
            arguments=arguments or {},
            result=result,
            error_message=error_message,
            duration_ms=duration_ms,
        )
        self.session.add(execution)
        await self.session.flush()
        return execution

    async def list_for_user(self, *, user_id: UUID, limit: int = 100) -> list[ToolExecution]:
        result = await self.session.execute(
            select(ToolExecution)
            .where(ToolExecution.user_id == user_id)
            .order_by(ToolExecution.started_at.desc())
            .limit(limit)
        )
        return list(result.scalars().all())

    async def list_for_conversation(self, *, conversation_id: UUID, user_id: UUID) -> list[ToolExecution]:
        result = await self.session.execute(
            select(ToolExecution)
            .where(
                ToolExecution.conversation_id == conversation_id,
                ToolExecution.user_id == user_id,
            )
            .order_by(ToolExecution.started_at.desc())
        )
        return list(result.scalars().all())
