from datetime import date

from app.models.indicator import Indicator, IndicatorPeriod
from app.models.industrial_sector import IndustrialSector
from app.models.organization import Organization
from app.models.patent import Patent, PatentStatus
from app.models.regulation import Regulation, RegulationCategory
from app.models.technology import Technology


async def make_sector(db, codigo="BIO", nombre="Biotecnologia", descripcion="Sector bio"):
    s = IndustrialSector(codigo=codigo, nombre=nombre, descripcion=descripcion)
    db.add(s)
    await db.flush()
    return s


async def make_org(db, nombre="Test Org", siglas="TO", tipo="empresa", sector_codigo=None):
    o = Organization(nombre=nombre, siglas=siglas, tipo=tipo, sector_codigo=sector_codigo)
    db.add(o)
    await db.flush()
    return o


async def make_tech(db, nombre="Test Tech", trl_nivel=5, sector_codigo=None):
    t = Technology(nombre=nombre, trl_nivel=trl_nivel, sector_codigo=sector_codigo)
    db.add(t)
    await db.flush()
    return t


async def make_patent(db, patent_number="CU-2026-001", title="Test Patent",
                      applicant="Test", inventor="Test Inv", filing_date=None,
                      country="CU", status=None, organization_id=None, technology_id=None):
    if filing_date is None:
        filing_date = date(2026, 1, 1)
    if status is None:
        status = PatentStatus.FILED
    p = Patent(
        title=title, patent_number=patent_number, applicant=applicant,
        inventor=inventor, filing_date=filing_date, country=country,
        status=status,
        organization_id=organization_id, technology_id=technology_id,
    )
    db.add(p)
    await db.flush()
    return p


async def make_regulation(db, title="Test Reg", regulation_number="RES-2026-001",
                          issuing_body="Test", publication_date=None,
                          category="resolution", sector_codigo=None):
    if publication_date is None:
        publication_date = date(2026, 1, 1)
    r = Regulation(
        title=title, regulation_number=regulation_number,
        issuing_body=issuing_body, publication_date=publication_date,
        category=RegulationCategory(category), sector_codigo=sector_codigo,
    )
    db.add(r)
    await db.flush()
    return r


async def make_indicator(db, name="Test Ind", code="TST-001", value=100.0,
                         unit="percent", source="Test", period="monthly",
                         sector_codigo=None):
    i = Indicator(
        name=name, code=code, value=value, unit=unit,
        source=source, period=IndicatorPeriod(period),
        sector_codigo=sector_codigo,
    )
    db.add(i)
    await db.flush()
    return i
