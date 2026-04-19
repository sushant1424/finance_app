"""Account Pydantic schemas."""

from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel


class AccountCreate(BaseModel):
    """Schema for creating an account."""
    name: str
    type: str  # bank, cash, wallet, credit
    balance: Decimal = Decimal("0.00")
    color: str = "#3B82F6"
    icon: str = "wallet"


class AccountUpdate(BaseModel):
    """Schema for updating an account."""
    name: str | None = None
    type: str | None = None
    balance: Decimal | None = None
    color: str | None = None
    icon: str | None = None
    is_active: bool | None = None


class AccountResponse(BaseModel):
    """Schema for account data in responses."""
    id: int
    user_id: int
    name: str
    type: str
    balance: Decimal
    color: str
    icon: str
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}
