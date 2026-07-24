"""Seed data for initial database population.

All functions are idempotent: they check for existing records before inserting.
Each function returns the number of inserted records.
"""

from decimal import Decimal

from loguru import logger
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.indicator import Indicator, IndicatorPeriod
from app.models.organization import Organization
from app.models.technology import Technology

# ---------------------------------------------------------------------------
# Organizations
# ---------------------------------------------------------------------------

_ORGANIZATIONS = [
    {
        "nombre": "Centro de Investigaciones de Energía y Automatización",
        "siglas": "CIEA",
        "tipo": "AUT",
        "sector_codigo": "AUT",
        "provincia": "La Habana",
        "pais": "Cuba",
    },
    {
        "nombre": "Empresa de Metalurgia y Equipo Técnico Camagüey",
        "siglas": "METCAM",
        "tipo": "MET",
        "sector_codigo": "MET",
        "provincia": "Camagüey",
        "pais": "Cuba",
    },
    {
        "nombre": "Instituto Nacional de Siderurgia y Industria del Dunque",
        "siglas": "INSID",
        "tipo": "SID",
        "sector_codigo": "SID",
        "provincia": "La Habana",
        "pais": "Cuba",
    },
    {
        "nombre": "Empresa Eléctrica de Villa Clara",
        "siglas": "ELEVC",
        "tipo": "ELE",
        "sector_codigo": "ELE",
        "provincia": "Villa Clara",
        "pais": "Cuba",
    },
    {
        "nombre": "Centro de Biotecnología Industrial",
        "siglas": "CBI",
        "tipo": "QUI",
        "sector_codigo": "QUI",
        "provincia": "La Habana",
        "pais": "Cuba",
    },
]


async def seed_organizations(session: AsyncSession) -> int:
    """Insert Cuban organizations if they do not already exist.

    Returns:
        Number of newly inserted records.
    """
    result = await session.execute(
        select(Organization.siglas)
    )
    existing = {row[0] for row in result.all()}

    inserted = 0
    for org in _ORGANIZATIONS:
        if org["siglas"] not in existing:
            session.add(Organization(**org))
            inserted += 1

    if inserted:
        await session.flush()
        logger.info(f"Seeded {inserted} organizations")

    return inserted


# ---------------------------------------------------------------------------
# Technologies
# ---------------------------------------------------------------------------

_TECHNOLOGIES = [
    {
        "nombre": "Sistema de Control de Planta de Automatización",
        "descripcion": (
            "Sistema SCADA para control y monitoreo de procesos industriales"
            " automatizados en plantas de energía."
        ),
        "sector_codigo": "AUT",
        "trl_nivel": 6,
        "palabras_clave": ["SCADA", "automatización", "control industrial"],
    },
    {
        "nombre": "Procesamiento de Aleaciones de Aluminio",
        "descripcion": "Tecnología de fundición y laminado de aleaciones ligeras para componentes estructurales.",
        "sector_codigo": "MET",
        "trl_nivel": 7,
        "palabras_clave": ["aleaciones", "aluminio", "fundición", "laminado"],
    },
    {
        "nombre": "Recubrimiento Anti-Corrosivo para Estructuras Siderúrgicas",
        "descripcion": (
            "Recubrimientos nanotecnológicos que prolongan la vida útil de"
            " estructuras de acero en ambientes hostiles."
        ),
        "sector_codigo": "SID",
        "trl_nivel": 5,
        "palabras_clave": ["anti-corrosión", "nanotecnología", "acero"],
    },
    {
        "nombre": "Micro-Red Inteligente con Integración Solar",
        "descripcion": (
            "Red eléctrica distribuida con gestión inteligente de demanda"
            " y fuentes renovables fotovoltaicas."
        ),
        "sector_codigo": "ELE",
        "trl_nivel": 4,
        "palabras_clave": ["micro-red", "solar", "gestión inteligente", "renovable"],
    },
    {
        "nombre": "Biotransformación de Biomasa Agrícola",
        "descripcion": "Procesos enzimáticos para conversión de residuos agrícolas en bioproductos de valor agregado.",
        "sector_codigo": "QUI",
        "trl_nivel": 3,
        "palabras_clave": ["biomasa", "biotransformación", "enzimas", "bioproductos"],
    },
]


async def seed_technologies(session: AsyncSession) -> int:
    """Insert one technology per sector if not already present.

    Returns:
        Number of newly inserted records.
    """
    result = await session.execute(
        select(Technology.nombre)
    )
    existing = {row[0] for row in result.all()}

    inserted = 0
    for tech in _TECHNOLOGIES:
        if tech["nombre"] not in existing:
            session.add(Technology(**tech))
            inserted += 1

    if inserted:
        await session.flush()
        logger.info(f"Seeded {inserted} technologies")

    return inserted


# ---------------------------------------------------------------------------
# Indicators
# ---------------------------------------------------------------------------

_INDICATORS = [
    {
        "name": "Producción mensual de acero crudo",
        "code": "STEEL_PRODUCTION_MONTHLY",
        "unit": "toneladas",
        "value": Decimal("12500.0000"),
        "source": "ONEI",
        "period": IndicatorPeriod.MONTHLY,
        "sector_codigo": "SID",
    },
    {
        "name": "Índice de confianza empresarial del sector eléctrico",
        "code": "ELECTRIC_CONFIDENCE_INDEX",
        "unit": "índice",
        "value": Decimal("72.5000"),
        "source": "MINEM",
        "period": IndicatorPeriod.QUARTERLY,
        "sector_codigo": "ELE",
    },
    {
        "name": "Inversión en I+D metalúrgica",
        "code": "MET_RD_INVESTMENT",
        "unit": "USD miles",
        "value": Decimal("3400.0000"),
        "source": "CITMA",
        "period": IndicatorPeriod.ANNUAL,
        "sector_codigo": "MET",
    },
    {
        "name": "Capacidad instalada de automatización",
        "code": "AUTO_INSTALLED_CAPACITY",
        "unit": "unidades",
        "value": Decimal("1580.0000"),
        "source": "CIEA",
        "period": IndicatorPeriod.ANNUAL,
        "sector_codigo": "AUT",
    },
    {
        "name": "Producción química básica mensual",
        "code": "CHEM_BASE_PRODUCTION_MONTHLY",
        "unit": "toneladas",
        "value": Decimal("8750.0000"),
        "source": "QUIMICUBA",
        "period": IndicatorPeriod.MONTHLY,
        "sector_codigo": "QUI",
    },
]


async def seed_indicators(session: AsyncSession) -> int:
    """Insert sector indicators if their code does not already exist.

    Returns:
        Number of newly inserted records.
    """
    result = await session.execute(
        select(Indicator.code)
    )
    existing = {row[0] for row in result.all()}

    inserted = 0
    for ind in _INDICATORS:
        if ind["code"] not in existing:
            session.add(Indicator(**ind))
            inserted += 1

    if inserted:
        await session.flush()
        logger.info(f"Seeded {inserted} indicators")

    return inserted


# ---------------------------------------------------------------------------
# Aggregate seed
# ---------------------------------------------------------------------------


async def seed_all(session: AsyncSession) -> None:
    """Run all seed functions in the correct order.

    Organizations must be seeded before technologies and indicators
    because the latter two reference ``industrial_sectores.codigo``
    via foreign keys.  The industrial_sectores table is assumed to
    already contain the base sector rows (AUT, MET, SID, ELE, QUI).
    """
    await seed_organizations(session)
    await seed_technologies(session)
    await seed_indicators(session)
