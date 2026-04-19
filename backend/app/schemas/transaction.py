"""Transaction Pydantic schemas."""

from datetime import date, datetime
from decimal import Decimal
from pydantic import BaseModel


class TransactionCreate(BaseModel):
    """Schema for creating a transaction."""
    amount: Decimal
    type: str  # income / expense
    category_id: int
    account_id: int
    date: date
    note: str = ""


class TransactionUpdate(BaseModel):
    """Schema for updating a transaction."""
    amount: Decimal | None = None
    type: str | None = None
    category_id: int | None = None
    account_id: int | None = None
    date: date | None = None
    note: str | None = None


class TransactionResponse(BaseModel):
    """Schema for transaction data in responses."""
    id: int
    user_id: int
    account_id: int | None
    category_id: int | None
    amount: Decimal
    type: str
    note: str
    date: date
    is_anomaly: bool
    anomaly_score: float
    created_at: datetime
    category_name: str | None = None
    category_color: str | None = None
    category_icon: str | None = None
    account_name: str | None = None

    model_config = {"from_attributes": True}
