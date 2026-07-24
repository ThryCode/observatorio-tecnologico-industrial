"""Tests for professionals endpoints."""
import pytest
from httpx import AsyncClient

from app.dependencies import get_current_user
from app.main import app
from tests.factories import make_professional_profile, make_user


@pytest.mark.asyncio
async def test_list_professionals(client: AsyncClient, db_session):
    await make_professional_profile(db_session)
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
