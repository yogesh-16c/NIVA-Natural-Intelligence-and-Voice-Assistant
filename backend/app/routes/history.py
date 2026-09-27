from fastapi import APIRouter, HTTPException, Query, status

from app.services.history import HistoryService

router = APIRouter(tags=["history"])


@router.get("/history")
async def get_history_root() -> list[dict]:
    service = HistoryService()
    return await service.list_conversations()


@router.get("/history/conversations")
async def list_conversations() -> list[dict]:
    service = HistoryService()
    return await service.list_conversations()


@router.get("/history/conversations/{conversation_id}/messages")
async def list_messages(conversation_id: str) -> list[dict]:
    service = HistoryService()
    return await service.list_messages(conversation_id)


@router.get("/history/conversations/{conversation_id}/tool-events")
async def list_tool_events(conversation_id: str) -> list[dict]:
    service = HistoryService()
    return await service.list_tool_events(conversation_id)
