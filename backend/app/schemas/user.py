"""User Pydantic schemas."""

from datetime import datetime
from pydantic import BaseModel, EmailStr


class UserCreate(BaseModel):
    """Schema for user registration."""
    name: str
    email: EmailStr
    password: str
    confirm_password: str


class UserUpdate(BaseModel):
    """Schema for updating user profile."""
    name: str | None = None
    email: EmailStr | None = None
    currency: str | None = None


class ChangePassword(BaseModel):
    """Schema for changing password."""
    current_password: str
    new_password: str
    confirm_password: str


class UserResponse(BaseModel):
    """Schema for user data in responses."""
    id: int
    name: str
    email: str
    currency: str
    created_at: datetime
    updated_at: datetime | None = None

    model_config = {"from_attributes": True}
