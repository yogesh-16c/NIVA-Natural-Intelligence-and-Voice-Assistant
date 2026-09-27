import asyncio
import logging
from typing import Any

from google import genai
from google.genai import types

from app.config import get_settings

logger = logging.getLogger("niva.api")


class GeminiService:

    @staticmethod
    def normalize_live_model_name(
        model_name: str | None,
    ) -> str:
        value = (model_name or "").strip()

        if not value:
            return "models/gemini-3.8-live"

        return (
            value
            if value.startswith("models/")
            else f"models/{value}"
        )

    def __init__(
        self,
        api_key: str | None,
        model_name: str,
        live_model_name: str,
    ) -> None:
        self.api_key = api_key
        self.model_name = model_name
        self.live_model_name = self.normalize_live_model_name(
            live_model_name
        )

        self.client = (
            genai.Client(api_key=api_key)
            if api_key
            else None
        )

    def is_configured(self) -> bool:
        return bool(self.client and self.api_key)

    async def generate_text(
        self,
        prompt: str,
        language: str | None = None,
    ) -> str:
        if not self.is_configured() or self.client is None:
            raise ValueError(
                "Gemini API key is not configured."
            )

        config = types.GenerateContentConfig(
            temperature=0.2,
            system_instruction=(
                "You are NIVA, a helpful assistant. "
                f"Respond in {language or 'English'} "
                "and be concise, factual, and safe."
            ),
        )

        last_error: Exception | None = None

        for attempt in range(3):
            try:
                response = (
                    await self.client.aio.models.generate_content(
                        model=self.model_name,
                        contents=prompt,
                        config=config,
                    )
                )

                if not getattr(response, "text", None):
                    return (
                        "I could not generate a response "
                        "from Gemini."
                    )

                return response.text

            except Exception as exc:
                last_error = exc

                logger.warning(
                    "Gemini text generation attempt %s/3 failed: %s",
                    attempt + 1,
                    exc,
                )

                if attempt < 2:
                    await asyncio.sleep(
                        1.5 * (attempt + 1)
                    )

        logger.error(
            "Gemini text generation failed after 3 attempts: %s",
            last_error,
        )

        raise last_error

    async def generate_live_token(
        self,
    ) -> dict[str, Any]:
        if not self.is_configured() or self.client is None:
            raise ValueError(
                "Gemini API key is not configured."
            )

        token_response = (
            await self.client.aio.auth_tokens.create(
                config=types.CreateAuthTokenConfig(
                    uses=1,
                    live_connect_constraints=(
                        types.LiveConnectConstraints(
                            model=self.live_model_name,
                            config=types.LiveConnectConfig(),
                        )
                    ),
                )
            )
        )

        token_value = (
            getattr(token_response, "token", None)
            or getattr(token_response, "value", None)
            or getattr(token_response, "name", None)
            or ""
        )

        expires_at = (
            getattr(
                token_response,
                "expire_time",
                None,
            )
            or getattr(
                token_response,
                "expires_at",
                None,
            )
        )

        if not token_value:
            raise ValueError(
                "Gemini auth token creation returned "
                "an empty live token."
            )

        token_payload = {
            "token": str(token_value),
            "expiresAt": expires_at,
            "model": self.live_model_name,
            "provider": "google-gemini",
        }

        logger.info(
            "Created Gemini auth token for model %s",
            self.live_model_name,
        )

        return token_payload


def get_gemini_service() -> GeminiService:
    settings = get_settings()

    return GeminiService(
        api_key=settings.gemini_api_key,
        model_name=settings.gemini_model,
        live_model_name=settings.gemini_live_model,
    )