from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class FollowResponse(BaseModel):
    id: UUID
    follower_id: UUID
    follower_type: str
    organization_id: UUID
    created_at: datetime

    model_config = {"from_attributes": True}


class FollowCountResponse(BaseModel):
    followers_count: int
    following_count: int
    is_following: bool
