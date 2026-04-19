"""Budget Pydantic schemas."""

from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel


class BudgetCreate(BaseModel):
    """Schema for creating a budget."""
    category_id: int
    month: int
    year: int
    amount_limit: Decimal


class BudgetUpdate(BaseModel):
    """Schema for updating a budget."""
    category_id: int | None = None
    month: int | None = None
    year: int | None = None
    amount_limit: Decimal | None = None


class BudgetResponse(BaseModel):
    """Schema for budget data in responses."""
    id: int
    user_id: int
    category_id: int
    month: int
    year: int
    amount_limit: Decimal
    spent: Decimal = Decimal("0.00")
    category_name: str | None = None
    category_color: str | None = None
    category_icon: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}
