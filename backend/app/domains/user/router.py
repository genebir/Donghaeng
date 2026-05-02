from typing import Annotated, Any
from uuid import UUID

from fastapi import APIRouter, Query
from sqlalchemy import or_, select

from app.config import get_settings
from app.deps import CurrentUser, DbSession
from app.domains.user import service
from app.domains.user.models import User
from app.domains.user.schemas import UserProfileUpdate

router = APIRouter(prefix="/users", tags=["user"])


@router.get("/me")
async def get_me(current_user: CurrentUser, db: DbSession) -> dict[str, Any]:
    settings = get_settings()
    profile = await service.get_profile(db, current_user, settings.bank_info_encryption_key)
    return {"data": profile.model_dump(mode="json")}


@router.get("/search")
async def search_users(
    q: Annotated[str, Query(min_length=1, max_length=100)],
    _current_user: CurrentUser,
    db: DbSession,
) -> dict[str, Any]:
    """이름 또는 이메일로 유저 검색 — 팀 멤버 추가 시 카카오 synthetic 이메일 우회용."""
    pattern = f"%{q}%"
    rows = (await db.execute(
        select(User)
        .where(or_(User.name.ilike(pattern), User.email.ilike(pattern)))
        .order_by(User.name)
        .limit(20)
    )).scalars().all()
    return {"data": [{"id": str(u.id), "name": u.name, "email": u.email, "profile_image_url": u.profile_image_url} for u in rows]}


@router.get("/{user_id}/bank")
async def get_user_bank(
    user_id: UUID,
    _current_user: CurrentUser,  # 인증만 필요, 팀 관리자 여부는 BFF에서 게이팅
    db: DbSession,
) -> dict[str, Any]:
    settings = get_settings()
    info = await service.get_bank_info_by_id(db, user_id, settings.bank_info_encryption_key)
    return {"data": info.model_dump(mode="json")}


@router.patch("/me")
async def update_me(
    payload: UserProfileUpdate,
    current_user: CurrentUser,
    db: DbSession,
) -> dict[str, Any]:
    settings = get_settings()
    profile = await service.update_profile(
        db, current_user, payload, settings.bank_info_encryption_key
    )
    await db.commit()
    return {"data": profile.model_dump(mode="json")}
