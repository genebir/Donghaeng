from typing import Literal
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


class OAuthExchangeIn(BaseModel):
    """NextAuth가 OAuth 검증을 마친 뒤 백엔드로 넘기는 프로필.

    Phase 0에서는 이 호출이 NextAuth 서버 → FastAPI 서버로 일어난다고 가정하고
    body의 (provider, subject) 쌍을 신뢰. 추후 NextAuth 시크릿 공유로 강화 예정.
    """

    provider: Literal["kakao", "google"]
    subject: str = Field(min_length=1, max_length=255)
    email: EmailStr
    name: str = Field(min_length=1, max_length=120)
    profile_image_url: str | None = Field(default=None, max_length=1024)


class UserPublic(BaseModel):
    id: UUID
    name: str
    email: EmailStr
    profile_image_url: str | None = None

    model_config = {"from_attributes": True}


class TokenPayload(BaseModel):
    access_token: str
    token_type: Literal["Bearer"] = "Bearer"
    expires_in: int
    user: UserPublic


class MeResponse(BaseModel):
    user: UserPublic
