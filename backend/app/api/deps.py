"""FastAPI dependency injection helpers."""

from typing import Optional

import aiosqlite
from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.exceptions import AuthenticationError
from app.core.security import decode_access_token
from app.db.database import get_db
from app.services.auth_service import auth_service

security = HTTPBearer(auto_error=False)


async def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    conn: aiosqlite.Connection = Depends(get_db),
) -> Optional[int]:
    if not credentials:
        return None
    try:
        username = decode_access_token(credentials.credentials)
        user = await auth_service.get_user(conn, username)
        return user.id
    except AuthenticationError:
        return None


async def get_current_user_id(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    conn: aiosqlite.Connection = Depends(get_db),
) -> int:
    if not credentials:
        raise AuthenticationError("Authentication required")
    username = decode_access_token(credentials.credentials)
    user = await auth_service.get_user(conn, username)
    return user.id

