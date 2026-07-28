from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AppException
from app.models.follow import Follow
from app.models.organization import Organization
from app.models.user import User


class FollowService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def follow_organization(self, user_id: UUID, organization_id: UUID) -> Follow:
        org = await self.db.get(Organization, organization_id)
        if not org:
            raise AppException(404, "Organization not found")

        user = await self.db.get(User, user_id)
        if user and user.organization_id == organization_id:
            raise AppException(400, "Cannot follow your own organization")

        existing = await self.db.execute(
            select(Follow).where(
                Follow.follower_id == user_id,
                Follow.follower_type == "user",
                Follow.organization_id == organization_id,
            )
        )
        if existing.scalar_one_or_none():
            raise AppException(409, "Already following this organization")

        follow = Follow(
            follower_id=user_id,
            follower_type="user",
            organization_id=organization_id,
        )
        self.db.add(follow)
        await self.db.flush()
        await self.db.refresh(follow)
        return follow

    async def unfollow_organization(self, user_id: UUID, organization_id: UUID) -> None:
        user = await self.db.get(User, user_id)
        if user and user.organization_id == organization_id:
            raise AppException(400, "Cannot unfollow your own organization")

        result = await self.db.execute(
            select(Follow).where(
                Follow.follower_id == user_id,
                Follow.follower_type == "user",
                Follow.organization_id == organization_id,
            )
        )
        follow = result.scalar_one_or_none()
        if not follow:
            raise AppException(404, "Not following this organization")

        await self.db.delete(follow)
        await self.db.flush()

    async def list_following(self, user_id: UUID) -> list[Follow]:
        result = await self.db.execute(
            select(Follow).where(
                Follow.follower_id == user_id,
                Follow.follower_type == "user",
            )
        )
        return list(result.scalars().all())

    async def get_follow_status(
        self, organization_id: UUID, current_user_id: UUID
    ) -> dict:
        org = await self.db.get(Organization, organization_id)
        if not org:
            raise AppException(404, "Organization not found")

        followers_count = await self.db.scalar(
            select(func.count())
            .select_from(Follow)
            .where(Follow.organization_id == organization_id)
        )

        following_count = await self.db.scalar(
            select(func.count())
            .select_from(Follow)
            .where(
                Follow.follower_id == current_user_id,
                Follow.follower_type == "user",
            )
        )

        is_following = await self.db.scalar(
            select(func.count())
            .select_from(Follow)
            .where(
                Follow.follower_id == current_user_id,
                Follow.follower_type == "user",
                Follow.organization_id == organization_id,
            )
        )

        return {
            "followers_count": followers_count or 0,
            "following_count": following_count or 0,
            "is_following": bool(is_following),
        }

    async def get_organization_follow_stats(self, org_id: UUID) -> dict:
        org = await self.db.get(Organization, org_id)
        if not org:
            raise AppException(404, "Organization not found")

        followers_count = await self.db.scalar(
            select(func.count())
            .select_from(Follow)
            .where(Follow.organization_id == org_id)
        )

        user_ids = await self.db.scalars(
            select(User.id).where(User.organization_id == org_id)
        )
        user_ids_list = list(user_ids.all())

        following_count = await self.db.scalar(
            select(func.count())
            .select_from(Follow)
            .where(
                Follow.follower_id.in_(user_ids_list),
                Follow.follower_type == "user",
            )
        ) if user_ids_list else 0

        return {"followers_count": followers_count or 0, "following_count": following_count or 0}
