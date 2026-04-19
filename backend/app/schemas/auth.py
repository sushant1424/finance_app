"""Auth-related Pydantic schemas."""

from pydantic import BaseModel


class TokenResponse(BaseModel):
    """Response containing JWT access token."""
    access_token: str
    token_type: str = "bearer"


class LoginRequest(BaseModel):
    """Login credentials."""
    email: str
    password: str
