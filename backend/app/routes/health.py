import logging
from typing import Any

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.config import get_settings
from app.services.gemini import GeminiService, get_gemini_service

logger = logging.getLogger("niva.api")
router = APIRouter(tags=["health"])


class HealthResponse(BaseModel):
    status: str
    service: str
    gemini_configured: bool
    model: str


class StatusResponse(BaseModel):
    app_name: str
    environment: str
    backend_url: str
    frontend_origins: list[str]
    gemini_configured: bool
    model: str
    live_model: str


@router.get("/health", response_model=HealthResponse)
async def health(gemini_service: GeminiService = Depends(get_gemini_service)) -> HealthResponse:
    logger.info("Health check requested")
    return HealthResponse(
        status="ok",
        service="niva-backend",
        gemini_configured=gemini_service.is_configured(),
        model=get_settings().gemini_model,
    )


@router.get("/status", response_model=StatusResponse)
async def status() -> StatusResponse:
    settings = get_settings()
    return StatusResponse(
        app_name=settings.app_name,
        environment=settings.environment,
        backend_url=settings.backend_url,
        frontend_origins=settings.frontend_origins,
        gemini_configured=bool(settings.gemini_api_key),
        model=settings.gemini_model,
        live_model=settings.gemini_live_model,
    )
