"""Category Pydantic schemas."""

from datetime import datetime
from pydantic import BaseModel


class CategoryCreate(BaseModel):
    """Schema for creating a category."""
    name: str
    type: str  # income / expense
    color: str = "#6366F1"
    icon: str = "tag"


class CategoryUpdate(BaseModel):
    """Schema for updating a category."""
    name: str | None = None
    type: str | None = None
    color: str | None = None
    icon: str | None = None


class CategoryResponse(BaseModel):
    """Schema for category data in responses."""
    id: int
    user_id: int
    name: str
    type: str
    color: str
    icon: str
    created_at: datetime

    model_config = {"from_attributes": True}
