from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AppException
from app.dependencies import get_current_user, get_db
from app.models.follow import Follow
from app.models.organization import Organization
from app.schemas.common import Message
from app.schemas.follow import FollowCountResponse, FollowResponse

router = APIRouter(prefix="/follows", tags=["follows"])


@router.post("/{organization_id}", response_model=FollowResponse, status_code=201)
async def follow_organization(
    organization_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    org = await db.get(Organization, organization_id)
    if not org:
        raise AppException(404, "Organization not found")

    if current_user.organization_id == organization_id:
        raise AppException(400, "Cannot follow your own organization")

    existing = await db.execute(
        select(Follow).where(
            Follow.follower_id == current_user.id,
            Follow.follower_type == "user",
            Follow.organization_id == organization_id,
        )
    )
    if existing.scalar_one_or_none():
        raise AppException(409, "Already following this organization")

    follow = Follow(
        follower_id=current_user.id,
        follower_type="user",
        organization_id=organization_id,
    )
    db.add(follow)
    await db.flush()
    await db.refresh(follow)
    return follow


@router.delete("/{organization_id}", response_model=Message)
async def unfollow_organization(
    organization_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    if current_user.organization_id == organization_id:
        raise AppException(400, "Cannot unfollow your own organization")

    result = await db.execute(
        select(Follow).where(
            Follow.follower_id == current_user.id,
            Follow.follower_type == "user",
            Follow.organization_id == organization_id,
        )
    )
    follow = result.scalar_one_or_none()
    if not follow:
        raise AppException(404, "Not following this organization")

    await db.delete(follow)
    await db.flush()
    return Message(detail="Unfollowed successfully")


@router.get("/following", response_model=list[FollowResponse])
async def get_following(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    result = await db.execute(
        select(Follow).where(
            Follow.follower_id == current_user.id,
            Follow.follower_type == "user",
        )
    )
    return list(result.scalars().all())


@router.get("/{organization_id}/status", response_model=FollowCountResponse)
async def get_follow_status(
    organization_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    org = await db.get(Organization, organization_id)
    if not org:
        raise AppException(404, "Organization not found")

    followers_count = await db.scalar(
        select(func.count()).select_from(Follow).where(Follow.organization_id == organization_id)
    )

    following_count = await db.scalar(
        select(func.count()).select_from(Follow).where(
            Follow.follower_id == current_user.id,
            Follow.follower_type == "user",
        )
    )

    is_following = await db.scalar(
        select(func.count()).select_from(Follow).where(
            Follow.follower_id == current_user.id,
            Follow.follower_type == "user",
            Follow.organization_id == organization_id,
        )
    )

    return FollowCountResponse(
        followers_count=followers_count or 0,
        following_count=following_count or 0,
        is_following=bool(is_following),
    )


@router.get("/organization/{org_id}/stats")
async def get_organization_follow_stats(
    org_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    org = await db.get(Organization, org_id)
    if not org:
        raise AppException(404, "Organization not found")

    followers_count = await db.scalar(
        select(func.count()).select_from(Follow).where(Follow.organization_id == org_id)
    )

    following_count = await db.scalar(
        select(func.count()).select_from(Follow).where(
            Follow.follower_id == org_id,
            Follow.follower_type == "organization",
        )
    )

    return {"followers_count": followers_count or 0, "following_count": following_count or 0}
