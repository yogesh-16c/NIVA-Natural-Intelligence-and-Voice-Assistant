import logging

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.schemas.api import LiveTokenRequest, LiveTokenResponse
from app.services.gemini import GeminiService, get_gemini_service
from app.services.live_token import LiveTokenService
from app.services.auth import get_current_user

logger = logging.getLogger("niva.api")
router = APIRouter(tags=["live"])
security = HTTPBearer(auto_error=False)


# Production note: this live-token route must be protected by authenticated session checks
# before any public deployment. The browser never supplies the Gemini API key or model choice.
@router.post("/live/token", response_model=LiveTokenResponse)
async def create_live_token(
    payload: LiveTokenRequest,
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    gemini_service: GeminiService = Depends(get_gemini_service),
) -> LiveTokenResponse:
    if not payload.sessionId:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "code": "session_required",
                "message": "A valid session identifier is required before generating a Live token.",
                "details": ["sessionId"],
            },
        )

    if credentials is None or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "code": "missing_token",
                "message": "Authentication token is required.",
            },
        )

    await get_current_user(credentials)

    if not gemini_service.is_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "code": "gemini_not_configured",
                "message": "Gemini API is not configured on the backend.",
            },
        )

    if payload.model and payload.model != gemini_service.live_model_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "live_model_not_allowed",
                "message": f"Only the server-configured Live model '{gemini_service.live_model_name}' is allowed.",
            },
        )

    token_service = LiveTokenService(gemini_service)
    try:
        token_payload = await token_service.create_token(payload.sessionId, payload.model)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "code": "gemini_live_token_error",
                "message": str(exc),
            },
        ) from exc

    if not token_payload.get("token"):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "code": "gemini_live_token_missing",
                "message": "Gemini Live token creation succeeded but no live token was returned.",
            },
        )

    return LiveTokenResponse(
        token=str(token_payload["token"]),
        expiresAt=str(token_payload["expiresAt"]),
        model=str(token_payload["model"]),
        sessionId=str(token_payload["sessionId"]) if token_payload["sessionId"] is not None else None,
    )
