from typing import Any, Literal

from pydantic import BaseModel, EmailStr, Field


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=12000)
    conversationId: str | None = None
    language: str | None = Field(default="en", min_length=2, max_length=10)


class ChatResponse(BaseModel):
    response: str
    conversationId: str
    metadata: dict[str, Any] = Field(default_factory=dict)


class LiveTokenRequest(BaseModel):
    sessionId: str | None = None
    model: str | None = None


class LiveTokenResponse(BaseModel):
    token: str
    expiresAt: str | None = None
    model: str
    sessionId: str | None = None
    provider: Literal["google-gemini"] = "google-gemini"


class ToolExecutionRequest(BaseModel):
    tool: str
    arguments: dict[str, Any] = Field(default_factory=dict)


class ToolExecutionResponse(BaseModel):
    success: bool
    tool: str
    result: dict[str, Any] = Field(default_factory=dict)


class AuthSessionRequest(BaseModel):
    email: str | None = None
    name: str | None = None
    userId: str | None = None


class AuthSessionResponse(BaseModel):
    status: str
    provider: str
    sessionId: str | None = None
    user: dict[str, Any] = Field(default_factory=dict)


class SignupRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)


class AuthUserResponse(BaseModel):
    id: str
    name: str
    email: str
    createdAt: int | None = None


class AuthTokenResponse(AuthUserResponse):
    accessToken: str
    tokenType: str = "bearer"
