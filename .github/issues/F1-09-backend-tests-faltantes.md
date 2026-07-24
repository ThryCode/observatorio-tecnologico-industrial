# F1-09: Backend tests faltantes

**Etiquetas:** `fase-1`, `backend`, `tests`
**Hito:** Fase 1 — Calidad
**Depende de:** F0-02, F0-04
**Subagente:** `test-writer`
**Skill:** `testing`

---

## Descripción

Actualmente existen 14 archivos de test en `backend/tests/`, pero hay endpoints que **no tienen cobertura**:

| Endpoint sin test | Router | Métodos |
|------------------|--------|---------|
| `/professionals/*` | professionals.py | GET list, GET specialties, GET me, PUT me |
| `/auth/{user_id}/approve` | auth.py | POST |
| `/auth/{user_id}/reject` | auth.py | POST |
| `/auth/pending` | auth.py | GET |
| `/auth/me/organization` | auth.py | GET, POST, PUT |

Además, `backend/tests/factories.py` no tiene factories para `User` ni `ProfessionalProfile`, lo que obliga a repetir código en cada test.

## Archivos afectados

| Archivo | Cambio |
|---------|--------|
| `backend/tests/factories.py` | Agregar `make_user` y `make_professional_profile` |
| `backend/tests/test_professionals.py` | **Nuevo** — tests CRUD para professionals |
| `backend/tests/test_auth.py` | Agregar tests de approve/reject/pending |

## Especificación técnica

### 1. Agregar factories

**Archivo:** `backend/tests/factories.py`

Agregar al final:

```python
from app.core.security import get_password_hash
from app.models.user import User
from app.models.professional_profile import ProfessionalProfile


async def make_user(
    db,
    username: str = "testuser",
    email: str | None = None,
    role: str = "user",
    status: str = "approved",
    is_superuser: bool = False,
) -> User:
    if email is None:
        email = f"{username}@test.com"
    user = User(
        username=username,
        email=email,
        hashed_password=get_password_hash("secret123"),
        full_name=f"Test {username}",
        role=role,
        status=status,
        is_superuser=is_superuser,
    )
    db.add(user)
    await db.flush()
    return user


async def make_professional_profile(
    db,
    user: User | None = None,
    especialidad: str = "Ingenieria Industrial",
) -> ProfessionalProfile:
    if user is None:
        user = await make_user(db)
    profile = ProfessionalProfile(
        user_id=user.id,
        especialidad=especialidad,
        grado_cientifico="Master",
        biografia="Perfil de prueba",
        intereses=["investigacion", "innovacion"],
    )
    db.add(profile)
    await db.flush()
    return profile
```

### 2. Crear `backend/tests/test_professionals.py`

```python
"""Tests for professionals endpoints."""
import pytest
from httpx import AsyncClient, ASGITransport

from app.main import app
from app.dependencies import get_db, get_current_user
from tests.factories import make_user, make_professional_profile


@pytest.mark.asyncio
async def test_list_professionals(client: AsyncClient, db_session):
    profile = await make_professional_profile(db_session)
    await db_session.commit()

    response = await client.get("/api/v1/professionals")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert len(data["items"]) >= 1


@pytest.mark.asyncio
async def test_list_specialties(client: AsyncClient, db_session):
    await make_professional_profile(db_session, especialidad="Nanotecnologia")
    await db_session.commit()

    response = await client.get("/api/v1/professionals/specialties")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "Nanotecnologia" in data["items"]


@pytest.mark.asyncio
async def test_get_my_profile(client: AsyncClient, db_session):
    user = await make_user(db_session, username="prof_test")
    await make_professional_profile(db_session, user=user)
    await db_session.commit()

    app.dependency_overrides[get_current_user] = lambda: user
    response = await client.get("/api/v1/professionals/me")
    app.dependency_overrides.pop(get_current_user, None)

    assert response.status_code == 200
    assert response.json()["especialidad"] == "Ingenieria Industrial"


@pytest.mark.asyncio
async def test_update_my_profile(client: AsyncClient, db_session):
    user = await make_user(db_session, username="prof_update")
    await make_professional_profile(db_session, user=user)
    await db_session.commit()

    app.dependency_overrides[get_current_user] = lambda: user
    response = await client.put(
        "/api/v1/professionals/me",
        json={"especialidad": "Automatizacion"},
    )
    app.dependency_overrides.pop(get_current_user, None)

    assert response.status_code == 200
    assert response.json()["especialidad"] == "Automatizacion"
```

### 3. Agregar tests a `test_auth.py`

```python
@pytest.mark.asyncio
async def test_approve_user(client: AsyncClient, db_session):
    """Superuser can approve a pending user."""
    from tests.factories import make_user

    pending_user = await make_user(db_session, username="pending1", status="pending")
    admin = await make_user(db_session, username="admin1", is_superuser=True)
    await db_session.commit()

    app.dependency_overrides[get_current_user] = lambda: admin
    response = await client.post(f"/api/v1/auth/{pending_user.id}/approve")
    app.dependency_overrides.pop(get_current_user, None)

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "approved"


@pytest.mark.asyncio
async def test_reject_user(client: AsyncClient, db_session):
    """Superuser can reject a pending user with reason."""
    from tests.factories import make_user

    pending_user = await make_user(db_session, username="pending2", status="pending")
    admin = await make_user(db_session, username="admin2", is_superuser=True)
    await db_session.commit()

    app.dependency_overrides[get_current_user] = lambda: admin
    response = await client.post(
        f"/api/v1/auth/{pending_user.id}/reject",
        json={"reason": "Documentacion incompleta"},
    )
    app.dependency_overrides.pop(get_current_user, None)

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "rejected"
    assert data["rejection_reason"] == "Documentacion incompleta"


@pytest.mark.asyncio
async def test_list_pending(client: AsyncClient, db_session):
    """Superuser can list pending users."""
    from tests.factories import make_user

    await make_user(db_session, username="pend_a", status="pending")
    await make_user(db_session, username="pend_b", status="pending")
    admin = await make_user(db_session, username="admin3", is_superuser=True)
    await db_session.commit()

    app.dependency_overrides[get_current_user] = lambda: admin
    response = await client.get("/api/v1/auth/pending")
    app.dependency_overrides.pop(get_current_user, None)

    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 2
```

## Criterios de aceptación

- [ ] `factories.py` tiene `make_user` y `make_professional_profile`
- [ ] `test_professionals.py` existe con 4+ tests (list, specialties, get me, update me)
- [ ] `test_auth.py` tiene tests para approve, reject, list pending
- [ ] `pytest -v` pasa todos los tests (incluyendo los existentes)
- [ ] `ruff check backend/` pasa

## Riesgos

- **Bajo**: Los tests usan `app.dependency_overrides` que es seguro (se limpia en cada test).
- **Bajo**: Las factories son independientes y no contaminan estado entre tests.
