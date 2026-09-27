from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db_session
from app.schemas.api import (
    AuthSessionRequest,
    AuthSessionResponse,
    AuthTokenResponse,
    AuthUserResponse,
    LoginRequest,
    SignupRequest,
)
from app.services.auth import AuthService, get_current_user, get_current_user_id

router = APIRouter(tags=["auth"])


@router.post("/auth/session", response_model=AuthSessionResponse)
async def create_auth_session(payload: AuthSessionRequest) -> AuthSessionResponse:
    """Legacy placeholder session contract retained for compatibility with the existing frontend/tests."""
    if not (payload.userId or payload.email or payload.name):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "session_identity_required",
                "message": "At least one user identity field is required for the placeholder session contract.",
                "details": ["email", "name", "userId"],
            },
        )

    service = AuthService()
    session = await service.create_session(
        email=payload.email,
        name=payload.name,
        user_id=payload.userId,
    )

    return AuthSessionResponse(
        status=session["status"],
        provider=session["provider"],
        sessionId=session["sessionId"],
        user=session["user"],
    )


@router.post("/auth/signup", response_model=AuthTokenResponse, status_code=status.HTTP_201_CREATED)
async def signup(payload: SignupRequest, session: AsyncSession = Depends(get_db_session)) -> AuthTokenResponse:
    service = AuthService(session)
    user = await service.signup(email=payload.email, password=payload.password, name=payload.name)
    token = service.issue_access_token(user)
    return AuthTokenResponse(
        id=str(user.id),
        name=user.display_name or user.email,
        email=user.email,
        createdAt=int(user.created_at.timestamp() * 1000) if user.created_at else None,
        accessToken=token,
    )


@router.post("/auth/login", response_model=AuthTokenResponse)
async def login(payload: LoginRequest, session: AsyncSession = Depends(get_db_session)) -> AuthTokenResponse:
    service = AuthService(session)
    user = await service.authenticate(email=payload.email, password=payload.password)
    token = service.issue_access_token(user)
    return AuthTokenResponse(
        id=str(user.id),
        name=user.display_name or user.email,
        email=user.email,
        createdAt=int(user.created_at.timestamp() * 1000) if user.created_at else None,
        accessToken=token,
    )


@router.get("/auth/me", response_model=AuthUserResponse)
async def me(current_user: dict = Depends(get_current_user)) -> AuthUserResponse:
    return AuthUserResponse(
        id=str(current_user["id"]),
        name=current_user["name"],
        email=current_user["email"],
        createdAt=current_user["createdAt"],
    )


@router.get("/auth/verify")
async def verify(current_user: dict = Depends(get_current_user)):
    return {"valid": True, "user": {"id": current_user["id"], "email": current_user["email"]}}


@router.get("/auth/test-user-guard")
async def test_user_guard(user_id: str, current_user: dict = Depends(get_current_user)):
    if user_id != current_user["id"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail={"code": "forbidden", "message": "You can only access your own user resource."})
    return {"userId": current_user["id"], "email": current_user["email"]}
