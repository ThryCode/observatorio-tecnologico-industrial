---
name: testing
description: Testing conventions and patterns for backend and frontend
metadata:
  version: "1.0.0"
  category: "quality"
  tags: ["pytest", "testing", "tdd", "quality"]
---

# Testing Conventions

## When To Use
- Writing new tests for backend endpoints
- Adding test fixtures
- Setting up test infrastructure
- Reviewing test coverage

## Backend Testing (pytest)

### Configuration
- Framework: pytest + pytest-asyncio
- Config: `backend/pyproject.toml` - `asyncio_mode = "auto"`
- Test DB: `postgresql+asyncpg://observatorio:observatorio_dev@localhost:5432/observatorio_test`

### Fixtures (from `backend/tests/conftest.py`)

#### Session-Scoped (once per test session)
```python
@pytest.fixture(scope="session")
async def engine():
    engine = create_async_engine(TEST_DATABASE_URL)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
```

#### Per-Test (rollback after each test)
```python
@pytest.fixture
async def db_session(engine):
    async with engine.connect() as conn:
        transaction = await conn.begin()
        session = AsyncSession(bind=conn, expire_on_commit=False)
        yield session
        await transaction.rollback()
```

#### HTTP Client
```python
@pytest.fixture
def client(db_session):
    app.dependency_overrides[get_db] = lambda: db_session
    transport = ASGITransport(app=app)
    return AsyncClient(transport=transport, base_url="http://test")
```

### Test Patterns

#### CRUD Test
```python
async def test_create_patent(client: AsyncClient):
    response = await client.post("/api/v1/patents", json={
        "title": "Test Patent",
        "patent_number": "CU-2026-001",
        "applicant": "Test Corp",
        "filing_date": "2026-01-15",
        "status": "filed",
        "country": "CU"
    })
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Test Patent"
    assert "id" in data
```

#### List with Pagination
```python
async def test_list_patents(client: AsyncClient):
    response = await client.get("/api/v1/patents?skip=0&limit=10")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data
    assert isinstance(data["items"], list)
```

#### Not Found
```python
async def test_get_patent_not_found(client: AsyncClient):
    response = await client.get("/api/v1/patents/nonexistent-id")
    assert response.status_code == 404
```

#### Authentication
```python
async def test_protected_endpoint_no_auth(client: AsyncClient):
    response = await client.post("/api/v1/patents", json={...})
    assert response.status_code == 401

async def test_protected_endpoint_with_auth(client: AsyncClient, auth_headers):
    response = await client.post("/api/v1/patents", json={...}, headers=auth_headers)
    assert response.status_code == 201
```

### Test Naming Convention
```
test_<action>_<entity>
test_<action>_<entity>_<condition>

Examples:
test_create_patent
test_list_patents_empty
test_get_patent_not_found
test_login_invalid_credentials
```

### Running Tests
```bash
cd backend

# Run all tests
pytest -v

# Run specific file
pytest tests/test_patents.py -v

# Run specific test
pytest tests/test_patents.py::test_create_patent -v

# With coverage
pytest --cov=app --cov-report=term-missing
```

## Graph Tests
```python
async def test_graph_stats(client: AsyncClient):
    response = await client.get("/api/v1/graph/stats")
    # Accept 200 (Neo4j available) or 503 (unavailable)
    assert response.status_code in [200, 503]
```

## Frontend Testing
- No test framework configured yet
- When added: Vitest + React Testing Library
- Component tests: render, interaction, state changes
- Hook tests: renderHook with QueryClient wrapper

## Coverage Targets
- Backend endpoints: 100% of CRUD operations
- Auth flow: all paths (success, failure, expired)
- Error cases: 404, 422, 401, 403
- Graph: smoke tests only (accepts 503)

## Guardrails
- Tests must be independent (no shared state)
- Use fixtures for setup/teardown
- Rollback transactions (never commit to test DB)
- Accept 503 for graph tests
- Test both success and failure paths

## Anti-Patterns
- DON'T depend on test execution order
- DON'T use real credentials in tests
- DON'T skip error path testing
- DON'T hardcode IDs (use generated values)
- DON'T leave test data in the database

## Done Checklist
- [ ] Test follows naming convention
- [ ] Both success and failure cases tested
- [ ] Test is independent (no external dependencies)
- [ ] Fixtures used for setup/teardown
- [ ] `pytest -v` passes
