"""Authentication routes."""

from fastapi import APIRouter, Depends
import aiosqlite

from app.api.deps import get_current_user_id, get_db
from app.models.schemas import MessageResponse, TokenResponse, UserRegister, UserResponse, UserLogin
from app.services.auth_service import auth_service

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=UserResponse, status_code=201)
async def register(data: UserRegister, conn: aiosqlite.Connection = Depends(get_db)) -> UserResponse:
    return await auth_service.register(conn, data)


@router.post("/login", response_model=TokenResponse)
async def login(data: UserLogin, conn: aiosqlite.Connection = Depends(get_db)) -> TokenResponse:
    return await auth_service.login(conn, data.username.lower(), data.password)


@router.get("/me", response_model=UserResponse)
async def get_me(
    user_id: int = Depends(get_current_user_id),
    conn: aiosqlite.Connection = Depends(get_db),
) -> UserResponse:
    cursor = await conn.execute("SELECT username FROM users WHERE id = ?", (user_id,))
    row = await cursor.fetchone()
    return await auth_service.get_user(conn, row["username"])

