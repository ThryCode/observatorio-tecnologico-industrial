"""Seed data for initial database population.

Contract:
    - All functions are idempotent: they check for existing records before inserting.
    - Each function returns the number of inserted records (0 if already populated).
    - Functions accept an AsyncSession and must be called within a transaction.
    - seed_all() calls all seed functions in dependency order.
    - On startup, db.py runs ``alembic upgrade head`` then ``seed_all()``.
    - Seed data is aligned with the production SQL dump (2026-08-20).
    - Neo4j graph sync happens separately via seed_follows_data.sync_neo4j_graph().
"""

from datetime import date, datetime
from decimal import Decimal
from uuid import uuid4

import structlog
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import get_password_hash
from app.core.seed_follows_data import FOLLOWS_DATA
from app.models.alert import Alert
from app.models.bulletin import Bulletin
from app.models.competitiveness import CompetitivenessIndex
from app.models.follow import Follow
from app.models.indicator import Indicator, IndicatorPeriod
from app.models.industrial_sector import IndustrialSector
from app.models.organization import Organization
from app.models.patent import Patent, PatentStatus
from app.models.patent_map import PatentMapEntry
from app.models.professional_profile import ProfessionalProfile
from app.models.research_publication import ResearchPublication
from app.models.technology import Technology
from app.models.user import User, UserStatus

logger = structlog.stdlib.get_logger()

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
        "tipo": "empresa",
        "sector_codigo": "BIO",
        "provincia": "La Habana",
        "pais": "Cuba",
        "sitio_web": "https://bionova.cu",
        "fecha_creacion": date(2018, 5, 12),
        "contacto": "78654321",
    },
    {
        "nombre": "AutoTech Solutions",
        "siglas": "ATS",
        "tipo": "empresa",
        "sector_codigo": "AUT",
        "provincia": "Villa Clara",
        "pais": "Cuba",
        "sitio_web": "https://autotech.cu",
        "fecha_creacion": date(2020, 1, 20),
        "contacto": "42234567",
    },
    {
        "nombre": "QuimiCuba Industrial",
        "siglas": "QCI",
        "tipo": "empresa",
        "sector_codigo": "QUI",
        "provincia": "Matanzas",
        "pais": "Cuba",
        "sitio_web": "https://quimicuba.cu",
        "fecha_creacion": date(2015, 9, 3),
        "contacto": "45234567",
    },
    {
        "nombre": "EmpresaNEW",
        "siglas": "ENW",
        "tipo": "empresa",
        "sector_codigo": "AUT",
        "provincia": "Villa Clara",
        "pais": "Cuba",
        "sitio_web": "https://prueba.cu",
        "fecha_creacion": date(2026, 1, 21),
        "contacto": "51234567",
    },
    {
        "nombre": "TechnoSol Industriales",
        "siglas": "TECHNO",
        "tipo": "empresa",
        "sector_codigo": "ELE",
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
        logger.info("seeded_organizations", count=inserted)

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
        "role": "rep_cti",
        "job_title": "Director Tecnico",
        "status": UserStatus.APPROVED,
        "org_siglas": "BNC",
    },
    {
        "email": "ana@autotech.cu",
        "username": "ana",
        "full_name": "Ana Rodriguez",
        "password": "test12345",
        "role": "rep_cti",
        "job_title": "Jefa de I+D",
        "status": UserStatus.APPROVED,
        "org_siglas": "ATS",
    },
    {
        "email": "pedro@quimicuba.cu",
        "username": "pedro",
        "full_name": "Pedro Castillo",
        "password": "test12345",
        "role": "rep_cti",
        "job_title": "Gerente General",
        "status": UserStatus.APPROVED,
        "org_siglas": "QCI",
    },
    {
        "email": "prueba@gmail.com",
        "username": "enmanuel",
        "full_name": "Enmanuel Perez",
        "password": "12345678",
        "role": "rep_cti",
        "job_title": "CEO",
        "status": UserStatus.APPROVED,
        "org_siglas": "ENW",
    },
    # Functional demo users (no org link)
    {
        "username": "usuario",
        "email": "usuario@mindus.gob.cu",
        "full_name": "Juan Perez Garcia",
        "role": "rep_cti",
        "password": "usuario123",
        "status": UserStatus.APPROVED,
    },
    {
        "username": "analista",
        "email": "analista@mindus.gob.cu",
        "full_name": "Ana analista",
        "role": "analista",
        "password": "analista123",
        "status": UserStatus.APPROVED,
    },
    {
        "username": "paco",
        "email": "paco@gmail.com",
        "full_name": "Paco Perez",
        "role": "profesional",
        "job_title": "Investigador Principal",
        "password": "paco123",
        "status": UserStatus.APPROVED,
    },
    {
        "username": "marta",
        "email": "marta@investigacion.cu",
        "full_name": "Marta Fernandez",
        "role": "profesional",
        "job_title": "Ingeniera de Procesos",
        "password": "marta123",
        "status": UserStatus.APPROVED,
    },
    {
        "username": "luis",
        "email": "luis@investigacion.cu",
        "full_name": "Luis Ramirez",
        "role": "profesional",
        "job_title": "Analista de Tecnología",
        "password": "luis123",
        "status": UserStatus.APPROVED,
        "org_siglas": "CIEA",
    },
    {
        "username": "sofia",
        "email": "sofia@biotech.cu",
        "full_name": "Sofia Torres",
        "role": "profesional",
        "job_title": "Directora de Innovación",
        "password": "sofia123",
        "status": UserStatus.APPROVED,
        "org_siglas": "CBI",
    },
    {
        "username": "jorge",
        "email": "jorge@energia.cu",
        "full_name": "Jorge Navarro",
        "role": "profesional",
        "job_title": "Especialista en Energía",
        "password": "jorge123",
        "status": UserStatus.APPROVED,
        "org_siglas": "ELEVC",
    },
]


async def seed_users(session: AsyncSession) -> int:
    """Insert test users if they do not already exist.

    Handles both org-linked users (representatives) and functional
    demo users (representante, analista, visitante).  Users without
    ``org_siglas`` are created without an organization link.

    Returns:
        Number of newly inserted records.
    """
    result = await session.execute(select(User.email))
    existing = {row[0] for row in result.all()}

    result = await session.execute(
        select(Organization.siglas, Organization.id)
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
            status=status_val,
            is_active=True,
            organization_id=org_id,
            job_title=data.get("job_title"),
        )
        session.add(user)
        inserted += 1

    if inserted:
        await session.flush()
        logger.info("seeded_users", count=inserted)

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
        logger.info("seeded_technologies", count=inserted)

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
        logger.info("seeded_indicators", count=inserted)

    return inserted


# ---------------------------------------------------------------------------
# Professional Profiles
# ---------------------------------------------------------------------------


_PROFESSIONAL_PROFILES = [
    {
        "username": "paco",
        "especialidad": "Ingeniería Industrial",
        "grado_cientifico": "Doctor",
        "biografia": (
            "Investigador principal con 15 años de experiencia en automatización"
            " industrial y control de procesos."
        ),
        "intereses": ["IA aplicada", "Robótica", "Energías renovables"],
    },
    {
        "username": "marta",
        "especialidad": "Biotecnología",
        "grado_cientifico": "Doctora",
        "biografia": "Ingeniera de procesos especializada en fermentación y bioprocesos industriales.",
        "intereses": ["Biotecnología", "Fermentación", "Bioinformática"],
    },
    {
        "username": "luis",
        "especialidad": "Automatización",
        "grado_cientifico": "Ingeniero",
        "biografia": "Analista de tecnología del Centro de Investigaciones de Energía y Automatización.",
        "intereses": ["Automatización", "Energía", "Control de procesos"],
    },
    {
        "username": "sofia",
        "especialidad": "Biotecnología",
        "grado_cientifico": "Máster",
        "biografia": "Directora de innovación en el Centro de Biotecnología Industrial.",
        "intereses": ["Biopolímeros", "Biotecnología", "Economía circular"],
    },
    {
        "username": "jorge",
        "especialidad": "Energía",
        "grado_cientifico": "Ingeniero",
        "biografia": "Especialista en energía de la Empresa Eléctrica de Villa Clara.",
        "intereses": ["Eficiencia energética", "Iluminación LED", "Smart grids"],
    },
]


async def seed_professional_profiles(session: AsyncSession) -> int:
    """Create professional profiles for users with role='profesional'.

    Returns:
        Number of newly inserted records.
    """
    result = await session.execute(
        select(ProfessionalProfile.user_id)
    )
    existing_user_ids = {row[0] for row in result.all()}

    result = await session.execute(
        select(User.id, User.username)
    )
    user_by_username = {row[1]: row[0] for row in result.all()}

    inserted = 0
    for data in _PROFESSIONAL_PROFILES:
        user_id = user_by_username.get(data["username"])
        if user_id and user_id not in existing_user_ids:
            session.add(ProfessionalProfile(
                user_id=user_id,
                especialidad=data["especialidad"],
                grado_cientifico=data.get("grado_cientifico"),
                biografia=data.get("biografia"),
                intereses=data.get("intereses"),
            ))
            inserted += 1

    if inserted:
        await session.flush()
        logger.info("seeded_professional_profiles", count=inserted)

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
        logger.info("alerts_already_seeded")
        return 0

    alerts = [
        Alert(
            titulo="Nueva patente en biotecnología",
            descripcion="Se ha registrado una patente clave para fermentación de precisión.",
            severidad="alta", leida=False,
        ),
        Alert(
            titulo="Actualización regulatoria sector energético",
            descripcion="Nueva normativa para eficiencia energética publicada por el MINEM.",
            severidad="media", leida=False,
        ),
        Alert(
            titulo="Indicador de innovación en ascenso",
            descripcion="El índice de innovación industrial subió 3 puntos este trimestre.",
            severidad="baja", leida=True,
        ),
        Alert(
            titulo="Tendencia: Automatización en manufactura",
            descripcion="La adopción de robots industriales crece un 15% anual en la región.",
            severidad="media", leida=False,
        ),
        Alert(
            titulo="Fondo de innovación disponible",
            descripcion="Nuevo fondo concursable para proyectos de I+D industrial.",
            severidad="alta", leida=False,
        ),
    ]
    for alert in alerts:
        session.add(alert)
    await session.flush()
    logger.info("seeded_alerts", count=len(alerts))
    return len(alerts)


# ---------------------------------------------------------------------------
# Bulletins
# ---------------------------------------------------------------------------

_BULLETINS = [
    {
        "titulo": "Alerta Tecnologica: Nuevos Materiales para Hidrogeno",
        "resumen": "Innovaciones en materiales de hidruros metalicos para almacenamiento de energia.",
        "fecha_publicacion": datetime(2026, 5, 15),
        "categoria": "alerta", "autor": "CIB", "sector_codigo": None,
    },
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
        "titulo": "Mapa de Patentes: Tecnologias de Energia Renovable",
        "resumen": "Actividad patentaria en energia solar, eolica y biomasa con relevancia para Cuba.",
        "fecha_publicacion": datetime(2026, 4, 1),
        "categoria": "mapa", "autor": "EDI", "sector_codigo": None,
    },
]


async def seed_bulletins(session: AsyncSession) -> int:
    result = await session.execute(select(Bulletin.titulo))
    existing = {row[0] for row in result.all()}
    inserted = 0
    for data in _BULLETINS:
        if data["titulo"] not in existing:
            session.add(Bulletin(id=uuid4(), **data))
            inserted += 1
    if inserted:
        await session.flush()
        logger.info("seeded_bulletins", count=inserted)
    return inserted


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
                id=uuid4(), sector=sector, sector_codigo=codigo,
                indicador="Indice de competitividad", valor=valores[i],
                pais=pais, periodo="2026-Q2", fuente="BCG",
            ))
            count += 1
    await session.flush()
    logger.info("seeded_competitiveness_indices", count=count)
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
            id=uuid4(), tecnologia=tecnologia, pais="Cuba",
            sector_codigo=codigo, total_patentes=patentes,
            periodo="2026-Q2", tendencia=tendencia,
        ))
    await session.flush()
    logger.info("seeded_patent_map_entries", count=len(_PATENT_MAP_DATA))
    return len(_PATENT_MAP_DATA)


# ---------------------------------------------------------------------------
# Industrial Sectors
# ---------------------------------------------------------------------------

_SECTORES = [
    {"codigo": "AUT", "nombre": "Automatización", "descripcion": "Automatización industrial y robótica"},
    {"codigo": "BIO", "nombre": "Biotecnologia", "descripcion": "Sector biotecnologico industrial"},
    {"codigo": "ELE", "nombre": "Electrónica", "descripcion": "Componentes y sistemas electrónicos"},
    {"codigo": "ENE", "nombre": "Energia", "descripcion": "Sector energetico industrial"},
    {"codigo": "MET", "nombre": "Metalurgia", "descripcion": "Transformación de metales no ferrosos"},
    {"codigo": "QUI", "nombre": "Química", "descripcion": "Industria química y petroquímica"},
    {"codigo": "SID", "nombre": "Siderurgia", "descripcion": "Industria del acero y derivados"},
]


async def seed_industrial_sectors(session: AsyncSession) -> int:
    """Seed industrial_sectores table (idempotent)."""
    count = 0
    for row in _SECTORES:
        existing = await session.execute(
            select(IndustrialSector).where(IndustrialSector.codigo == row["codigo"])
        )
        if existing.scalar_one_or_none() is None:
            session.add(IndustrialSector(**row))
            count += 1
    await session.flush()
    if count:
        logger.info("seeded_industrial_sectors", count=count)
    return count


# ---------------------------------------------------------------------------
# Research Publications
# ---------------------------------------------------------------------------

_RESEARCH_PUBLICATIONS = [
    {
        "titulo": (
            "Aplicación de redes neuronales artificiales para la optimización de procesos"
            " de manufactura en la industria azucarera cubana"
        ),
        "autores": "María Elena García López, Carlos Alejandro Rodríguez Pérez",
        "resumen": (
            "Se presenta un modelo de red neuronal artificial para la predicción y"
            " optimización de parámetros críticos en la producción de azúcar, logrando una"
            " reducción del 15% en el consumo de energía."
        ),
        "doi": "10.1016/j.compchemeng.2025.108234",
        "journal": "Computers & Chemical Engineering",
        "fecha_publicacion": datetime(2025, 3, 15),
        "palabras_clave": ["inteligencia artificial", "manufactura", "azúcar", "optimización"],
        "sector_codigo": "BIO",
        "url": "https://doi.org/10.1016/j.compchemeng.2025.108234",
    },
    {
        "titulo": (
            "Manufactura aditiva de piezas metálicas mediante impresión 3D para la"
            " reparación de equipos industriales"
        ),
        "autores": "Carlos Alejandro Rodríguez Pérez, Pedro Manuel Sánchez Díaz",
        "resumen": (
            "Evaluación de técnicas de fabricación aditiva con metales para la producción de"
            " repuestos industriales, demostrando viabilidad técnica y económica para la"
            " industria cubana."
        ),
        "doi": "10.1016/j.addma.2025.03.012",
        "journal": "Additive Manufacturing",
        "fecha_publicacion": datetime(2025, 5, 20),
        "palabras_clave": ["manufactura aditiva", "impresión 3D", "repuestos", "metalurgia"],
        "sector_codigo": "MET",
        "url": "https://doi.org/10.1016/j.addma.2025.03.012",
    },
    {
        "titulo": "Biorrefinería sostenible: producción de bioplásticos a partir de residuos agrícolas en Cuba",
        "autores": "Ana Lucía Martínez Fernández, Laura Isabel Hernández Torres",
        "resumen": (
            "Investigación sobre la obtención de polihidroxialcanoatos (PHA) a partir de"
            " subproductos de la agricultura cubana, como alternativa biodegradable a los"
            " plásticos convencionales."
        ),
        "doi": "10.1016/j.biortech.2025.130456",
        "journal": "Bioresource Technology",
        "fecha_publicacion": datetime(2025, 2, 10),
        "palabras_clave": ["bioplásticos", "biorrefinería", "residuos agrícolas", "sostenibilidad"],
        "sector_codigo": "BIO",
        "url": "https://doi.org/10.1016/j.biortech.2025.130456",
    },
    {
        "titulo": (
            "Evaluación del potencial eólico para la generación distribuida en zonas"
            " industriales del occidente cubano"
        ),
        "autores": "Pedro Manuel Sánchez Díaz, María Elena García López",
        "resumen": (
            "Análisis de recursos eólicos y diseño de sistemas de generación distribuida"
            " para zonas industriales, logrando una factibilidad técnica del 78% para la"
            " integración de energía eólica."
        ),
        "doi": "10.1016/j.rser.2025.114789",
        "journal": "Renewable and Sustainable Energy Reviews",
        "fecha_publicacion": datetime(2025, 6, 1),
        "palabras_clave": ["energía eólica", "generación distribuida", "zonas industriales", "Cuba"],
        "sector_codigo": "ENE",
        "url": "https://doi.org/10.1016/j.rser.2025.114789",
    },
    {
        "titulo": "Nanocomposites de celulosa microcristalina: aplicaciones en la industria alimentaria cubana",
        "autores": "Laura Isabel Hernández Torres, Ana Lucía Martínez Fernández",
        "resumen": (
            "Desarrollo de nanocomposites derivados de celulosa microcristalina para"
            " envases alimentarios activos con propiedades antimicrobianas y barrera al"
            " oxígeno."
        ),
        "doi": "10.1016/j.carbpol.2025.122345",
        "journal": "Carbohydrate Polymers",
        "fecha_publicacion": datetime(2025, 4, 18),
        "palabras_clave": ["nanocomposites", "celulosa", "envases", "industria alimentaria"],
        "sector_codigo": "QUI",
        "url": "https://doi.org/10.1016/j.carbpol.2025.122345",
    },
    {
        "titulo": "Sistema de visión artificial para control de calidad en la producción de componentes electrónicos",
        "autores": "María Elena García López, Ana Lucía Martínez Fernández, Carlos Alejandro Rodríguez Pérez",
        "resumen": (
            "Implementación de un sistema de inspección automática basado en deep learning"
            " para la detección de defectos en líneas de ensamblaje electrónico, alcanzando"
            " un 97.3% de precisión."
        ),
        "doi": "10.1016/j.engappai.2025.110234",
        "journal": "Engineering Applications of Artificial Intelligence",
        "fecha_publicacion": datetime(2025, 7, 5),
        "palabras_clave": ["visión artificial", "deep learning", "control de calidad", "electrónica"],
        "sector_codigo": "ELE",
        "url": "https://doi.org/10.1016/j.engappai.2025.110234",
    },
    {
        "titulo": "Optimización de procesos de fermentación para la producción de bioetanol de segunda generación",
        "autores": "Ana Lucía Martínez Fernández, Pedro Manuel Sánchez Díaz",
        "resumen": (
            "Optimización de condiciones de fermentación usando cepas mejoradas de"
            " Saccharomyces cerevisiae con residuos lignocelulósicos como sustrato,"
            " incrementando el rendimiento en un 23%."
        ),
        "doi": "10.1016/j.biombioe.2025.107890",
        "journal": "Biomass and Bioenergy",
        "fecha_publicacion": datetime(2025, 1, 22),
        "palabras_clave": ["bioetanol", "fermentación", "biomasa", "segunda generación"],
        "sector_codigo": "BIO",
        "url": "https://doi.org/10.1016/j.biombioe.2025.107890",
    },
    {
        "titulo": (
            "Recubrimientos anticorrosivos auto-reparables basados en microcápsulas para la"
            " protección de infraestructura industrial"
        ),
        "autores": "Laura Isabel Hernández Torres, Carlos Alejandro Rodríguez Pérez",
        "resumen": (
            "Diseño de recubrimientos inteligentes con microcápsulas de agentes reparadores"
            " que se activan ante daño mecánico, prolongando la vida útil de estructuras"
            " metálicas en ambientes agresivos."
        ),
        "doi": "10.1016/j.progpolymsci.2025.101890",
        "journal": "Progress in Polymer Science",
        "fecha_publicacion": datetime(2025, 8, 12),
        "palabras_clave": ["recubrimientos", "auto-reparables", "anticorrosivo", "microcápsulas"],
        "sector_codigo": "QUI",
        "url": "https://doi.org/10.1016/j.progpolymsci.2025.101890",
    },
    {
        "titulo": "Simulación de procesos térmicos para la mejora de eficiencia en hornos industriales cubanos",
        "autores": "Pedro Manuel Sánchez Díaz, María Elena García López, Laura Isabel Hernández Torres",
        "resumen": (
            "Modelo de simulación computacional para la optimización del flujo de calor y la"
            " distribución de temperatura en hornos industriales, logrando ahorros"
            " energéticos del 18%."
        ),
        "doi": "10.1016/j.apenergy.2025.124567",
        "journal": "Applied Energy",
        "fecha_publicacion": datetime(2025, 5, 30),
        "palabras_clave": ["simulación", "hornos industriales", "eficiencia energética", "transferencia de calor"],
        "sector_codigo": "ENE",
        "url": "https://doi.org/10.1016/j.apenergy.2025.124567",
    },
    {
        "titulo": (
            "Plataforma IoT para el monitoreo en tiempo real de variables ambientales en"
            " plantas de procesamiento de alimentos"
        ),
        "autores": "María Elena García López, Ana Lucía Martínez Fernández",
        "resumen": (
            "Diseño e implementación de una plataforma de Internet de las Cosas para el"
            " monitoreo continuo de temperatura, humedad y calidad del aire en instalaciones"
            " de procesamiento alimentario."
        ),
        "doi": "10.1016/j.compag.2025.109876",
        "journal": "Computers and Electronics in Agriculture",
        "fecha_publicacion": datetime(2025, 3, 8),
        "palabras_clave": ["IoT", "monitoreo ambiental", "industria alimentaria", "sensores"],
        "sector_codigo": "AUT",
        "url": "https://doi.org/10.1016/j.compag.2025.109876",
    },
    {
        "titulo": "Hidrógeno verde como vector energético para la industria química cubana: análisis de viabilidad",
        "autores": "Pedro Manuel Sánchez Díaz, Carlos Alejandro Rodríguez Pérez, Ana Lucía Martínez Fernández",
        "resumen": (
            "Estudio de viabilidad técnica y económica para la producción de hidrógeno verde"
            " mediante electrólisis solar en la industria química cubana, con proyección a"
            " 2030."
        ),
        "doi": "10.1016/j.ijhydrogen.2025.04.023",
        "journal": "International Journal of Hydrogen Energy",
        "fecha_publicacion": datetime(2025, 6, 25),
        "palabras_clave": ["hidrógeno verde", "electrólisis", "energía solar", "industria química"],
        "sector_codigo": "ENE",
        "url": "https://doi.org/10.1016/j.ijhydrogen.2025.04.023",
    },
    {
        "titulo": (
            "Materiales compuestos de fibra de coco para aplicaciones estructurales en la"
            " construcción civil cubana"
        ),
        "autores": "Laura Isabel Hernández Torres, Pedro Manuel Sánchez Díaz",
        "resumen": (
            "Caracterización mecánica de materiales compuestos reforzados con fibra de coco"
            " natural para uso en elementos estructurales no convencionales, con propiedades"
            " comparables a materiales sintéticos."
        ),
        "doi": "10.1016/j.compositesb.2025.110567",
        "journal": "Composites Part B: Engineering",
        "fecha_publicacion": datetime(2025, 4, 2),
        "palabras_clave": ["materiales compuestos", "fibra de coco", "construcción", "sostenibilidad"],
        "sector_codigo": "SID",
        "url": "https://doi.org/10.1016/j.compositesb.2025.110567",
    },
]


async def seed_research_publications(session: AsyncSession) -> int:
    result = await session.execute(select(ResearchPublication.titulo).limit(1))
    if result.scalar_one_or_none():
        return 0
    for data in _RESEARCH_PUBLICATIONS:
        session.add(ResearchPublication(id=uuid4(), **data))
    await session.flush()
    logger.info("seeded_research_publications", count=len(_RESEARCH_PUBLICATIONS))
    return len(_RESEARCH_PUBLICATIONS)


# ---------------------------------------------------------------------------
# Patents
# ---------------------------------------------------------------------------

_PATENTS = [
    {
        "title": "Sistema de detección temprana de fallos en motores de vehículos mediante análisis de vibraciones",
        "patent_number": "CU202600001",
        "applicant": "AutoTech Solutions",
        "inventor": "Pérez, G.; Rodríguez, L.; Hernández, M.",
        "filing_date": date(2024, 8, 15),
        "publication_date": date(2025, 12, 10),
        "status": PatentStatus.GRANTED,
        "abstract": (
            "Sistema embebido basado en redes neuronales convolutional para el monitoreo en tiempo real "
            "de vibraciones en motores de combustión interna, capaz de detectar anomalías con un 94% "
            "de precisión antes de que ocurra una falla catastrófica."
        ),
        "technological_sector": "AUT",
        "country": "Cuba",
        "org_siglas": "CIEA",
    },
    {
        "title": "Proceso de obtención de biopolímeros a partir de residuos de la industria azucarera",
        "patent_number": "CU202600002",
        "applicant": "Centro de Biotecnología Industrial",
        "inventor": "García, A.; Martínez, R.; Fernández, T.",
        "filing_date": date(2024, 5, 20),
        "publication_date": date(2025, 9, 15),
        "status": PatentStatus.GRANTED,
        "abstract": (
            "Método innovador para la conversión de bagazo de caña y otros residuos lignocelulósicos "
            "en biopolímeros biodegradables mediante fermentación bacteriana, con aplicaciones "
            "en empaques y dispositivos médicos."
        ),
        "technological_sector": "BIO",
        "country": "Cuba",
        "org_siglas": "CBI",
    },
    {
        "title": "Dispositivo de iluminación LED de alta eficiencia con gestión inteligente de energía",
        "patent_number": "CU202600003",
        "applicant": "Empresa Eléctrica de Villa Clara",
        "inventor": "López, D.; Torres, S.; Cruz, R.",
        "filing_date": date(2024, 1, 10),
        "publication_date": date(2025, 6, 20),
        "status": PatentStatus.GRANTED,
        "abstract": (
            "Luminaria LED con módulo IoT integrado que ajusta automáticamente el flujo luminoso "
            "según la presencia de personas y la luz ambiental, logrando un ahorro energético "
            "superior al 60% respecto a luminarias convencionales."
        ),
        "technological_sector": "ELE",
        "country": "Cuba",
        "org_siglas": "ELEVC",
    },
    {
        "title": "Método de recuperación de metales raros a partir de escorias metalúrgicas",
        "patent_number": "CU202600004",
        "applicant": "Empresa de Metalurgia y Equipo Técnico Camagüey",
        "inventor": "Herrera, J.; Castillo, P.; Vega, M.",
        "filing_date": date(2024, 11, 5),
        "publication_date": date(2026, 2, 28),
        "status": PatentStatus.GRANTED,
        "abstract": (
            "Proceso hidrometalúrgico combinado con extracción por solvente para la recuperación "
            "selectiva de metales de tierras raras contenidos en escorias de la industria "
            "metalúrgica, con una eficiencia de extracción del 91%."
        ),
        "technological_sector": "MET",
        "country": "Cuba",
        "org_siglas": "INSID",
    },
    {
        "title": "Composición catalítica para la producción de amoníaco verde a baja temperatura",
        "patent_number": "CU202600005",
        "applicant": "QuimiCuba Industrial",
        "inventor": "Medina, O.; Ramírez, E.; Sánchez, L.",
        "filing_date": date(2025, 2, 14),
        "publication_date": None,
        "status": PatentStatus.EXAMINATION,
        "abstract": (
            "Nuevo catalizador heterogéneo basado en nitruros metálicos soportados sobre carbón "
            "activado que permite la síntesis de amoníaco a temperaturas de 250-350°C, "
            "reduciendo significativamente el consumo energético del proceso Haber-Bosch."
        ),
        "technological_sector": "QUI",
        "country": "Cuba",
        "org_siglas": "CBI",
    },
    {
        "title": "Procedimiento de laminación en caliente para aceros de alta resistencia soldables",
        "patent_number": "CU202600006",
        "applicant": "Instituto Nacional de Siderurgia y Industria del Duque",
        "inventor": "González, R.; Díaz, F.; Álvarez, P.",
        "filing_date": date(2024, 9, 30),
        "publication_date": date(2025, 11, 18),
        "status": PatentStatus.GRANTED,
        "abstract": (
            "Procedimiento termomecánico de laminación en caliente controlada que produce aceros "
            "microaleados con límite elástico superior a 700 MPa y excelente soldabilidad, "
            "aptos para construcciones sismorresistentes."
        ),
        "technological_sector": "SID",
        "country": "Cuba",
        "org_siglas": "METCAM",
    },
]


async def seed_patents(session: AsyncSession) -> int:
    result = await session.execute(select(Organization.siglas, Organization.id))
    org_by_siglas = dict(result.all())

    result = await session.execute(select(Patent))
    existing = {p.patent_number: p for p in result.scalars().all()}

    inserted = 0
    updated = 0
    for data in _PATENTS:
        org_id = org_by_siglas.get(data.get("org_siglas"))
        patent_data = {k: v for k, v in data.items() if k != "org_siglas"}
        existing_patent = existing.get(data["patent_number"])
        if existing_patent is None:
            session.add(Patent(id=uuid4(), organization_id=org_id, **patent_data))
            inserted += 1
        elif org_id and existing_patent.organization_id is None:
            existing_patent.organization_id = org_id
            updated += 1
    if inserted or updated:
        await session.flush()
        logger.info("seeded_patents", inserted=inserted, linked=updated)
    return inserted


async def seed_follows(session: AsyncSession) -> int:
    """Seed organization-to-organization follow relationships (enterprise graph)."""
    orgs = (await session.execute(select(Organization))).scalars().all()
    org_map = {o.siglas: o.id for o in orgs}

    existing = {
        (str(f.follower_id), str(f.organization_id))
        for f in (await session.execute(select(Follow))).scalars().all()
    }

    inserted = 0
    for src, tgt in FOLLOWS_DATA:
        src_id = org_map.get(src)
        tgt_id = org_map.get(tgt)
        if not src_id or not tgt_id:
            continue
        if (str(src_id), str(tgt_id)) in existing:
            continue
        session.add(Follow(
            follower_id=src_id,
            follower_type="organization",
            organization_id=tgt_id,
        ))
        inserted += 1

    if inserted:
        await session.flush()
        logger.info("seeded_organization_follows", count=inserted)
    return inserted


async def seed_all(session: AsyncSession) -> None:
    """Run all seed functions in the correct order."""
    await seed_industrial_sectors(session)
    await seed_organizations(session)
    await seed_follows(session)
    await seed_users(session)
    await seed_professional_profiles(session)
    await seed_technologies(session)
    await seed_indicators(session)
    await seed_alerts(session)
    await seed_bulletins(session)
    await seed_competitiveness(session)
    await seed_patent_maps(session)
    await seed_research_publications(session)
    await seed_patents(session)
