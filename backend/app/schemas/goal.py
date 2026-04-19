"""Goal Pydantic schemas."""

from datetime import date, datetime
from decimal import Decimal
from pydantic import BaseModel


class GoalCreate(BaseModel):
    """Schema for creating a goal."""
    name: str
    target_amount: Decimal
    current_amount: Decimal = Decimal("0.00")
    deadline: date | None = None


class GoalUpdate(BaseModel):
    """Schema for updating a goal."""
    name: str | None = None
    target_amount: Decimal | None = None
    current_amount: Decimal | None = None
    deadline: date | None = None
    is_complete: bool | None = None


class GoalResponse(BaseModel):
    """Schema for goal data in responses."""
    id: int
    user_id: int
    name: str
    target_amount: Decimal
    current_amount: Decimal
    deadline: date | None
    is_complete: bool
    created_at: datetime

    model_config = {"from_attributes": True}
