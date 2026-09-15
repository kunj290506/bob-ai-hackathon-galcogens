"""Authentication and user schemas."""
from typing import Optional
from pydantic import BaseModel, EmailStr


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    username: str
    role: str
    unit: str
    clearance_level: str


class UserOut(BaseModel):
    id: int
    username: str
    email: EmailStr
    full_name: str
    role: str
    unit: str
    clearance_level: str
    is_active: bool

    class Config:
        from_attributes = True
