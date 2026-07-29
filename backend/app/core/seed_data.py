"""Seed data for initial database population.

All functions are idempotent: they check for existing records before inserting.
Each function returns the number of inserted records.
"""

from datetime import datetime
from decimal import Decimal
from uuid import uuid4

from loguru import logger
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import get_password_hash
from app.models.alert import Alert
from app.models.bulletin import Bulletin
from app.models.competitiveness import CompetitivenessIndex
from app.models.indicator import Indicator, IndicatorPeriod
from app.models.organization import Organization
from app.models.patent_map import PatentMapEntry
from app.models.technology import Technology
from app.models.user import User, UserRole, UserStatus

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
    {
        "nombre": "BioNova Cuba",
        "siglas": "BNC",
        "tipo": "BIO",
        "sector_codigo": "BIO",
        "provincia": "La Habana",
        "pais": "Cuba",
    },
    {
        "nombre": "AutoTech Solutions",
        "siglas": "ATS",
        "tipo": "AUT",
        "sector_codigo": "AUT",
        "provincia": "La Habana",
        "pais": "Cuba",
    },
    {
        "nombre": "QuimiCuba Industrial",
        "siglas": "QCI",
        "tipo": "QUI",
        "sector_codigo": "QUI",
        "provincia": "La Habana",
        "pais": "Cuba",
    },
    {
        "nombre": "EmpresaNEW",
        "siglas": "ENW",
        "tipo": "empresa",
        "sector_codigo": "AUT",
        "provincia": "Villa Clara",
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
# Users (test representatives)
# ---------------------------------------------------------------------------

_USERS = [
    {
        "email": "carlos@bionova.cu",
        "username": "carlos",
        "full_name": "Carlos Mendez",
        "password": "test12345",
        "role": UserRole.REP_CTI,
        "account_type": "representante",
        "status": UserStatus.APPROVED,
        "org_siglas": "BNC",
    },
    {
        "email": "ana@autotech.cu",
        "username": "ana",
        "full_name": "Ana Rodriguez",
        "password": "test12345",
        "role": UserRole.REP_CTI,
        "account_type": "representante",
        "status": UserStatus.APPROVED,
        "org_siglas": "ATS",
    },
    {
        "email": "pedro@quimicuba.cu",
        "username": "pedro",
        "full_name": "Pedro Castillo",
        "password": "test12345",
        "role": UserRole.REP_CTI,
        "account_type": "representante",
        "status": UserStatus.APPROVED,
        "org_siglas": "QCI",
    },
    {
        "email": "prueba@gmail.com",
        "username": "enmanuel",
        "full_name": "Enmanuel Perez",
        "password": "12345678",
        "role": UserRole.REP_CTI,
        "account_type": "representante",
        "status": UserStatus.APPROVED,
        "org_siglas": "ENW",
    },
    # Functional demo users (no org link)
    {
        "username": "usuario",
        "email": "usuario@mindus.gob.cu",
        "full_name": "Juan Perez Garcia",
        "role": "rep_cti",
        "account_type": "representante",
        "password": "usuario123",
        "status": UserStatus.APPROVED,
    },
    {
        "username": "analista",
        "email": "analista@mindus.gob.cu",
        "full_name": "Ana analista",
        "role": "analista",
        "account_type": "analista",
        "password": "analista123",
        "status": UserStatus.APPROVED,
    },
    {
        "username": "paco",
        "email": "paco@gmail.com",
        "full_name": "Paco Perez",
        "role": "visitante",
        "account_type": "profesional",
        "password": "paco123",
        "status": UserStatus.APPROVED,
    },
]


async def seed_users(session: AsyncSession) -> int:
    """Insert test users if they do not already exist.

    Handles both org-linked users (representatives) and functional
    demo users (rep_cti, analista, visitante).  Users without
    ``org_siglas`` are created without an organization link.

    Returns:
        Number of newly inserted records.
    """
    result = await session.execute(select(User.email))
    existing = {row[0] for row in result.all()}

    result = await session.execute(
        select(Organization.id, Organization.siglas)
    )
    org_by_siglas = dict(result.all())

    inserted = 0
    for data in _USERS:
        if data["email"] in existing:
            continue

        role_val = data["role"].value if hasattr(data["role"], "value") else data["role"]
        status_val = data["status"].value if hasattr(data["status"], "value") else data["status"]
        org_id = org_by_siglas.get(data.get("org_siglas")) if "org_siglas" in data else None

        user = User(
            email=data["email"],
            username=data["username"],
            full_name=data["full_name"],
            hashed_password=get_password_hash(data["password"]),
            role=role_val,
            account_type=data["account_type"],
            status=status_val,
            is_active=True,
            organization_id=org_id,
        )
        session.add(user)
        inserted += 1

    if inserted:
        await session.flush()
        logger.info(f"Seeded {inserted} users")

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


async def seed_alerts(session: AsyncSession) -> int:
    """Insert sample alerts if none exist.

    Returns:
        Number of newly inserted records.
    """
    result = await session.execute(select(Alert.titulo).limit(1))
    if result.scalar_one_or_none():
        logger.info("Alerts already seeded, skipping")
        return 0

    alerts = [
        Alert(
            titulo="Nueva patente en biotecnología",
            descripcion="Se ha registrado una patente clave para fermentación de precisión.",
            severidad="alta",
            leida=False,
        ),
        Alert(
            titulo="Actualización regulatoria sector energético",
            descripcion="Nueva normativa para eficiencia energética publicada por el MINEM.",
            severidad="media",
            leida=False,
        ),
        Alert(
            titulo="Indicador de innovación en ascenso",
            descripcion="El índice de innovación industrial subió 3 puntos este trimestre.",
            severidad="baja",
            leida=True,
        ),
        Alert(
            titulo="Tendencia: Automatización en manufactura",
            descripcion="La adopción de robots industriales crece un 15% anual en la región.",
            severidad="media",
            leida=False,
        ),
        Alert(
            titulo="Fondo de innovación disponible",
            descripcion="Nuevo fondo concursable para proyectos de I+D industrial.",
            severidad="alta",
            leida=False,
        ),
    ]
    for alert in alerts:
        session.add(alert)
    await session.flush()
    logger.info(f"Seeded {len(alerts)} alerts")
    return len(alerts)


# ---------------------------------------------------------------------------
# Bulletins
# ---------------------------------------------------------------------------

_BULLETINS = [
    {
        "titulo": "Boletin Trimestral de Ciencia y Tecnologia Q2 2026",
        "resumen": "Tendencias tecnologicas emergentes en sectores siderurgico, metalurgico y quimico.",
        "fecha_publicacion": datetime(2026, 7, 1),
        "categoria": "boletin", "autor": "OCyT", "sector_codigo": "SID",
    },
    {
        "titulo": "Estudio de Prospectiva: IA en Manufactura",
        "resumen": "Potencial de adopcion de IA en procesos productivos del sector industrial cubano.",
        "fecha_publicacion": datetime(2026, 6, 1),
        "categoria": "estudio", "autor": "ICT", "sector_codigo": "ELE",
    },
    {
        "titulo": "Alerta Tecnologica: Nuevos Materiales para Hidrogeno",
        "resumen": "Innovaciones en materiales de hidruros metalicos para almacenamiento de energia.",
        "fecha_publicacion": datetime(2026, 5, 15),
        "categoria": "alerta", "autor": "CIB", "sector_codigo": None,
    },
    {
        "titulo": "Mapa de Patentes: Tecnologias de Energia Renovable",
        "resumen": "Actividad patentaria en energia solar, eolica y biomasa con relevancia para Cuba.",
        "fecha_publicacion": datetime(2026, 4, 1),
        "categoria": "mapa", "autor": "EDI", "sector_codigo": None,
    },
]


async def seed_bulletins(session: AsyncSession) -> int:
    result = await session.execute(select(Bulletin.titulo).limit(1))
    if result.scalar_one_or_none():
        return 0
    for data in _BULLETINS:
        session.add(Bulletin(id=str(uuid4()), **data))
    await session.flush()
    logger.info(f"Seeded {len(_BULLETINS)} bulletins")
    return len(_BULLETINS)


# ---------------------------------------------------------------------------
# Competitiveness Indices
# ---------------------------------------------------------------------------

_COMPETITIVENESS_DATA = [
    ("Siderurgia", "SID", 42, 78, 65, 91),
    ("Metalurgia", "MET", 38, 72, 58, 85),
    ("Quimica", "QUI", 55, 60, 70, 88),
    ("Electronica", "ELE", 28, 55, 62, 70),
]

_COMPETITIVENESS_PAISES = ["Cuba", "Chile", "Mexico", "Brasil"]


async def seed_competitiveness(session: AsyncSession) -> int:
    result = await session.execute(select(CompetitivenessIndex).limit(1))
    if result.scalar_one_or_none():
        return 0
    count = 0
    for sector, codigo, *valores in _COMPETITIVENESS_DATA:
        for i, pais in enumerate(_COMPETITIVENESS_PAISES):
            session.add(CompetitivenessIndex(
                id=str(uuid4()), sector=sector, sector_codigo=codigo,
                indicador="Indice de competitividad", valor=valores[i],
                pais=pais, periodo="2026-Q2", fuente="BCG",
            ))
            count += 1
    await session.flush()
    logger.info(f"Seeded {count} competitiveness indices")
    return count


# ---------------------------------------------------------------------------
# Patent Map Entries
# ---------------------------------------------------------------------------

_PATENT_MAP_DATA = [
    ("Reduccion Directa", "SID", 34, "creciente"),
    ("Sensores IoT", "ELE", 28, "creciente"),
    ("Bioprocesos", None, 22, "estable"),
    ("Energia Solar", None, 19, "creciente"),
    ("Materiales Compuestos", "MET", 15, "estable"),
    ("Hidrogeno Verde", None, 12, "creciente"),
    ("Automatizacion", "AUT", 10, "estable"),
    ("Nanomateriales", "MET", 8, "decreciente"),
]


async def seed_patent_maps(session: AsyncSession) -> int:
    result = await session.execute(select(PatentMapEntry).limit(1))
    if result.scalar_one_or_none():
        return 0
    for tecnologia, codigo, patentes, tendencia in _PATENT_MAP_DATA:
        session.add(PatentMapEntry(
            id=str(uuid4()), tecnologia=tecnologia, pais="Cuba",
            sector_codigo=codigo, total_patentes=patentes,
            periodo="2026-Q2", tendencia=tendencia,
        ))
    await session.flush()
    logger.info(f"Seeded {len(_PATENT_MAP_DATA)} patent map entries")
    return len(_PATENT_MAP_DATA)


async def seed_all(session: AsyncSession) -> None:
    """Run all seed functions in the correct order.

    Organizations must be seeded before technologies and indicators
    because the latter two reference ``industrial_sectores.codigo``
    via foreign keys.  Users are seeded after organizations so that
    org-linked users can find their organization.

    The industrial_sectores table is assumed to already contain the
    base sector rows (AUT, MET, SID, ELE, QUI).
    """
    await seed_organizations(session)
    await seed_users(session)
    await seed_technologies(session)
    await seed_indicators(session)
    await seed_alerts(session)
    await seed_bulletins(session)
    await seed_competitiveness(session)
    await seed_patent_maps(session)
