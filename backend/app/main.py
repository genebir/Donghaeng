import logging
from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text

from app.config import get_settings
from app.db.session import async_session_maker, engine
from app.domains.auth.router import router as auth_router
from app.domains.budget.router import router as budget_router
from app.domains.checklist.router import flat_router as checklist_flat_router
from app.domains.checklist.router import nested_router as checklist_nested_router
from app.domains.expense.router import flat_router as expense_flat_router
from app.domains.expense.router import nested_router as expense_nested_router
from app.domains.reimbursement.router import flat_router as reimbursement_flat_router
from app.domains.reimbursement.router import nested_router as reimbursement_nested_router
from app.domains.home_update.router import nested_router as home_update_nested_router
from app.domains.home_update.router import public_router as home_update_public_router
from app.domains.media.router import nested_router as media_nested_router
from app.domains.media.router import flat_router as media_flat_router
from app.domains.member.router import flat_router as member_flat_router
from app.domains.member.router import nested_router as member_nested_router
from app.domains.org.router import router as org_router
from app.domains.outreach.router import flat_router as outreach_flat_router
from app.domains.outreach.router import nested_router as outreach_nested_router
from app.domains.schedule.router import flat_router as schedule_flat_router
from app.domains.schedule.router import nested_router as schedule_nested_router
from app.domains.team.router import flat_router as team_flat_router
from app.domains.team.router import invite_router as team_invite_router
from app.domains.team.router import nested_router as team_nested_router
from app.domains.testimony.router import flat_router as testimony_flat_router
from app.domains.testimony.router import nested_router as testimony_nested_router
from app.domains.testimony.router import public_router as testimony_public_router
from app.domains.notification.router import router as notification_router
from app.domains.user.router import router as user_router

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)


@asynccontextmanager
async def lifespan(_: FastAPI) -> Any:
    yield
    await engine.dispose()


def create_app() -> FastAPI:
    settings = get_settings()

    app = FastAPI(
        title="동행 API",
        version="0.1.0",
        description="교회 아웃리치 플랫폼 백엔드",
        lifespan=lifespan,
        docs_url="/docs" if not settings.is_production else None,
        redoc_url=None,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(auth_router, prefix="/api/v1")
    app.include_router(org_router, prefix="/api/v1")
    app.include_router(outreach_nested_router, prefix="/api/v1")
    app.include_router(outreach_flat_router, prefix="/api/v1")
    app.include_router(team_nested_router, prefix="/api/v1")
    app.include_router(team_flat_router, prefix="/api/v1")
    app.include_router(team_invite_router, prefix="/api/v1")
    app.include_router(member_nested_router, prefix="/api/v1")
    app.include_router(member_flat_router, prefix="/api/v1")
    app.include_router(schedule_nested_router, prefix="/api/v1")
    app.include_router(schedule_flat_router, prefix="/api/v1")
    app.include_router(checklist_nested_router, prefix="/api/v1")
    app.include_router(checklist_flat_router, prefix="/api/v1")
    app.include_router(budget_router, prefix="/api/v1")
    app.include_router(expense_nested_router, prefix="/api/v1")
    app.include_router(expense_flat_router, prefix="/api/v1")
    app.include_router(reimbursement_nested_router, prefix="/api/v1")
    app.include_router(reimbursement_flat_router, prefix="/api/v1")
    app.include_router(home_update_nested_router, prefix="/api/v1")
    app.include_router(home_update_public_router, prefix="/api/v1")
    app.include_router(media_nested_router, prefix="/api/v1")
    app.include_router(media_flat_router, prefix="/api/v1")
    app.include_router(testimony_nested_router, prefix="/api/v1")
    app.include_router(testimony_flat_router, prefix="/api/v1")
    app.include_router(testimony_public_router, prefix="/api/v1")
    app.include_router(notification_router, prefix="/api/v1")
    app.include_router(user_router, prefix="/api/v1")

    @app.get("/healthz", tags=["meta"])
    async def healthz() -> dict[str, str]:
        return {"status": "ok"}

    @app.get("/healthz/db", tags=["meta"])
    async def healthz_db() -> JSONResponse:
        try:
            async with async_session_maker() as session:
                result = await session.execute(text("SELECT 1"))
                result.scalar_one()
            return JSONResponse({"status": "ok", "db": "ok"})
        except Exception as e:
            logger.exception("DB health check failed")
            return JSONResponse(
                {"status": "error", "db": "fail", "detail": str(e)},
                status_code=503,
            )

    return app


app = create_app()
