"""Comprehensive tests for remaining coverage gaps."""
from __future__ import annotations

import uuid
from datetime import date, datetime
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from sqlalchemy import select

from app.core.security import get_password_hash
from app.graph.repository import GraphRepository
from app.models.follow import Follow
from app.models.industrial_sector import IndustrialSector
from app.models.organization import Organization
from app.models.professional_profile import ProfessionalProfile
from app.models.research_publication import ResearchPublication
from app.models.user import User


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _make_user(db, **overrides):
    defaults = dict(
        username=f"u_{uuid.uuid4().hex[:8]}",
        email=f"{uuid.uuid4().hex[:8]}@test.com",
        hashed_password=get_password_hash("secret123"),
        full_name="Test User",
        role="user",
        is_superuser=False,
        is_active=True,
        status="approved",
    )
    defaults.update(overrides)
    user = User(**defaults)
    db.add(user)
    return user


def _make_org(db, **overrides):
    defaults = dict(
        nombre=f"Org {uuid.uuid4().hex[:6]}",
        siglas=uuid.uuid4().hex[:6].upper(),
        tipo="universidad",
        pais="Cuba",
        provincia="La Habana",
    )
    defaults.update(overrides)
    org = Organization(**defaults)
    db.add(org)
    return org


async def _seed_sector(db, codigo="AUT"):
    stmt = select(IndustrialSector).where(IndustrialSector.codigo == codigo)
    existing = (await db.execute(stmt)).scalar_one_or_none()
    if not existing:
        db.add(IndustrialSector(codigo=codigo, nombre="Automotriz", descripcion="Test sector"))
        await db.flush()
    return codigo


# ---------------------------------------------------------------------------
# Neo4j mocks
# ---------------------------------------------------------------------------
class MockRecord:
    def __init__(self, data=None, **kwargs):
        self._data = data if data is not None else kwargs
    def data(self):
        return self._data
    def __getitem__(self, key):
        return self._data[key]
    def get(self, key, default=None):
        return self._data.get(key, default)
    def keys(self):
        return self._data.keys()
    def __iter__(self):
        return iter(self._data)
    def __contains__(self, key):
        return key in self._data


class MockResult:
    def __init__(self, records=None):
        self._records = records or []
        self._idx = 0
    async def single(self):
        return self._records[0] if self._records else None
    async def data(self):
        return [r.data() for r in self._records]
    def __aiter__(self):
        return self
    async def __anext__(self):
        if self._idx >= len(self._records):
            raise StopAsyncIteration
        r = self._records[self._idx]
        self._idx += 1
        return r


class MockSession:
    def __init__(self, responses=None):
        self._responses = list(responses) if responses else []
        self._call = 0
    async def run(self, query, *args, **kwargs):
        if self._call < len(self._responses):
            r = self._responses[self._call]
            self._call += 1
            if isinstance(r, MockResult):
                return r
            if isinstance(r, list):
                return MockResult(r)
            return MockResult([r])
        return MockResult([])
    async def __aenter__(self):
        return self
    async def __aexit__(self, *args):
        pass


class MockDriver:
    def __init__(self, session=None):
        self._session = session or MockSession()
    def session(self):
        return self._session


# ---------------------------------------------------------------------------
# graph/models.py
# ---------------------------------------------------------------------------
class TestGraphModels:
    def test_node_labels_non_empty(self):
        from app.graph.models import NODE_LABELS, RELATIONSHIPS
        assert len(NODE_LABELS) > 0
        assert len(RELATIONSHIPS) > 0
        assert "Technology" in NODE_LABELS
        assert "Organization" in NODE_LABELS

    def test_relationships_structure(self):
        from app.graph.models import RELATIONSHIPS
        for src, rel, dst in RELATIONSHIPS:
            assert isinstance(src, str)
            assert isinstance(rel, str)
            assert isinstance(dst, str)


# ---------------------------------------------------------------------------
# graph/repository.py — explore_node non-APOC
# ---------------------------------------------------------------------------
class TestExploreNodeNonApoc:
    @pytest.mark.asyncio
    async def test_apoc_fallback_with_nodes(self):
        class FakeNode:
            def __init__(self, nid, labels, props):
                self._props = props
                self._labels = labels
                self.element_id = nid
            def get(self, key, default=None):
                return self._props.get(key, default)
            def __getitem__(self, key):
                return self._props[key]
            @property
            def labels(self):
                return self._labels
            def keys(self):
                return self._props.keys()
            def __iter__(self):
                return iter(self._props)

        node1 = FakeNode("n1", ["Technology"], {"id": "n1", "codigo": None})
        node2 = FakeNode("n2", ["Organization"], {"id": "n2", "codigo": None})
        edge_rec = MockRecord({"source": "n1", "target": "n2", "type": "OPERATES_IN"})
        node_rec = MockRecord({"all_nodes": [node1, node2]})

        class FallbackSession:
            def __init__(self):
                self._calls = 0
            async def run(self, query, **kwargs):
                self._calls += 1
                if "apoc.version" in query:
                    raise Exception("APOC not available")
                if "all_nodes" in query:
                    return MockResult([node_rec])
                if "coalesce(a.id" in query:
                    return MockResult([edge_rec])
                return MockResult([])
            async def __aenter__(self):
                return self
            async def __aexit__(self, *args):
                pass

        driver = MockDriver()
        driver.session = lambda: FallbackSession()
        repo = GraphRepository(driver)
        result = await repo.explore_node("n1", depth=2)
        assert result["total_nodes"] == 2
        assert result["total_edges"] == 1

    @pytest.mark.asyncio
    async def test_apoc_fallback_no_record(self):
        class EmptySession:
            async def run(self, query, **kwargs):
                if "apoc.version" in query:
                    raise Exception("APOC not available")
                return MockResult([])
            async def __aenter__(self):
                return self
            async def __aexit__(self, *args):
                pass

        driver = MockDriver()
        driver.session = lambda: EmptySession()
        repo = GraphRepository(driver)
        result = await repo.explore_node("n1")
        assert result["total_nodes"] == 0

    @pytest.mark.asyncio
    async def test_apoc_no_record(self):
        class ApocEmptySession:
            async def run(self, query, **kwargs):
                if "apoc.version" in query:
                    return MockResult([MockRecord({"v": "4.0.0"})])
                return MockResult([])
            async def __aenter__(self):
                return self
            async def __aexit__(self, *args):
                pass

        driver = MockDriver()
        driver.session = lambda: ApocEmptySession()
        repo = GraphRepository(driver)
        result = await repo.explore_node("n1")
        assert result["total_nodes"] == 0


# ---------------------------------------------------------------------------
# graph/repository.py — query_graph with sectors
# ---------------------------------------------------------------------------
class TestQueryGraphSectors:
    @pytest.mark.asyncio
    async def test_query_with_sectors(self):
        node_data = {"id": "n1", "codigo": None, "labels": ["Org"], "props": {"nombre": "X"}}
        edge_data = {"sid": "n1", "scod": None, "tid": "n2", "tcod": None, "type": "REL"}

        class SectorSession:
            async def run(self, query, **kwargs):
                if "labels(n)" in query and "BELONGS_TO_SECTOR" in query:
                    return MockResult([MockRecord(node_data)])
                if "type(r)" in query and "BELONGS_TO_SECTOR" in query:
                    return MockResult([MockRecord(edge_data)])
                return MockResult([])
            async def __aenter__(self):
                return self
            async def __aexit__(self, *args):
                pass

        driver = MockDriver()
        driver.session = lambda: SectorSession()
        repo = GraphRepository(driver)
        result = await repo.query_graph(limit=100, sector_codigos=["AUT"])
        assert result["total_nodes"] == 1
        assert result["total_edges"] == 1


# ---------------------------------------------------------------------------
# graph/repository.py — search_nodes
# ---------------------------------------------------------------------------
class TestSearchNodes:
    @pytest.mark.asyncio
    async def test_search_with_labels(self):
        search_rec = MockRecord({"n": {"id": "n1"}, "node_labels": ["Technology"]})
        count_rec = MockRecord({"total": 1})

        class SearchSession:
            def __init__(self):
                self._calls = 0
            async def run(self, query, *args, **kwargs):
                self._calls += 1
                if "count(*)" in query:
                    return MockResult([count_rec])
                return MockResult([search_rec])
            async def __aenter__(self):
                return self
            async def __aexit__(self, *args):
                pass

        driver = MockDriver()
        driver.session = lambda: SearchSession()
        repo = GraphRepository(driver)
        result = await repo.search_nodes("test", labels=["Technology"])
        assert result["total"] == 1
        assert len(result["items"]) == 1

    @pytest.mark.asyncio
    async def test_search_no_labels(self):
        count_rec = MockRecord({"total": 0})

        class SearchSession:
            async def run(self, query, *args, **kwargs):
                if "count(*)" in query:
                    return MockResult([count_rec])
                return MockResult([])
            async def __aenter__(self):
                return self
            async def __aexit__(self, *args):
                pass

        driver = MockDriver()
        driver.session = lambda: SearchSession()
        repo = GraphRepository(driver)
        result = await repo.search_nodes("test")
        assert result["total"] == 0


# ---------------------------------------------------------------------------
# graph/repository.py — shortest_path with APOC
# ---------------------------------------------------------------------------
class TestShortestPathApoc:
    @pytest.mark.asyncio
    async def test_shortest_path_apoc(self):
        path_rec = MockRecord({
            "node_ids": ["a", "b"], "rel_types": ["CONNECTS"], "weight": 1.0,
        })

        class ApocPathSession:
            def __init__(self):
                self._calls = 0
            async def run(self, query, **kwargs):
                self._calls += 1
                if "apoc.version" in query:
                    return MockResult([MockRecord({"v": "4.0.0"})])
                if "dijkstra" in query:
                    return MockResult([path_rec])
                return MockResult([])
            async def __aenter__(self):
                return self
            async def __aexit__(self, *args):
                pass

        driver = MockDriver()
        driver.session = lambda: ApocPathSession()
        repo = GraphRepository(driver)
        result = await repo.shortest_path("a", "b")
        assert result is not None
        assert result["node_ids"] == ["a", "b"]


# ---------------------------------------------------------------------------
# graph/repository.py — recommendations_for_org
# ---------------------------------------------------------------------------
class TestRecommendations:
    @pytest.mark.asyncio
    async def test_recommendations(self):
        rec_node = {"id": "rec1", "nombre": "Rec Org"}
        rec_rec = MockRecord({
            "rec": rec_node,
            "labels": ["Organization"],
            "sector": "Automotriz",
        })

        class RecSession:
            async def run(self, query, **kwargs):
                return MockResult([rec_rec])
            async def __aenter__(self):
                return self
            async def __aexit__(self, *args):
                pass

        driver = MockDriver()
        driver.session = lambda: RecSession()
        repo = GraphRepository(driver)
        result = await repo.recommendations_for_org("org1")
        assert result["total"] == 1
        assert result["items"][0]["type"] == "Organization"

    def test_primary_label(self):
        assert GraphRepository._primary_label(["Technology", "Organization"]) == "Technology"
        assert GraphRepository._primary_label(["Organization"]) == "Organization"
        assert GraphRepository._primary_label([]) == "Unknown"
        assert GraphRepository._primary_label(["Patent"]) == "Patent"

    def test_recommendation_reason(self):
        assert "sector" in GraphRepository._recommendation_reason("Technology", "AUT")
        assert "sector" in GraphRepository._recommendation_reason("Organization", None)
        assert "Relacionado" in GraphRepository._recommendation_reason("Unknown", None)


# ---------------------------------------------------------------------------
# graph/repository.py — _delete_missing
# ---------------------------------------------------------------------------
class TestDeleteMissing:
    @pytest.mark.asyncio
    async def test_invalid_label(self):
        driver = MockDriver()
        repo = GraphRepository(driver)
        with pytest.raises(ValueError, match="Invalid node label"):
            await repo._delete_missing(MockSession(), "InvalidLabel", "id", ["a"])

    @pytest.mark.asyncio
    async def test_invalid_key(self):
        driver = MockDriver()
        repo = GraphRepository(driver)
        with pytest.raises(ValueError, match="Invalid node key"):
            await repo._delete_missing(MockSession(), "Organization", "bad_key", ["a"])

    @pytest.mark.asyncio
    async def test_empty_valid_ids(self):
        del_rec = MockRecord({"deleted": 3})
        session = MockSession([del_rec])
        driver = MockDriver()
        repo = GraphRepository(driver)
        result = await repo._delete_missing(session, "Organization", "id", [])
        assert result == 3

    @pytest.mark.asyncio
    async def test_with_valid_ids(self):
        del_rec = MockRecord({"deleted": 1})
        session = MockSession([del_rec])
        driver = MockDriver()
        repo = GraphRepository(driver)
        result = await repo._delete_missing(session, "Organization", "id", ["a", "b"])
        assert result == 1


# ---------------------------------------------------------------------------
# graph/repository.py — _ensure_constraints
# ---------------------------------------------------------------------------
class TestEnsureConstraints:
    @pytest.mark.asyncio
    async def test_ensure_constraints_error(self):
        class ErrorSession:
            async def run(self, query, **kwargs):
                raise Exception("constraint error")
            async def __aenter__(self):
                return self
            async def __aexit__(self, *args):
                pass

        driver = MockDriver()
        repo = GraphRepository(driver)
        await repo._ensure_constraints(ErrorSession())


# ---------------------------------------------------------------------------
# ws_manager.py
# ---------------------------------------------------------------------------
class TestWSManager:
    @pytest.mark.asyncio
    async def test_connect_and_disconnect(self):
        from app.ws_manager import ConnectionManager
        mgr = ConnectionManager()
        ws = MagicMock()
        ws.accept = AsyncMock()
        await mgr.connect(ws, "user1")
        assert "user1" in mgr._connections
        mgr.disconnect(ws, "user1")
        assert "user1" not in mgr._connections

    @pytest.mark.asyncio
    async def test_send_to_user(self):
        from app.ws_manager import ConnectionManager
        mgr = ConnectionManager()
        ws = MagicMock()
        ws.send_json = AsyncMock()
        mgr.register(ws, "user1")
        await mgr.send_to_user("user1", {"msg": "hi"})
        ws.send_json.assert_called_once_with({"msg": "hi"})

    @pytest.mark.asyncio
    async def test_send_to_user_error(self):
        from app.ws_manager import ConnectionManager
        mgr = ConnectionManager()
        ws = MagicMock()
        ws.send_json = AsyncMock(side_effect=Exception("fail"))
        mgr.register(ws, "user1")
        await mgr.send_to_user("user1", {"msg": "hi"})
        assert "user1" not in mgr._connections

    @pytest.mark.asyncio
    async def test_broadcast(self):
        from app.ws_manager import ConnectionManager
        mgr = ConnectionManager()
        ws1 = MagicMock()
        ws1.send_json = AsyncMock()
        ws2 = MagicMock()
        ws2.send_json = AsyncMock()
        mgr.register(ws1, "u1")
        mgr.register(ws2, "u2")
        await mgr.broadcast({"msg": "all"})
        ws1.send_json.assert_called_once()
        ws2.send_json.assert_called_once()

    @pytest.mark.asyncio
    async def test_disconnect_nonexistent(self):
        from app.ws_manager import ConnectionManager
        mgr = ConnectionManager()
        ws = MagicMock()
        mgr.disconnect(ws, "nobody")


# ---------------------------------------------------------------------------
# core/db.py
# ---------------------------------------------------------------------------
class TestCoreDB:
    @pytest.mark.asyncio
    async def test_startup_sqlite(self):
        from app.core import db as db_mod
        mock_engine = MagicMock()
        mock_session_factory = MagicMock()

        with patch("app.core.db.settings") as mock_settings, \
             patch("app.core.db.create_async_engine", return_value=mock_engine) as mock_create, \
             patch("app.core.db.async_sessionmaker", return_value=mock_session_factory):
            mock_settings.database_url = "sqlite+aiosqlite:///test.db"
            mock_session_inst = AsyncMock()
            mock_session_factory.return_value.__aenter__ = AsyncMock(return_value=mock_session_inst)
            mock_session_factory.return_value.__aexit__ = AsyncMock(return_value=False)

            await db_mod.startup_db()
            mock_create.assert_called_once()

        db_mod._engine = None
        db_mod._session_factory = None

    @pytest.mark.asyncio
    async def test_startup_postgres(self):
        from app.core import db as db_mod
        mock_engine = MagicMock()
        mock_session_factory = MagicMock()

        with patch("app.core.db.settings") as mock_settings, \
             patch("app.core.db.create_async_engine", return_value=mock_engine) as mock_create, \
             patch("app.core.db.async_sessionmaker", return_value=mock_session_factory):
            mock_settings.database_url = "postgresql+asyncpg://test:test@localhost/test"
            mock_session_inst = AsyncMock()
            mock_session_factory.return_value.__aenter__ = AsyncMock(return_value=mock_session_inst)
            mock_session_factory.return_value.__aexit__ = AsyncMock(return_value=False)

            await db_mod.startup_db()
            _, kwargs = mock_create.call_args
            assert kwargs.get("pool_size") == 5

        db_mod._engine = None
        db_mod._session_factory = None

    @pytest.mark.asyncio
    async def test_close_db(self):
        from app.core import db as db_mod
        mock_engine = AsyncMock()
        db_mod._engine = mock_engine
        db_mod._session_factory = MagicMock()
        await db_mod.close_db()
        mock_engine.dispose.assert_called_once()
        assert db_mod._engine is None
        assert db_mod._session_factory is None

    @pytest.mark.asyncio
    async def test_close_db_no_engine(self):
        from app.core import db as db_mod
        db_mod._engine = None
        await db_mod.close_db()

    @pytest.mark.asyncio
    async def test_get_db_runtime_error(self):
        from app.core import db as db_mod
        db_mod._session_factory = None
        with pytest.raises(RuntimeError, match="Database not initialized"):
            async for _ in db_mod.get_db():
                pass


# ---------------------------------------------------------------------------
# api/v1/auth.py — update_me, my org, approve/reject
# ---------------------------------------------------------------------------
class TestAuthUpdateMe:
    @pytest.mark.asyncio
    async def test_update_me(self, client, auth_headers):
        headers = await auth_headers("updateme")
        resp = await client.put(
            "/api/v1/auth/me",
            json={"full_name": "New Name", "phone": "555-1234", "job_title": "Dev"},
            headers=headers,
        )
        assert resp.status_code == 200
        assert resp.json()["full_name"] == "New Name"

    @pytest.mark.asyncio
    async def test_get_my_organization(self, client, db_session, auth_headers):
        org = _make_org(db_session)
        await db_session.flush()
        headers = await auth_headers("myorguser")
        user = (await db_session.execute(select(User).where(User.username == "myorguser"))).scalar_one_or_none()
        user.organization_id = org.id
        await db_session.flush()
        resp = await client.get("/api/v1/auth/me/organization", headers=headers)
        assert resp.status_code == 200
        assert "nombre" in resp.json()

    @pytest.mark.asyncio
    async def test_get_my_organization_no_org(self, client, auth_headers):
        headers = await auth_headers("noorguser")
        resp = await client.get("/api/v1/auth/me/organization", headers=headers)
        assert resp.status_code == 404

    @pytest.mark.asyncio
    async def test_create_my_organization(self, client, auth_headers):
        headers = await auth_headers("createorg")
        resp = await client.post(
            "/api/v1/auth/me/organization",
            json={"nombre": "Mi Org", "siglas": "MIORG", "tipo": "universidad"},
            headers=headers,
        )
        assert resp.status_code == 201

    @pytest.mark.asyncio
    async def test_create_my_organization_already_has(self, client, db_session, auth_headers):
        org = _make_org(db_session)
        await db_session.flush()
        headers = await auth_headers("hasorg")
        user = (await db_session.execute(select(User).where(User.username == "hasorg"))).scalar_one_or_none()
        user.organization_id = org.id
        await db_session.flush()
        resp = await client.post(
            "/api/v1/auth/me/organization",
            json={"nombre": "Dup", "siglas": "DUP", "tipo": "empresa"},
            headers=headers,
        )
        assert resp.status_code == 400

    @pytest.mark.asyncio
    async def test_update_my_organization(self, client, db_session, auth_headers):
        org = _make_org(db_session)
        await db_session.flush()
        headers = await auth_headers("updorg")
        user = (await db_session.execute(select(User).where(User.username == "updorg"))).scalar_one_or_none()
        user.organization_id = org.id
        await db_session.flush()
        resp = await client.put(
            "/api/v1/auth/me/organization",
            json={"nombre": "Updated Org"},
            headers=headers,
        )
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_update_my_organization_no_org(self, client, auth_headers):
        headers = await auth_headers("updorgno")
        resp = await client.put(
            "/api/v1/auth/me/organization",
            json={"nombre": "X"},
            headers=headers,
        )
        assert resp.status_code == 404

    @pytest.mark.asyncio
    async def test_approve_and_reject_user(self, client, db_session, superuser_token_headers):
        pending = _make_user(db_session, username="pendingapr", status="pending")
        await db_session.flush()
        uid = str(pending.id)
        resp = await client.post(f"/api/v1/auth/{uid}/approve", headers=superuser_token_headers)
        assert resp.status_code == 200
        assert resp.json()["status"] == "approved"

        pending2 = _make_user(db_session, username="pendingrej", status="pending")
        await db_session.flush()
        uid2 = str(pending2.id)
        resp = await client.post(
            f"/api/v1/auth/{uid2}/reject",
            json={"reason": "Not qualified"},
            headers=superuser_token_headers,
        )
        assert resp.status_code == 200
        assert resp.json()["status"] == "rejected"


# ---------------------------------------------------------------------------
# api/v1/health.py — Neo4j/Redis error paths
# ---------------------------------------------------------------------------
class TestHealthExtended:
    @pytest.mark.asyncio
    async def test_health_neo4j_error(self, client):
        from app.dependencies import get_neo4j, get_redis
        from app.main import app

        mock_neo4j = AsyncMock()
        session_ctx = AsyncMock()
        session_ctx.run.side_effect = Exception("connection refused")
        mock_neo4j.session.return_value.__aenter__ = AsyncMock(return_value=session_ctx)
        mock_neo4j.session.return_value.__aexit__ = AsyncMock(return_value=False)

        app.dependency_overrides[get_neo4j] = lambda: mock_neo4j
        app.dependency_overrides[get_redis] = lambda: None
        try:
            resp = await client.get("/api/v1/health")
            assert resp.status_code == 200
            data = resp.json()
            assert data["services"]["neo4j"]["status"] == "error"
            assert data["status"] == "degraded"
        finally:
            app.dependency_overrides.clear()

    @pytest.mark.asyncio
    async def test_health_redis_error(self, client):
        from app.dependencies import get_neo4j, get_redis
        from app.main import app

        mock_redis = AsyncMock()
        mock_redis.ping.side_effect = Exception("redis down")

        app.dependency_overrides[get_neo4j] = lambda: None
        app.dependency_overrides[get_redis] = lambda: mock_redis
        try:
            resp = await client.get("/api/v1/health")
            assert resp.status_code == 200
            data = resp.json()
            assert data["services"]["redis"]["status"] == "error"
            assert data["status"] == "degraded"
        finally:
            app.dependency_overrides.clear()

    @pytest.mark.asyncio
    async def test_readiness_neo4j_error(self, client):
        from app.dependencies import get_neo4j, get_redis
        from app.main import app

        mock_neo4j = AsyncMock()
        session_ctx = AsyncMock()
        session_ctx.run.side_effect = Exception("down")
        mock_neo4j.session.return_value.__aenter__ = AsyncMock(return_value=session_ctx)
        mock_neo4j.session.return_value.__aexit__ = AsyncMock(return_value=False)

        app.dependency_overrides[get_neo4j] = lambda: mock_neo4j
        app.dependency_overrides[get_redis] = lambda: None
        try:
            resp = await client.get("/api/v1/health/ready")
            assert resp.status_code == 200
            assert resp.json()["status"] == "not ready"
        finally:
            app.dependency_overrides.clear()

    @pytest.mark.asyncio
    async def test_readiness_redis_error(self, client):
        from app.dependencies import get_neo4j, get_redis
        from app.main import app

        mock_redis = AsyncMock()
        mock_redis.ping.side_effect = Exception("down")

        app.dependency_overrides[get_neo4j] = lambda: None
        app.dependency_overrides[get_redis] = lambda: mock_redis
        try:
            resp = await client.get("/api/v1/health/ready")
            assert resp.status_code == 200
            assert resp.json()["status"] == "not ready"
        finally:
            app.dependency_overrides.clear()

    @pytest.mark.asyncio
    async def test_readiness_ok(self, client):
        from app.dependencies import get_neo4j, get_redis
        from app.main import app

        mock_neo4j = MagicMock()
        session_ctx = MagicMock()
        session_ctx.run = AsyncMock()
        mock_neo4j.session.return_value.__aenter__ = AsyncMock(return_value=session_ctx)
        mock_neo4j.session.return_value.__aexit__ = AsyncMock(return_value=False)

        mock_redis = MagicMock()
        mock_redis.ping = AsyncMock()

        app.dependency_overrides[get_neo4j] = lambda: mock_neo4j
        app.dependency_overrides[get_redis] = lambda: mock_redis
        try:
            resp = await client.get("/api/v1/health/ready")
            assert resp.status_code == 200
            assert resp.json()["status"] == "ready"
        finally:
            app.dependency_overrides.clear()

    @pytest.mark.asyncio
    async def test_health_neo4j_ok(self, client):
        from app.dependencies import get_neo4j, get_redis
        from app.main import app

        mock_neo4j = MagicMock()
        session_ctx = MagicMock()
        session_ctx.run = AsyncMock()
        mock_neo4j.session.return_value.__aenter__ = AsyncMock(return_value=session_ctx)
        mock_neo4j.session.return_value.__aexit__ = AsyncMock(return_value=False)

        mock_redis = MagicMock()
        mock_redis.ping = AsyncMock()

        app.dependency_overrides[get_neo4j] = lambda: mock_neo4j
        app.dependency_overrides[get_redis] = lambda: mock_redis
        try:
            resp = await client.get("/api/v1/health")
            assert resp.status_code == 200
            data = resp.json()
            assert data["services"]["neo4j"]["status"] == "ok"
            assert data["services"]["redis"]["status"] == "ok"
            assert data["status"] == "healthy"
        finally:
            app.dependency_overrides.clear()


# ---------------------------------------------------------------------------
# api/v1/dashboard.py — timeline with sectors, follow events
# ---------------------------------------------------------------------------
class TestDashboardExtended:
    @pytest.mark.asyncio
    async def test_timeline_with_sectors(self, client, db_session, auth_headers):
        await _seed_sector(db_session, "AUT")
        await db_session.flush()
        headers = await auth_headers("dashuser")
        resp = await client.get("/api/v1/dashboard/timeline?sector_codigos=AUT", headers=headers)
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_summary_with_sectors(self, client, db_session, auth_headers):
        await _seed_sector(db_session, "AUT")
        await db_session.flush()
        headers = await auth_headers("sumuser")
        resp = await client.get("/api/v1/dashboard/summary?sector_codigos=AUT", headers=headers)
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_follow_events(self, client, db_session, auth_headers):
        await _seed_sector(db_session, "AUT")
        org1 = _make_org(db_session, siglas="FEORG1", sector_codigo="AUT")
        org2 = _make_org(db_session, siglas="FEORG2", sector_codigo="AUT")
        await db_session.flush()
        user = _make_user(db_session, username="feusermanual", full_name="FE User", organization_id=org1.id)
        await db_session.flush()
        follow = Follow(
            follower_id=user.id,
            follower_type="user",
            organization_id=org2.id,
        )
        db_session.add(follow)
        await db_session.flush()
        headers = await auth_headers("feuser2")
        resp = await client.get("/api/v1/dashboard/timeline", headers=headers)
        assert resp.status_code == 200


# ---------------------------------------------------------------------------
# api/v1/graph.py — no neo4j = 503
# ---------------------------------------------------------------------------
class TestGraphNoNeo4j:
    @pytest.mark.asyncio
    async def test_all_endpoints_503(self, client, auth_headers):
        from app.dependencies import get_neo4j
        from app.main import app
        app.dependency_overrides[get_neo4j] = lambda: None
        headers = await auth_headers("guser")
        try:
            for path in ["/api/v1/graph/query", "/api/v1/graph/explore?node_id=x",
                         "/api/v1/graph/search?q=test", "/api/v1/graph/stats"]:
                resp = await client.get(path, headers=headers)
                assert resp.status_code == 503
        finally:
            app.dependency_overrides.clear()


# ---------------------------------------------------------------------------
# api/v1/graph.py — mocked neo4j
# ---------------------------------------------------------------------------
class TestGraphMocked:
    @pytest.mark.asyncio
    async def test_query_mock(self, client, auth_headers):
        from app.dependencies import get_neo4j
        from app.main import app

        node_data = {"id": "n1", "codigo": None, "labels": ["Org"], "props": {}}
        edge_data = {"sid": "n1", "scod": None, "tid": "n2", "tcod": None, "type": "REL"}

        class FakeResult:
            def __init__(self, records):
                self._records = records
            async def data(self):
                return self._records
            def __aiter__(self):
                self._idx = 0
                return self
            async def __anext__(self):
                if self._idx >= len(self._records):
                    raise StopAsyncIteration
                r = self._records[self._idx]
                self._idx += 1
                return r

        call_idx = 0

        async def fake_run(query, *args, **kwargs):
            nonlocal call_idx
            call_idx += 1
            if "labels(n)" in query and "BELONGS_TO_SECTOR" in query:
                return FakeResult([node_data])
            if "type(r)" in query and "BELONGS_TO_SECTOR" in query:
                return FakeResult([edge_data])
            if "n.id" in query and "BELONGS_TO_SECTOR" not in query:
                return FakeResult([node_data])
            if "type(r)" in query and "BELONGS_TO_SECTOR" not in query:
                return FakeResult([edge_data])
            return FakeResult([])

        mock_neo4j = MagicMock()
        mock_session = MagicMock()
        mock_session.run = fake_run
        mock_neo4j.session.return_value.__aenter__ = AsyncMock(return_value=mock_session)
        mock_neo4j.session.return_value.__aexit__ = AsyncMock(return_value=False)

        app.dependency_overrides[get_neo4j] = lambda: mock_neo4j
        headers = await auth_headers("gmock")
        try:
            resp = await client.get("/api/v1/graph/query", headers=headers)
            assert resp.status_code == 200
            data = resp.json()
            assert "nodes" in data
            assert "edges" in data
        finally:
            app.dependency_overrides.clear()

    @pytest.mark.asyncio
    async def test_search_mock(self, client, auth_headers):
        from app.dependencies import get_neo4j
        from app.main import app

        count_rec = MockRecord({"total": 1})
        search_rec = MockRecord({"n": {"id": "n1"}, "node_labels": ["Technology"]})

        class FakeResult:
            def __init__(self, records):
                self._records = records
                self._idx = 0
            async def single(self):
                return self._records[0] if self._records else None
            async def data(self):
                return [r.data() for r in self._records]
            def __aiter__(self):
                return self
            async def __anext__(self):
                if self._idx >= len(self._records):
                    raise StopAsyncIteration
                r = self._records[self._idx]
                self._idx += 1
                return r

        call_idx = 0

        async def fake_run(query, *args, **kwargs):
            nonlocal call_idx
            call_idx += 1
            if "count(*)" in query:
                return FakeResult([count_rec])
            return FakeResult([search_rec])

        mock_neo4j = MagicMock()
        mock_session = MagicMock()
        mock_session.run = fake_run
        mock_neo4j.session.return_value.__aenter__ = AsyncMock(return_value=mock_session)
        mock_neo4j.session.return_value.__aexit__ = AsyncMock(return_value=False)

        app.dependency_overrides[get_neo4j] = lambda: mock_neo4j
        headers = await auth_headers("gsearch")
        try:
            resp = await client.get("/api/v1/graph/search?q=tech", headers=headers)
            assert resp.status_code == 200
        finally:
            app.dependency_overrides.clear()

    @pytest.mark.asyncio
    async def test_explore_mock(self, client, auth_headers):
        from app.dependencies import get_neo4j
        from app.main import app

        explore_rec = MockRecord({
            "nodes": [{"id": "n1", "labels": ["Org"], "props": {}}],
            "edges": [{"source": "n1", "target": "n2", "type": "REL"}],
        })
        apoc_rec = MockRecord({"v": "4.0.0"})

        class FakeResult:
            def __init__(self, records):
                self._records = records
            async def single(self):
                return self._records[0] if self._records else None
            async def data(self):
                return [r.data() for r in self._records]

        call_idx = 0

        async def fake_run(query, **kwargs):
            nonlocal call_idx
            call_idx += 1
            if "apoc.version" in query:
                return FakeResult([apoc_rec])
            return FakeResult([explore_rec])

        mock_neo4j = MagicMock()
        mock_session = MagicMock()
        mock_session.run = fake_run
        mock_neo4j.session.return_value.__aenter__ = AsyncMock(return_value=mock_session)
        mock_neo4j.session.return_value.__aexit__ = AsyncMock(return_value=False)

        app.dependency_overrides[get_neo4j] = lambda: mock_neo4j
        headers = await auth_headers("gexplore")
        try:
            resp = await client.get("/api/v1/graph/explore?node_id=n1", headers=headers)
            assert resp.status_code == 200
        finally:
            app.dependency_overrides.clear()

    @pytest.mark.asyncio
    async def test_stats_mock(self, client, auth_headers):
        from app.dependencies import get_neo4j, get_redis
        from app.main import app

        stat_rec = MockRecord({"label": "Organization", "count": 5})

        class FakeResult:
            def __init__(self, records):
                self._records = records
                self._idx = 0
            async def data(self):
                return [r.data() for r in self._records]
            def __aiter__(self):
                return self
            async def __anext__(self):
                if self._idx >= len(self._records):
                    raise StopAsyncIteration
                r = self._records[self._idx]
                self._idx += 1
                return r

        mock_neo4j = MagicMock()
        mock_session = MagicMock()
        mock_session.run = AsyncMock(return_value=FakeResult([stat_rec]))
        mock_neo4j.session.return_value.__aenter__ = AsyncMock(return_value=mock_session)
        mock_neo4j.session.return_value.__aexit__ = AsyncMock(return_value=False)

        app.dependency_overrides[get_neo4j] = lambda: mock_neo4j
        app.dependency_overrides[get_redis] = lambda: None
        headers = await auth_headers("gstats")
        try:
            resp = await client.get("/api/v1/graph/stats", headers=headers)
            assert resp.status_code == 200
        finally:
            app.dependency_overrides.clear()

    @pytest.mark.asyncio
    async def test_sync_mock(self, client, db_session, auth_headers):
        from app.dependencies import get_neo4j
        from app.main import app

        merge_rec = MockRecord({"merged": 0})
        del_rec = MockRecord({"deleted": 0})

        class FakeResult:
            def __init__(self, records):
                self._records = records
            async def single(self):
                return self._records[0] if self._records else None

        call_idx = 0

        async def fake_run(query, **kwargs):
            nonlocal call_idx
            call_idx += 1
            if "CREATE CONSTRAINT" in query:
                return FakeResult([])
            if "DETACH DELETE" in query:
                return FakeResult([del_rec])
            return FakeResult([merge_rec])

        mock_neo4j = MagicMock()
        mock_session = MagicMock()
        mock_session.run = fake_run
        mock_neo4j.session.return_value.__aenter__ = AsyncMock(return_value=mock_session)
        mock_neo4j.session.return_value.__aexit__ = AsyncMock(return_value=False)

        app.dependency_overrides[get_neo4j] = lambda: mock_neo4j
        headers = await auth_headers("gsync", is_superuser=True)
        try:
            resp = await client.post("/api/v1/graph/sync", headers=headers)
            assert resp.status_code == 200
        finally:
            app.dependency_overrides.clear()

    @pytest.mark.asyncio
    async def test_sync_enterprise_mock(self, client, db_session, auth_headers):
        from app.dependencies import get_neo4j
        from app.main import app

        merge_rec = MockRecord({"merged": 0})
        rel_rec = MockRecord({"merged": 0})

        class FakeResult:
            def __init__(self, records):
                self._records = records
            async def single(self):
                return self._records[0] if self._records else None

        call_idx = 0

        async def fake_run(query, **kwargs):
            nonlocal call_idx
            call_idx += 1
            if "FOLLOWS" in query:
                return FakeResult([rel_rec])
            return FakeResult([merge_rec])

        mock_neo4j = MagicMock()
        mock_session = MagicMock()
        mock_session.run = fake_run
        mock_neo4j.session.return_value.__aenter__ = AsyncMock(return_value=mock_session)
        mock_neo4j.session.return_value.__aexit__ = AsyncMock(return_value=False)

        app.dependency_overrides[get_neo4j] = lambda: mock_neo4j
        headers = await auth_headers("gsyncent", is_superuser=True)
        try:
            resp = await client.post("/api/v1/graph/sync-enterprise", headers=headers)
            assert resp.status_code == 200
        finally:
            app.dependency_overrides.clear()

    @pytest.mark.asyncio
    async def test_recommendations_mock(self, client, db_session, auth_headers):
        from app.dependencies import get_neo4j
        from app.main import app

        org = _make_org(db_session)
        await db_session.flush()
        org_id = str(org.id)

        rec_node = {"id": "rec1", "nombre": "Rec"}
        rec_rec = MockRecord({"rec": rec_node, "labels": ["Technology"], "sector": "AUT"})

        class FakeResult:
            def __init__(self, records):
                self._records = records
                self._idx = 0
            def __aiter__(self):
                return self
            async def __anext__(self):
                if self._idx >= len(self._records):
                    raise StopAsyncIteration
                r = self._records[self._idx]
                self._idx += 1
                return r

        mock_neo4j = MagicMock()
        mock_session = MagicMock()
        mock_session.run = AsyncMock(return_value=FakeResult([rec_rec]))
        mock_neo4j.session.return_value.__aenter__ = AsyncMock(return_value=mock_session)
        mock_neo4j.session.return_value.__aexit__ = AsyncMock(return_value=False)

        app.dependency_overrides[get_neo4j] = lambda: mock_neo4j
        headers = await auth_headers("grec")
        try:
            resp = await client.get(f"/api/v1/graph/recommendations/{org_id}", headers=headers)
            assert resp.status_code == 200
        finally:
            app.dependency_overrides.clear()

    @pytest.mark.asyncio
    async def test_shortest_path_mock(self, client, auth_headers):
        from app.dependencies import get_neo4j
        from app.main import app

        path_rec = MockRecord({
            "node_ids": ["a", "b"], "rel_types": ["X"], "weight": 1,
        })
        apoc_rec = MockRecord({"v": "4.0.0"})

        class FakeResult:
            def __init__(self, records):
                self._records = records
            async def single(self):
                return self._records[0] if self._records else None

        call_idx = 0

        async def fake_run(query, **kwargs):
            nonlocal call_idx
            call_idx += 1
            if "apoc.version" in query:
                return FakeResult([apoc_rec])
            return FakeResult([path_rec])

        mock_neo4j = MagicMock()
        mock_session = MagicMock()
        mock_session.run = fake_run
        mock_neo4j.session.return_value.__aenter__ = AsyncMock(return_value=mock_session)
        mock_neo4j.session.return_value.__aexit__ = AsyncMock(return_value=False)

        app.dependency_overrides[get_neo4j] = lambda: mock_neo4j
        headers = await auth_headers("gpath")
        try:
            resp = await client.get("/api/v1/graph/shortest-path?from=a&to=b", headers=headers)
            assert resp.status_code == 200
        finally:
            app.dependency_overrides.clear()

    @pytest.mark.asyncio
    async def test_stats_cache_hit(self, client, auth_headers):
        from app.dependencies import get_neo4j, get_redis
        from app.main import app

        cached_data = [{"label": "Organization", "count": 5}]
        mock_neo4j = AsyncMock()
        mock_redis = AsyncMock()

        with patch("app.api.v1.graph.get_cached", new_callable=AsyncMock, return_value=cached_data):
            app.dependency_overrides[get_neo4j] = lambda: mock_neo4j
            app.dependency_overrides[get_redis] = lambda: mock_redis
            headers = await auth_headers("gcache")
            try:
                resp = await client.get("/api/v1/graph/stats", headers=headers)
                assert resp.status_code == 200
            finally:
                app.dependency_overrides.clear()


# ---------------------------------------------------------------------------
# api/v1/alerts.py — CRUD with audit
# ---------------------------------------------------------------------------
class TestAlertsCRUD:
    @pytest.mark.asyncio
    async def test_alert_full_cycle(self, client, db_session, auth_headers):
        from app.ws_manager import manager
        headers = await auth_headers("alertcr")
        with patch.object(manager, "send_to_user", new_callable=AsyncMock):
            resp = await client.post(
                "/api/v1/alerts",
                json={"titulo": "Test Alert", "severidad": "alta"},
                headers=headers,
            )
            assert resp.status_code == 201
            alert_id = resp.json()["id"]

            resp = await client.get(f"/api/v1/alerts/{alert_id}", headers=headers)
            assert resp.status_code == 200

            resp = await client.put(
                f"/api/v1/alerts/{alert_id}",
                json={"titulo": "Updated Alert"},
                headers=headers,
            )
            assert resp.status_code == 200
            assert resp.json()["titulo"] == "Updated Alert"

            resp = await client.patch(f"/api/v1/alerts/{alert_id}/read", headers=headers)
            assert resp.status_code == 200
            assert resp.json()["leida"] is True

    @pytest.mark.asyncio
    async def test_alert_list_filters(self, client, db_session, auth_headers):
        headers = await auth_headers("alertfl")
        resp = await client.get(
            "/api/v1/alerts?unread_only=true&severidad=alta",
            headers=headers,
        )
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_alert_read_all(self, client, db_session, auth_headers):
        headers = await auth_headers("alertreadall")
        resp = await client.post("/api/v1/alerts/read-all", headers=headers)
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_alert_delete(self, client, db_session, auth_headers):
        from app.ws_manager import manager
        headers = await auth_headers("alertdel", is_superuser=True)
        with patch.object(manager, "send_to_user", new_callable=AsyncMock):
            resp = await client.post(
                "/api/v1/alerts",
                json={"titulo": "Del Alert", "severidad": "baja"},
                headers=headers,
            )
            alert_id = resp.json()["id"]
            resp = await client.delete(f"/api/v1/alerts/{alert_id}", headers=headers)
            assert resp.status_code == 200


# ---------------------------------------------------------------------------
# api/v1/research_publications.py — permissions
# ---------------------------------------------------------------------------
class TestResearchPubPermissions:
    @pytest.mark.asyncio
    async def test_update_forbidden(self, client, db_session, auth_headers):
        pub = ResearchPublication(
            titulo="Test Pub", autores="Author1",
            fecha_publicacion=datetime(2024, 1, 1),
        )
        db_session.add(pub)
        await db_session.flush()
        pub_id = str(pub.id)

        owner = _make_user(db_session, username="pubowner", full_name="Owner User")
        await db_session.flush()
        pub.created_by = owner.id
        await db_session.flush()

        headers = await auth_headers("notowner")
        resp = await client.put(
            f"/api/v1/research-publications/{pub_id}",
            json={"titulo": "Hacked"},
            headers=headers,
        )
        assert resp.status_code == 403

    @pytest.mark.asyncio
    async def test_delete_forbidden(self, client, db_session, auth_headers):
        pub = ResearchPublication(
            titulo="Del Pub", autores="Author1",
            fecha_publicacion=datetime(2024, 1, 1),
        )
        db_session.add(pub)
        await db_session.flush()
        pub_id = str(pub.id)

        owner = _make_user(db_session, username="pubowner2", full_name="Owner2")
        await db_session.flush()
        pub.created_by = owner.id
        await db_session.flush()

        headers = await auth_headers("notowner2")
        resp = await client.delete(f"/api/v1/research-publications/{pub_id}", headers=headers)
        assert resp.status_code == 403

    @pytest.mark.asyncio
    async def test_list_mine(self, client, db_session, auth_headers):
        pub = ResearchPublication(
            titulo="Mine Pub", autores="Test User",
            fecha_publicacion=datetime(2024, 1, 1),
        )
        db_session.add(pub)
        await db_session.flush()
        headers = await auth_headers("mineuser")
        resp = await client.get("/api/v1/research-publications?mine=true", headers=headers)
        assert resp.status_code == 200


# ---------------------------------------------------------------------------
# dependencies.py
# ---------------------------------------------------------------------------
class TestDependencies:
    @pytest.mark.asyncio
    async def test_get_current_superuser_not_super(self, client, auth_headers):
        headers = await auth_headers("notsuper")
        resp = await client.get("/api/v1/auth/pending", headers=headers)
        assert resp.status_code == 403

    @pytest.mark.asyncio
    async def test_require_role_wrong_role(self, client, auth_headers):
        headers = await auth_headers("wrongrole")
        resp = await client.post("/api/v1/graph/sync", headers=headers)
        assert resp.status_code == 403


# ---------------------------------------------------------------------------
# Services — patent audit
# ---------------------------------------------------------------------------
class TestPatentServiceAudit:
    @pytest.mark.asyncio
    async def test_create_with_audit(self, db_session):
        from app.schemas.patent import PatentCreate
        from app.services.patent_service import PatentService
        user = _make_user(db_session, username="pataudit1")
        await db_session.flush()
        svc = PatentService(db_session)
        data = PatentCreate(
            title="Test Patent", patent_number="CU-2024-001",
            applicant="Test Corp", inventor="John Doe",
            filing_date=date(2024, 1, 1), country="CU",
        )
        patent = await svc.create_with_audit(data, user.id)
        assert patent.patent_number == "CU-2024-001"

    @pytest.mark.asyncio
    async def test_update_with_audit(self, db_session):
        from app.schemas.patent import PatentCreate, PatentUpdate
        from app.services.patent_service import PatentService
        user = _make_user(db_session, username="pataudit2")
        await db_session.flush()
        svc = PatentService(db_session)
        data = PatentCreate(
            title="Upd Patent", patent_number="CU-2024-002",
            applicant="Corp", inventor="Jane",
            filing_date=date(2024, 1, 1), country="CU",
        )
        patent = await svc.create_with_audit(data, user.id)
        updated = await svc.update_with_audit(patent.id, PatentUpdate(title="Updated"), user.id)
        assert updated.title == "Updated"

    @pytest.mark.asyncio
    async def test_delete_with_audit(self, db_session):
        from app.schemas.patent import PatentCreate
        from app.services.patent_service import PatentService
        user = _make_user(db_session, username="pataudit3")
        await db_session.flush()
        svc = PatentService(db_session)
        data = PatentCreate(
            title="Del Patent", patent_number="CU-2024-003",
            applicant="Corp", inventor="X",
            filing_date=date(2024, 1, 1), country="CU",
        )
        patent = await svc.create_with_audit(data, user.id)
        await svc.delete_with_audit(patent.id, user.id)


# ---------------------------------------------------------------------------
# Services — technology audit (no FK sector)
# ---------------------------------------------------------------------------
class TestTechServiceAudit:
    @pytest.mark.asyncio
    async def test_create_with_audit(self, db_session):
        from app.schemas.technology import TechnologyCreate
        from app.services.technology_service import TechnologyService
        user = _make_user(db_session, username="tecaudit1")
        await db_session.flush()
        svc = TechnologyService(db_session)
        data = TechnologyCreate(nombre="Test Tech")
        tech = await svc.create_with_audit(data, user.id)
        assert tech.nombre == "Test Tech"

    @pytest.mark.asyncio
    async def test_update_with_audit(self, db_session):
        from app.schemas.technology import TechnologyCreate, TechnologyUpdate
        from app.services.technology_service import TechnologyService
        user = _make_user(db_session, username="tecaudit2")
        await db_session.flush()
        svc = TechnologyService(db_session)
        data = TechnologyCreate(nombre="Upd Tech")
        tech = await svc.create_with_audit(data, user.id)
        updated = await svc.update_with_audit(tech.id, TechnologyUpdate(nombre="Updated"), user.id)
        assert updated.nombre == "Updated"

    @pytest.mark.asyncio
    async def test_delete_with_audit(self, db_session):
        from app.schemas.technology import TechnologyCreate
        from app.services.technology_service import TechnologyService
        user = _make_user(db_session, username="tecaudit3")
        await db_session.flush()
        svc = TechnologyService(db_session)
        data = TechnologyCreate(nombre="Del Tech")
        tech = await svc.create_with_audit(data, user.id)
        await svc.delete_with_audit(tech.id, user.id)


# ---------------------------------------------------------------------------
# Services — RP list with author/q
# ---------------------------------------------------------------------------
class TestRPListFilters:
    @pytest.mark.asyncio
    async def test_list_with_author(self, db_session):
        from app.services.research_publication_service import ResearchPublicationService
        pub = ResearchPublication(
            titulo="Author Filter", autores="Juan Perez",
            fecha_publicacion=datetime(2024, 1, 1),
        )
        db_session.add(pub)
        await db_session.flush()
        svc = ResearchPublicationService(db_session)
        items, total = await svc.list(1, 20, author_name="Juan")
        assert total >= 1

    @pytest.mark.asyncio
    async def test_list_with_q(self, db_session):
        from app.services.research_publication_service import ResearchPublicationService
        pub = ResearchPublication(
            titulo="Searchable Pub", autores="Test",
            fecha_publicacion=datetime(2024, 1, 1),
        )
        db_session.add(pub)
        await db_session.flush()
        svc = ResearchPublicationService(db_session)
        items, total = await svc.list(1, 20, q="Searchable")
        assert total >= 1


# ---------------------------------------------------------------------------
# Services — professional list
# ---------------------------------------------------------------------------
class TestProfessionalListFilters:
    @pytest.mark.asyncio
    async def test_list_q(self, db_session):
        from app.services.professional_profile_service import ProfessionalProfileService
        user = _make_user(db_session, username="plistq", full_name="Search Me", role="profesional")
        await db_session.flush()
        profile = ProfessionalProfile(
            user_id=user.id, especialidad="AI", grado_cientifico="Dr",
        )
        db_session.add(profile)
        await db_session.flush()
        svc = ProfessionalProfileService(db_session)
        items, total = await svc.list_professionals(1, 20, q="Search Me")
        assert total >= 1

    @pytest.mark.asyncio
    async def test_list_email_sort(self, db_session):
        from app.services.professional_profile_service import ProfessionalProfileService
        user = _make_user(db_session, username="pemailsrt", full_name="Sort User", role="profesional")
        await db_session.flush()
        profile = ProfessionalProfile(
            user_id=user.id, especialidad="ML", grado_cientifico="MSc",
        )
        db_session.add(profile)
        await db_session.flush()
        svc = ProfessionalProfileService(db_session)
        items, total = await svc.list_professionals(1, 20, sort_by="email", sort_order="asc")
        assert total >= 1

    @pytest.mark.asyncio
    async def test_update_not_found(self, db_session):
        from app.core.exceptions import AppException
        from app.schemas.professional import ProfessionalProfileUpdate
        from app.services.professional_profile_service import ProfessionalProfileService
        svc = ProfessionalProfileService(db_session)
        with pytest.raises(AppException):
            await svc.update_my_profile(uuid.uuid4(), ProfessionalProfileUpdate(especialidad="X"))

    @pytest.mark.asyncio
    async def test_get_not_found(self, db_session):
        from app.core.exceptions import AppException
        from app.services.professional_profile_service import ProfessionalProfileService
        svc = ProfessionalProfileService(db_session)
        with pytest.raises(AppException):
            await svc.get_my_profile(uuid.uuid4())


# ---------------------------------------------------------------------------
# file_service.py
# ---------------------------------------------------------------------------
class TestFileService:
    def test_validate_no_ext(self):
        from app.services.file_service import FileServiceError, _validate
        f = MagicMock()
        f.filename = "noext"
        with pytest.raises(FileServiceError, match="extensión"):
            _validate(f)

    def test_validate_bad_ext(self):
        from app.services.file_service import FileServiceError, _validate
        f = MagicMock()
        f.filename = "bad.exe"
        with pytest.raises(FileServiceError, match="no permitida"):
            _validate(f)
