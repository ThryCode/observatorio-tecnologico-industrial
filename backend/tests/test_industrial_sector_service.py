
import pytest

from app.core.exceptions import AppException
from app.models.industrial_sector import IndustrialSector
from app.schemas.industrial_sector import IndustrialSectorCreate, IndustrialSectorUpdate
from app.services.industrial_sector_service import IndustrialSectorService


@pytest.mark.asyncio
async def test_industrial_sector_get(db_session):
    await seed_sector(db_session, "T01", "Test Sector 1")
    svc = IndustrialSectorService(db_session)
    sector = await svc.get("T01")
    assert sector.nombre == "Test Sector 1"


@pytest.mark.asyncio
async def test_industrial_sector_get_not_found(db_session):
    svc = IndustrialSectorService(db_session)
    with pytest.raises(AppException) as exc_info:
        await svc.get("Z99")
    assert exc_info.value.status_code == 404


@pytest.mark.asyncio
async def test_industrial_sector_create(db_session):
    svc = IndustrialSectorService(db_session)
    data = IndustrialSectorCreate(codigo="NEW", nombre="New Sector")
    sector = await svc.create(data)
    assert sector.codigo == "NEW"
    assert sector.nombre == "New Sector"


@pytest.mark.asyncio
async def test_industrial_sector_create_duplicate(db_session):
    await seed_sector(db_session, "DUP", "Dup Sector")
    svc = IndustrialSectorService(db_session)
    data = IndustrialSectorCreate(codigo="DUP", nombre="Dup Sector 2")
    with pytest.raises(AppException) as exc_info:
        await svc.create(data)
    assert exc_info.value.status_code == 409


@pytest.mark.asyncio
async def test_industrial_sector_update(db_session):
    await seed_sector(db_session, "UPD", "Old Name")
    svc = IndustrialSectorService(db_session)
    data = IndustrialSectorUpdate(nombre="New Name")
    updated = await svc.update("UPD", data)
    assert updated.nombre == "New Name"


@pytest.mark.asyncio
async def test_industrial_sector_delete(db_session):
    await seed_sector(db_session, "DEL", "To Delete")
    svc = IndustrialSectorService(db_session)
    await svc.delete("DEL")
    with pytest.raises(AppException):
        await svc.get("DEL")


@pytest.mark.asyncio
async def test_industrial_sector_list_sorting(db_session):
    await seed_sector(db_session, "Z01", "Zebra")
    await seed_sector(db_session, "A01", "Alpha")
    svc = IndustrialSectorService(db_session)
    items, total = await svc.list(1, 10, sort_by="nombre", sort_order="asc")
    assert items[0].nombre == "Alpha"


async def seed_sector(db, codigo, nombre):
    existing = await db.get(IndustrialSector, codigo)
    if existing:
        return existing
    sector = IndustrialSector(codigo=codigo, nombre=nombre)
    db.add(sector)
    await db.flush()
    return sector
