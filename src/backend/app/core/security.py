"""
Authentication and Cryptography utilities for military-grade access control.
Uses direct bcrypt hashing and python-jose RS256 / HS256 JWT tokens.
"""

from datetime import datetime, timedelta
from typing import Any, Dict, Optional, Union
import bcrypt
from jose import jwt

from src.backend.app.core.config import settings


def hash_password(password: str) -> str:
    """Hashes a plaintext password using bcrypt with salt rounds."""
    # Truncate to 72 bytes if needed (bcrypt standard limit)
    pwd_bytes = password.encode("utf-8")[:72]
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(pwd_bytes, salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plaintext password against the stored bcrypt hash."""
    pwd_bytes = plain_password.encode("utf-8")[:72]
    hash_bytes = hashed_password.encode("utf-8")
    return bcrypt.checkpw(pwd_bytes, hash_bytes)


def create_access_token(
    subject: Union[str, Any],
    role: str,
    unit: str,
    clearance_level: str,
    expires_delta: Optional[timedelta] = None
) -> str:
    """Generates a cryptographically signed JWT access token."""
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode = {
        "exp": expire,
        "sub": str(subject),
        "role": role,
        "unit": unit,
        "clearance_level": clearance_level,
        "iat": datetime.utcnow()
    }
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str) -> Dict[str, Any]:
    """Decodes and validates a JWT token."""
    return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
