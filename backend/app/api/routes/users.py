"""User routes — profile management."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.common import APIResponse
from app.schemas.user import ChangePassword, UserResponse, UserUpdate
from app.services.user_service import change_password, delete_user, get_user, update_user

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me")
def read_current_user(user: User = Depends(get_current_user)):
    """Get current user profile."""
    return APIResponse(data=UserResponse.model_validate(user).model_dump())


@router.put("/me")
def update_current_user(
    data: UserUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update current user profile."""
    updated = update_user(user, data, db)
    return APIResponse(data=UserResponse.model_validate(updated).model_dump(), message="Profile updated")


@router.put("/me/password")
def update_password(
    data: ChangePassword,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Change current user password."""
    change_password(user, data, db)
    return APIResponse(message="Password changed successfully")


@router.delete("/me")
def delete_current_user(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete current user account and all data."""
    delete_user(user, db)
    return APIResponse(message="Account deleted successfully")
