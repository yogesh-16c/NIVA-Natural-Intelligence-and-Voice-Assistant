import logging
from datetime import datetime, timedelta, timezone

logger = logging.getLogger("niva.api")


class LiveTokenService:
    def __init__(self, gemini_service) -> None:
        self.gemini_service = gemini_service

    async def create_token(self, session_id: str | None = None, model: str | None = None) -> dict[str, str | None]:
        if not self.gemini_service.is_configured():
            raise ValueError("Gemini API key is not configured.")

        server_model = self.gemini_service.live_model_name
        if model and model != server_model:
            raise ValueError(f"Only the server-configured Live model '{server_model}' is allowed.")

        token_payload = await self.gemini_service.generate_live_token()
        resolved_model = str(token_payload.get("model") or server_model)
        logger.info("Generated ephemeral Live API token for session %s with model %s", session_id or "anonymous", resolved_model)
        return {
            "token": str(token_payload.get("token") or ""),
            "expiresAt": str(token_payload.get("expiresAt")) if token_payload.get("expiresAt") is not None else None,
            "model": resolved_model,
            "sessionId": session_id,
        }
