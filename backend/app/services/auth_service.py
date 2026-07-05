"""User authentication and registration."""

import logging
from datetime import datetime

import aiosqlite

from app.core.exceptions import AppError, AuthenticationError
from app.core.security import create_access_token, hash_password, verify_password
from app.models.schemas import TokenResponse, UserRegister, UserResponse

logger = logging.getLogger(__name__)


class AuthService:
    async def register(self, conn: aiosqlite.Connection, data: UserRegister) -> UserResponse:
        password_hash = hash_password(data.password)
        try:
            cursor = await conn.execute(
                """
                INSERT INTO users (username, email, password_hash)
                VALUES (?, ?, ?)
                """,
                (data.username, data.email, password_hash),
            )
            await conn.commit()
            user_id = cursor.lastrowid
            
            row_cursor = await conn.execute(
                "SELECT id, username, email, created_at FROM users WHERE id = ?",
                (user_id,),
            )
            row = await row_cursor.fetchone()
            
            logger.info("User registered: %s", data.username)
            return UserResponse(
                id=row["id"],
                username=row["username"],
                email=row["email"],
                created_at=datetime.fromisoformat(row["created_at"]),
            )
        except aiosqlite.IntegrityError as exc:
            raise AppError("Username or email already exists") from exc

    async def login(self, conn: aiosqlite.Connection, username: str, password: str) -> TokenResponse:
        cursor = await conn.execute(
            "SELECT username, password_hash FROM users WHERE username = ?",
            (username.lower(),),
        )
        row = await cursor.fetchone()

        if not row or not verify_password(password, row["password_hash"]):
            raise AuthenticationError("Invalid username or password")

        token = create_access_token(row["username"])
        logger.info("User logged in: %s", row["username"])
        return TokenResponse(access_token=token, username=row["username"])

    async def get_user(self, conn: aiosqlite.Connection, username: str) -> UserResponse:
        cursor = await conn.execute(
            "SELECT id, username, email, created_at FROM users WHERE username = ?",
            (username,),
        )
        row = await cursor.fetchone()
        if not row:
            raise AppError("User not found", status_code=404)
        return UserResponse(
            id=row["id"],
            username=row["username"],
            email=row["email"],
            created_at=datetime.fromisoformat(row["created_at"]),
        )


auth_service = AuthService()

