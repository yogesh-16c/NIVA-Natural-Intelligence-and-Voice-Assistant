import logging
import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status

from app.schemas.api import ChatRequest, ChatResponse
from app.services.gemini import GeminiService, get_gemini_service
from app.services.auth import get_current_user
logger = logging.getLogger("niva.api")
router = APIRouter(tags=["chat"])


@router.post("/chat", response_model=ChatResponse)
async def chat(
    payload: ChatRequest,
    current_user: dict = Depends(get_current_user),
    gemini_service: GeminiService = Depends(get_gemini_service),
) -> ChatResponse:
    if not gemini_service.is_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "code": "gemini_not_configured",
                "message": "Gemini API is not configured on the backend.",
            },
        )

    conversation_id = payload.conversationId or str(uuid.uuid4())

    try:
        response_text = await gemini_service.generate_text(payload.message, language=payload.language)
    except Exception as exc:  # pragma: no cover - surfaced to error middleware
        logger.exception("Gemini chat generation failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail={
                "code": "gemini_generation_failed",
                "message": "The backend could not complete the Gemini request.",
            },
        ) from exc

    return ChatResponse(
        response=response_text,
        conversationId=conversation_id,
        metadata={
            "model": gemini_service.model_name,
            "language": payload.language or "en",
            "provider": "google-gemini",
        },
    )
