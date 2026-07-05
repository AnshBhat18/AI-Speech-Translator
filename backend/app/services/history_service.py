"""Translation history, favorites, and analytics persistence."""

import logging
from collections import Counter
from datetime import datetime
from typing import List, Optional

import aiosqlite

from app.models.schemas import AnalyticsResponse, FavoriteEntry, HistoryEntry

logger = logging.getLogger(__name__)


class HistoryService:
    async def add_entry(
        self,
        conn: aiosqlite.Connection,
        original: str,
        translated: str,
        source_language: str,
        target_language: str,
        mode: str = "text",
        user_id: Optional[int] = None,
    ) -> HistoryEntry:
        cursor = await conn.execute(
            """
            INSERT INTO translation_history
            (user_id, original, translated, source_language, target_language, mode)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (user_id, original, translated, source_language, target_language, mode),
        )
        await conn.commit()
        return await self.get_entry(conn, cursor.lastrowid)

    async def get_entry(self, conn: aiosqlite.Connection, entry_id: int) -> HistoryEntry:
        cursor = await conn.execute(
            "SELECT * FROM translation_history WHERE id = ?",
            (entry_id,),
        )
        row = await cursor.fetchone()
        if not row:
            raise ValueError(f"History entry {entry_id} not found")
        return self._row_to_history(row)

    async def list_history(
        self,
        conn: aiosqlite.Connection,
        user_id: Optional[int] = None,
        limit: int = 100,
    ) -> List[HistoryEntry]:
        if user_id:
            cursor = await conn.execute(
                """
                SELECT * FROM translation_history
                WHERE user_id = ?
                ORDER BY created_at DESC
                LIMIT ?
                """,
                (user_id, limit),
            )
        else:
            cursor = await conn.execute(
                """
                SELECT * FROM translation_history
                ORDER BY created_at DESC
                LIMIT ?
                """,
                (limit,),
            )
        rows = await cursor.fetchall()
        return [self._row_to_history(row) for row in rows]

    async def clear_history(self, conn: aiosqlite.Connection, user_id: int) -> int:
        cursor = await conn.execute(
            "DELETE FROM translation_history WHERE user_id = ?",
            (user_id,),
        )
        await conn.commit()
        return cursor.rowcount

    async def add_favorite(
        self,
        conn: aiosqlite.Connection,
        user_id: int,
        original: str,
        translated: str,
        target_language: str,
    ) -> FavoriteEntry:
        cursor = await conn.execute(
            """
            INSERT INTO favorites (user_id, original, translated, target_language)
            VALUES (?, ?, ?, ?)
            """,
            (user_id, original, translated, target_language),
        )
        await conn.commit()
        
        row_cursor = await conn.execute(
            "SELECT * FROM favorites WHERE id = ?",
            (cursor.lastrowid,),
        )
        row = await row_cursor.fetchone()
        return self._row_to_favorite(row)

    async def list_favorites(self, conn: aiosqlite.Connection, user_id: int) -> List[FavoriteEntry]:
        cursor = await conn.execute(
            """
            SELECT * FROM favorites
            WHERE user_id = ?
            ORDER BY created_at DESC
            """,
            (user_id,),
        )
        rows = await cursor.fetchall()
        return [self._row_to_favorite(row) for row in rows]

    async def delete_favorite(self, conn: aiosqlite.Connection, user_id: int, favorite_id: int) -> bool:
        cursor = await conn.execute(
            "DELETE FROM favorites WHERE id = ? AND user_id = ?",
            (favorite_id, user_id),
        )
        await conn.commit()
        return cursor.rowcount > 0

    async def get_analytics(
        self,
        conn: aiosqlite.Connection,
        user_id: Optional[int] = None,
    ) -> AnalyticsResponse:
        if user_id:
            cursor = await conn.execute(
                "SELECT * FROM translation_history WHERE user_id = ?",
                (user_id,),
            )
            rows = await cursor.fetchall()
            
            fav_cursor = await conn.execute(
                "SELECT COUNT(*) as cnt FROM favorites WHERE user_id = ?",
                (user_id,),
            )
            fav_row = await fav_cursor.fetchone()
            fav_count = fav_row["cnt"]
        else:
            cursor = await conn.execute("SELECT * FROM translation_history")
            rows = await cursor.fetchall()
            
            fav_cursor = await conn.execute("SELECT COUNT(*) as cnt FROM favorites")
            fav_row = await fav_cursor.fetchone()
            fav_count = fav_row["cnt"]

        if not rows:
            return AnalyticsResponse(
                total_translations=0,
                total_favorites=fav_count,
                most_used_language=None,
                translations_by_language={},
                translations_by_mode={},
                daily_counts={},
            )

        target_langs = [row["target_language"] for row in rows]
        modes = [row["mode"] for row in rows]
        daily: Counter[str] = Counter()

        for row in rows:
            try:
                day = datetime.fromisoformat(row["created_at"]).strftime("%Y-%m-%d")
                daily[day] += 1
            except ValueError:
                continue

        lang_counts = dict(Counter(target_langs))
        mode_counts = dict(Counter(modes))
        most_used = Counter(target_langs).most_common(1)[0][0] if target_langs else None

        return AnalyticsResponse(
            total_translations=len(rows),
            total_favorites=fav_count,
            most_used_language=most_used,
            translations_by_language=lang_counts,
            translations_by_mode=mode_counts,
            daily_counts=dict(sorted(daily.items())),
        )

    @staticmethod
    def _row_to_history(row: aiosqlite.Row) -> HistoryEntry:
        return HistoryEntry(
            id=row["id"],
            user_id=row["user_id"],
            original=row["original"],
            translated=row["translated"],
            source_language=row["source_language"],
            target_language=row["target_language"],
            mode=row["mode"],
            created_at=datetime.fromisoformat(row["created_at"]),
        )

    @staticmethod
    def _row_to_favorite(row: aiosqlite.Row) -> FavoriteEntry:
        return FavoriteEntry(
            id=row["id"],
            user_id=row["user_id"],
            original=row["original"],
            translated=row["translated"],
            target_language=row["target_language"],
            created_at=datetime.fromisoformat(row["created_at"]),
        )


history_service = HistoryService()

