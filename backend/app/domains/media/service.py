from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.storage import (
    delete_object,
    generate_presigned_get,
    generate_presigned_put,
    make_storage_key,
)
from app.domains.media.models import MediaAsset, MediaKind, MediaStatus
from app.domains.media.schemas import (
    MediaAssetPublic,
    MediaPresignIn,
    MediaUpdate,
)


async def presign_upload(
    db: AsyncSession,
    team_id: UUID,
    payload: MediaPresignIn,
    *,
    uploader_user_id: UUID,
) -> tuple[MediaAsset, str]:
    """Create a PENDING MediaAsset record and return (asset, presigned_put_url)."""
    if payload.content_type.startswith("video/"):
        kind = MediaKind.VIDEO
    elif payload.content_type.startswith("image/"):
        kind = MediaKind.PHOTO
    else:
        kind = MediaKind.DOCUMENT

    asset = MediaAsset(
        team_id=team_id,
        uploader_user_id=uploader_user_id,
        status=MediaStatus.PENDING,
        kind=kind,
        filename=payload.filename,
        storage_key="",  # set after id is known
        content_type=payload.content_type,
        byte_size=payload.byte_size,
    )
    db.add(asset)
    await db.flush()  # get id

    key = make_storage_key(str(team_id), str(asset.id), payload.filename)
    asset.storage_key = key

    upload_url = generate_presigned_put(key, payload.content_type)
    await db.commit()
    await db.refresh(asset)
    return asset, upload_url


async def complete_upload(db: AsyncSession, asset: MediaAsset) -> MediaAsset:
    """Mark asset as READY after client confirms upload."""
    if asset.status != MediaStatus.PENDING:
        raise HTTPException(409, "이미 처리된 미디어입니다.")
    asset.status = MediaStatus.READY
    await db.commit()
    await db.refresh(asset)
    return asset


def _populate_view_url(asset: MediaAsset) -> MediaAssetPublic:
    pub = MediaAssetPublic.model_validate(asset)
    if asset.status == MediaStatus.READY and asset.storage_key:
        try:
            pub.view_url = generate_presigned_get(asset.storage_key)
        except Exception:
            pass
    return pub


async def list_media(
    db: AsyncSession,
    team_id: UUID,
    *,
    kind: MediaKind | None = None,
    visibility: str | None = None,
    uploader_user_id: UUID | None = None,
) -> list[MediaAssetPublic]:
    stmt = (
        select(MediaAsset)
        .where(
            MediaAsset.team_id == team_id,
            MediaAsset.status == MediaStatus.READY,
        )
        .order_by(MediaAsset.created_at.desc())
    )
    if kind:
        stmt = stmt.where(MediaAsset.kind == kind)
    if visibility:
        stmt = stmt.where(MediaAsset.visibility == visibility)
    if uploader_user_id:
        stmt = stmt.where(MediaAsset.uploader_user_id == uploader_user_id)
    assets = list((await db.execute(stmt)).scalars())
    return [_populate_view_url(a) for a in assets]


async def get_media(db: AsyncSession, media_id: UUID) -> MediaAsset | None:
    return (
        await db.execute(select(MediaAsset).where(MediaAsset.id == media_id))
    ).scalar_one_or_none()


async def update_media(
    db: AsyncSession, asset: MediaAsset, payload: MediaUpdate
) -> MediaAsset:
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(asset, k, v)
    await db.commit()
    await db.refresh(asset)
    return asset


async def delete_media(db: AsyncSession, asset: MediaAsset) -> None:
    try:
        delete_object(asset.storage_key)
    except Exception:
        pass  # best-effort S3 delete
    await db.delete(asset)
    await db.commit()
