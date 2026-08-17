"""Seed data for initial database population.

All functions are idempotent: they check for existing records before inserting.
Each function returns the number of inserted records.
"""

from datetime import date, datetime
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
from app.models.industrial_sector import IndustrialSector
from app.models.organization import Organization
from app.models.follow import Follow
from app.models.patent import Patent, PatentStatus
from app.models.patent_map import PatentMapEntry
from app.models.professional_profile import ProfessionalProfile
from app.models.research_publication import ResearchPublication
from app.models.technology import Technology
from app.models.user import User, UserStatus
from app.core.seed_follows_data import FOLLOWS_DATA

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
        "role": "rep_cti",
        "status": UserStatus.APPROVED,
        "org_siglas": "BNC",
    },
    {
        "email": "ana@autotech.cu",
        "username": "ana",
        "full_name": "Ana Rodriguez",
        "password": "test12345",
        "role": "rep_cti",
        "status": UserStatus.APPROVED,
        "org_siglas": "ATS",
    },
    {
        "email": "pedro@quimicuba.cu",
        "username": "pedro",
        "full_name": "Pedro Castillo",
        "password": "test12345",
        "role": "rep_cti",
        "status": UserStatus.APPROVED,
        "org_siglas": "QCI",
    },
    {
        "email": "prueba@gmail.com",
        "username": "enmanuel",
        "full_name": "Enmanuel Perez",
        "password": "12345678",
        "role": "rep_cti",
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
        "role": "visitante",
        "password": "paco123",
        "status": UserStatus.APPROVED,
    },
    {
        "username": "marta",
        "email": "marta@investigacion.cu",
        "full_name": "Marta Fernandez",
        "role": "profesional",
        "password": "marta123",
        "status": UserStatus.APPROVED,
    },
    {
        "username": "luis",
        "email": "luis@investigacion.cu",
        "full_name": "Luis Ramirez",
        "role": "profesional",
        "password": "luis123",
        "status": UserStatus.APPROVED,
        "org_siglas": "CIEA",
    },
    {
        "username": "sofia",
        "email": "sofia@biotech.cu",
        "full_name": "Sofia Torres",
        "role": "profesional",
        "password": "sofia123",
        "status": UserStatus.APPROVED,
        "org_siglas": "CBI",
    },
    {
        "username": "jorge",
        "email": "jorge@energia.cu",
        "full_name": "Jorge Navarro",
        "role": "profesional",
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
# Professional Profiles
# ---------------------------------------------------------------------------


_PROFESSIONAL_PROFILES = [
    {
        "username": "paco",
        "especialidad": "Ingeniería Industrial",
        "grado_cientifico": "Doctor",
        "biografia": "Profesional con 15 años de experiencia en automatización industrial y control de procesos.",
        "intereses": ["IA aplicada", "Robótica", "Energías renovables"],
    },
    {
        "username": "marta",
        "especialidad": "Biotecnología",
        "grado_cientifico": "Doctora",
        "biografia": "Investigadora en biotecnología industrial con enfoque en fermentación y bioprocesos.",
        "intereses": ["Biotecnología", "Fermentación", "Bioinformática"],
    },
    {
        "username": "luis",
        "especialidad": "Ingeniería en Automatización",
        "grado_cientifico": "Máster",
        "biografia": "Investigador del Centro de Investigaciones de Energía y Automatización.",
        "intereses": ["Automatización", "Energía", "Control de procesos"],
    },
    {
        "username": "sofia",
        "especialidad": "Biotecnología Industrial",
        "grado_cientifico": "Doctor",
        "biografia": "Especialista en biopolímeros y fermentación en el Centro de Biotecnología Industrial.",
        "intereses": ["Biopolímeros", "Biotecnología", "Economía circular"],
    },
    {
        "username": "jorge",
        "especialidad": "Ingeniería Eléctrica",
        "grado_cientifico": "Máster",
        "biografia": "Ingeniero de la Empresa Eléctrica de Villa Clara, especializado en eficiencia energética.",
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
        logger.info(f"Seeded {inserted} professional profiles")

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
            severidad="alta", leida=False, sector_codigo="BIO",
        ),
        Alert(
            titulo="Actualización regulatoria sector energético",
            descripcion="Nueva normativa para eficiencia energética publicada por el MINEM.",
            severidad="media", leida=False, sector_codigo="ENE",
        ),
        Alert(
            titulo="Indicador de innovación en ascenso",
            descripcion="El índice de innovación industrial subió 3 puntos este trimestre.",
            severidad="baja", leida=True,
        ),
        Alert(
            titulo="Tendencia: Automatización en manufactura",
            descripcion="La adopción de robots industriales crece un 15% anual en la región.",
            severidad="media", leida=False, sector_codigo="MET",
        ),
        Alert(
            titulo="Fondo de innovación disponible",
            descripcion="Nuevo fondo concursable para proyectos de I+D industrial.",
            severidad="alta", leida=False,
        ),
        Alert(
            titulo="Electrónica: nuevo estándar de eficiencia",
            descripcion="Normativa ISO actualizada para componentes electrónicos industriales.",
            severidad="media", leida=False, sector_codigo="ELE",
        ),
        Alert(
            titulo="Química: método innovador de catálisis",
            descripcion="Nuevo catalizador reduce costos en procesos petroquímicos.",
            severidad="media", leida=False, sector_codigo="QUI",
        ),
        Alert(
            titulo="Siderurgia: actualización tecnológica",
            descripcion="Planta siderúrgica nacional incorpora horno de arco eléctrico de última generación.",
            severidad="alta", leida=True, sector_codigo="SID",
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
        "titulo": "Alerta Tecnologica: Nuevos Materiales para Hidrogeno",
        "resumen": "Innovaciones en materiales de hidruros metalicos para almacenamiento de energia.",
        "fecha_publicacion": datetime(2026, 5, 15),
        "categoria": "alerta", "autor": "CIB", "sector_codigo": None,
    },
    {
        "titulo": "Boletin de prueba",
        "resumen": "Probando el endpoint real",
        "fecha_publicacion": datetime(2026, 7, 28),
        "categoria": "boletin", "autor": "Admin MINDUS", "sector_codigo": None,
    },
    {
        "titulo": "Boletin Trimestral Q2 2026",
        "resumen": "Analisis de tendencias tecnologicas en sectores siderurgico, metalurgico y quimico",
        "fecha_publicacion": datetime(2026, 7, 1),
        "categoria": "boletin", "autor": "OCyT", "sector_codigo": "SID",
    },
    {
        "titulo": "Estudio de Prospectiva: IA en Manufactura",
        "resumen": "Evaluacion del potencial de adopcion de IA en procesos productivos industriales",
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
        logger.info(f"Seeded {inserted} bulletins")
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
            id=uuid4(), tecnologia=tecnologia, pais="Cuba",
            sector_codigo=codigo, total_patentes=patentes,
            periodo="2026-Q2", tendencia=tendencia,
        ))
    await session.flush()
    logger.info(f"Seeded {len(_PATENT_MAP_DATA)} patent map entries")
    return len(_PATENT_MAP_DATA)


# ---------------------------------------------------------------------------
# Industrial Sectors
# ---------------------------------------------------------------------------

_SECTORES = [
    {"codigo": "AUT", "nombre": "Automotriz", "descripcion": "Industria automotriz y autopartes"},
    {"codigo": "BIO", "nombre": "Biotecnología", "descripcion": "Biotecnología y ciencias de la vida"},
    {"codigo": "ELE", "nombre": "Electrónica", "descripcion": "Electrónica y equipos eléctricos"},
    {"codigo": "ENE", "nombre": "Energía", "descripcion": "Sector energético industrial"},
    {"codigo": "MET", "nombre": "Metalurgia", "descripcion": "Metalurgia y minería"},
    {"codigo": "QUI", "nombre": "Química", "descripcion": "Industria química y petroquímica"},
    {"codigo": "SID", "nombre": "Siderurgia", "descripcion": "Siderurgia y acero"},
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
        logger.info(f"Seeded {count} industrial sectors")
    return count


# ---------------------------------------------------------------------------
# Research Publications
# ---------------------------------------------------------------------------

_RESEARCH_PUBLICATIONS = [
    {
        "titulo": "Modelo de optimización energética en procesos siderúrgicos mediante redes neuronales",
        "autores": "Rodríguez, C.; Pérez, M.; González, L.",
        "resumen": (
            "Se propone un modelo basado en redes neuronales artificiales para optimizar el consumo "
            "energético en hornos de arco eléctrico de la industria siderúrgica cubana. Los resultados "
            "muestran una reducción del 12% en el consumo específico de energía."
        ),
        "doi": "10.1234/steel.2026.001",
        "journal": "Revista Cubana de Ingeniería Industrial",
        "fecha_publicacion": datetime(2026, 3, 15),
        "palabras_clave": ["redes neuronales", "optimización energética", "siderurgia", "IA"],
        "sector_codigo": "SID",
        "url": "https://doi.org/10.1234/steel.2026.001",
    },
    {
        "titulo": "Bioprospección de microorganismos para biorremediación de efluentes metalúrgicos",
        "autores": "Martínez, A.; Fernández, R.; Díaz, T.",
        "resumen": (
            "Se aislaron y caracterizaron cepas bacterianas nativas con capacidad de remover metales "
            "pesados en efluentes de la industria metalúrgica. La cepa Bacillus sp. MET-23 mostró "
            "una eficiencia de remoción del 87% para cromo hexavalente."
        ),
        "doi": "10.1234/met.2026.008",
        "journal": "Biotecnología Aplicada",
        "fecha_publicacion": datetime(2026, 5, 20),
        "palabras_clave": ["biorremediación", "metales pesados", "microorganismos", "metalurgia"],
        "sector_codigo": "MET",
        "url": "https://doi.org/10.1234/met.2026.008",
    },
    {
        "titulo": "Desarrollo de un recubrimiento cerámico nanoestructurado para prótesis ortopédicas",
        "autores": "Sánchez, P.; Herrera, J.; Cruz, E.",
        "resumen": (
            "Se sintetizaron recubrimientos de hidroxiapatita nanoestructurada mediante deposición "
            "electroforética sobre sustratos de Ti-6Al-4V. Las pruebas in vitro demostraron "
            "excelente biocompatibilidad y resistencia a la corrosión."
        ),
        "doi": "10.1234/bio.2026.003",
        "journal": "Materiales y Biomateriales",
        "fecha_publicacion": datetime(2026, 2, 10),
        "palabras_clave": ["nanotecnología", "biomateriales", "recubrimientos", "implantes"],
        "sector_codigo": "BIO",
        "url": None,
    },
    {
        "titulo": "Sistema de control predictivo para microrredes eléctricas con penetración renovable",
        "autores": "García, D.; López, S.; Torres, R.",
        "resumen": (
            "Se implementó un controlador predictivo basado en modelo (MPC) para la gestión óptima "
            "de microrredes eléctricas con alta penetración de fuentes renovables. El sistema "
            "logró mantener la estabilidad de frecuencia con un error máximo del 0.5%."
        ),
        "doi": "10.1234/ele.2026.012",
        "journal": "Ingeniería Eléctrica y Automática",
        "fecha_publicacion": datetime(2026, 7, 5),
        "palabras_clave": ["microrredes", "control predictivo", "energía renovable", "MPC"],
        "sector_codigo": "ELE",
        "url": "https://doi.org/10.1234/ele.2026.012",
    },
    {
        "titulo": "Evaluación de la huella de carbono del biodiésel a partir de aceite de jatropha en Cuba",
        "autores": "Torres, M.; Ramírez, O.; Medina, J.",
        "resumen": (
            "Mediante análisis de ciclo de vida (LCA) se evaluó la huella de carbono de la "
            "producción de biodiésel a partir de Jatropha curcas en condiciones cubanas. Se "
            "obtuvo una reducción del 62% respecto al diésel fósil."
        ),
        "doi": "10.1234/qui.2026.005",
        "journal": "Revista Cubana de Química",
        "fecha_publicacion": datetime(2026, 4, 28),
        "palabras_clave": ["biodiésel", "huella de carbono", "LCA", "jatropha", "sostenibilidad"],
        "sector_codigo": "QUI",
        "url": "https://doi.org/10.1234/qui.2026.005",
    },
    {
        "titulo": "Arquitectura de control descentralizado para líneas de ensamblaje automotriz basada en ROS 2",
        "autores": "Díaz, L.; Fernández, A.; Pérez, G.",
        "resumen": (
            "Se propone una arquitectura modular de control descentralizado utilizando ROS 2 para "
            "líneas de ensamblaje en la industria automotriz. La implementación redujo el tiempo "
            "de ciclo en un 18% y mejoró la flexibilidad del sistema."
        ),
        "doi": "10.1234/aut.2026.009",
        "journal": "Automatización Industrial",
        "fecha_publicacion": datetime(2026, 6, 15),
        "palabras_clave": ["ROS 2", "control descentralizado", "automotriz", "línea de ensamblaje"],
        "sector_codigo": "AUT",
        "url": None,
    },
]


async def seed_research_publications(session: AsyncSession) -> int:
    result = await session.execute(select(ResearchPublication.titulo).limit(1))
    if result.scalar_one_or_none():
        return 0
    for data in _RESEARCH_PUBLICATIONS:
        session.add(ResearchPublication(id=uuid4(), **data))
    await session.flush()
    logger.info(f"Seeded {len(_RESEARCH_PUBLICATIONS)} research publications")
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
        "org_siglas": "ATS",
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
        "org_siglas": "METCAM",
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
        "org_siglas": "QCI",
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
        "org_siglas": "INSID",
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
        logger.info(f"Seeded {inserted} patents, linked {updated} to organizations")
    return inserted


async def seed_follows(session: AsyncSession) -> int:
    """Seed organization-to-organization follow relationships (enterprise graph)."""
    orgs = (await session.execute(select(Organization))).scalars().all()
    org_map = {o.siglas: str(o.id) for o in orgs}

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
        if (src_id, tgt_id) in existing:
            continue
        session.add(Follow(
            follower_id=src_id,
            follower_type="organization",
            organization_id=tgt_id,
        ))
        inserted += 1

    if inserted:
        await session.flush()
        logger.info(f"Seeded {inserted} organization follows")
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
