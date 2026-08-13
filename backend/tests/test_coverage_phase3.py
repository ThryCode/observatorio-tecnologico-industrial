import json
import uuid
from datetime import datetime
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from pydantic import ValidationError

from app.core.exceptions import AppException
from app.core.security import create_access_token
from app.main import app
from app.models.bulletin import Bulletin
from app.models.competitiveness import CompetitivenessIndex
from app.models.follow import Follow
from app.models.indicator import Indicator, IndicatorPeriod
from app.models.industrial_sector import IndustrialSector
from app.models.organization import Organization
from app.models.patent import Patent, PatentStatus
from app.models.patent_map import PatentMapEntry
from app.models.professional_profile import ProfessionalProfile
from app.models.regulation import Regulation, RegulationCategory
from app.models.research_publication import ResearchPublication
from app.models.technology import Technology
from app.models.user import User, UserRole
from app.services.file_service import FileServiceError

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

async def _create_user(db, **kwargs):
    defaults = {
        "id": uuid.uuid4(),
        "username": f"user_{uuid.uuid4().hex[:8]}",
        "email": f"{uuid.uuid4().hex[:8]}@test.com",
        "full_name": "Test User",
        "hashed_password": "$2b$12$hashed",
        "role": UserRole.ADMIN_MINDUS,
        "is_active": True,
        "status": "approved",
    }
    defaults.update(kwargs)
    user = User(**defaults)
    db.add(user)
    await db.flush()
    return user


async def _create_sector(db, codigo="AUT"):
    s = IndustrialSector(codigo=codigo, nombre=f"Sector {codigo}", descripcion="test")
    db.add(s)
    await db.flush()
    return s


async def _create_org(db, sector_codigo="AUT", **kwargs):
    defaults = {
        "id": uuid.uuid4(),
        "nombre": "Org Test",
        "siglas": "ORG",
        "tipo": "empresa",
        "sector_codigo": sector_codigo,
        "pais": "CU",
        "provincia": "La Habana",
    }
    defaults.update(kwargs)
    org = Organization(**defaults)
    db.add(org)
    await db.flush()
    return org


def _token(user):
    return create_access_token({"sub": str(user.id)})


# ---------------------------------------------------------------------------
# Graph sync_all — mock Neo4j driver entirely
# ---------------------------------------------------------------------------

class _FakeRecord:
    def __init__(self, data):
        self._data = data

    def __getitem__(self, key):
        return self._data[key]


class _FakeResult:
    def __init__(self, records):
        self._records = [_FakeRecord(r) for r in records]

    async def single(self):
        return self._records[0] if self._records else None

    async def __aiter__(self):
        for r in self._records:
            yield r

    def data(self):
        return [r._data for r in self._records]


class _FakeSession:
    def __init__(self):
        self._call = 0

    async def run(self, cypher, **kwargs):
        self._call += 1
        return _FakeResult([{"merged": 1, "deleted": 0}])

    async def __aenter__(self):
        return self

    async def __aexit__(self, *a):
        pass


class _FakeDriver:
    def __init__(self):
        self._sessions = []

    def session(self):
        s = _FakeSession()
        self._sessions.append(s)
        return s


class TestGraphSyncAll:
    @pytest.mark.asyncio
    async def test_sync_all_full(self, db_session):
        from app.graph.repository import GraphRepository

        await _create_sector(db_session)
        await _create_org(db_session)
        user = await _create_user(db_session)
        t = Technology(nombre="AI", sector_codigo="AUT", trl_nivel=5)
        db_session.add(t)
        await db_session.flush()

        p = Patent(
            title="Test Patent",
            patent_number="CU-2024-0001",
            inventor="John Doe; Jane Smith",
            applicant="Org",
            filing_date=datetime(2024, 1, 1),
            technological_sector="AUT",
            country="CU",
            status=PatentStatus.FILED,
        )
        db_session.add(p)
        await db_session.flush()

        reg = Regulation(
            title="Reg Test",
            regulation_number="REG-001",
            issuing_body="MINDUS",
            publication_date=datetime(2024, 1, 1),
            category=RegulationCategory.LAW,
            summary="test",
            sector_codigo="AUT",
        )
        db_session.add(reg)
        await db_session.flush()

        ind = Indicator(
            name="Test Indicator",
            code="TI-001",
            description="test",
            unit="%",
            value=10,
            source="test",
            period=IndicatorPeriod.ANNUAL,
            sector_codigo="AUT",
        )
        db_session.add(ind)
        await db_session.flush()

        pp = ProfessionalProfile(
            user_id=user.id,
            especialidad="CS",
            grado_cientifico="Doctorado",
        )
        db_session.add(pp)
        await db_session.flush()

        driver = _FakeDriver()
        repo = GraphRepository(driver)
        result = await repo.sync_all(db_session)

        assert "nodes_merged" in result
        assert "relationships_merged" in result
        assert "nodes_deleted" in result

    @pytest.mark.asyncio
    async def test_sync_all_empty_db(self, db_session):
        from app.graph.repository import GraphRepository

        driver = _FakeDriver()
        repo = GraphRepository(driver)
        result = await repo.sync_all(db_session)
        assert result["nodes_merged"] >= 0


class TestGraphSyncEnterprise:
    @pytest.mark.asyncio
    async def test_sync_enterprise_full(self, db_session):
        from app.graph.repository import GraphRepository

        await _create_sector(db_session)
        org1 = await _create_org(db_session)
        org2 = await _create_org(db_session, siglas="ORG2")
        user = await _create_user(db_session, organization_id=org1.id)

        follow = Follow(
            follower_id=user.id,
            follower_type="user",
            organization_id=org2.id,
        )
        db_session.add(follow)
        follow2 = Follow(
            follower_id=org1.id,
            follower_type="organization",
            organization_id=org2.id,
        )
        db_session.add(follow2)
        follow3 = Follow(
            follower_id=uuid.uuid4(),
            follower_type="other",
            organization_id=org2.id,
        )
        db_session.add(follow3)
        await db_session.flush()

        driver = _FakeDriver()
        repo = GraphRepository(driver)
        result = await repo.sync_enterprise_graph(db_session)

        assert result["nodes_merged"] >= 1
        assert result["relationships_merged"] >= 1

    @pytest.mark.asyncio
    async def test_sync_enterprise_self_follow_ignored(self, db_session):
        from app.graph.repository import GraphRepository

        await _create_sector(db_session)
        org1 = await _create_org(db_session)
        user = await _create_user(db_session, organization_id=org1.id)
        follow = Follow(
            follower_id=user.id,
            follower_type="user",
            organization_id=org1.id,
        )
        db_session.add(follow)
        await db_session.flush()

        driver = _FakeDriver()
        repo = GraphRepository(driver)
        result = await repo.sync_enterprise_graph(db_session)
        assert result["relationships_merged"] == 0


# ---------------------------------------------------------------------------
# Dashboard follow_events
# ---------------------------------------------------------------------------

class TestDashboardFollowEvents:
    @pytest.mark.asyncio
    async def test_follow_org_follower_type(self, client, db_session):
        user = await _create_user(db_session)
        token = _token(user)
        await _create_sector(db_session)
        org1 = await _create_org(db_session, nombre="Org A", siglas="AA")
        org2 = await _create_org(db_session, nombre="Org B", siglas="BB")
        follow = Follow(
            follower_id=org1.id,
            follower_type="organization",
            organization_id=org2.id,
        )
        db_session.add(follow)
        await db_session.flush()

        resp = await client.get(
            "/api/v1/dashboard/timeline",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 200
        events = resp.json()
        assert any("Org A" in e["titulo"] and "Org B" in e["titulo"] for e in events)

    @pytest.mark.asyncio
    async def test_follow_user_follower_type(self, client, db_session):
        user = await _create_user(db_session)
        token = _token(user)
        await _create_sector(db_session)
        org1 = await _create_org(db_session, nombre="Org X", siglas="XX")
        org2 = await _create_org(db_session, nombre="Org Y", siglas="YY")
        user2 = await _create_user(db_session, organization_id=org1.id)
        follow = Follow(
            follower_id=user2.id,
            follower_type="user",
            organization_id=org2.id,
        )
        db_session.add(follow)
        await db_session.flush()

        resp = await client.get(
            "/api/v1/dashboard/timeline",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_follow_other_type_skipped(self, client, db_session):
        user = await _create_user(db_session)
        token = _token(user)
        await _create_sector(db_session)
        org = await _create_org(db_session)
        follow = Follow(
            follower_id=uuid.uuid4(),
            follower_type="other",
            organization_id=org.id,
        )
        db_session.add(follow)
        await db_session.flush()

        resp = await client.get(
            "/api/v1/dashboard/timeline",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 200
        events = resp.json()
        assert all(e["tipo"] != "follow" for e in events)

    @pytest.mark.asyncio
    async def test_follow_sector_filter(self, client, db_session):
        user = await _create_user(db_session)
        token = _token(user)
        await _create_sector(db_session, "AUT")
        await _create_sector(db_session, "FAR")
        org1 = await _create_org(db_session, sector_codigo="AUT", siglas="AA")
        org2 = await _create_org(db_session, sector_codigo="FAR", siglas="BB")
        follow = Follow(
            follower_id=org1.id,
            follower_type="organization",
            organization_id=org2.id,
        )
        db_session.add(follow)
        await db_session.flush()

        resp = await client.get(
            "/api/v1/dashboard/timeline",
            params={"sector_codigos": "AUT"},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_follow_follower_user_no_org(self, client, db_session):
        user = await _create_user(db_session)
        token = _token(user)
        await _create_sector(db_session)
        org = await _create_org(db_session)
        user2 = await _create_user(db_session)
        follow = Follow(
            follower_id=user2.id,
            follower_type="user",
            organization_id=org.id,
        )
        db_session.add(follow)
        await db_session.flush()

        resp = await client.get(
            "/api/v1/dashboard/timeline",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 200
        events = resp.json()
        assert any("Un usuario" in e["titulo"] for e in events)


# ---------------------------------------------------------------------------
# Dashboard summary cache hit
# ---------------------------------------------------------------------------

class TestDashboardSummaryCache:
    @pytest.mark.asyncio
    async def test_summary_cache_hit(self, client, db_session):
        user = await _create_user(db_session)
        token = _token(user)
        cached = {
            "kpis": [
                {"label": "Organizaciones", "value": 5, "unit": "entidades", "change": 0},
                {"label": "Patentes", "value": 10, "unit": "registradas", "change": 0},
                {"label": "Tecnologías", "value": 3, "unit": "vigiladas", "change": 0},
                {"label": "Indicadores", "value": 7, "unit": "activos", "change": 0},
                {"label": "Alertas", "value": 2, "unit": "activas", "change": 0},
            ]
        }
        fake_redis = AsyncMock()
        fake_redis.get = AsyncMock(return_value=json.dumps(cached))

        from app.dependencies import get_redis
        app.dependency_overrides[get_redis] = lambda: fake_redis
        try:
            resp = await client.get(
                "/api/v1/dashboard/summary",
                headers={"Authorization": f"Bearer {token}"},
            )
            assert resp.status_code == 200
            assert resp.json()["kpis"][0]["value"] == 5
        finally:
            app.dependency_overrides.pop(get_redis, None)

    @pytest.mark.asyncio
    async def test_summary_with_sectors(self, client, db_session):
        user = await _create_user(db_session)
        token = _token(user)
        await _create_sector(db_session, "AUT")
        await _create_org(db_session, sector_codigo="AUT")

        resp = await client.get(
            "/api/v1/dashboard/summary",
            params={"sector_codigos": "AUT"},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 200


# ---------------------------------------------------------------------------
# Health readiness
# ---------------------------------------------------------------------------

class TestHealthReadiness:
    @pytest.mark.asyncio
    async def test_readiness_all_ok(self, client):
        from app.dependencies import get_neo4j, get_redis

        fake_neo4j = MagicMock()
        session_mock = AsyncMock()
        session_mock.run = AsyncMock()
        fake_neo4j.session.return_value.__aenter__ = AsyncMock(return_value=session_mock)
        fake_neo4j.session.return_value.__aexit__ = AsyncMock(return_value=False)

        fake_redis = AsyncMock()
        fake_redis.ping = AsyncMock()

        app.dependency_overrides[get_neo4j] = lambda: fake_neo4j
        app.dependency_overrides[get_redis] = lambda: fake_redis
        try:
            resp = await client.get("/api/v1/health/ready")
            assert resp.status_code == 200
            data = resp.json()
            assert data["status"] == "ready"
            assert data["checks"]["database"] == "ok"
            assert data["checks"]["neo4j"] == "ok"
            assert data["checks"]["redis"] == "ok"
        finally:
            app.dependency_overrides.pop(get_neo4j, None)
            app.dependency_overrides.pop(get_redis, None)

    @pytest.mark.asyncio
    async def test_readiness_neo4j_not_configured(self, client):
        from app.dependencies import get_neo4j, get_redis

        app.dependency_overrides[get_neo4j] = lambda: None
        app.dependency_overrides[get_redis] = lambda: None
        try:
            resp = await client.get("/api/v1/health/ready")
            assert resp.status_code == 200
            data = resp.json()
            assert data["checks"]["neo4j"] == "not configured"
            assert data["checks"]["redis"] == "not configured"
        finally:
            app.dependency_overrides.pop(get_neo4j, None)
            app.dependency_overrides.pop(get_redis, None)

    @pytest.mark.asyncio
    async def test_readiness_neo4j_error(self, client):
        from app.dependencies import get_neo4j, get_redis

        fake_neo4j = MagicMock()
        fake_neo4j.session.return_value.__aenter__ = AsyncMock(
            side_effect=Exception("connection refused")
        )
        fake_neo4j.session.return_value.__aexit__ = AsyncMock(return_value=False)

        app.dependency_overrides[get_neo4j] = lambda: fake_neo4j
        app.dependency_overrides[get_redis] = lambda: None
        try:
            resp = await client.get("/api/v1/health/ready")
            assert resp.status_code == 200
            data = resp.json()
            assert data["status"] == "not ready"
            assert "error" in data["checks"]["neo4j"]
        finally:
            app.dependency_overrides.pop(get_neo4j, None)
            app.dependency_overrides.pop(get_redis, None)

    @pytest.mark.asyncio
    async def test_readiness_redis_error(self, client):
        from app.dependencies import get_neo4j, get_redis

        fake_redis = AsyncMock()
        fake_redis.ping = AsyncMock(side_effect=Exception("timeout"))

        app.dependency_overrides[get_neo4j] = lambda: None
        app.dependency_overrides[get_redis] = lambda: fake_redis
        try:
            resp = await client.get("/api/v1/health/ready")
            assert resp.status_code == 200
            data = resp.json()
            assert data["status"] == "not ready"
            assert "error" in data["checks"]["redis"]
        finally:
            app.dependency_overrides.pop(get_neo4j, None)
            app.dependency_overrides.pop(get_redis, None)


# ---------------------------------------------------------------------------
# Health detailed
# ---------------------------------------------------------------------------

class TestHealthDetailed:
    @pytest.mark.asyncio
    async def test_health_neo4j_error(self, client):
        from app.dependencies import get_neo4j, get_redis

        fake_neo4j = MagicMock()
        fake_neo4j.session.return_value.__aenter__ = AsyncMock(
            side_effect=Exception("bolt error")
        )
        fake_neo4j.session.return_value.__aexit__ = AsyncMock(return_value=False)

        app.dependency_overrides[get_neo4j] = lambda: fake_neo4j
        app.dependency_overrides[get_redis] = lambda: None
        try:
            resp = await client.get("/api/v1/health")
            assert resp.status_code == 200
            data = resp.json()
            assert data["services"]["neo4j"]["status"] == "error"
        finally:
            app.dependency_overrides.pop(get_neo4j, None)
            app.dependency_overrides.pop(get_redis, None)

    @pytest.mark.asyncio
    async def test_health_redis_error(self, client):
        from app.dependencies import get_neo4j, get_redis

        fake_redis = AsyncMock()
        fake_redis.ping = AsyncMock(side_effect=Exception("timeout"))

        app.dependency_overrides[get_neo4j] = lambda: None
        app.dependency_overrides[get_redis] = lambda: fake_redis
        try:
            resp = await client.get("/api/v1/health")
            assert resp.status_code == 200
            data = resp.json()
            assert data["services"]["redis"]["status"] == "error"
        finally:
            app.dependency_overrides.pop(get_neo4j, None)
            app.dependency_overrides.pop(get_redis, None)

    @pytest.mark.asyncio
    async def test_health_neo4j_none(self, client):
        from app.dependencies import get_neo4j, get_redis

        app.dependency_overrides[get_neo4j] = lambda: None
        app.dependency_overrides[get_redis] = lambda: None
        try:
            resp = await client.get("/api/v1/health")
            assert resp.status_code == 200
            assert resp.json()["services"]["neo4j"]["status"] == "unavailable"
        finally:
            app.dependency_overrides.pop(get_neo4j, None)
            app.dependency_overrides.pop(get_redis, None)

    @pytest.mark.asyncio
    async def test_health_redis_none(self, client):
        from app.dependencies import get_neo4j, get_redis

        app.dependency_overrides[get_neo4j] = lambda: None
        app.dependency_overrides[get_redis] = lambda: None
        try:
            resp = await client.get("/api/v1/health")
            assert resp.status_code == 200
            assert resp.json()["services"]["redis"]["status"] == "unavailable"
        finally:
            app.dependency_overrides.pop(get_neo4j, None)
            app.dependency_overrides.pop(get_redis, None)

    @pytest.mark.asyncio
    async def test_health_neo4j_ok(self, client):
        from app.dependencies import get_neo4j, get_redis

        fake_neo4j = MagicMock()
        session_mock = AsyncMock()
        session_mock.run = AsyncMock()
        fake_neo4j.session.return_value.__aenter__ = AsyncMock(return_value=session_mock)
        fake_neo4j.session.return_value.__aexit__ = AsyncMock(return_value=False)

        app.dependency_overrides[get_neo4j] = lambda: fake_neo4j
        app.dependency_overrides[get_redis] = lambda: None
        try:
            resp = await client.get("/api/v1/health")
            assert resp.status_code == 200
            assert resp.json()["services"]["neo4j"]["status"] == "ok"
        finally:
            app.dependency_overrides.pop(get_neo4j, None)
            app.dependency_overrides.pop(get_redis, None)

    @pytest.mark.asyncio
    async def test_health_redis_ok(self, client):
        from app.dependencies import get_neo4j, get_redis

        fake_redis = AsyncMock()
        fake_redis.ping = AsyncMock()

        app.dependency_overrides[get_neo4j] = lambda: None
        app.dependency_overrides[get_redis] = lambda: fake_redis
        try:
            resp = await client.get("/api/v1/health")
            assert resp.status_code == 200
            assert resp.json()["services"]["redis"]["status"] == "ok"
        finally:
            app.dependency_overrides.pop(get_neo4j, None)
            app.dependency_overrides.pop(get_redis, None)


# ---------------------------------------------------------------------------
# Dependencies
# ---------------------------------------------------------------------------

class TestDependencies:
    @pytest.mark.asyncio
    async def test_invalid_token(self, client):
        resp = await client.get(
            "/api/v1/auth/me",
            headers={"Authorization": "Bearer invalid.jwt.token"},
        )
        assert resp.status_code in (401, 403)

    @pytest.mark.asyncio
    async def test_user_not_found(self, client, db_session):
        fake_id = uuid.uuid4()
        token = create_access_token({"sub": str(fake_id)})
        resp = await client.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code in (401, 403)

    @pytest.mark.asyncio
    async def test_user_disabled(self, client, db_session):
        user = await _create_user(db_session, is_active=False)
        token = _token(user)
        resp = await client.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code in (401, 403)

    @pytest.mark.asyncio
    async def test_user_pending(self, client, db_session):
        user = await _create_user(db_session, status="pending")
        token = _token(user)
        resp = await client.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code in (401, 403)

    @pytest.mark.asyncio
    async def test_user_rejected(self, client, db_session):
        user = await _create_user(db_session, status="rejected")
        token = _token(user)
        resp = await client.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code in (401, 403)

    @pytest.mark.asyncio
    async def test_superuser_required(self, client, db_session):
        user = await _create_user(db_session, role=UserRole.PROFESIONAL)
        token = _token(user)
        resp = await client.get(
            "/api/v1/auth/pending",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 403

    @pytest.mark.asyncio
    async def test_require_role_wrong_role(self, client, db_session):
        user = await _create_user(db_session, role=UserRole.PROFESIONAL)
        token = _token(user)
        resp = await client.get(
            "/api/v1/auth/pending",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 403


# ---------------------------------------------------------------------------
# Auth endpoints
# ---------------------------------------------------------------------------

class TestAuthRegisterPublic:
    @pytest.mark.asyncio
    async def test_register_public(self, client, db_session):
        resp = await client.post(
            "/api/v1/auth/register/public",
            json={
                "role": "representante",
                "username": "newpublic",
                "email": "public@test.com",
                "password": "Test1234!",
                "full_name": "Public User",
            },
        )
        assert resp.status_code == 201
        assert "wait for administrator" in resp.json()["detail"].lower()


class TestAuthLogin:
    @pytest.mark.asyncio
    async def test_login_success(self, client, db_session, superuser_token_headers):
        resp = await client.post(
            "/api/v1/auth/login",
            json={"username": "testsuperuser", "password": "secret123"},
        )
        assert resp.status_code == 200
        assert "access_token" in resp.json()


class TestAuthRegister:
    @pytest.mark.asyncio
    async def test_register_admin(self, client, db_session, superuser_token_headers):
        resp = await client.post(
            "/api/v1/auth/register",
            json={
                "username": "newadmin",
                "email": "admin@test.com",
                "password": "Admin123!",
                "full_name": "Admin User",
                "role": "admin_mindus",
            },
            headers=superuser_token_headers,
        )
        assert resp.status_code == 201

    @pytest.mark.asyncio
    async def test_register_unauthorized(self, client, db_session):
        user = await _create_user(db_session, role=UserRole.PROFESIONAL)
        token = _token(user)
        resp = await client.post(
            "/api/v1/auth/register",
            json={
                "username": "failreg",
                "email": "fail@test.com",
                "password": "Pass123!",
                "full_name": "Fail",
            },
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 403


class TestAuthUpdateMe:
    @pytest.mark.asyncio
    async def test_update_me(self, client, db_session):
        user = await _create_user(db_session)
        token = _token(user)
        resp = await client.put(
            "/api/v1/auth/me",
            json={"full_name": "New Name", "phone": "555-1234"},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 200
        assert resp.json()["full_name"] == "New Name"

    @pytest.mark.asyncio
    async def test_update_me_disallowed_field(self, client, db_session):
        user = await _create_user(db_session)
        token = _token(user)
        resp = await client.put(
            "/api/v1/auth/me",
            json={"email": "hacker@test.com"},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 200


class TestAuthMyOrganization:
    @pytest.mark.asyncio
    async def test_get_my_org_none(self, client, db_session):
        user = await _create_user(db_session)
        token = _token(user)
        resp = await client.get(
            "/api/v1/auth/me/organization",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 404

    @pytest.mark.asyncio
    async def test_get_my_org_not_found(self, client, db_session):
        user = await _create_user(db_session)
        token = _token(user)
        resp = await client.get(
            "/api/v1/auth/me/organization",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 404

    @pytest.mark.asyncio
    async def test_create_my_org(self, client, db_session):
        await _create_sector(db_session)
        user = await _create_user(db_session)
        token = _token(user)
        resp = await client.post(
            "/api/v1/auth/me/organization",
            json={
                "nombre": "My Org",
                "siglas": "MYO",
                "tipo": "empresa",
                "sector_codigo": "AUT",
            },
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 201

    @pytest.mark.asyncio
    async def test_create_my_org_already_has(self, client, db_session):
        await _create_sector(db_session)
        org = await _create_org(db_session)
        user = await _create_user(db_session, organization_id=org.id)
        token = _token(user)
        resp = await client.post(
            "/api/v1/auth/me/organization",
            json={
                "nombre": "Another Org",
                "siglas": "AOT",
                "tipo": "empresa",
                "sector_codigo": "AUT",
            },
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 400

    @pytest.mark.asyncio
    async def test_update_my_org_none(self, client, db_session):
        user = await _create_user(db_session)
        token = _token(user)
        resp = await client.put(
            "/api/v1/auth/me/organization",
            json={"nombre": "Updated"},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 404

    @pytest.mark.asyncio
    async def test_update_my_org_not_found(self, client, db_session):
        user = await _create_user(db_session)
        token = _token(user)
        resp = await client.put(
            "/api/v1/auth/me/organization",
            json={"nombre": "Updated"},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 404

    @pytest.mark.asyncio
    async def test_update_my_org_ok(self, client, db_session):
        await _create_sector(db_session)
        org = await _create_org(db_session)
        user = await _create_user(db_session, organization_id=org.id)
        token = _token(user)
        resp = await client.put(
            "/api/v1/auth/me/organization",
            json={"nombre": "Updated Org"},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 200
        assert resp.json()["nombre"] == "Updated Org"


class TestAuthPendingApproveReject:
    @pytest.mark.asyncio
    async def test_list_pending(self, client, db_session, superuser_token_headers):
        await _create_user(db_session, status="pending", username="pending1")
        resp = await client.get(
            "/api/v1/auth/pending",
            headers=superuser_token_headers,
        )
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_approve_user(self, client, db_session, superuser_token_headers):
        pending = await _create_user(db_session, status="pending", username="toapprove")
        resp = await client.post(
            f"/api/v1/auth/{pending.id}/approve",
            headers=superuser_token_headers,
        )
        assert resp.status_code == 200
        assert resp.json()["status"] == "approved"

    @pytest.mark.asyncio
    async def test_reject_user(self, client, db_session, superuser_token_headers):
        pending = await _create_user(db_session, status="pending", username="toreject")
        resp = await client.post(
            f"/api/v1/auth/{pending.id}/reject",
            json={"reason": "Not qualified"},
            headers=superuser_token_headers,
        )
        assert resp.status_code == 200
        assert resp.json()["status"] == "rejected"


# ---------------------------------------------------------------------------
# Research publications
# ---------------------------------------------------------------------------

class TestResearchPublicationCRUD:
    @pytest.mark.asyncio
    async def test_create_pub(self, client, db_session):
        user = await _create_user(db_session, role=UserRole.ADMIN_MINDUS)
        token = _token(user)
        await _create_sector(db_session)
        resp = await client.post(
            "/api/v1/research-publications",
            json={
                "titulo": "Test Paper",
                "autores": "Author One",
                "resumen": "Abstract",
                "fecha_publicacion": "2024-01-01",
                "sector_codigo": "AUT",
            },
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 201

    @pytest.mark.asyncio
    async def test_update_pub_owner(self, client, db_session):
        user = await _create_user(db_session, role=UserRole.ADMIN_MINDUS)
        token = _token(user)
        await _create_sector(db_session)
        pub = ResearchPublication(
            titulo="Old Title",
            autores="Author",
            resumen="Abstract",
            fecha_publicacion=datetime(2024, 1, 1),
            sector_codigo="AUT",
            created_by=user.id,
        )
        db_session.add(pub)
        await db_session.flush()

        resp = await client.put(
            f"/api/v1/research-publications/{pub.id}",
            json={"titulo": "New Title"},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_update_pub_author_match(self, client, db_session):
        user = await _create_user(
            db_session, role=UserRole.ADMIN_MINDUS, full_name="John Smith"
        )
        token = _token(user)
        await _create_sector(db_session)
        pub = ResearchPublication(
            titulo="Title",
            autores="John Smith",
            resumen="Abstract",
            fecha_publicacion=datetime(2024, 1, 1),
            sector_codigo="AUT",
        )
        db_session.add(pub)
        await db_session.flush()

        resp = await client.put(
            f"/api/v1/research-publications/{pub.id}",
            json={"titulo": "Updated"},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_update_pub_forbidden(self, client, db_session):
        user = await _create_user(
            db_session, role=UserRole.PROFESIONAL, full_name="Other User"
        )
        token = _token(user)
        await _create_sector(db_session)
        pub = ResearchPublication(
            titulo="Title",
            autores="Some Author",
            resumen="Abstract",
            fecha_publicacion=datetime(2024, 1, 1),
            sector_codigo="AUT",
        )
        db_session.add(pub)
        await db_session.flush()

        resp = await client.put(
            f"/api/v1/research-publications/{pub.id}",
            json={"titulo": "Hacked"},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 403

    @pytest.mark.asyncio
    async def test_delete_pub_forbidden(self, client, db_session):
        user = await _create_user(
            db_session, role=UserRole.PROFESIONAL, full_name="Other User"
        )
        token = _token(user)
        await _create_sector(db_session)
        pub = ResearchPublication(
            titulo="Title",
            autores="Some Author",
            resumen="Abstract",
            fecha_publicacion=datetime(2024, 1, 1),
            sector_codigo="AUT",
        )
        db_session.add(pub)
        await db_session.flush()

        resp = await client.delete(
            f"/api/v1/research-publications/{pub.id}",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 403

    @pytest.mark.asyncio
    async def test_delete_pub_author_match(self, client, db_session):
        user = await _create_user(
            db_session, role=UserRole.ADMIN_MINDUS, full_name="Jane Doe"
        )
        token = _token(user)
        await _create_sector(db_session)
        pub = ResearchPublication(
            titulo="Title",
            autores="Jane Doe",
            resumen="Abstract",
            fecha_publicacion=datetime(2024, 1, 1),
            sector_codigo="AUT",
        )
        db_session.add(pub)
        await db_session.flush()

        resp = await client.delete(
            f"/api/v1/research-publications/{pub.id}",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 200


# ---------------------------------------------------------------------------
# Alerts
# ---------------------------------------------------------------------------

class TestAlertCRUD:
    @pytest.mark.asyncio
    async def test_alert_crud_cycle(self, client, db_session):
        user = await _create_user(db_session)
        token = _token(user)
        await _create_sector(db_session)

        resp = await client.post(
            "/api/v1/alerts",
            json={
                "titulo": "Alert 1",
                "descripcion": "desc",
                "severidad": "alta",
                "fecha": "2024-01-01T00:00:00Z",
                "sector_codigo": "AUT",
            },
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 201
        alert_id = resp.json()["id"]

        resp = await client.get(
            f"/api/v1/alerts/{alert_id}",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 200

        resp = await client.put(
            f"/api/v1/alerts/{alert_id}",
            json={"titulo": "Updated Alert"},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 200
        assert resp.json()["titulo"] == "Updated Alert"

        resp = await client.patch(
            f"/api/v1/alerts/{alert_id}/read",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 200

        resp = await client.post(
            "/api/v1/alerts/read-all",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 200

        resp = await client.delete(
            f"/api/v1/alerts/{alert_id}",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_alert_list_filters(self, client, db_session):
        user = await _create_user(db_session)
        token = _token(user)
        await _create_sector(db_session)

        await client.post(
            "/api/v1/alerts",
            json={
                "titulo": "Severe Alert",
                "descripcion": "desc",
                "severidad": "critica",
                "fecha": "2024-06-01T00:00:00Z",
                "sector_codigo": "AUT",
            },
            headers={"Authorization": f"Bearer {token}"},
        )

        resp = await client.get(
            "/api/v1/alerts",
            params={
                "severidad": "critica", "q": "Severe",
                "sort_by": "fecha", "sort_order": "asc",
            },
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_alert_list_sector_filter(self, client, db_session):
        user = await _create_user(db_session)
        token = _token(user)
        await _create_sector(db_session)

        await client.post(
            "/api/v1/alerts",
            json={
                "titulo": "Sector Alert",
                "descripcion": "desc",
                "severidad": "media",
                "fecha": "2024-01-01T00:00:00Z",
                "sector_codigo": "AUT",
            },
            headers={"Authorization": f"Bearer {token}"},
        )

        resp = await client.get(
            "/api/v1/alerts",
            params={"sector_codigos": "AUT", "unread_only": True},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 200


# ---------------------------------------------------------------------------
# Users endpoints
# ---------------------------------------------------------------------------

class TestUserEndpoints:
    @pytest.mark.asyncio
    async def test_list_users(self, client, db_session, superuser_token_headers):
        await _create_user(db_session, username="listuser")
        resp = await client.get(
            "/api/v1/users",
            params={
                "q": "list", "role": "admin_mindus",
                "status": "approved", "is_active": True,
                "sort_by": "username",
            },
            headers=superuser_token_headers,
        )
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_get_user(self, client, db_session, superuser_token_headers):
        user = await _create_user(db_session, username="getuser")
        resp = await client.get(
            f"/api/v1/users/{user.id}",
            headers=superuser_token_headers,
        )
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_update_user(self, client, db_session, superuser_token_headers):
        user = await _create_user(db_session, username="upduser")
        resp = await client.patch(
            f"/api/v1/users/{user.id}",
            json={"full_name": "Updated"},
            headers=superuser_token_headers,
        )
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_delete_user(self, client, db_session, superuser_token_headers):
        user = await _create_user(db_session, username="deluser")
        resp = await client.delete(
            f"/api/v1/users/{user.id}",
            headers=superuser_token_headers,
        )
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_list_users_unauthorized(self, client, db_session):
        user = await _create_user(db_session, role=UserRole.PROFESIONAL)
        token = _token(user)
        resp = await client.get(
            "/api/v1/users",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 403


# ---------------------------------------------------------------------------
# Follows
# ---------------------------------------------------------------------------

class TestFollowEndpoints:
    @pytest.mark.asyncio
    async def test_follow_crud(self, client, db_session):
        user = await _create_user(db_session)
        token = _token(user)
        await _create_sector(db_session)
        org = await _create_org(db_session)

        resp = await client.post(
            f"/api/v1/follows/{org.id}",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 201

        resp = await client.get(
            f"/api/v1/follows/{org.id}/status",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 200

        resp = await client.get(
            "/api/v1/follows/following",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 200

        resp = await client.delete(
            f"/api/v1/follows/{org.id}",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_org_follow_stats(self, client, db_session):
        await _create_sector(db_session)
        org = await _create_org(db_session)
        resp = await client.get(f"/api/v1/follows/organization/{org.id}/stats")
        assert resp.status_code == 200


# ---------------------------------------------------------------------------
# Organizations
# ---------------------------------------------------------------------------

class TestOrganizationEndpoints:
    @pytest.mark.asyncio
    async def test_update_organization_forbidden(self, client, db_session):
        await _create_sector(db_session)
        user = await _create_user(db_session, role=UserRole.REPRESENTANTE)
        token = _token(user)
        org = await _create_org(db_session)
        resp = await client.put(
            f"/api/v1/organizations/{org.id}",
            json={"nombre": "Hacked"},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 403

    @pytest.mark.asyncio
    async def test_delete_organization(self, client, db_session, superuser_token_headers):
        await _create_sector(db_session)
        org = await _create_org(db_session)
        resp = await client.delete(
            f"/api/v1/organizations/{org.id}",
            headers=superuser_token_headers,
        )
        assert resp.status_code == 200


# ---------------------------------------------------------------------------
# Professionals
# ---------------------------------------------------------------------------

class TestProfessionalsEndpoints:
    @pytest.mark.asyncio
    async def test_list_professionals(self, client, db_session):
        user = await _create_user(db_session)
        token = _token(user)
        await _create_sector(db_session)
        org = await _create_org(db_session)
        user.organization_id = org.id
        pp = ProfessionalProfile(
            user_id=user.id,
            especialidad="CS",
            grado_cientifico="Doctorado",
        )
        db_session.add(pp)
        await db_session.flush()

        resp = await client.get(
            "/api/v1/professionals",
            params={"especialidad": "CS", "q": "test", "sort_by": "especialidad"},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_specialties(self, client, db_session):
        user = await _create_user(db_session)
        token = _token(user)
        pp = ProfessionalProfile(
            user_id=user.id,
            especialidad="CS",
            grado_cientifico="Doctorado",
        )
        db_session.add(pp)
        await db_session.flush()

        resp = await client.get(
            "/api/v1/professionals/specialties",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_update_my_profile(self, client, db_session):
        user = await _create_user(db_session)
        token = _token(user)
        pp = ProfessionalProfile(
            user_id=user.id,
            especialidad="CS",
            grado_cientifico="Doctorado",
        )
        db_session.add(pp)
        await db_session.flush()

        resp = await client.put(
            "/api/v1/professionals/me",
            json={"especialidad": "AI"},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 200
        assert resp.json()["especialidad"] == "AI"

    @pytest.mark.asyncio
    async def test_update_my_profile_not_found(self, client, db_session):
        user = await _create_user(db_session)
        token = _token(user)
        resp = await client.put(
            "/api/v1/professionals/me",
            json={"especialidad": "AI"},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 404


# ---------------------------------------------------------------------------
# Uploads
# ---------------------------------------------------------------------------

class TestUploadEndpoints:
    @pytest.mark.asyncio
    async def test_upload_file_error(self, client, db_session):
        user = await _create_user(db_session)
        token = _token(user)
        with patch(
            "app.api.v1.uploads.save_upload",
            side_effect=FileServiceError("bad file"),
        ):
            resp = await client.post(
                "/api/v1/upload",
                headers={"Authorization": f"Bearer {token}"},
                files={"file": ("test.txt", b"content", "text/plain")},
            )
            assert resp.status_code == 400

    @pytest.mark.asyncio
    async def test_upload_generic_error(self, client, db_session):
        user = await _create_user(db_session)
        token = _token(user)
        with patch("app.api.v1.uploads.save_upload", side_effect=Exception("boom")):
            resp = await client.post(
                "/api/v1/upload",
                headers={"Authorization": f"Bearer {token}"},
                files={"file": ("test.txt", b"content", "text/plain")},
            )
            assert resp.status_code == 500

    @pytest.mark.asyncio
    async def test_get_file_not_found(self, client, db_session):
        user = await _create_user(db_session)
        token = _token(user)
        resp = await client.get(
            "/api/v1/files/nonexistent.txt",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 404

    @pytest.mark.asyncio
    async def test_get_file_path_traversal(self, client, db_session):
        user = await _create_user(db_session)
        token = _token(user)
        resp = await client.get(
            "/api/v1/files/../../etc/passwd",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code in (403, 404)


# ---------------------------------------------------------------------------
# Professional profile service
# ---------------------------------------------------------------------------

class TestProfessionalProfileServiceMissing:
    @pytest.mark.asyncio
    async def test_get_my_profile_not_found(self, db_session):
        from app.services.professional_profile_service import (
            ProfessionalProfileService,
        )
        svc = ProfessionalProfileService(db_session)
        with pytest.raises(AppException) as exc_info:
            await svc.get_my_profile(uuid.uuid4())
        assert exc_info.value.status_code == 404

    @pytest.mark.asyncio
    async def test_update_my_profile_not_found(self, db_session):
        from app.schemas.professional import ProfessionalProfileUpdate
        from app.services.professional_profile_service import (
            ProfessionalProfileService,
        )
        svc = ProfessionalProfileService(db_session)
        with pytest.raises(AppException) as exc_info:
            await svc.update_my_profile(
                uuid.uuid4(), ProfessionalProfileUpdate(especialidad="AI")
            )
        assert exc_info.value.status_code == 404

    @pytest.mark.asyncio
    async def test_update_my_profile_ok(self, db_session):
        from app.schemas.professional import ProfessionalProfileUpdate
        from app.services.professional_profile_service import (
            ProfessionalProfileService,
        )
        user = await _create_user(db_session)
        pp = ProfessionalProfile(user_id=user.id, especialidad="CS")
        db_session.add(pp)
        await db_session.flush()

        svc = ProfessionalProfileService(db_session)
        updated = await svc.update_my_profile(
            user.id, ProfessionalProfileUpdate(especialidad="AI")
        )
        assert updated.especialidad == "AI"


# ---------------------------------------------------------------------------
# Query helpers
# ---------------------------------------------------------------------------

class TestQueryHelpers:
    def test_apply_search_no_query(self):
        from sqlalchemy import select as sa_select

        from app.services.query_helpers import apply_search
        query = sa_select(1)
        result = apply_search(query, None, None, [])
        assert str(result) == str(query)

    def test_apply_search_with_query(self):
        from sqlalchemy import select as sa_select

        from app.services.query_helpers import apply_search
        query = sa_select(IndustrialSector)
        result = apply_search(
            query, IndustrialSector, "test", [IndustrialSector.nombre]
        )
        assert "lower" in str(result).lower() or "like" in str(result).lower()

    def test_apply_date_range_both(self):
        from sqlalchemy import select as sa_select

        from app.services.query_helpers import apply_date_range
        query = sa_select(1)
        result = apply_date_range(query, Indicator.period, "2024-01-01", "2024-12-31")
        assert "WHERE" in str(result) or "where" in str(result)

    def test_apply_date_range_from_only(self):
        from sqlalchemy import select as sa_select

        from app.services.query_helpers import apply_date_range
        query = sa_select(1)
        result = apply_date_range(query, Indicator.period, "2024-01-01", None)
        assert "WHERE" in str(result) or "where" in str(result)

    def test_apply_sorting_invalid(self):
        from sqlalchemy import select as sa_select

        from app.services.query_helpers import apply_sorting
        query = sa_select(1)
        result = apply_sorting(query, None, "nonexistent", "asc", {"valid": 1})
        assert str(result) == str(query)


# ---------------------------------------------------------------------------
# Graph service enterprise
# ---------------------------------------------------------------------------

class TestGraphServiceEnterprise:
    @pytest.mark.asyncio
    async def test_enterprise_graph_full(self, db_session):
        from app.services.graph_service import GraphService

        await _create_sector(db_session)
        org1 = await _create_org(db_session)
        org2 = await _create_org(db_session, siglas="ORG2")
        user = await _create_user(db_session, organization_id=org1.id)
        follow = Follow(
            follower_id=user.id,
            follower_type="user",
            organization_id=org2.id,
        )
        db_session.add(follow)

        p = Patent(
            title="Patent 1",
            patent_number="CU-2024-0001",
            inventor="Inventor",
            applicant="Applicant",
            filing_date=datetime(2024, 1, 1),
            technological_sector="AUT",
            country="CU",
            status=PatentStatus.GRANTED,
            organization_id=org1.id,
        )
        db_session.add(p)
        await db_session.flush()

        svc = GraphService(db_session)
        result = await svc.get_enterprise_graph()
        assert len(result.nodes) >= 2
        assert any(n.patents_active > 0 for n in result.nodes)

    @pytest.mark.asyncio
    async def test_enterprise_graph_self_follow_ignored(self, db_session):
        from app.services.graph_service import GraphService

        await _create_sector(db_session)
        org = await _create_org(db_session)
        user = await _create_user(db_session, organization_id=org.id)
        follow = Follow(
            follower_id=user.id,
            follower_type="user",
            organization_id=org.id,
        )
        db_session.add(follow)
        await db_session.flush()

        svc = GraphService(db_session)
        result = await svc.get_enterprise_graph()
        assert len(result.edges) == 0


# ---------------------------------------------------------------------------
# Service filters
# ---------------------------------------------------------------------------

class TestBulletinServiceFilters:
    @pytest.mark.asyncio
    async def test_bulletin_filter_sector_categoria(self, db_session):
        from app.services.bulletin_service import BulletinService
        await _create_sector(db_session)
        bul = Bulletin(
            titulo="Test Bulletin",
            resumen="summary",
            fecha_publicacion=datetime(2024, 1, 1),
            categoria="tecnologia",
            sector_codigo="AUT",
        )
        db_session.add(bul)
        await db_session.flush()

        svc = BulletinService(db_session)
        items, total = await svc.list(
            1, 10, "AUT", "tecnologia", None, None, None, None
        )
        assert total >= 1

    @pytest.mark.asyncio
    async def test_bulletin_filter_no_sector(self, db_session):
        from app.services.bulletin_service import BulletinService
        await _create_sector(db_session)
        bul = Bulletin(
            titulo="No Sector Bulletin",
            resumen="summary",
            fecha_publicacion=datetime(2024, 1, 1),
            categoria="economia",
            sector_codigo="AUT",
        )
        db_session.add(bul)
        await db_session.flush()

        svc = BulletinService(db_session)
        items, total = await svc.list(1, 10, None, None, None, None, None, None)
        assert total >= 1


class TestCompetitivenessServiceFilters:
    @pytest.mark.asyncio
    async def test_competitiveness_filter(self, db_session):
        from app.services.competitiveness_service import CompetitivenessService
        await _create_sector(db_session)
        ci = CompetitivenessIndex(
            indicador="Test",
            sector="Test Sector",
            valor=10.0,
            pais="CU",
            periodo="2024",
            fuente="test",
            sector_codigo="AUT",
        )
        db_session.add(ci)
        await db_session.flush()

        svc = CompetitivenessService(db_session)
        items, total = await svc.list(1, 10, "AUT", "2024", None, None, None)
        assert total >= 1


class TestIndustrialSectorServiceFilters:
    @pytest.mark.asyncio
    async def test_industrial_sector_search(self, db_session):
        from app.services.industrial_sector_service import IndustrialSectorService
        await _create_sector(db_session, "AUT")

        svc = IndustrialSectorService(db_session)
        items, total = await svc.list(1, 10, "Sector")
        assert total >= 1

    @pytest.mark.asyncio
    async def test_industrial_sector_no_search(self, db_session):
        from app.services.industrial_sector_service import IndustrialSectorService
        await _create_sector(db_session, "FAR")

        svc = IndustrialSectorService(db_session)
        items, total = await svc.list(1, 10, None)
        assert total >= 1


class TestOrganizationServiceFilters:
    @pytest.mark.asyncio
    async def test_organization_search(self, db_session):
        from app.services.organization_service import OrganizationService
        await _create_sector(db_session)
        await _create_org(db_session)

        svc = OrganizationService(db_session)
        items, total = await svc.list(
            1, 10, None, None, "test", None, None, None, "desc"
        )
        assert total >= 1

    @pytest.mark.asyncio
    async def test_organization_filters(self, db_session):
        from app.services.organization_service import OrganizationService
        await _create_sector(db_session)
        await _create_org(db_session, pais="CU", provincia="La Habana")

        svc = OrganizationService(db_session)
        items, total = await svc.list(
            1, 10, "empresa", None, None, "CU", "La Habana", None, "desc"
        )
        assert total >= 1


class TestPatentMapServiceFilters:
    @pytest.mark.asyncio
    async def test_patent_map_summary_filters(self, db_session):
        from app.services.patent_map_service import PatentMapService
        await _create_sector(db_session)
        entry = PatentMapEntry(
            tecnologia="AI",
            pais="CU",
            total_patentes=10,
            periodo="2024",
            tendencia="up",
            sector_codigo="AUT",
        )
        db_session.add(entry)
        await db_session.flush()

        svc = PatentMapService(db_session)
        items = await svc.summary(pais="CU", sector_codigo="AUT")
        assert len(items) >= 1

    @pytest.mark.asyncio
    async def test_patent_map_summary_no_filter(self, db_session):
        from app.services.patent_map_service import PatentMapService
        await _create_sector(db_session)
        entry = PatentMapEntry(
            tecnologia="ML",
            pais="US",
            total_patentes=20,
            periodo="2024",
            tendencia="stable",
            sector_codigo="AUT",
        )
        db_session.add(entry)
        await db_session.flush()

        svc = PatentMapService(db_session)
        items = await svc.summary()
        assert len(items) >= 1


class TestIndicatorServiceFilters:
    @pytest.mark.asyncio
    async def test_indicator_filter_period(self, db_session):
        from app.services.indicator_service import IndicatorService
        await _create_sector(db_session)
        ind = Indicator(
            name="Test Indicator",
            code="TI-001",
            description="test",
            unit="%",
            value=10,
            source="test",
            period="annual",
            sector_codigo="AUT",
        )
        db_session.add(ind)
        await db_session.flush()

        svc = IndicatorService(db_session)
        items, total = await svc.list(1, 10, "AUT", "annual", None, None)
        assert total >= 1

    @pytest.mark.asyncio
    async def test_indicator_search(self, db_session):
        from app.services.indicator_service import IndicatorService
        await _create_sector(db_session)
        ind = Indicator(
            name="GDP Growth",
            code="GDP-001",
            description="test",
            unit="%",
            value=5,
            source="test",
            period="annual",
            sector_codigo="AUT",
        )
        db_session.add(ind)
        await db_session.flush()

        svc = IndicatorService(db_session)
        items, total = await svc.list(1, 10, None, None, "GDP", None)
        assert total >= 1


# ---------------------------------------------------------------------------
# Schema validators
# ---------------------------------------------------------------------------

class TestSchemaValidators:
    def test_technology_palabras_clave(self):
        from app.schemas.technology import TechnologyCreate
        t = TechnologyCreate(
            nombre="AI", palabras_clave=["  ML  ", "", "DL"]
        )
        assert t.palabras_clave == ["ml", "dl"]

    def test_technology_update_palabras_clave(self):
        from app.schemas.technology import TechnologyUpdate
        t = TechnologyUpdate(palabras_clave=["  ML  ", "", "DL"])
        assert t.palabras_clave == ["ml", "dl"]

    def test_technology_update_palabras_clave_none(self):
        from app.schemas.technology import TechnologyUpdate
        t = TechnologyUpdate(palabras_clave=None)
        assert t.palabras_clave is None

    def test_user_update_invalid_email(self):
        from app.schemas.user import UserUpdate
        with pytest.raises(ValidationError):
            UserUpdate(email="not-an-email")

    def test_user_update_valid_email(self):
        from app.schemas.user import UserUpdate
        u = UserUpdate(email="valid@test.com")
        assert u.email == "valid@test.com"

    def test_user_update_invalid_role(self):
        from app.schemas.user import UserUpdate
        with pytest.raises(ValidationError):
            UserUpdate(role="superadmin")


# ---------------------------------------------------------------------------
# Core config
# ---------------------------------------------------------------------------

class TestCoreConfig:
    def test_settings_load(self):
        from app.core.config import settings
        assert settings.database_url is not None


# ---------------------------------------------------------------------------
# Core init_db
# ---------------------------------------------------------------------------

class TestCoreInitDb:
    @pytest.mark.asyncio
    async def test_init_db_success(self, db_session):
        from app.core.init_db import init_db
        await init_db(db_session)

    @pytest.mark.asyncio
    async def test_init_db_idempotent(self, db_session):
        from app.core.init_db import init_db
        await init_db(db_session)
        await init_db(db_session)


# ---------------------------------------------------------------------------
# Core DB
# ---------------------------------------------------------------------------

class TestCoreDb:
    @pytest.mark.asyncio
    async def test_close_db(self):
        import app.core.db as db_mod
        engine = db_mod._engine
        await db_mod.close_db()
        assert db_mod._engine is None
        db_mod._engine = engine

    @pytest.mark.asyncio
    async def test_get_db_runtime_error(self):
        import app.core.db as db_mod
        old = db_mod._session_factory
        db_mod._session_factory = None
        try:
            with pytest.raises(RuntimeError):
                async for _ in db_mod.get_db():
                    pass
        finally:
            db_mod._session_factory = old


# ---------------------------------------------------------------------------
# Email service
# ---------------------------------------------------------------------------

class TestEmailService:
    @pytest.mark.asyncio
    async def test_email_smtp_not_configured(self):
        from app.services import email_service
        with patch.object(email_service, "settings") as mock_settings:
            mock_settings.smtp_host = ""
            result = await email_service._send_email(
                "test@test.com", "Subject", "<p>Hi</p>"
            )
            assert result is False

    @pytest.mark.asyncio
    async def test_notify_approval(self):
        from app.services import email_service
        with patch.object(
            email_service, "_send_email",
            new_callable=AsyncMock, return_value=True,
        ) as mock_send:
            result = await email_service.notify_approval(
                "test@test.com", "John"
            )
            assert result is True
            mock_send.assert_called_once()

    @pytest.mark.asyncio
    async def test_notify_rejection(self):
        from app.services import email_service
        with patch.object(
            email_service, "_send_email",
            new_callable=AsyncMock, return_value=True,
        ) as mock_send:
            result = await email_service.notify_rejection(
                "test@test.com", "John", "Not qualified"
            )
            assert result is True
            mock_send.assert_called_once()

    @pytest.mark.asyncio
    async def test_build_mime(self):
        from app.services.email_service import _build_mime
        mime = _build_mime("to@test.com", "Subject", "<p>Hi</p>")
        assert "to@test.com" in mime
        assert "Subject" in mime


# ---------------------------------------------------------------------------
# Graph delete_missing validation
# ---------------------------------------------------------------------------

class TestGraphDeleteMissing:
    @pytest.mark.asyncio
    async def test_delete_missing_invalid_label(self):
        from app.graph.repository import GraphRepository
        with pytest.raises(ValueError, match="Invalid node label"):
            await GraphRepository._delete_missing(None, "EvilLabel", "id", [])

    @pytest.mark.asyncio
    async def test_delete_missing_invalid_key(self):
        from app.graph.repository import GraphRepository
        with pytest.raises(ValueError, match="Invalid node key"):
            await GraphRepository._delete_missing(
                None, "Organization", "evil_key", []
            )

    @pytest.mark.asyncio
    async def test_delete_missing_empty_ids(self):
        from app.graph.repository import GraphRepository
        session = _FakeSession()
        count = await GraphRepository._delete_missing(
            session, "Organization", "id", []
        )
        assert count >= 0


# ---------------------------------------------------------------------------
# Dashboard timeline with data
# ---------------------------------------------------------------------------

class TestDashboardTimelineWithData:
    @pytest.mark.asyncio
    async def test_timeline_with_sectors(self, client, db_session):
        user = await _create_user(db_session)
        token = _token(user)
        await _create_sector(db_session, "AUT")
        await _create_sector(db_session, "FAR")
        await _create_org(db_session, sector_codigo="AUT")

        ind = Indicator(
            name="Test",
            code="T-001",
            description="d",
            unit="%",
            value=1,
            source="s",
            period="annual",
            sector_codigo="AUT",
        )
        db_session.add(ind)
        await db_session.flush()

        resp = await client.get(
            "/api/v1/dashboard/timeline",
            params={"sector_codigos": "AUT,FAR", "limit": 5},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 200


# ---------------------------------------------------------------------------
# Alert list date range
# ---------------------------------------------------------------------------

class TestAlertListAdvancedFilters:
    @pytest.mark.asyncio
    async def test_alert_list_date_range(self, client, db_session):
        user = await _create_user(db_session)
        token = _token(user)
        await _create_sector(db_session)
        await client.post(
            "/api/v1/alerts",
            json={
                "titulo": "Date Alert",
                "descripcion": "desc",
                "severidad": "baja",
                "fecha": "2024-03-15T12:00:00Z",
                "sector_codigo": "AUT",
            },
            headers={"Authorization": f"Bearer {token}"},
        )
        resp = await client.get(
            "/api/v1/alerts",
            params={"fecha_desde": "2024-01-01", "fecha_hasta": "2024-12-31"},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 200


# ---------------------------------------------------------------------------
# Research publication list mine
# ---------------------------------------------------------------------------

class TestResearchPublicationListMine:
    @pytest.mark.asyncio
    async def test_list_mine(self, client, db_session):
        user = await _create_user(db_session, full_name="Mine Author")
        token = _token(user)
        await _create_sector(db_session)
        pub = ResearchPublication(
            titulo="My Paper",
            autores="Mine Author",
            resumen="Abstract",
            fecha_publicacion=datetime(2024, 1, 1),
            sector_codigo="AUT",
        )
        db_session.add(pub)
        await db_session.flush()

        resp = await client.get(
            "/api/v1/research-publications",
            params={"mine": True},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 200
        items = resp.json()["items"]
        assert any(p["titulo"] == "My Paper" for p in items)


# ---------------------------------------------------------------------------
# Organization filters
# ---------------------------------------------------------------------------

class TestOrganizationFilters:
    @pytest.mark.asyncio
    async def test_list_with_filters(self, client, db_session):
        await _create_sector(db_session)
        await _create_org(db_session, pais="CU", provincia="La Habana")

        resp = await client.get(
            "/api/v1/organizations",
            params={
                "q": "test", "pais": "CU",
                "provincia": "La Habana", "tipo": "empresa",
                "sector_codigos": "AUT", "sort_by": "nombre",
            },
        )
        assert resp.status_code == 200


# ---------------------------------------------------------------------------
# Professional profile service search
# ---------------------------------------------------------------------------

class TestProfessionalProfileServiceSearch:
    @pytest.mark.asyncio
    async def test_list_professionals_search(self, db_session):
        from app.services.professional_profile_service import (
            ProfessionalProfileService,
        )
        user = await _create_user(db_session, full_name="Dr. Smith", role=UserRole.PROFESIONAL)
        pp = ProfessionalProfile(user_id=user.id, especialidad="CS")
        db_session.add(pp)
        await db_session.flush()

        svc = ProfessionalProfileService(db_session)
        items, total = await svc.list_professionals(
            1, 10, None, "Smith", None, "desc"
        )
        assert total >= 1

    @pytest.mark.asyncio
    async def test_list_professionals_sort_email(self, db_session):
        from app.services.professional_profile_service import (
            ProfessionalProfileService,
        )
        user = await _create_user(db_session, email="sort@test.com", role=UserRole.PROFESIONAL)
        pp = ProfessionalProfile(user_id=user.id, especialidad="CS")
        db_session.add(pp)
        await db_session.flush()

        svc = ProfessionalProfileService(db_session)
        items, total = await svc.list_professionals(1, 10, None, None, None, "asc")
        assert total >= 1

    @pytest.mark.asyncio
    async def test_list_professionals_filter_especialidad(self, db_session):
        from app.services.professional_profile_service import (
            ProfessionalProfileService,
        )
        user = await _create_user(db_session, role=UserRole.PROFESIONAL)
        pp = ProfessionalProfile(user_id=user.id, especialidad="AI")
        db_session.add(pp)
        await db_session.flush()

        svc = ProfessionalProfileService(db_session)
        items, total = await svc.list_professionals(
            1, 10, "AI", None, None, None
        )
        assert total >= 1
