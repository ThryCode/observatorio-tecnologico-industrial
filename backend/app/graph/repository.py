import re

from neo4j import AsyncDriver
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession


class GraphRepository:
    def __init__(self, driver: AsyncDriver):
        self.driver = driver

    async def _apoc_available(self) -> bool:
        try:
            async with self.driver.session() as session:
                result = await session.run("RETURN apoc.version() AS v")
                await result.single()
                return True
        except Exception:
            return False

    async def explore_node(self, node_id: str, depth: int = 2):
        async with self.driver.session() as session:
            apoc_ok = await self._apoc_available()
            if apoc_ok:
                result = await session.run(
                    """
                    MATCH (n)
                    WHERE elementId(n) = $node_id OR n.id = $node_id
                    CALL apoc.path.subgraphAll(n, {maxLevel: $depth})
                    YIELD nodes, relationships
                    RETURN nodes, relationships
                    """,
                    node_id=node_id,
                    depth=depth,
                )
                record = await result.single()
                return record.data() if record else None
            result = await session.run(
                """
                MATCH path = (n)-[*1..$depth]-(m)
                WHERE elementId(n) = $node_id OR n.id = $node_id
                RETURN collect(DISTINCT n) + collect(DISTINCT m) AS nodes,
                       collect(DISTINCT relationships(path)) AS relationships
                LIMIT 1
                """,
                node_id=node_id,
                depth=depth,
            )
            record = await result.single()
            return record.data() if record else None

    async def search_nodes(self, q: str, labels: list[str] | None = None, page: int = 1, per_page: int = 20):
        params = {"q": re.escape(q)}
        label_filter = ""
        if labels:
            label_filter = "AND any(lbl IN labels(n) WHERE lbl IN $labels)"
            params["labels"] = labels
        skip = (page - 1) * per_page

        async with self.driver.session() as session:
            count_result = await session.run(
                f"""
                MATCH (n)
                WHERE (
                    toLower(n.name) CONTAINS toLower($q) OR
                    toLower(n.title) CONTAINS toLower($q) OR
                    toLower(n.code) CONTAINS toLower($q) OR
                    toLower(n.nombre) CONTAINS toLower($q)
                )
                {label_filter}
                RETURN count(*) AS total
                """,
                params,
            )
            total_record = await count_result.single()
            total = total_record["total"] if total_record else 0

            result = await session.run(
                f"""
                MATCH (n)
                WHERE (
                    toLower(n.name) CONTAINS toLower($q) OR
                    toLower(n.title) CONTAINS toLower($q) OR
                    toLower(n.code) CONTAINS toLower($q) OR
                    toLower(n.nombre) CONTAINS toLower($q)
                )
                {label_filter}
                RETURN n, labels(n) AS node_labels
                SKIP $skip
                LIMIT $per_page
                """,
                params | {"skip": skip, "per_page": per_page},
            )
            items = [record.data() async for record in result]
            return {"items": items, "total": total, "page": page, "per_page": per_page}

    async def stats(self):
        async with self.driver.session() as session:
            result = await session.run(
                """
                MATCH (n)
                UNWIND labels(n) AS label
                RETURN label, count(*) AS count
                ORDER BY count DESC
                """
            )
            return [record.data() async for record in result]

    async def shortest_path(self, from_id: str, to_id: str, max_depth: int = 10):
        async with self.driver.session() as session:
            apoc_ok = await self._apoc_available()
            if apoc_ok:
                result = await session.run(
                    """
                    MATCH (a), (b)
                    WHERE (elementId(a) = $from_id OR a.id = $from_id)
                      AND (elementId(b) = $to_id OR b.id = $to_id)
                    CALL apoc.algo.dijkstra(a, b, '', 'weight', 1, $max_depth)
                    YIELD path, weight
                    RETURN [n IN nodes(path) | elementId(n)] AS node_ids,
                           [r IN relationships(path) | type(r)] AS rel_types,
                           weight
                    LIMIT 1
                    """,
                    from_id=from_id,
                    to_id=to_id,
                    max_depth=max_depth,
                )
                record = await result.single()
                return record.data() if record else None
            result = await session.run(
                """
                MATCH path = shortestPath(
                    (a)-[*1..$max_depth]-(b)
                )
                WHERE (elementId(a) = $from_id OR a.id = $from_id)
                  AND (elementId(b) = $to_id OR b.id = $to_id)
                RETURN [n IN nodes(path) | elementId(n)] AS node_ids,
                       [r IN relationships(path) | type(r)] AS rel_types,
                       length(path) AS weight
                LIMIT 1
                """,
                from_id=from_id,
                to_id=to_id,
                max_depth=max_depth,
            )
            record = await result.single()
            return record.data() if record else None

    async def sync_all(self, db: AsyncSession):
        from app.models.indicator import Indicator
        from app.models.industrial_sector import IndustrialSector
        from app.models.organization import Organization
        from app.models.patent import Patent
        from app.models.regulation import Regulation
        from app.models.technology import Technology

        async with self.driver.session() as session:
            await self._ensure_constraints(session)
            nodes_merged = 0
            rels_merged = 0

            # IndustrialSector
            for sector in (await db.execute(select(IndustrialSector))).scalars().all():
                await session.run(
                    "MERGE (n:IndustrialSector {codigo: $codigo}) SET n += $props",
                    codigo=sector.codigo,
                    props={"nombre": sector.nombre, "descripcion": sector.descripcion},
                )
                nodes_merged += 1

            # Organization
            org_query = select(Organization)
            for org in (await db.execute(org_query)).scalars().all():
                props = {
                    "nombre": org.nombre,
                    "siglas": org.siglas,
                    "tipo": org.tipo,
                    "sector_codigo": org.sector_codigo,
                    "pais": org.pais,
                    "provincia": org.provincia,
                    "sitio_web": org.sitio_web,
                    "email_contacto": org.email_contacto,
                }
                await session.run(
                    "MERGE (n:Organization {id: $id}) SET n += $props",
                    id=str(org.id), props=props,
                )
                nodes_merged += 1
                if org.sector_codigo:
                    await session.run(
                        """
                        MATCH (org:Organization {id: $org_id}), (s:IndustrialSector {codigo: $codigo})
                        MERGE (org)-[:BELONGS_TO_SECTOR]->(s)
                        """,
                        org_id=str(org.id), codigo=org.sector_codigo,
                    )
                    rels_merged += 1

            # Technology
            for tech in (await db.execute(select(Technology))).scalars().all():
                props = {
                    "nombre": tech.nombre,
                    "descripcion": tech.descripcion,
                    "sector_codigo": tech.sector_codigo,
                    "trl_nivel": tech.trl_nivel,
                    "referencia_ontologia": tech.referencia_ontologia,
                    "palabras_clave": tech.palabras_clave,
                }
                await session.run(
                    "MERGE (n:Technology {id: $id}) SET n += $props",
                    id=str(tech.id), props=props,
                )
                nodes_merged += 1
                if tech.sector_codigo:
                    await session.run(
                        """
                        MATCH (t:Technology {id: $tech_id}), (s:IndustrialSector {codigo: $codigo})
                        MERGE (t)-[:BELONGS_TO_SECTOR]->(s)
                        """,
                        tech_id=str(tech.id), codigo=tech.sector_codigo,
                    )
                    rels_merged += 1

            # Patent
            patent_query = select(Patent)
            for pat in (await db.execute(patent_query)).scalars().all():
                props = {
                    "title": pat.title,
                    "patent_number": pat.patent_number,
                    "applicant": pat.applicant,
                    "inventor": pat.inventor,
                    "filing_date": str(pat.filing_date),
                    "publication_date": str(pat.publication_date) if pat.publication_date else None,
                    "status": pat.status.value if pat.status else None,
                    "abstract": pat.abstract,
                    "technological_sector": pat.technological_sector,
                    "country": pat.country,
                    "technology_id": str(pat.technology_id) if pat.technology_id else None,
                    "organization_id": str(pat.organization_id) if pat.organization_id else None,
                }
                await session.run(
                    "MERGE (n:Patent {id: $id}) SET n += $props",
                    id=str(pat.id), props=props,
                )
                nodes_merged += 1
                if pat.organization_id:
                    await session.run(
                        """
                        MATCH (org:Organization {id: $org_id}), (p:Patent {id: $pat_id})
                        MERGE (org)-[:HAS_PATENT]->(p)
                        """,
                        org_id=str(pat.organization_id), pat_id=str(pat.id),
                    )
                    rels_merged += 1
                if pat.technology_id:
                    await session.run(
                        """
                        MATCH (p:Patent {id: $pat_id}), (t:Technology {id: $tech_id})
                        MERGE (p)-[:RELATES_TO]->(t)
                        """,
                        pat_id=str(pat.id), tech_id=str(pat.technology_id),
                    )
                    rels_merged += 1

                # Person (inventor) extraction
                inventors = [inv.strip() for inv in pat.inventor.split(",") if inv.strip()]
                for inv_name in inventors:
                    person_id = f"person-{inv_name.lower().replace(' ', '-')}"
                    await session.run(
                        "MERGE (n:Person {id: $person_id}) SET n.name = $name",
                        person_id=person_id, name=inv_name,
                    )
                    nodes_merged += 1
                    await session.run(
                        """
                        MATCH (per:Person {id: $person_id}), (p:Patent {id: $pat_id})
                        MERGE (per)-[:IS_AUTHOR_OF]->(p)
                        """,
                        person_id=person_id, pat_id=str(pat.id),
                    )
                    rels_merged += 1

            # Regulation
            for reg in (await db.execute(select(Regulation))).scalars().all():
                props = {
                    "title": reg.title,
                    "regulation_number": reg.regulation_number,
                    "issuing_body": reg.issuing_body,
                    "publication_date": str(reg.publication_date),
                    "effective_date": str(reg.effective_date) if reg.effective_date else None,
                    "category": reg.category.value if reg.category else None,
                    "summary": reg.summary,
                    "sector_codigo": reg.sector_codigo,
                }
                await session.run(
                    "MERGE (n:Regulation {id: $id}) SET n += $props",
                    id=str(reg.id), props=props,
                )
                nodes_merged += 1
                if reg.sector_codigo:
                    await session.run(
                        """
                        MATCH (r:Regulation {id: $reg_id}), (s:IndustrialSector {codigo: $codigo})
                        MERGE (r)-[:BELONGS_TO_SECTOR]->(s)
                        """,
                        reg_id=str(reg.id), codigo=reg.sector_codigo,
                    )
                    rels_merged += 1

            # Indicator
            for ind in (await db.execute(select(Indicator))).scalars().all():
                props = {
                    "name": ind.name,
                    "code": ind.code,
                    "description": ind.description,
                    "unit": ind.unit,
                    "value": float(ind.value) if ind.value else None,
                    "source": ind.source,
                    "period": ind.period.value if ind.period else None,
                    "sector_codigo": ind.sector_codigo,
                    "created_at": str(ind.created_at) if ind.created_at else None,
                }
                await session.run(
                    "MERGE (n:Indicator {id: $id}) SET n += $props",
                    id=str(ind.id), props=props,
                )
                nodes_merged += 1
                if ind.sector_codigo:
                    await session.run(
                        """
                        MATCH (ind:Indicator {id: $ind_id}), (s:IndustrialSector {codigo: $codigo})
                        MERGE (ind)-[:BELONGS_TO_SECTOR]->(s)
                        """,
                        ind_id=str(ind.id), codigo=ind.sector_codigo,
                    )
                    rels_merged += 1

            return {"nodes_merged": nodes_merged, "relationships_merged": rels_merged}

    async def _ensure_constraints(self, session):
        constraints = [
            "CREATE CONSTRAINT IF NOT EXISTS FOR (n:Organization) REQUIRE n.id IS UNIQUE",
            "CREATE CONSTRAINT IF NOT EXISTS FOR (n:Technology) REQUIRE n.id IS UNIQUE",
            "CREATE CONSTRAINT IF NOT EXISTS FOR (n:Patent) REQUIRE n.id IS UNIQUE",
            "CREATE CONSTRAINT IF NOT EXISTS FOR (n:Regulation) REQUIRE n.id IS UNIQUE",
            "CREATE CONSTRAINT IF NOT EXISTS FOR (n:Indicator) REQUIRE n.id IS UNIQUE",
            "CREATE CONSTRAINT IF NOT EXISTS FOR (n:IndustrialSector) REQUIRE n.codigo IS UNIQUE",
            "CREATE CONSTRAINT IF NOT EXISTS FOR (n:Person) REQUIRE n.id IS UNIQUE",
        ]
        for cql in constraints:
            try:  # noqa: SIM105
                await session.run(cql)
            except Exception:
                pass
