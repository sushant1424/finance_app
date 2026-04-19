"""User service — profile get, update, delete, change password."""

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import hash_password, verify_password
from app.models.user import User
from app.schemas.user import ChangePassword, UserUpdate


def get_user(user: User) -> User:
    """Return the user object (already fetched by dependency)."""
    return user


def update_user(user: User, data: UserUpdate, db: Session) -> User:
    """Update user profile fields."""
    if data.name is not None:
        user.name = data.name
    if data.email is not None:
        existing = db.query(User).filter(User.email == data.email, User.id != user.id).first()
        if existing:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already in use")
        user.email = data.email
    if data.currency is not None:
        user.currency = data.currency

    db.commit()
    db.refresh(user)
    return user


def change_password(user: User, data: ChangePassword, db: Session) -> None:
    """Change user password after verifying current password."""
    if not verify_password(data.current_password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Current password is incorrect")
    if data.new_password != data.confirm_password:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="New passwords do not match")

    user.hashed_password = hash_password(data.new_password)
    db.commit()


def delete_user(user: User, db: Session) -> None:
    """Permanently delete user and all associated data (cascade)."""
    db.delete(user)
    db.commit()
