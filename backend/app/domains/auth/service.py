from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import issue_access_token
from app.domains.auth.schemas import OAuthExchangeIn, TokenPayload, UserPublic
from app.domains.user.models import User


async def upsert_user_from_oauth(db: AsyncSession, payload: OAuthExchangeIn) -> User:
    stmt = select(User).where(
        User.oauth_provider == payload.provider,
        User.oauth_subject == payload.subject,
    )
    user = (await db.execute(stmt)).scalar_one_or_none()

    if user is None:
        # 동일 이메일의 기존 유저(다른 provider)와 자동 병합은 보안 이슈가 있어 새 row 생성.
        # 충돌 시 email UNIQUE에서 막힘 → 클라이언트에 안내.
        user = User(
            email=payload.email,
            name=payload.name,
            profile_image_url=payload.profile_image_url,
            oauth_provider=payload.provider,
            oauth_subject=payload.subject,
        )
        db.add(user)
    else:
        # 프로필 변동분 동기화 (이름/이미지/이메일).
        user.name = payload.name
        user.email = payload.email
        user.profile_image_url = payload.profile_image_url

    await db.flush()
    return user


async def exchange_oauth_for_token(
    db: AsyncSession, payload: OAuthExchangeIn
) -> TokenPayload:
    user = await upsert_user_from_oauth(db, payload)
    token, expires_in = issue_access_token(user.id)
    await db.commit()
    return TokenPayload(
        access_token=token,
        expires_in=expires_in,
        user=UserPublic.model_validate(user),
    )
