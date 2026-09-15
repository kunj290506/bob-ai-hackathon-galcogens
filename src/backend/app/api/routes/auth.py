"""Authentication and user management routes."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.backend.app.api.deps import get_current_user
from src.backend.app.core.security import create_access_token, verify_password
from src.backend.app.db.base import get_db
from src.backend.app.db.models import User
from src.backend.app.schemas.auth import LoginRequest, TokenResponse, UserOut

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=TokenResponse)
async def login(req: LoginRequest, session: AsyncSession = Depends(get_db)):
    """Authenticates defense personnel and returns an RS256/HS256 JWT access token."""
    res = await session.execute(select(User).filter(User.username == req.username))
    user = res.scalars().first()

    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid defense personnel credentials"
        )

    token = create_access_token(
        subject=user.username,
        role=user.role,
        unit=user.unit,
        clearance_level=user.clearance_level
    )
    return TokenResponse(
        access_token=token,
        username=user.username,
        role=user.role,
        unit=user.unit,
        clearance_level=user.clearance_level
    )


@router.get("/me", response_model=UserOut)
async def get_me(current_user: User = Depends(get_current_user)):
    """Returns currently authenticated operator profile."""
    return current_user
