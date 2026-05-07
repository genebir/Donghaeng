from datetime import UTC, datetime
from typing import Any
from uuid import UUID

from fastapi import APIRouter, HTTPException, Request, status
from sqlalchemy import select

from app.core.permissions import TeamAccessContext, _check_team_admin, _resolve_team_membership
from app.deps import CurrentUser, DbSession
from app.domains.member.models import TeamMember, TeamRole
from app.domains.notification import service as notif_service
from app.domains.notification.models import NotificationKind
from app.domains.team.models import Team
from app.domains.testimony import service
from app.domains.testimony.models import QrToken, Testimony
from app.domains.testimony.schemas import (
    AnonymousTestimonyCreate,
    QrTokenCreate,
    QrTokenPublic,
    TestimonyCreate,
    TestimonyPublic,
    TestimonyUpdate,
    TestimonyKind,
    TestimonyVisibility,
)

# ---------------------------------------------------------------------------
# /api/v1/teams/{team_id}/testimonies  — requires TeamAccessContext
# ---------------------------------------------------------------------------
nested_router = APIRouter(
    prefix="/teams/{team_id}/testimonies",
    tags=["testimony"],
)

# ---------------------------------------------------------------------------
# /api/v1/testimonies  — requires CurrentUser
# ---------------------------------------------------------------------------
flat_router = APIRouter(
    prefix="/testimonies",
    tags=["testimony"],
)

# ---------------------------------------------------------------------------
# /api/v1/qr  — no auth (public QR form)
# ---------------------------------------------------------------------------
public_router = APIRouter(
    prefix="/qr",
    tags=["testimony-public"],
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _testimony_dict(t: Testimony) -> dict[str, Any]:
    return TestimonyPublic.model_validate(t).model_dump(mode="json")


def _qr_token_dict(q: QrToken) -> dict[str, Any]:
    return QrTokenPublic.model_validate(q).model_dump(mode="json")


async def _get_testimony(
    db: DbSession, testimony_id: UUID
) -> Testimony:
    t = (
        await db.execute(select(Testimony).where(Testimony.id == testimony_id))
    ).scalar_one_or_none()
    if t is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="간증을 찾을 수 없습니다.",
        )
    return t


def _is_token_valid(qr_token: QrToken) -> bool:
    if not qr_token.is_active:
        return False
    if qr_token.expires_at is not None:
        now = datetime.now(UTC)
        if now > qr_token.expires_at:
            return False
    return True


# ---------------------------------------------------------------------------
# nested_router endpoints
# ---------------------------------------------------------------------------

@nested_router.post("", status_code=status.HTTP_201_CREATED)
async def create_testimony(
    payload: TestimonyCreate,
    access: TeamAccessContext,
    db: DbSession,
) -> dict[str, Any]:
    testimony = await service.create_testimony(
        db, access.team.id, payload, author_user_id=access.user_id
    )
    return {"data": _testimony_dict(testimony)}


@nested_router.get("")
async def list_testimonies(
    access: TeamAccessContext,
    db: DbSession,
    kind: TestimonyKind | None = None,
    visibility: TestimonyVisibility | None = None,
) -> dict[str, Any]:
    testimonies = await service.list_testimonies(
        db, access.team.id, kind=kind, visibility=visibility
    )
    return {"data": [_testimony_dict(t) for t in testimonies]}


@nested_router.post("/qr-tokens", status_code=status.HTTP_201_CREATED)
async def create_qr_token(
    payload: QrTokenCreate,
    access: TeamAccessContext,
    db: DbSession,
) -> dict[str, Any]:
    if not access.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="팀 관리 권한이 필요합니다.",
        )
    qr_token = await service.create_qr_token(db, access.team.id, label=payload.label)
    return {"data": _qr_token_dict(qr_token)}


@nested_router.get("/qr-tokens")
async def list_qr_tokens(
    access: TeamAccessContext,
    db: DbSession,
) -> dict[str, Any]:
    if not access.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="팀 관리 권한이 필요합니다.",
        )
    qr_tokens = await service.list_qr_tokens(db, access.team.id)
    return {"data": [_qr_token_dict(q) for q in qr_tokens]}


# ---------------------------------------------------------------------------
# flat_router endpoints
# ---------------------------------------------------------------------------

@flat_router.patch("/{testimony_id}")
async def update_testimony(
    testimony_id: UUID,
    payload: TestimonyUpdate,
    user: CurrentUser,
    db: DbSession,
) -> dict[str, Any]:
    testimony = await _get_testimony(db, testimony_id)
    team, org_membership = await _resolve_team_membership(db, user, testimony.team_id)
    is_admin = await _check_team_admin(db, user.id, team, org_membership)
    is_own = testimony.submitter_user_id == user.id
    if not (is_admin or is_own):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="본인 또는 팀 관리자만 수정할 수 있습니다.",
        )
    updated = await service.update_testimony(db, testimony, payload)
    return {"data": _testimony_dict(updated)}


@flat_router.delete("/{testimony_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_testimony(
    testimony_id: UUID,
    user: CurrentUser,
    db: DbSession,
) -> None:
    testimony = await _get_testimony(db, testimony_id)
    team, org_membership = await _resolve_team_membership(db, user, testimony.team_id)
    is_admin = await _check_team_admin(db, user.id, team, org_membership)
    is_own = testimony.submitter_user_id == user.id
    if not (is_admin or is_own):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="본인 또는 팀 관리자만 삭제할 수 있습니다.",
        )
    await service.delete_testimony(db, testimony)


@flat_router.delete(
    "/qr-tokens/{token_id}", status_code=status.HTTP_204_NO_CONTENT
)
async def deactivate_qr_token(
    token_id: UUID,
    user: CurrentUser,
    db: DbSession,
) -> None:
    qr_token = (
        await db.execute(select(QrToken).where(QrToken.id == token_id))
    ).scalar_one_or_none()
    if qr_token is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="QR 토큰을 찾을 수 없습니다.",
        )
    team, org_membership = await _resolve_team_membership(db, user, qr_token.team_id)
    is_admin = await _check_team_admin(db, user.id, team, org_membership)
    if not is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="팀 관리 권한이 필요합니다.",
        )
    await service.deactivate_qr_token(db, token_id, qr_token.team_id)


# ---------------------------------------------------------------------------
# public_router endpoints
# ---------------------------------------------------------------------------

@public_router.get("/{token}")
async def get_qr_info(token: str, db: DbSession) -> dict[str, Any]:
    qr_token = await service.get_qr_token_by_token(db, token)
    if qr_token is None or not _is_token_valid(qr_token):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="유효하지 않은 QR 토큰입니다.",
        )
    team = (
        await db.execute(select(Team).where(Team.id == qr_token.team_id))
    ).scalar_one_or_none()
    if team is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="팀을 찾을 수 없습니다.",
        )
    return {
        "data": {
            "team": {
                "id": str(team.id),
                "name": team.name,
                "slug": team.slug,
                "description": team.description,
            },
            "token": {
                "id": str(qr_token.id),
                "token": qr_token.token,
                "label": qr_token.label,
            },
        }
    }


@public_router.post("/{token}/submit", status_code=status.HTTP_201_CREATED)
async def submit_anonymous_testimony(
    token: str,
    payload: AnonymousTestimonyCreate,
    db: DbSession,
) -> dict[str, Any]:
    qr_token = await service.get_qr_token_by_token(db, token)
    if qr_token is None or not _is_token_valid(qr_token):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="유효하지 않은 QR 토큰입니다.",
        )
    testimony = await service.create_anonymous_testimony(
        db, qr_token.team_id, qr_token.id, payload
    )
    # 간증 제출 시 팀 리더에게 알림
    leader_ids = list(
        (await db.execute(
            select(TeamMember.user_id).where(
                TeamMember.team_id == qr_token.team_id,
                TeamMember.role == TeamRole.LEADER,
            )
        )).scalars()
    )
    for leader_id in leader_ids:
        await notif_service.create_notification(
            db,
            recipient_user_id=leader_id,
            team_id=qr_token.team_id,
            kind=NotificationKind.TESTIMONY_NEW,
            title="새 간증/기도제목이 도착했어요",
            body=payload.content[:80] if payload.content else None,
        )
    return {"data": {"id": str(testimony.id)}}
