"""Common response wrapper schemas."""

from typing import Any, Generic, TypeVar
from pydantic import BaseModel

T = TypeVar("T")


class APIResponse(BaseModel):
    """Standard API response wrapper."""
    success: bool = True
    message: str = "Success"
    data: Any = None


class PaginatedResponse(BaseModel):
    """Paginated list response."""
    success: bool = True
    message: str = "Success"
    data: list[Any] = []
    total: int = 0
    page: int = 1
    limit: int = 10
    total_pages: int = 0
