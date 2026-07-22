import os

from fastapi import APIRouter, Depends, Request
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AppException
from app.dependencies import get_current_superuser, get_current_user, get_db
from app.models.organization import Organization
from app.models.user import User
from app.schemas.auth import LoginRequest, RegisterRequest, RejectRequest, TokenResponse
from app.schemas.common import PaginatedResponse
from app.schemas.organization import OrganizationResponse, OrganizationUpdate
from app.schemas.user import UserCreate, UserResponse, UserUpdate
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["auth"])

_testing = os.getenv("TESTING", "0") == "1"
limiter = Limiter(key_func=get_remote_address, enabled=not _testing)


@router.post("/register", response_model=UserResponse, status_code=201)
@limiter.limit("3/hour")
async def register(
    request: Request,
    data: UserCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_superuser),
):
    return await AuthService(db).register(data)


@router.post("/register/public", status_code=201)
@limiter.limit("3/hour")
async def register_public(
    request: Request,
    data: RegisterRequest,
    db: AsyncSession = Depends(get_db),
):
    await AuthService(db).register_public(data)
    return {"detail": "Registration submitted. Please wait for administrator approval."}


@router.post("/login", response_model=TokenResponse)
@limiter.limit("10/minute")
async def login(
    request: Request,
    data: LoginRequest,
    db: AsyncSession = Depends(get_db),
):
    token = await AuthService(db).authenticate(data)
    return TokenResponse(access_token=token)


@router.get("/me", response_model=UserResponse)
async def me(current_user: User = Depends(get_current_user)):
    return current_user


@router.put("/me", response_model=UserResponse)
async def update_me(
    data: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    allowed = {"full_name", "phone", "job_title"}
    for key, val in data.model_dump(exclude_unset=True).items():
        if key in allowed:
            setattr(current_user, key, val)
    await db.flush()
    await db.refresh(current_user)
    return current_user


@router.get("/me/organization", response_model=OrganizationResponse)
async def get_my_organization(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user.organization_id:
        raise AppException(404, "You are not associated with any organization")
    result = await db.execute(select(Organization).where(Organization.id == current_user.organization_id))
    org = result.scalar_one_or_none()
    if not org:
        raise AppException(404, "Organization not found")
    return org


@router.put("/me/organization", response_model=OrganizationResponse)
async def update_my_organization(
    data: OrganizationUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user.organization_id:
        raise AppException(404, "You are not associated with any organization")
    result = await db.execute(select(Organization).where(Organization.id == current_user.organization_id))
    org = result.scalar_one_or_none()
    if not org:
        raise AppException(404, "Organization not found")
    for key, val in data.model_dump(exclude_unset=True).items():
        setattr(org, key, val)
    await db.flush()
    await db.refresh(org)
    return org


@router.get("/pending", response_model=PaginatedResponse[UserResponse])
async def list_pending(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_superuser),
):
    users = await AuthService(db).list_pending()
    return PaginatedResponse(
        items=users,
        total=len(users),
        page=1,
        per_page=len(users) or 1,
        total_pages=1,
    )


@router.post("/{user_id}/approve", response_model=UserResponse)
async def approve_user(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_superuser),
):
    return await AuthService(db).approve_user(user_id, str(current_user.id))


@router.post("/{user_id}/reject", response_model=UserResponse)
async def reject_user(
    user_id: str,
    data: RejectRequest,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_superuser),
):
    return await AuthService(db).reject_user(user_id, data.reason)
