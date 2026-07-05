"""FastAPI application entry point."""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from slowapi.util import get_remote_address

from app.api.routes import auth, files, history, speech, translation
from app.config import get_settings
from app.core.exceptions import register_exception_handlers
from app.core.logging_config import setup_logging
from app.db.database import init_db

logger = logging.getLogger(__name__)
limiter = Limiter(key_func=get_remote_address)


@asynccontextmanager
async def lifespan(_app: FastAPI):
    setup_logging()
    await init_db()
    logger.info("Application started")
    yield
    logger.info("Application shutdown")



def create_app() -> FastAPI:
    settings = get_settings()

    app = FastAPI(
        title=settings.app_name,
        description="Multilingual speech and text translation API",
        version="2.0.0",
        lifespan=lifespan,
        docs_url="/api/docs",
        redoc_url="/api/redoc",
        openapi_url="/api/openapi.json",
    )

    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
    app.add_middleware(SlowAPIMiddleware)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    register_exception_handlers(app)

    app.include_router(auth.router, prefix="/api")
    app.include_router(translation.router, prefix="/api")
    app.include_router(speech.router, prefix="/api")
    app.include_router(files.router, prefix="/api")
    app.include_router(history.router, prefix="/api")

    @app.get("/api/health")
    @limiter.limit(f"{settings.rate_limit_per_minute}/minute")
    def health_check(request: Request):
        return {"status": "healthy", "app": settings.app_name, "version": "2.0.0"}

    return app


app = create_app()
