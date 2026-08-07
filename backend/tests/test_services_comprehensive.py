import pytest
from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AppException
from app.core.security import get_password_hash
from app.models.organization import Organization
from app.models.user import User, UserRole, UserStatus
from app.schemas.auth import LoginRequest, RegisterRequest
from app.schemas.user import UserCreate
from app.services.auth_service import AuthService
from app.services.base import BaseService
from app.services.follow_service import FollowService
from app.services.professional_profile_service import ProfessionalProfileService
from app.services.indicator_service import IndicatorService
from app.services.patent_service import PatentService
from app.services.technology_service import TechnologyService
from app.services.industrial_sector_service import IndustrialSectorService
from app.services.organization_service import OrganizationService
from app.services.regulation_service import RegulationService
from app.services.bulletin_service import BulletinService
from app.services.competitiveness_service import CompetitivenessService
from app.services.alert_service import AlertService
from app.services.research_publication_service import ResearchPublicationService


# --- Base Service Tests ---

@pytest.mark.asyncio
async def test_base_service_get_not_found(db_session):
    from app.models.indicator import Indicator
    svc = BaseService(Indicator, db_session)
    with pytest.raises(AppException) as exc_info:
        await svc.get(uuid4())
    assert exc_info.value.status_code == 404


@pytest.mark.asyncio
async def test_base_service_create_and_delete(db_session):
    from app.models.indicator import Indicator
    from app.schemas.indicator import IndicatorCreate
    svc = BaseService(Indicator, db_session)

    data = IndicatorCreate(
        name="Test", code="TST001", unit="units",
        value=10, source="test", period="monthly",
    )
    obj = await svc.create(data)
    assert obj.code == "TST001"

    await svc.delete(obj.id)
    with pytest.raises(AppException):
        await svc.get(obj.id)


@pytest.mark.asyncio
async def test_base_service_update(db_session):
    from app.models.indicator import Indicator
    from app.schemas.indicator import IndicatorCreate, IndicatorUpdate
    svc = BaseService(Indicator, db_session)

    data = IndicatorCreate(
        name="Test", code="UPD001", unit="units",
        value=10, source="test", period="monthly",
    )
    obj = await svc.create(data)

    update = IndicatorUpdate(name="Updated")
    updated = await svc.update(obj.id, update)
    assert updated.name == "Updated"


@pytest.mark.asyncio
async def test_base_service_paginate(db_session):
    from app.models.indicator import Indicator
    from app.schemas.indicator import IndicatorCreate
    from sqlalchemy import func
    svc = BaseService(Indicator, db_session)

    for i in range(5):
        data = IndicatorCreate(
            name=f"Ind {i}", code=f"PAG{i:03d}", unit="u",
            value=i, source="src", period="monthly",
        )
        await svc.create(data)

    count_q = select(func.count()).select_from(Indicator)
    list_q = select(Indicator)
    items, total = await svc._paginate(count_q, list_q, page=1, per_page=3)
    assert len(items) == 3
    assert total == 5


# --- Auth Service Tests ---

@pytest.mark.asyncio
async def test_auth_service_register(db_session):
    svc = AuthService(db_session)
    data = UserCreate(
        username="newuser", email="new@test.com",
        password="password123", full_name="New User",
    )
    user = await svc.register(data)
    assert user.username == "newuser"


@pytest.mark.asyncio
async def test_auth_service_register_duplicate(db_session):
    svc = AuthService(db_session)
    data = UserCreate(
        username="dupuser", email="dup@test.com",
        password="password123", full_name="Dup User",
    )
    await svc.register(data)
    with pytest.raises(AppException) as exc_info:
        await svc.register(data)
    assert exc_info.value.status_code == 409


@pytest.mark.asyncio
async def test_auth_service_authenticate(db_session):
    from app.core.security import get_password_hash
    user = User(
        username="authuser", email="auth@test.com",
        hashed_password=get_password_hash("secret"),
        full_name="Auth User", status="approved",
    )
    db_session.add(user)
    await db_session.flush()

    svc = AuthService(db_session)
    data = LoginRequest(username="authuser", password="secret")
    token = await svc.authenticate(data)
    assert token is not None


@pytest.mark.asyncio
async def test_auth_service_authenticate_invalid(db_session):
    from app.core.security import get_password_hash
    user = User(
        username="authuser2", email="auth2@test.com",
        hashed_password=get_password_hash("secret"),
        full_name="Auth User", status="approved",
    )
    db_session.add(user)
    await db_session.flush()

    svc = AuthService(db_session)
    data = LoginRequest(username="authuser2", password="wrong")
    with pytest.raises(AppException) as exc_info:
        await svc.authenticate(data)
    assert exc_info.value.status_code == 401


@pytest.mark.asyncio
async def test_auth_service_approve_user(db_session):
    from app.core.security import get_password_hash
    admin = User(
        username="admin_approver", email="admin_approver@test.com",
        hashed_password=get_password_hash("password123"),
        full_name="Admin Approver", status="approved",
        role="admin_mindus", is_superuser=True,
    )
    db_session.add(admin)
    await db_session.flush()

    user = User(
        username="pend_user", email="pend@test.com",
        hashed_password=get_password_hash("password123"),
        full_name="Pend User", status="pending",
    )
    db_session.add(user)
    await db_session.flush()

    svc = AuthService(db_session)
    approved = await svc.approve_user(str(user.id), str(admin.id))
    assert approved.status == "approved"
    assert str(approved.approved_by) == str(admin.id)


@pytest.mark.asyncio
async def test_auth_service_reject_user(db_session):
    from app.core.security import get_password_hash
    user = User(
        username="rej_user", email="rej@test.com",
        hashed_password=get_password_hash("pass"),
        full_name="Rej User", status="pending",
    )
    db_session.add(user)
    await db_session.flush()

    svc = AuthService(db_session)
    rejected = await svc.reject_user(str(user.id), "Not qualified")
    assert rejected.status == "rejected"
    assert rejected.rejection_reason == "Not qualified"


@pytest.mark.asyncio
async def test_auth_service_list_pending(db_session):
    from app.core.security import get_password_hash
    for i in range(3):
        user = User(
            username=f"pending{i}", email=f"pend{i}@test.com",
            hashed_password=get_password_hash("pass"),
            full_name=f"Pending {i}", status="pending",
        )
        db_session.add(user)
    await db_session.flush()

    svc = AuthService(db_session)
    users, total = await svc.list_pending(1, 10)
    assert total == 3
    assert len(users) == 3


# --- Follow Service Tests ---

@pytest.mark.asyncio
async def test_follow_service_follow_and_unfollow(db_session):
    from app.core.seed_data import seed_all
    await seed_all(db_session)

    result = await db_session.execute(select(Organization).limit(1))
    org = result.scalar_one_or_none()

    user = User(
        username="follow_user", email="follow@test.com",
        hashed_password="x", full_name="Follow User",
        organization_id=None,
    )
    db_session.add(user)
    await db_session.flush()

    svc = FollowService(db_session)
    follow = await svc.follow_organization(user.id, org.id)
    assert follow is not None

    with pytest.raises(AppException) as exc_info:
        await svc.follow_organization(user.id, org.id)
    assert exc_info.value.status_code == 409

    following = await svc.list_following(user.id)
    assert len(following) == 1

    await svc.unfollow_organization(user.id, org.id)
    following = await svc.list_following(user.id)
    assert len(following) == 0


@pytest.mark.asyncio
async def test_follow_service_follow_own_org(db_session):
    from app.core.seed_data import seed_all
    await seed_all(db_session)

    result = await db_session.execute(select(Organization).limit(1))
    org = result.scalar_one_or_none()

    user = User(
        username="own_org_user", email="own@test.com",
        hashed_password="x", full_name="Own Org User",
        organization_id=org.id,
    )
    db_session.add(user)
    await db_session.flush()

    svc = FollowService(db_session)
    with pytest.raises(AppException) as exc_info:
        await svc.follow_organization(user.id, org.id)
    assert exc_info.value.status_code == 400


@pytest.mark.asyncio
async def test_follow_service_follow_status(db_session):
    from app.core.seed_data import seed_all
    await seed_all(db_session)

    result = await db_session.execute(select(Organization).limit(1))
    org = result.scalar_one_or_none()

    user = User(
        username="status_user", email="status@test.com",
        hashed_password="x", full_name="Status User",
    )
    db_session.add(user)
    await db_session.flush()

    svc = FollowService(db_session)
    status = await svc.get_follow_status(org.id, user.id)
    assert "followers_count" in status
    assert "following_count" in status
    assert "is_following" in status


# --- Professional Profile Service Tests ---

@pytest.mark.asyncio
async def test_professional_service_list(db_session):
    from app.core.seed_data import seed_all
    await seed_all(db_session)
    svc = ProfessionalProfileService(db_session)
    items, total = await svc.list_professionals(1, 10)
    assert isinstance(items, list)


@pytest.mark.asyncio
async def test_professional_service_specialties(db_session):
    from app.core.seed_data import seed_all
    await seed_all(db_session)
    svc = ProfessionalProfileService(db_session)
    specs = await svc.list_specialties()
    assert isinstance(specs, list)


@pytest.mark.asyncio
async def test_professional_service_get_profile_not_found(db_session):
    svc = ProfessionalProfileService(db_session)
    with pytest.raises(AppException) as exc_info:
        await svc.get_my_profile(uuid4())
    assert exc_info.value.status_code == 404


# --- Indicator Service Tests ---

@pytest.mark.asyncio
async def test_indicator_service_list(db_session):
    from app.core.seed_data import seed_all
    await seed_all(db_session)
    svc = IndicatorService(db_session)
    items, total = await svc.list(1, 10)
    assert total >= 0


# --- Patent Service Tests ---

@pytest.mark.asyncio
async def test_patent_service_list(db_session):
    from app.core.seed_data import seed_all
    await seed_all(db_session)
    svc = PatentService(db_session)
    items, total = await svc.list(1, 10)
    assert total >= 0


# --- Technology Service Tests ---

@pytest.mark.asyncio
async def test_technology_service_list(db_session):
    from app.core.seed_data import seed_all
    await seed_all(db_session)
    svc = TechnologyService(db_session)
    items, total = await svc.list(1, 10)
    assert total >= 0


# --- Industrial Sector Service Tests ---

@pytest.mark.asyncio
async def test_industrial_sector_service_list(db_session):
    from app.core.seed_data import seed_all
    await seed_all(db_session)
    svc = IndustrialSectorService(db_session)
    items, total = await svc.list(1, 10)
    assert total >= 0


# --- Organization Service Tests ---

@pytest.mark.asyncio
async def test_organization_service_list(db_session):
    from app.core.seed_data import seed_all
    await seed_all(db_session)
    svc = OrganizationService(db_session)
    items, total = await svc.list(1, 10)
    assert total >= 0


# --- Regulation Service Tests ---

@pytest.mark.asyncio
async def test_regulation_service_list(db_session):
    from app.core.seed_data import seed_all
    await seed_all(db_session)
    svc = RegulationService(db_session)
    items, total = await svc.list(1, 10)
    assert total >= 0


# --- Bulletin Service Tests ---

@pytest.mark.asyncio
async def test_bulletin_service_list(db_session):
    from app.core.seed_data import seed_all
    await seed_all(db_session)
    svc = BulletinService(db_session)
    items, total = await svc.list(1, 10)
    assert total >= 0


# --- Competitiveness Service Tests ---

@pytest.mark.asyncio
async def test_competitiveness_service_list(db_session):
    from app.core.seed_data import seed_all
    await seed_all(db_session)
    svc = CompetitivenessService(db_session)
    items, total = await svc.list(1, 10)
    assert total >= 0


# --- Alert Service Tests ---

@pytest.mark.asyncio
async def test_alert_service_list(db_session):
    from app.core.seed_data import seed_all
    await seed_all(db_session)
    svc = AlertService(db_session)
    items, total = await svc.list(1, 10)
    assert total >= 0


# --- Research Publication Service Tests ---

@pytest.mark.asyncio
async def test_research_publication_service_list(db_session):
    from app.core.seed_data import seed_all
    await seed_all(db_session)
    svc = ResearchPublicationService(db_session)
    items, total = await svc.list(1, 10)
    assert total >= 0
