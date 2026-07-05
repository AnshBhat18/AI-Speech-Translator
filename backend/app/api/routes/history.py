"""History, favorites, and analytics routes."""

import aiosqlite
from fastapi import APIRouter, Depends

from app.api.deps import get_current_user_id, get_db, get_optional_user
from app.models.schemas import AnalyticsResponse, FavoriteCreate, FavoriteEntry, HistoryEntry, MessageResponse
from app.services.history_service import history_service

router = APIRouter(tags=["History & Analytics"])


@router.get("/history", response_model=list[HistoryEntry])
async def get_history(
    limit: int = 100,
    conn: aiosqlite.Connection = Depends(get_db),
    user_id: int | None = Depends(get_optional_user),
) -> list[HistoryEntry]:
    return await history_service.list_history(conn, user_id=user_id, limit=min(limit, 500))


@router.delete("/history", response_model=MessageResponse)
async def clear_history(
    conn: aiosqlite.Connection = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
) -> MessageResponse:
    count = await history_service.clear_history(conn, user_id)
    return MessageResponse(message=f"Cleared {count} history entries")


@router.get("/favorites", response_model=list[FavoriteEntry])
async def get_favorites(
    conn: aiosqlite.Connection = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
) -> list[FavoriteEntry]:
    return await history_service.list_favorites(conn, user_id)


@router.post("/favorites", response_model=FavoriteEntry, status_code=201)
async def add_favorite(
    payload: FavoriteCreate,
    conn: aiosqlite.Connection = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
) -> FavoriteEntry:
    return await history_service.add_favorite(
        conn,
        user_id,
        payload.original,
        payload.translated,
        payload.target_language,
    )


@router.delete("/favorites/{favorite_id}", response_model=MessageResponse)
async def remove_favorite(
    favorite_id: int,
    conn: aiosqlite.Connection = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
) -> MessageResponse:
    removed = await history_service.delete_favorite(conn, user_id, favorite_id)
    if not removed:
        return MessageResponse(success=False, message="Favorite not found")
    return MessageResponse(message="Favorite removed")


@router.get("/analytics", response_model=AnalyticsResponse)
async def get_analytics(
    conn: aiosqlite.Connection = Depends(get_db),
    user_id: int | None = Depends(get_optional_user),
) -> AnalyticsResponse:
    return await history_service.get_analytics(conn, user_id=user_id)

