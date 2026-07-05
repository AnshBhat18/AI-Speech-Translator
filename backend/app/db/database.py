"""SQLite database initialization and connection management."""

import logging
from pathlib import Path
from typing import AsyncGenerator

import aiosqlite

logger = logging.getLogger(__name__)

DB_PATH = Path(__file__).resolve().parent.parent.parent / "data" / "translator.db"


def get_db_path() -> Path:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    return DB_PATH


async def get_connection() -> aiosqlite.Connection:
    conn = await aiosqlite.connect(get_db_path(), check_same_thread=False)
    conn.row_factory = aiosqlite.Row
    await conn.execute("PRAGMA foreign_keys = ON")
    return conn


async def init_db() -> None:
    conn = await get_connection()
    try:
        await conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                created_at TEXT NOT NULL DEFAULT (datetime('now'))
            );

            CREATE TABLE IF NOT EXISTS translation_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                original TEXT NOT NULL,
                translated TEXT NOT NULL,
                source_language TEXT NOT NULL,
                target_language TEXT NOT NULL,
                mode TEXT NOT NULL DEFAULT 'text',
                created_at TEXT NOT NULL DEFAULT (datetime('now')),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
            );

            CREATE TABLE IF NOT EXISTS favorites (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                original TEXT NOT NULL,
                translated TEXT NOT NULL,
                target_language TEXT NOT NULL,
                created_at TEXT NOT NULL DEFAULT (datetime('now')),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );

            CREATE INDEX IF NOT EXISTS idx_history_user ON translation_history(user_id);
            CREATE INDEX IF NOT EXISTS idx_history_created ON translation_history(created_at);
            CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);
            """
        )
        await conn.commit()
        logger.info("Database initialized at %s", get_db_path())
    finally:
        await conn.close()


async def get_db() -> AsyncGenerator[aiosqlite.Connection, None]:
    conn = await get_connection()
    try:
        yield conn
        await conn.commit()
    except Exception:
        await conn.rollback()
        raise
    finally:
        await conn.close()

