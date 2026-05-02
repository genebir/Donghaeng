from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field


class OAuthExchangeIn(BaseModel):
    """NextAuth가 OAuth 검증을 마친 뒤 백엔드로 넘기는 프로필.

    Phase 0에서는 이 호출이 NextAuth 서버 → FastAPI 서버로 일어난다고 가정하고
    body의 (provider, subject) 쌍을 신뢰. 추후 NextAuth 시크릿 공유로 강화 예정.
    email은 OAuth provider가 이미 검증했으므로 str로 받음 (카카오는 미동의시 null).
    """

    provider: Literal["kakao", "google"]
    subject: str = Field(min_length=1, max_length=255)
    email: str | None = Field(default=None, max_length=254)
    name: str | None = Field(default=None, max_length=120)
    profile_image_url: str | None = Field(default=None, max_length=1024)


class UserPublic(BaseModel):
    id: UUID
    name: str
    email: str
    profile_image_url: str | None = None

    model_config = {"from_attributes": True}


class TokenPayload(BaseModel):
    access_token: str
    token_type: Literal["Bearer"] = "Bearer"
    expires_in: int
    user: UserPublic


class MeResponse(BaseModel):
    user: UserPublic
