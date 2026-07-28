"""Seed data for Bulletins, Competitiveness and PatentMap entities.

Usage:
    cd backend
    python scripts/seed_data.py
"""

import asyncio
import uuid
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine

from app.core.config import settings
from app.models.base import Base
from app.models.bulletin import Bulletin
from app.models.competitiveness import CompetitivenessIndex
from app.models.patent_map import PatentMapEntry

engine = create_async_engine(settings.database_url)


async def seed_bulletins(db: AsyncSession) -> int:
    result = await db.execute(select(Bulletin).limit(1))
    if result.scalar_one_or_none():
        return 0

    bulletins = [
        Bulletin(
            id=uuid.uuid4(), titulo="Boletin Trimestral de Ciencia y Tecnologia Q2 2026",
            resumen="Analisis de las tendencias tecnologicas emergentes en los sectores siderurgico, metalurgico y quimico de la industria cubana.",
            fecha_publicacion=datetime(2026, 7, 1), categoria="boletin", autor="OCyT", sector_codigo="SID",
        ),
        Bulletin(
            id=uuid.uuid4(), titulo="Estudio de Prospectiva: IA en Manufactura",
            resumen="Evaluacion del potencial de adopcion de IA en los procesos productivos del sector industrial cubano.",
            fecha_publicacion=datetime(2026, 6, 1), categoria="estudio", autor="ICT", sector_codigo="ELE",
        ),
        Bulletin(
            id=uuid.uuid4(), titulo="Alerta Tecnologica: Nuevos Materiales para Hidrogeno",
            resumen="Deteccion temprana de innovaciones en materiales de hidruros metalicos con potencial aplicacion en la industria energetica.",
            fecha_publicacion=datetime(2026, 5, 15), categoria="alerta", autor="CIB",
        ),
        Bulletin(
            id=uuid.uuid4(), titulo="Mapa de Patentes: Tecnologias de Energia Renovable",
            resumen="Visualizacion y analisis de la actividad patentaria en energia solar, eolica y biomasa con relevancia para Cuba.",
            fecha_publicacion=datetime(2026, 4, 1), categoria="mapa", autor="EDI",
        ),
    ]
    db.add_all(bulletins)
    await db.flush()
    return len(bulletins)


COMPETITIVENESS_DATA = [
    ("Siderurgia", "SID", 42, 78, 65, 91),
    ("Metalurgia", "MET", 38, 72, 58, 85),
    ("Quimica", "QUI", 55, 60, 70, 88),
    ("Electronica", "ELE", 28, 55, 62, 70),
]

PAISES = ["Cuba", "Chile", "Mexico", "Brasil"]


async def seed_competitiveness(db: AsyncSession) -> int:
    result = await db.execute(select(CompetitivenessIndex).limit(1))
    if result.scalar_one_or_none():
        return 0

    count = 0
    for sector, codigo, *valores in COMPETITIVENESS_DATA:
        for i, pais in enumerate(PAISES):
            db.add(CompetitivenessIndex(
                id=uuid.uuid4(), sector=sector, sector_codigo=codigo,
                indicador="Indice de competitividad", valor=valores[i],
                pais=pais, periodo="2026-Q2", fuente="BCG",
            ))
            count += 1
    await db.flush()
    return count


PATENT_MAP_DATA = [
    ("Reduccion Directa", "SID", 34, "creciente"),
    ("Sensores IoT", "ELE", 28, "creciente"),
    ("Bioprocesos", None, 22, "estable"),
    ("Energia Solar", None, 19, "creciente"),
    ("Materiales Compuestos", "MET", 15, "estable"),
    ("Hidrogeno Verde", None, 12, "creciente"),
    ("Automatizacion", "AUT", 10, "estable"),
    ("Nanomateriales", "MET", 8, "decreciente"),
]


async def seed_patent_maps(db: AsyncSession) -> int:
    result = await db.execute(select(PatentMapEntry).limit(1))
    if result.scalar_one_or_none():
        return 0

    for tecnologia, codigo, patentes, tendencia in PATENT_MAP_DATA:
        db.add(PatentMapEntry(
            id=uuid.uuid4(), tecnologia=tecnologia, pais="Cuba",
            sector_codigo=codigo, total_patentes=patentes,
            periodo="2026-Q2", tendencia=tendencia,
        ))
    await db.flush()
    return len(PATENT_MAP_DATA)


async def main():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSession(engine, expire_on_commit=False) as db:
        b = await seed_bulletins(db)
        c = await seed_competitiveness(db)
        p = await seed_patent_maps(db)
        await db.commit()
        print(f"Seeded: {b} bulletins, {c} competitiveness indices, {p} patent map entries")


if __name__ == "__main__":
    asyncio.run(main())
