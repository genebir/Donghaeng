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

    fallback_email = f"{payload.provider}_{payload.subject}@noemail.local"
    email = payload.email or fallback_email
    name = payload.name or payload.subject

    if user is None:
        user = User(
            email=email,
            name=name,
            profile_image_url=payload.profile_image_url,
            oauth_provider=payload.provider,
            oauth_subject=payload.subject,
        )
        db.add(user)
    else:
        user.name = name
        # 실제 이메일이 들어오면 업데이트. synthetic 주소로 덮어쓰지 않음.
        if payload.email:
            user.email = email
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
