"""Auth routes — register, login, refresh, logout."""

from fastapi import APIRouter, Depends, Response, Request
from sqlalchemy.orm import Session

from app.core.deps import get_db
from app.schemas.auth import LoginRequest, TokenResponse
from app.schemas.common import APIResponse
from app.schemas.user import UserCreate, UserResponse
from app.services.auth_service import (
    authenticate_user,
    create_tokens,
    refresh_access_token,
    register_user,
    revoke_refresh_token,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])

REFRESH_COOKIE = "refresh_token"
COOKIE_MAX_AGE = 7 * 24 * 60 * 60  # 7 days


def _set_refresh_cookie(response: Response, token: str) -> None:
    """Set the refresh token as an httpOnly cookie."""
    response.set_cookie(
        key=REFRESH_COOKIE,
        value=token,
        httponly=True,
        secure=False,  # Set True in production with HTTPS
        samesite="lax",
        max_age=COOKIE_MAX_AGE,
        path="/",
    )


@router.post("/register")
def register(data: UserCreate, response: Response, db: Session = Depends(get_db)):
    """Register a new user and return tokens."""
    user = register_user(data, db)
    access_token, refresh_token = create_tokens(user.id, db)
    _set_refresh_cookie(response, refresh_token)

    return APIResponse(
        data={
            "user": UserResponse.model_validate(user).model_dump(),
            "access_token": access_token,
            "token_type": "bearer",
        },
        message="Registration successful",
    )


@router.post("/login")
def login(data: LoginRequest, response: Response, db: Session = Depends(get_db)):
    """Authenticate user and return tokens."""
    user = authenticate_user(data.email, data.password, db)
    access_token, refresh_token = create_tokens(user.id, db)
    _set_refresh_cookie(response, refresh_token)

    return APIResponse(
        data={
            "user": UserResponse.model_validate(user).model_dump(),
            "access_token": access_token,
            "token_type": "bearer",
        },
        message="Login successful",
    )


@router.post("/refresh")
def refresh(request: Request, response: Response, db: Session = Depends(get_db)):
    """Refresh access token using refresh token from cookie."""
    refresh_token_str = request.cookies.get(REFRESH_COOKIE)
    if not refresh_token_str:
        return APIResponse(success=False, message="No refresh token provided", data=None)

    access_token, new_refresh_token = refresh_access_token(refresh_token_str, db)
    _set_refresh_cookie(response, new_refresh_token)

    return APIResponse(
        data={"access_token": access_token, "token_type": "bearer"},
        message="Token refreshed",
    )


@router.post("/logout")
def logout(request: Request, response: Response, db: Session = Depends(get_db)):
    """Revoke refresh token and clear cookie."""
    refresh_token_str = request.cookies.get(REFRESH_COOKIE)
    if refresh_token_str:
        revoke_refresh_token(refresh_token_str, db)

    response.delete_cookie(REFRESH_COOKIE, path="/")
    return APIResponse(message="Logged out successfully")
