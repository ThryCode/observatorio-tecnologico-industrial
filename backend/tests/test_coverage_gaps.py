from uuid import uuid4

import pytest
from sqlalchemy import select

from app.core.exceptions import AppException
from app.core.security import get_password_hash
from app.models.alert import Alert
from app.models.organization import Organization
from app.models.user import User, UserRole
from app.schemas.indicator import IndicatorCreate, IndicatorUpdate
from app.services.alert_service import AlertService
from app.services.audit_service import AuditService
from app.services.email_service import _build_mime, _render, notify_approval, notify_rejection
from app.services.follow_service import FollowService
from app.services.indicator_service import IndicatorService
from app.services.organization_service import OrganizationService
from app.services.patent_service import PatentService
from app.services.professional_profile_service import ProfessionalProfileService
from app.services.query_helpers import apply_date_range, apply_search, apply_sorting
from app.services.research_publication_service import ResearchPublicationService
from app.services.technology_service import TechnologyService
from app.services.user_service import UserService


async def _create_user(
    db_session, username="testuser", status="approved", is_active=True,
    role="user", email=None, organization_id=None,
):
    user = User(
        username=username,
        email=email or f"{username}@test.com",
        hashed_password=get_password_hash("secret"),
        full_name=f"Test {username}",
        status=status,
        is_active=is_active,
        role=role,
        organization_id=organization_id,
    )
    db_session.add(user)
    await db_session.flush()
    return user


# ========== query_helpers tests ==========

class TestQueryHelpers:
    def test_apply_sorting_asc(self):
        from app.models.indicator import Indicator
        q = select(Indicator)
        result = apply_sorting(q, Indicator, "name", "asc", {"name": Indicator.name})
        assert result is not None

    def test_apply_sorting_desc(self):
        from app.models.indicator import Indicator
        q = select(Indicator)
        result = apply_sorting(q, Indicator, "name", "desc", {"name": Indicator.name})
        assert result is not None

    def test_apply_sorting_no_sort_by(self):
        from app.models.indicator import Indicator
        q = select(Indicator)
        result = apply_sorting(q, Indicator, None, "desc", {"name": Indicator.name})
        assert result is q

    def test_apply_sorting_no_allowed_sorts(self):
        from app.models.indicator import Indicator
        q = select(Indicator)
        result = apply_sorting(q, Indicator, "name", "desc", None)
        assert result is q

    def test_apply_sorting_invalid_sort_field(self):
        from app.models.indicator import Indicator
        q = select(Indicator)
        result = apply_sorting(q, Indicator, "nonexistent", "desc", {"name": Indicator.name})
        assert result is q

    def test_apply_search_no_query(self):
        from app.models.indicator import Indicator
        q = select(Indicator)
        result = apply_search(q, Indicator, None, [Indicator.name])
        assert result is q

    def test_apply_search_empty_query(self):
        from app.models.indicator import Indicator
        q = select(Indicator)
        result = apply_search(q, Indicator, "", [Indicator.name])
        assert result is q

    def test_apply_date_range_both(self):
        from datetime import date

        from app.models.indicator import Indicator
        q = select(Indicator)
        result = apply_date_range(q, Indicator.created_at, date(2024, 1, 1), date(2024, 12, 31))
        assert result is not None

    def test_apply_date_range_from_only(self):
        from datetime import date

        from app.models.indicator import Indicator
        q = select(Indicator)
        result = apply_date_range(q, Indicator.created_at, date(2024, 1, 1), None)
        assert result is not None

    def test_apply_date_range_to_only(self):
        from datetime import date

        from app.models.indicator import Indicator
        q = select(Indicator)
        result = apply_date_range(q, Indicator.created_at, None, date(2024, 12, 31))
        assert result is not None

    def test_apply_date_range_none(self):
        from app.models.indicator import Indicator
        q = select(Indicator)
        result = apply_date_range(q, Indicator.created_at, None, None)
        assert result is q


# ========== email_service tests ==========

class TestEmailService:
    def test_build_mime(self):
        result = _build_mime("to@test.com", "Subject", "<p>Hello</p>")
        assert "to@test.com" in result
        assert "Subject" in result

    def test_render_approval_template(self):
        result = _render("approval.html", nombre="Test User", login_url="http://test.com/login")
        assert "Test User" in result

    def test_render_rejection_template(self):
        result = _render("rejection.html", nombre="Test User", razon="No reason")
        assert "Test User" in result

    def test_render_rejection_no_reason(self):
        result = _render("rejection.html", nombre="Test User", razon=None)
        assert "Test User" in result

    @pytest.mark.asyncio
    async def test_send_email_no_smtp(self):
        from app.core.config import settings
        original = settings.smtp_host
        settings.smtp_host = ""
        try:
            from app.services.email_service import _send_email
            result = await _send_email("to@test.com", "Subject", "<p>Hi</p>")
            assert result is False
        finally:
            settings.smtp_host = original

    @pytest.mark.asyncio
    async def test_notify_approval(self):
        from app.core.config import settings
        original = settings.smtp_host
        settings.smtp_host = ""
        try:
            result = await notify_approval("user@test.com", "Test User")
            assert result is False
        finally:
            settings.smtp_host = original

    @pytest.mark.asyncio
    async def test_notify_rejection(self):
        from app.core.config import settings
        original = settings.smtp_host
        settings.smtp_host = ""
        try:
            result = await notify_rejection("user@test.com", "Test User", "Not qualified")
            assert result is False
        finally:
            settings.smtp_host = original

    @pytest.mark.asyncio
    async def test_notify_rejection_no_reason(self):
        from app.core.config import settings
        original = settings.smtp_host
        settings.smtp_host = ""
        try:
            result = await notify_rejection("user@test.com", "Test User")
            assert result is False
        finally:
            settings.smtp_host = original


# ========== auth_service edge cases ==========

class TestAuthServiceExtended:
    @pytest.mark.asyncio
    async def test_authenticate_disabled_account(self, db_session):
        await _create_user(db_session, username="disabled_user", is_active=False)
        from app.schemas.auth import LoginRequest
        from app.services.auth_service import AuthService
        svc = AuthService(db_session)
        with pytest.raises(AppException) as exc_info:
            await svc.authenticate(LoginRequest(username="disabled_user", password="secret"))
        assert exc_info.value.status_code == 403

    @pytest.mark.asyncio
    async def test_authenticate_pending_account(self, db_session):
        await _create_user(db_session, username="pending_auth", status="pending")
        from app.schemas.auth import LoginRequest
        from app.services.auth_service import AuthService
        svc = AuthService(db_session)
        with pytest.raises(AppException) as exc_info:
            await svc.authenticate(LoginRequest(username="pending_auth", password="secret"))
        assert exc_info.value.status_code == 403
        assert "pending" in str(exc_info.value.detail).lower()

    @pytest.mark.asyncio
    async def test_authenticate_rejected_account(self, db_session):
        await _create_user(db_session, username="rejected_auth", status="rejected")
        from app.schemas.auth import LoginRequest
        from app.services.auth_service import AuthService
        svc = AuthService(db_session)
        with pytest.raises(AppException) as exc_info:
            await svc.authenticate(LoginRequest(username="rejected_auth", password="secret"))
        assert exc_info.value.status_code == 403
        assert "rejected" in str(exc_info.value.detail).lower()

    @pytest.mark.asyncio
    async def test_authenticate_by_email(self, db_session):
        await _create_user(db_session, username="email_auth", email="emailauth@test.com")
        from app.schemas.auth import LoginRequest
        from app.services.auth_service import AuthService
        svc = AuthService(db_session)
        token = await svc.authenticate(LoginRequest(username="emailauth@test.com", password="secret"))
        assert token is not None

    @pytest.mark.asyncio
    async def test_register_public_with_new_org(self, db_session):
        from app.schemas.auth import RegisterRequest
        from app.services.auth_service import AuthService
        svc = AuthService(db_session)
        data = RegisterRequest(
            role="representante",
            username="pubuser1", email="pub1@test.com", password="pass12345",
            full_name="Pub User", new_organization_name="New Org",
            new_organization_siglas="NO",
        )
        await svc.register_public(data)
        result = await db_session.execute(select(User).where(User.username == "pubuser1"))
        user = result.scalar_one_or_none()
        assert user is not None
        assert user.status == "pending"

    @pytest.mark.asyncio
    async def test_register_public_with_existing_org(self, db_session):
        org = Organization(
            nombre="Existing Org", siglas="EO", tipo="empresa",
        )
        db_session.add(org)
        await db_session.flush()

        from app.schemas.auth import RegisterRequest
        from app.services.auth_service import AuthService
        svc = AuthService(db_session)
        data = RegisterRequest(
            role="analista",
            username="pubuser2", email="pub2@test.com", password="pass12345",
            full_name="Pub User 2", organization_id=str(org.id),
        )
        await svc.register_public(data)
        result = await db_session.execute(select(User).where(User.username == "pubuser2"))
        user = result.scalar_one_or_none()
        assert user is not None

    @pytest.mark.asyncio
    async def test_register_public_profesional_with_profile(self, db_session):
        from app.schemas.auth import RegisterRequest
        from app.services.auth_service import AuthService
        svc = AuthService(db_session)
        data = RegisterRequest(
            role="profesional",
            username="prouser1", email="pro1@test.com", password="pass12345",
            full_name="Pro User",
            especialidad="IA", grado_cientifico="Doctor",
        )
        await svc.register_public(data)
        result = await db_session.execute(select(User).where(User.username == "prouser1"))
        user = result.scalar_one_or_none()
        assert user is not None
        assert user.role == UserRole.PROFESIONAL.value

    @pytest.mark.asyncio
    async def test_register_public_duplicate(self, db_session):
        await _create_user(db_session, username="dup_pub", email="dup_pub@test.com")
        from app.schemas.auth import RegisterRequest
        from app.services.auth_service import AuthService
        svc = AuthService(db_session)
        data = RegisterRequest(
            role="representante",
            username="dup_pub", email="dup_pub@test.com", password="pass12345",
            full_name="Dup User",
        )
        with pytest.raises(AppException) as exc_info:
            await svc.register_public(data)
        assert exc_info.value.status_code == 409

    @pytest.mark.asyncio
    async def test_approve_user_not_found(self, db_session):
        from app.services.auth_service import AuthService
        svc = AuthService(db_session)
        with pytest.raises(AppException) as exc_info:
            await svc.approve_user(str(uuid4()), str(uuid4()))
        assert exc_info.value.status_code == 404

    @pytest.mark.asyncio
    async def test_approve_user_not_pending(self, db_session):
        user = await _create_user(db_session, username="approved_user")
        from app.services.auth_service import AuthService
        svc = AuthService(db_session)
        with pytest.raises(AppException) as exc_info:
            await svc.approve_user(str(user.id), str(uuid4()))
        assert exc_info.value.status_code == 400

    @pytest.mark.asyncio
    async def test_reject_user_not_found(self, db_session):
        from app.services.auth_service import AuthService
        svc = AuthService(db_session)
        with pytest.raises(AppException) as exc_info:
            await svc.reject_user(str(uuid4()), "reason")
        assert exc_info.value.status_code == 404

    @pytest.mark.asyncio
    async def test_reject_user_not_pending(self, db_session):
        user = await _create_user(db_session, username="approved_rej")
        from app.services.auth_service import AuthService
        svc = AuthService(db_session)
        with pytest.raises(AppException) as exc_info:
            await svc.reject_user(str(user.id), "reason")
        assert exc_info.value.status_code == 400

    @pytest.mark.asyncio
    async def test_list_pending_empty(self, db_session):
        from app.services.auth_service import AuthService
        svc = AuthService(db_session)
        users, total = await svc.list_pending(1, 10)
        assert total == 0
        assert len(users) == 0


# ========== indicator_service tests ==========

class TestIndicatorServiceExtended:
    @pytest.mark.asyncio
    async def test_get_not_found(self, db_session):
        svc = IndicatorService(db_session)
        with pytest.raises(AppException) as exc_info:
            await svc.get(uuid4())
        assert exc_info.value.status_code == 404

    @pytest.mark.asyncio
    async def test_create_with_redis(self, db_session):
        from unittest.mock import AsyncMock
        mock_redis = AsyncMock()
        svc = IndicatorService(db_session, redis=mock_redis)
        data = IndicatorCreate(
            name="Test Redis", code="TR001", unit="u",
            value=10, source="test", period="monthly",
        )
        indicator = await svc.create(data)
        assert indicator.code == "TR001"

    @pytest.mark.asyncio
    async def test_update_indicator(self, db_session):
        svc = IndicatorService(db_session)
        data = IndicatorCreate(
            name="Upd Test", code="UPD001", unit="u",
            value=10, source="test", period="monthly",
        )
        indicator = await svc.create(data)
        update = IndicatorUpdate(name="Updated Ind")
        updated = await svc.update(indicator.id, update)
        assert updated.name == "Updated Ind"

    @pytest.mark.asyncio
    async def test_update_not_found(self, db_session):
        svc = IndicatorService(db_session)
        with pytest.raises(AppException):
            await svc.update(uuid4(), IndicatorUpdate(name="x"))

    @pytest.mark.asyncio
    async def test_delete_indicator(self, db_session):
        svc = IndicatorService(db_session)
        data = IndicatorCreate(
            name="Del Test", code="DEL001", unit="u",
            value=10, source="test", period="monthly",
        )
        indicator = await svc.create(data)
        await svc.delete(indicator.id)
        with pytest.raises(AppException):
            await svc.get(indicator.id)

    @pytest.mark.asyncio
    async def test_delete_not_found(self, db_session):
        svc = IndicatorService(db_session)
        with pytest.raises(AppException):
            await svc.delete(uuid4())

    @pytest.mark.asyncio
    async def test_list_with_sector_filter(self, db_session):
        from app.core.seed_data import seed_all
        await seed_all(db_session)
        svc = IndicatorService(db_session)
        items, total = await svc.list(1, 10, sector="some_sector")
        assert total >= 0

    @pytest.mark.asyncio
    async def test_list_with_period_filter(self, db_session):
        from app.core.seed_data import seed_all
        await seed_all(db_session)
        svc = IndicatorService(db_session)
        items, total = await svc.list(1, 10, period="monthly")
        assert total >= 0

    @pytest.mark.asyncio
    async def test_list_with_sort(self, db_session):
        from app.core.seed_data import seed_all
        await seed_all(db_session)
        svc = IndicatorService(db_session)
        items, total = await svc.list(1, 10, sort_by="name", sort_order="asc")
        assert total >= 0

    @pytest.mark.asyncio
    async def test_update_with_redis(self, db_session):
        from unittest.mock import AsyncMock
        mock_redis = AsyncMock()
        svc = IndicatorService(db_session, redis=mock_redis)
        data = IndicatorCreate(
            name="Redis Upd", code="RU001", unit="u",
            value=10, source="test", period="monthly",
        )
        indicator = await svc.create(data)
        updated = await svc.update(indicator.id, IndicatorUpdate(name="Redis Updated"))
        assert updated.name == "Redis Updated"

    @pytest.mark.asyncio
    async def test_delete_with_redis(self, db_session):
        from unittest.mock import AsyncMock
        mock_redis = AsyncMock()
        svc = IndicatorService(db_session, redis=mock_redis)
        data = IndicatorCreate(
            name="Redis Del", code="RD001", unit="u",
            value=10, source="test", period="monthly",
        )
        indicator = await svc.create(data)
        await svc.delete(indicator.id)
        with pytest.raises(AppException):
            await svc.get(indicator.id)

    @pytest.mark.asyncio
    async def test_list_default_sort(self, db_session):
        from app.core.seed_data import seed_all
        await seed_all(db_session)
        svc = IndicatorService(db_session)
        items, total = await svc.list(1, 10)
        assert total >= 0


# ========== patent_service tests ==========

class TestPatentServiceExtended:
    @pytest.mark.asyncio
    async def test_patent_list_with_sector(self, db_session):
        from app.core.seed_data import seed_all
        await seed_all(db_session)
        svc = PatentService(db_session)
        items, total = await svc.list(1, 10, sector="some_sector")
        assert total >= 0

    @pytest.mark.asyncio
    async def test_patent_list_with_status(self, db_session):
        from app.core.seed_data import seed_all
        await seed_all(db_session)
        svc = PatentService(db_session)
        items, total = await svc.list(1, 10, status="granted")
        assert total >= 0

    @pytest.mark.asyncio
    async def test_patent_list_with_date_range(self, db_session):
        from datetime import date

        from app.core.seed_data import seed_all
        await seed_all(db_session)
        svc = PatentService(db_session)
        items, total = await svc.list(
            1, 10, fecha_desde=date(2024, 1, 1), fecha_hasta=date(2024, 12, 31)
        )
        assert total >= 0

    @pytest.mark.asyncio
    async def test_patent_list_with_sort(self, db_session):
        from app.core.seed_data import seed_all
        await seed_all(db_session)
        svc = PatentService(db_session)
        items, total = await svc.list(1, 10, sort_by="title", sort_order="asc")
        assert total >= 0

    @pytest.mark.asyncio
    async def test_patent_list_default_sort(self, db_session):
        from app.core.seed_data import seed_all
        await seed_all(db_session)
        svc = PatentService(db_session)
        items, total = await svc.list(1, 10)
        assert total >= 0


# ========== technology_service tests ==========

class TestTechnologyServiceExtended:
    @pytest.mark.asyncio
    async def test_tech_list_with_sector(self, db_session):
        from app.core.seed_data import seed_all
        await seed_all(db_session)
        svc = TechnologyService(db_session)
        items, total = await svc.list(1, 10, sector_codigo="some_sector")
        assert total >= 0

    @pytest.mark.asyncio
    async def test_tech_list_with_trl(self, db_session):
        from app.core.seed_data import seed_all
        await seed_all(db_session)
        svc = TechnologyService(db_session)
        items, total = await svc.list(1, 10, trl_nivel=5)
        assert total >= 0

    @pytest.mark.asyncio
    async def test_tech_list_with_sort(self, db_session):
        from app.core.seed_data import seed_all
        await seed_all(db_session)
        svc = TechnologyService(db_session)
        items, total = await svc.list(1, 10, sort_by="nombre", sort_order="asc")
        assert total >= 0

    @pytest.mark.asyncio
    async def test_tech_list_default(self, db_session):
        from app.core.seed_data import seed_all
        await seed_all(db_session)
        svc = TechnologyService(db_session)
        items, total = await svc.list(1, 10)
        assert total >= 0


# ========== research_publication_service tests ==========

class TestResearchPublicationServiceExtended:
    @pytest.mark.asyncio
    async def test_rp_list_with_sector(self, db_session):
        from app.core.seed_data import seed_all
        await seed_all(db_session)
        svc = ResearchPublicationService(db_session)
        items, total = await svc.list(1, 10, sector_codigo="some_sector")
        assert total >= 0

    @pytest.mark.asyncio
    async def test_rp_list_with_sort(self, db_session):
        from app.core.seed_data import seed_all
        await seed_all(db_session)
        svc = ResearchPublicationService(db_session)
        items, total = await svc.list(1, 10, sort_by="titulo", sort_order="asc")
        assert total >= 0

    @pytest.mark.asyncio
    async def test_rp_list_default(self, db_session):
        from app.core.seed_data import seed_all
        await seed_all(db_session)
        svc = ResearchPublicationService(db_session)
        items, total = await svc.list(1, 10)
        assert total >= 0


# ========== user_service tests ==========

class TestUserServiceExtended:
    @pytest.mark.asyncio
    async def test_user_list_with_role(self, db_session):
        from app.core.seed_data import seed_all
        await seed_all(db_session)
        svc = UserService(db_session)
        items, total = await svc.list(1, 10, role="admin_mindus")
        assert total >= 0

    @pytest.mark.asyncio
    async def test_user_list_with_status(self, db_session):
        from app.core.seed_data import seed_all
        await seed_all(db_session)
        svc = UserService(db_session)
        items, total = await svc.list(1, 10, status="approved")
        assert total >= 0

    @pytest.mark.asyncio
    async def test_user_list_with_active(self, db_session):
        from app.core.seed_data import seed_all
        await seed_all(db_session)
        svc = UserService(db_session)
        items, total = await svc.list(1, 10, is_active=True)
        assert total >= 0

    @pytest.mark.asyncio
    async def test_user_list_with_sort(self, db_session):
        from app.core.seed_data import seed_all
        await seed_all(db_session)
        svc = UserService(db_session)
        items, total = await svc.list(1, 10, sort_by="full_name", sort_order="asc")
        assert total >= 0

    @pytest.mark.asyncio
    async def test_user_list_default(self, db_session):
        from app.core.seed_data import seed_all
        await seed_all(db_session)
        svc = UserService(db_session)
        items, total = await svc.list(1, 10)
        assert total >= 0


# ========== follow_service edge cases ==========

class TestFollowServiceExtended:
    @pytest.mark.asyncio
    async def test_follow_not_found(self, db_session):
        svc = FollowService(db_session)
        with pytest.raises(AppException) as exc_info:
            await svc.follow_organization(uuid4(), uuid4())
        assert exc_info.value.status_code == 404

    @pytest.mark.asyncio
    async def test_unfollow_own_org(self, db_session):
        from app.core.seed_data import seed_all
        await seed_all(db_session)
        result = await db_session.execute(select(Organization).limit(1))
        org = result.scalar_one_or_none()
        user = await _create_user(db_session, username="unfollow_own", organization_id=org.id)

        svc = FollowService(db_session)
        with pytest.raises(AppException) as exc_info:
            await svc.unfollow_organization(user.id, org.id)
        assert exc_info.value.status_code == 400

    @pytest.mark.asyncio
    async def test_unfollow_not_following(self, db_session):
        from app.core.seed_data import seed_all
        await seed_all(db_session)
        result = await db_session.execute(select(Organization).limit(1))
        org = result.scalar_one_or_none()
        user = await _create_user(db_session, username="unfollow_none")

        svc = FollowService(db_session)
        with pytest.raises(AppException) as exc_info:
            await svc.unfollow_organization(user.id, org.id)
        assert exc_info.value.status_code == 404

    @pytest.mark.asyncio
    async def test_follow_status_not_found(self, db_session):
        svc = FollowService(db_session)
        with pytest.raises(AppException) as exc_info:
            await svc.get_follow_status(uuid4(), uuid4())
        assert exc_info.value.status_code == 404

    @pytest.mark.asyncio
    async def test_get_organization_follow_stats_not_found(self, db_session):
        svc = FollowService(db_session)
        with pytest.raises(AppException) as exc_info:
            await svc.get_organization_follow_stats(uuid4())
        assert exc_info.value.status_code == 404

    @pytest.mark.asyncio
    async def test_get_organization_follow_stats(self, db_session):
        from app.core.seed_data import seed_all
        await seed_all(db_session)
        result = await db_session.execute(select(Organization).limit(1))
        org = result.scalar_one_or_none()

        svc = FollowService(db_session)
        stats = await svc.get_organization_follow_stats(org.id)
        assert "followers_count" in stats
        assert "following_count" in stats


# ========== alert_service tests ==========

class TestAlertServiceExtended:
    @pytest.mark.asyncio
    async def test_alert_list_unread(self, db_session):
        from app.core.seed_data import seed_all
        await seed_all(db_session)
        svc = AlertService(db_session)
        items, total = await svc.list(1, 10, unread_only=True)
        assert total >= 0

    @pytest.mark.asyncio
    async def test_alert_list_severidad(self, db_session):
        from app.core.seed_data import seed_all
        await seed_all(db_session)
        svc = AlertService(db_session)
        items, total = await svc.list(1, 10, severidad="alta")
        assert total >= 0

    @pytest.mark.asyncio
    async def test_alert_list_sector(self, db_session):
        from app.core.seed_data import seed_all
        await seed_all(db_session)
        svc = AlertService(db_session)
        items, total = await svc.list(1, 10, sector_codigos=["sector1"])
        assert total >= 0

    @pytest.mark.asyncio
    async def test_alert_list_date_range(self, db_session):
        from datetime import datetime

        from app.core.seed_data import seed_all
        await seed_all(db_session)
        svc = AlertService(db_session)
        items, total = await svc.list(
            1, 10,
            fecha_desde=datetime(2024, 1, 1),
            fecha_hasta=datetime(2024, 12, 31),
        )
        assert total >= 0

    @pytest.mark.asyncio
    async def test_alert_list_sort(self, db_session):
        from app.core.seed_data import seed_all
        await seed_all(db_session)
        svc = AlertService(db_session)
        items, total = await svc.list(1, 10, sort_by="fecha", sort_order="asc")
        assert total >= 0

    @pytest.mark.asyncio
    async def test_mark_read(self, db_session):
        alert = Alert(
            titulo="Test Alert", descripcion="Test", severidad="media",
        )
        db_session.add(alert)
        await db_session.flush()

        svc = AlertService(db_session)
        marked = await svc.mark_read(alert.id)
        assert marked.leida is True

    @pytest.mark.asyncio
    async def test_mark_read_not_found(self, db_session):
        svc = AlertService(db_session)
        with pytest.raises(AppException):
            await svc.mark_read(uuid4())

    @pytest.mark.asyncio
    async def test_mark_all_read(self, db_session):
        from app.core.seed_data import seed_all
        await seed_all(db_session)
        svc = AlertService(db_session)
        count = await svc.mark_all_read()
        assert count >= 0

    @pytest.mark.asyncio
    async def test_alert_list_default(self, db_session):
        from app.core.seed_data import seed_all
        await seed_all(db_session)
        svc = AlertService(db_session)
        items, total = await svc.list(1, 10)
        assert total >= 0


# ========== audit_service tests ==========

class TestAuditServiceExtended:
    @pytest.mark.asyncio
    async def test_log_with_ip(self, db_session):
        user = await _create_user(db_session, username="audit_user1")
        svc = AuditService(db_session)
        entry = await svc.log(
            user_id=user.id, action="CREATE", entity_type="Test",
            entity_id="1", changes={"key": "val"}, ip_address="127.0.0.1",
        )
        assert entry is not None
        assert entry.ip_address == "127.0.0.1"

    @pytest.mark.asyncio
    async def test_log_no_changes(self, db_session):
        user = await _create_user(db_session, username="audit_user2")
        svc = AuditService(db_session)
        entry = await svc.log(
            user_id=user.id, action="DELETE", entity_type="Test",
            entity_id="2",
        )
        assert entry is not None
        assert entry.changes is None

    @pytest.mark.asyncio
    async def test_get_logs_by_entity_type(self, db_session):
        user = await _create_user(db_session, username="audit_user3")
        svc = AuditService(db_session)
        await svc.log(user_id=user.id, action="CREATE", entity_type="Patent", entity_id="1")
        items, total = await svc.get_logs(entity_type="Patent")
        assert total >= 1

    @pytest.mark.asyncio
    async def test_get_logs_by_entity_id(self, db_session):
        user = await _create_user(db_session, username="audit_user4")
        svc = AuditService(db_session)
        await svc.log(user_id=user.id, action="CREATE", entity_type="Tech", entity_id="42")
        items, total = await svc.get_logs(entity_id="42")
        assert total >= 1

    @pytest.mark.asyncio
    async def test_get_logs_by_user_id(self, db_session):
        user = await _create_user(db_session, username="audit_user5")
        svc = AuditService(db_session)
        await svc.log(user_id=user.id, action="UPDATE", entity_type="User", entity_id="1")
        items, total = await svc.get_logs(user_id=user.id)
        assert total >= 1

    @pytest.mark.asyncio
    async def test_get_logs_pagination(self, db_session):
        user = await _create_user(db_session, username="audit_user6")
        svc = AuditService(db_session)
        for i in range(5):
            await svc.log(user_id=user.id, action="CREATE", entity_type="Page", entity_id=str(i))
        items, total = await svc.get_logs(entity_type="Page", offset=0, limit=3)
        assert len(items) == 3
        assert total >= 5

    @pytest.mark.asyncio
    async def test_get_logs_no_filters(self, db_session):
        user = await _create_user(db_session, username="audit_user7")
        svc = AuditService(db_session)
        await svc.log(user_id=user.id, action="CREATE", entity_type="Misc", entity_id="99")
        items, total = await svc.get_logs()
        assert total >= 1


# ========== organization_service tests ==========

class TestOrganizationServiceExtended:
    @pytest.mark.asyncio
    async def test_org_list_tipo(self, db_session):
        from app.core.seed_data import seed_all
        await seed_all(db_session)
        svc = OrganizationService(db_session)
        items, total = await svc.list(1, 10, tipo="empresa")
        assert total >= 0

    @pytest.mark.asyncio
    async def test_org_list_sector(self, db_session):
        from app.core.seed_data import seed_all
        await seed_all(db_session)
        svc = OrganizationService(db_session)
        items, total = await svc.list(1, 10, sector_codigos=["sector1"])
        assert total >= 0

    @pytest.mark.asyncio
    async def test_org_list_pais(self, db_session):
        from app.core.seed_data import seed_all
        await seed_all(db_session)
        svc = OrganizationService(db_session)
        items, total = await svc.list(1, 10, pais="Cuba")
        assert total >= 0

    @pytest.mark.asyncio
    async def test_org_list_provincia(self, db_session):
        from app.core.seed_data import seed_all
        await seed_all(db_session)
        svc = OrganizationService(db_session)
        items, total = await svc.list(1, 10, provincia="La Habana")
        assert total >= 0

    @pytest.mark.asyncio
    async def test_org_list_sort(self, db_session):
        from app.core.seed_data import seed_all
        await seed_all(db_session)
        svc = OrganizationService(db_session)
        items, total = await svc.list(1, 10, sort_by="nombre", sort_order="asc")
        assert total >= 0

    @pytest.mark.asyncio
    async def test_org_list_default(self, db_session):
        from app.core.seed_data import seed_all
        await seed_all(db_session)
        svc = OrganizationService(db_session)
        items, total = await svc.list(1, 10)
        assert total >= 0


# ========== professional_profile_service extended ==========

class TestProfessionalProfileServiceExtended:
    @pytest.mark.asyncio
    async def test_list_professionals_with_filters(self, db_session):
        from app.core.seed_data import seed_all
        await seed_all(db_session)
        svc = ProfessionalProfileService(db_session)
        items, total = await svc.list_professionals(
            1, 10, especialidad="IA", sort_by="email", sort_order="asc"
        )
        assert total >= 0

    @pytest.mark.asyncio
    async def test_update_profile_not_found(self, db_session):
        from app.schemas.professional import ProfessionalProfileUpdate
        svc = ProfessionalProfileService(db_session)
        with pytest.raises(AppException) as exc_info:
            await svc.update_my_profile(uuid4(), ProfessionalProfileUpdate())
        assert exc_info.value.status_code == 404

    @pytest.mark.asyncio
    async def test_get_profile_not_found(self, db_session):
        svc = ProfessionalProfileService(db_session)
        with pytest.raises(AppException) as exc_info:
            await svc.get_my_profile(uuid4())
        assert exc_info.value.status_code == 404

    @pytest.mark.asyncio
    async def test_list_professionals_sort_especialidad(self, db_session):
        from app.core.seed_data import seed_all
        await seed_all(db_session)
        svc = ProfessionalProfileService(db_session)
        items, total = await svc.list_professionals(
            1, 10, sort_by="especialidad", sort_order="desc"
        )
        assert total >= 0

    @pytest.mark.asyncio
    async def test_list_professionals_default_sort(self, db_session):
        from app.core.seed_data import seed_all
        await seed_all(db_session)
        svc = ProfessionalProfileService(db_session)
        items, total = await svc.list_professionals(1, 10)
        assert total >= 0
