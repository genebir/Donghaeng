from typing import Annotated, Any
from uuid import UUID

from fastapi import APIRouter, HTTPException, Query, status

from app.core.permissions import (
    TeamAccessContext,
    _check_team_admin,
    _resolve_team_membership,
)
from app.deps import CurrentUser, DbSession
from app.domains.media import service
from app.domains.media.models import MediaKind, MediaVisibility
from app.domains.media.schemas import (
    MediaAssetPublic,
    MediaPresignIn,
    MediaPresignOut,
    MediaUpdate,
)

# /api/v1/teams/{team_id}/media
nested_router = APIRouter(prefix="/teams/{team_id}/media", tags=["media"])

# /api/v1/media/{media_id}
flat_router = APIRouter(prefix="/media", tags=["media"])


@nested_router.post("/presign", status_code=status.HTTP_201_CREATED)
async def presign_upload(
    payload: MediaPresignIn,
    access: TeamAccessContext,
    db: DbSession,
) -> dict[str, Any]:
    asset, upload_url = await service.presign_upload(
        db,
        access.team.id,
        payload,
        uploader_user_id=access.user_id,
    )
    out = MediaPresignOut(
        media_id=asset.id,
        upload_url=upload_url,
    )
    return {"data": out.model_dump(mode="json")}


@nested_router.get("")
async def list_media(
    access: TeamAccessContext,
    db: DbSession,
    kind: Annotated[MediaKind | None, Query()] = None,
    visibility: Annotated[MediaVisibility | None, Query()] = None,
    uploader_user_id: Annotated[UUID | None, Query()] = None,
) -> dict[str, Any]:
    items = await service.list_media(
        db,
        access.team.id,
        kind=kind,
        visibility=visibility,
        uploader_user_id=uploader_user_id,
    )
    return {"data": [MediaAssetPublic.model_validate(i).model_dump(mode="json") for i in items]}


@flat_router.post("/{media_id}/complete")
async def complete_upload(
    media_id: UUID,
    user: CurrentUser,
    db: DbSession,
) -> dict[str, Any]:
    asset = await service.get_media(db, media_id)
    if not asset:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "미디어를 찾을 수 없습니다.")
    # Verify the caller is a team member
    await _resolve_team_membership(db, user, asset.team_id)
    updated = await service.complete_upload(db, asset)
    pub = MediaAssetPublic.model_validate(updated)
    return {"data": pub.model_dump(mode="json")}


@flat_router.patch("/{media_id}")
async def update_media(
    media_id: UUID,
    payload: MediaUpdate,
    user: CurrentUser,
    db: DbSession,
) -> dict[str, Any]:
    asset = await service.get_media(db, media_id)
    if not asset:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "미디어를 찾을 수 없습니다.")
    team, org_membership = await _resolve_team_membership(db, user, asset.team_id)
    is_admin = await _check_team_admin(db, user.id, team, org_membership)
    is_self = asset.uploader_user_id == user.id
    if not (is_admin or is_self):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "업로더 또는 팀 관리자만 수정할 수 있습니다.")
    updated = await service.update_media(db, asset, payload)
    pub = MediaAssetPublic.model_validate(updated)
    return {"data": pub.model_dump(mode="json")}


@flat_router.delete("/{media_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_media(
    media_id: UUID,
    user: CurrentUser,
    db: DbSession,
) -> None:
    asset = await service.get_media(db, media_id)
    if not asset:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "미디어를 찾을 수 없습니다.")
    team, org_membership = await _resolve_team_membership(db, user, asset.team_id)
    is_admin = await _check_team_admin(db, user.id, team, org_membership)
    is_self = asset.uploader_user_id == user.id
    if not (is_admin or is_self):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "업로더 또는 팀 관리자만 삭제할 수 있습니다.")
    await service.delete_media(db, asset)
