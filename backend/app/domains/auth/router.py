from typing import Any

from fastapi import APIRouter, status

from app.deps import CurrentUser, DbSession
from app.domains.auth import service
from app.domains.auth.schemas import MeResponse, OAuthExchangeIn, UserPublic

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post(
    "/oauth/exchange",
    status_code=status.HTTP_200_OK,
)
async def oauth_exchange(payload: OAuthExchangeIn, db: DbSession) -> dict[str, Any]:
    token = await service.exchange_oauth_for_token(db, payload)
    return {"data": token.model_dump()}


@router.get("/me")
async def me(current_user: CurrentUser) -> dict[str, Any]:
    response = MeResponse(user=UserPublic.model_validate(current_user))
    return {"data": response.model_dump()}
