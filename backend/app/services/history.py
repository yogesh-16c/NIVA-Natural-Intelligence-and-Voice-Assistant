from __future__ import annotations

from typing import Any


class HistoryService:
    async def list_conversations(self) -> list[dict[str, Any]]:
        return []

    async def list_messages(self, conversation_id: str | None = None) -> list[dict[str, Any]]:
        return []

    async def list_tool_events(self, conversation_id: str | None = None) -> list[dict[str, Any]]:
        return []

    async def add_message(self, *, conversation_id: str, role: str, content: str) -> dict[str, Any]:
        return {"conversation_id": conversation_id, "role": role, "content": content}

    async def add_tool_event(self, *, conversation_id: str, event_type: str, payload: dict[str, Any]) -> dict[str, Any]:
        return {"conversation_id": conversation_id, "event_type": event_type, "payload": payload}
