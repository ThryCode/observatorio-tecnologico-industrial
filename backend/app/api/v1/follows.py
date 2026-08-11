from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_current_user, get_db
from app.models.user import User
from app.schemas.common import Message
from app.schemas.follow import FollowCountResponse, FollowResponse
from app.services.follow_service import FollowService

router = APIRouter(prefix="/follows", tags=["follows"])


@router.post("/{organization_id}", response_model=FollowResponse, status_code=201)
async def follow_organization(
    organization_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    follow = await FollowService(db).follow_organization(current_user.id, organization_id)
    return follow


@router.delete("/{organization_id}", response_model=Message)
async def unfollow_organization(
    organization_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await FollowService(db).unfollow_organization(current_user.id, organization_id)
    return Message(detail="Unfollowed successfully")


@router.get("/following", response_model=list[FollowResponse])
async def get_following(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await FollowService(db).list_following(current_user.id)


@router.get("/{organization_id}/status", response_model=FollowCountResponse)
async def get_follow_status(
    organization_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    data = await FollowService(db).get_follow_status(organization_id, current_user.id)
    return FollowCountResponse(**data)


@router.get("/organization/{org_id}/stats")
async def get_organization_follow_stats(
    org_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    return await FollowService(db).get_organization_follow_stats(org_id)
