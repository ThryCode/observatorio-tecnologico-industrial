from fastapi import Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.core.security import decode_token
from app.core.exceptions import AppException
from app.models.user import User

security_scheme = HTTPBearer()


async def get_neo4j(request: Request):
    return getattr(request.app.state, "neo4j", None)


async def get_redis(request: Request):
    return getattr(request.app.state, "redis", None)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    payload = decode_token(credentials.credentials)
    if payload is None:
        raise AppException(401, "Invalid or expired token")
    user_id = payload.get("sub")
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise AppException(401, "User not found")
    return user


async def get_current_superuser(current_user: User = Depends(get_current_user)) -> User:
    if not current_user.is_superuser:
        raise AppException(403, "Admin access required")
    return current_user


def require_role(*roles: str):
    async def _require_role(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in roles:
            raise AppException(
                403,
                f"Se requiere uno de estos roles: {', '.join(roles)}",
            )
        return current_user
    return _require_role
