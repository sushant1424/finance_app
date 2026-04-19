"""Authentication service — register, login, refresh, logout logic."""

from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import (
    create_access_token,
    generate_refresh_token,
    hash_password,
    hash_token,
    verify_password,
)
from app.models.refresh_token import RefreshToken
from app.models.user import User
from app.schemas.user import UserCreate


def register_user(data: UserCreate, db: Session) -> User:
    """Register a new user after validating input."""
    if data.password != data.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Passwords do not match",
        )

    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    user = User(
        name=data.name,
        email=data.email,
        hashed_password=hash_password(data.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def authenticate_user(email: str, password: str, db: Session) -> User:
    """Validate credentials and return the user."""
    user = db.query(User).filter(User.email == email).first()
    if not user or not verify_password(password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    return user


def create_tokens(user_id: int, db: Session) -> tuple[str, str]:
    """Create an access token and a refresh token, storing the refresh hash."""
    access_token = create_access_token(user_id)
    refresh_token = generate_refresh_token()

    db_token = RefreshToken(
        user_id=user_id,
        token_hash=hash_token(refresh_token),
        expires_at=datetime.now(timezone.utc) + timedelta(days=7),
    )
    db.add(db_token)
    db.commit()

    return access_token, refresh_token


def refresh_access_token(refresh_token_str: str, db: Session) -> tuple[str, str]:
    """Rotate refresh token and issue new access token."""
    token_hash = hash_token(refresh_token_str)
    db_token = (
        db.query(RefreshToken)
        .filter(
            RefreshToken.token_hash == token_hash,
            RefreshToken.revoked == False,
            RefreshToken.expires_at > datetime.now(timezone.utc),
        )
        .first()
    )

    if not db_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )

    # Revoke old token
    db_token.revoked = True
    db.commit()

    # Issue new pair
    return create_tokens(db_token.user_id, db)


def revoke_refresh_token(refresh_token_str: str, db: Session) -> None:
    """Revoke a refresh token (logout)."""
    token_hash = hash_token(refresh_token_str)
    db_token = (
        db.query(RefreshToken)
        .filter(RefreshToken.token_hash == token_hash)
        .first()
    )
    if db_token:
        db_token.revoked = True
        db.commit()
