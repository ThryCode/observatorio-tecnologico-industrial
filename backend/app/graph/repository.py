import re

from neo4j import AsyncDriver
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession


class GraphRepository:
    def __init__(self, driver: AsyncDriver):
        self.driver = driver

    async def get_enterprise_graph(self):
        from app.schemas.graph import EnterpriseGraphEdge, EnterpriseGraphNode, EnterpriseGraphResponse
        async with self.driver.session() as session:
            nodes_result = await session.run(
                "MATCH (n:Enterprise) RETURN n.id AS id, n.nombre AS nombre, n.siglas AS siglas, "
                "n.sector_codigo AS sector, n.tipo AS tipo, n.provincia AS provincia ORDER BY n.id"
            )
            nodes_data = await nodes_result.data()

            edges_result = await session.run(
                "MATCH (a:Enterprise)-[:FOLLOWS]->(b:Enterprise) "
                "RETURN a.id AS source, b.id AS target"
            )
            edges_data = await edges_result.data()

        if not nodes_data:
            return None

        nodes = [
            EnterpriseGraphNode(
                id=n["id"],
                type="organization",
                label=f'{n.get("nombre", "")} ({n.get("siglas", "")})',
                siglas=n.get("siglas"),
                sector=n.get("sector"),
                tipo=n.get("tipo"),
                provincia=n.get("provincia"),
            )
            for n in nodes_data
        ]
        edges = [
            EnterpriseGraphEdge(source=e["source"], target=e["target"], type="FOLLOWS")
            for e in edges_data
        ]
        return EnterpriseGraphResponse(nodes=nodes, edges=edges)

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

        batch_size = 500

        async with self.driver.session() as session:
            await self._ensure_constraints(session)
            nodes_merged = 0
            rels_merged = 0

            # --- IndustrialSector ---
            sectors = (await db.execute(select(IndustrialSector))).scalars().all()
            for i in range(0, len(sectors), batch_size):
                batch = sectors[i:i+batch_size]
                batch_data = [
                    {
                        "codigo": s.codigo,
                        "props": {"nombre": s.nombre, "descripcion": s.descripcion},
                    }
                    for s in batch
                ]
                result = await session.run(
                    """
                    UNWIND $batch AS item
                    MERGE (n:IndustrialSector {codigo: item.codigo})
                    SET n += item.props
                    RETURN count(*) AS merged
                    """,
                    batch=batch_data,
                )
                record = await result.single()
                nodes_merged += record["merged"]

            # --- Organization ---
            orgs = (await db.execute(select(Organization))).scalars().all()
            for i in range(0, len(orgs), batch_size):
                batch = orgs[i:i+batch_size]
                batch_data = [
                    {
                        "id": str(o.id),
                        "props": {
                            "nombre": o.nombre,
                            "siglas": o.siglas,
                            "tipo": o.tipo,
                            "sector_codigo": o.sector_codigo,
                            "pais": o.pais,
                            "provincia": o.provincia,
                            "sitio_web": o.sitio_web,
                            "email_contacto": o.email_contacto,
                        },
                    }
                    for o in batch
                ]
                result = await session.run(
                    """
                    UNWIND $batch AS item
                    MERGE (n:Organization {id: item.id})
                    SET n += item.props
                    RETURN count(*) AS merged
                    """,
                    batch=batch_data,
                )
                record = await result.single()
                nodes_merged += record["merged"]

                # BELONGS_TO_SECTOR for organizations
                sector_rels = [
                    {"org_id": str(o.id), "sector_codigo": o.sector_codigo}
                    for o in batch if o.sector_codigo
                ]
                if sector_rels:
                    await session.run(
                        """
                        UNWIND $batch AS item
                        MATCH (org:Organization {id: item.org_id})
                        MATCH (s:IndustrialSector {codigo: item.sector_codigo})
                        MERGE (org)-[:BELONGS_TO_SECTOR]->(s)
                        """,
                        batch=sector_rels,
                    )
                    rels_merged += len(sector_rels)

            # --- Technology ---
            techs = (await db.execute(select(Technology))).scalars().all()
            for i in range(0, len(techs), batch_size):
                batch = techs[i:i+batch_size]
                batch_data = [
                    {
                        "id": str(t.id),
                        "props": {
                            "nombre": t.nombre,
                            "descripcion": t.descripcion,
                            "sector_codigo": t.sector_codigo,
                            "trl_nivel": t.trl_nivel,
                            "referencia_ontologia": t.referencia_ontologia,
                            "palabras_clave": t.palabras_clave,
                        },
                    }
                    for t in batch
                ]
                result = await session.run(
                    """
                    UNWIND $batch AS item
                    MERGE (n:Technology {id: item.id})
                    SET n += item.props
                    RETURN count(*) AS merged
                    """,
                    batch=batch_data,
                )
                record = await result.single()
                nodes_merged += record["merged"]

                # BELONGS_TO_SECTOR for technologies
                sector_rels = [
                    {"tech_id": str(t.id), "sector_codigo": t.sector_codigo}
                    for t in batch if t.sector_codigo
                ]
                if sector_rels:
                    await session.run(
                        """
                        UNWIND $batch AS item
                        MATCH (t:Technology {id: item.tech_id})
                        MATCH (s:IndustrialSector {codigo: item.sector_codigo})
                        MERGE (t)-[:BELONGS_TO_SECTOR]->(s)
                        """,
                        batch=sector_rels,
                    )
                    rels_merged += len(sector_rels)

            # --- Patent ---
            patents = (await db.execute(select(Patent))).scalars().all()
            # Collect all inventor data across all patents for batched Person creation
            all_inventor_nodes: list[dict] = []
            all_author_rels: list[dict] = []
            seen_inventors: set[str] = set()

            for i in range(0, len(patents), batch_size):
                batch = patents[i:i+batch_size]
                batch_data = [
                    {
                        "id": str(p.id),
                        "props": {
                            "title": p.title,
                            "patent_number": p.patent_number,
                            "applicant": p.applicant,
                            "inventor": p.inventor,
                            "filing_date": str(p.filing_date),
                            "publication_date": str(p.publication_date) if p.publication_date else None,
                            "status": p.status.value if p.status else None,
                            "abstract": p.abstract,
                            "technological_sector": p.technological_sector,
                            "country": p.country,
                            "technology_id": str(p.technology_id) if p.technology_id else None,
                            "organization_id": str(p.organization_id) if p.organization_id else None,
                        },
                    }
                    for p in batch
                ]
                result = await session.run(
                    """
                    UNWIND $batch AS item
                    MERGE (n:Patent {id: item.id})
                    SET n += item.props
                    RETURN count(*) AS merged
                    """,
                    batch=batch_data,
                )
                record = await result.single()
                nodes_merged += record["merged"]

                # HAS_PATENT relationships
                has_patent_rels = [
                    {"org_id": str(p.organization_id), "pat_id": str(p.id)}
                    for p in batch if p.organization_id
                ]
                if has_patent_rels:
                    await session.run(
                        """
                        UNWIND $batch AS item
                        MATCH (org:Organization {id: item.org_id})
                        MATCH (p:Patent {id: item.pat_id})
                        MERGE (org)-[:HAS_PATENT]->(p)
                        """,
                        batch=has_patent_rels,
                    )
                    rels_merged += len(has_patent_rels)

                # RELATES_TO relationships
                relates_to_rels = [
                    {"pat_id": str(p.id), "tech_id": str(p.technology_id)}
                    for p in batch if p.technology_id
                ]
                if relates_to_rels:
                    await session.run(
                        """
                        UNWIND $batch AS item
                        MATCH (p:Patent {id: item.pat_id})
                        MATCH (t:Technology {id: item.tech_id})
                        MERGE (p)-[:RELATES_TO]->(t)
                        """,
                        batch=relates_to_rels,
                    )
                    rels_merged += len(relates_to_rels)

                # Collect inventor data for Person nodes and IS_AUTHOR_OF relationships
                for p in batch:
                    inventors = [inv.strip() for inv in p.inventor.split(",") if inv.strip()]
                    for inv_name in inventors:
                        person_id = f"person-{inv_name.lower().replace(' ', '-')}"
                        if person_id not in seen_inventors:
                            seen_inventors.add(person_id)
                            all_inventor_nodes.append({
                                "id": person_id,
                                "name": inv_name,
                            })
                        all_author_rels.append({
                            "person_id": person_id,
                            "pat_id": str(p.id),
                        })

            # Batch create Person nodes
            for i in range(0, len(all_inventor_nodes), batch_size):
                batch = all_inventor_nodes[i:i+batch_size]
                result = await session.run(
                    """
                    UNWIND $batch AS item
                    MERGE (n:Person {id: item.id})
                    SET n.name = item.name
                    RETURN count(*) AS merged
                    """,
                    batch=batch,
                )
                record = await result.single()
                nodes_merged += record["merged"]

            # Batch create IS_AUTHOR_OF relationships
            for i in range(0, len(all_author_rels), batch_size):
                batch = all_author_rels[i:i+batch_size]
                await session.run(
                    """
                    UNWIND $batch AS item
                    MATCH (per:Person {id: item.person_id})
                    MATCH (p:Patent {id: item.pat_id})
                    MERGE (per)-[:IS_AUTHOR_OF]->(p)
                    """,
                    batch=batch,
                )
                rels_merged += len(batch)

            # --- Regulation ---
            regs = (await db.execute(select(Regulation))).scalars().all()
            for i in range(0, len(regs), batch_size):
                batch = regs[i:i+batch_size]
                batch_data = [
                    {
                        "id": str(r.id),
                        "props": {
                            "title": r.title,
                            "regulation_number": r.regulation_number,
                            "issuing_body": r.issuing_body,
                            "publication_date": str(r.publication_date),
                            "effective_date": str(r.effective_date) if r.effective_date else None,
                            "category": r.category.value if r.category else None,
                            "summary": r.summary,
                            "sector_codigo": r.sector_codigo,
                        },
                    }
                    for r in batch
                ]
                result = await session.run(
                    """
                    UNWIND $batch AS item
                    MERGE (n:Regulation {id: item.id})
                    SET n += item.props
                    RETURN count(*) AS merged
                    """,
                    batch=batch_data,
                )
                record = await result.single()
                nodes_merged += record["merged"]

                # BELONGS_TO_SECTOR for regulations
                sector_rels = [
                    {"reg_id": str(r.id), "sector_codigo": r.sector_codigo}
                    for r in batch if r.sector_codigo
                ]
                if sector_rels:
                    await session.run(
                        """
                        UNWIND $batch AS item
                        MATCH (r:Regulation {id: item.reg_id})
                        MATCH (s:IndustrialSector {codigo: item.sector_codigo})
                        MERGE (r)-[:BELONGS_TO_SECTOR]->(s)
                        """,
                        batch=sector_rels,
                    )
                    rels_merged += len(sector_rels)

            # --- Indicator ---
            indicators = (await db.execute(select(Indicator))).scalars().all()
            for i in range(0, len(indicators), batch_size):
                batch = indicators[i:i+batch_size]
                batch_data = [
                    {
                        "id": str(ind.id),
                        "props": {
                            "name": ind.name,
                            "code": ind.code,
                            "description": ind.description,
                            "unit": ind.unit,
                            "value": float(ind.value) if ind.value else None,
                            "source": ind.source,
                            "period": ind.period.value if ind.period else None,
                            "sector_codigo": ind.sector_codigo,
                            "created_at": str(ind.created_at) if ind.created_at else None,
                        },
                    }
                    for ind in batch
                ]
                result = await session.run(
                    """
                    UNWIND $batch AS item
                    MERGE (n:Indicator {id: item.id})
                    SET n += item.props
                    RETURN count(*) AS merged
                    """,
                    batch=batch_data,
                )
                record = await result.single()
                nodes_merged += record["merged"]

                # BELONGS_TO_SECTOR for indicators
                sector_rels = [
                    {"ind_id": str(ind.id), "sector_codigo": ind.sector_codigo}
                    for ind in batch if ind.sector_codigo
                ]
                if sector_rels:
                    await session.run(
                        """
                        UNWIND $batch AS item
                        MATCH (ind:Indicator {id: item.ind_id})
                        MATCH (s:IndustrialSector {codigo: item.sector_codigo})
                        MERGE (ind)-[:BELONGS_TO_SECTOR]->(s)
                        """,
                        batch=sector_rels,
                    )
                    rels_merged += len(sector_rels)

            return {"nodes_merged": nodes_merged, "relationships_merged": rels_merged}

    async def sync_enterprise_graph(self, db: AsyncSession):
        from app.models.follow import Follow
        from app.models.organization import Organization
        from app.models.user import User

        async with self.driver.session() as session:
            nodes_merged = 0
            rels_merged = 0

            orgs = (await db.execute(select(Organization))).scalars().all()
            org_map = {str(o.id): o for o in orgs}

            for o in orgs:
                props = {
                    "nombre": o.nombre,
                    "siglas": o.siglas,
                    "tipo": o.tipo,
                    "sector_codigo": o.sector_codigo,
                    "pais": o.pais,
                    "provincia": o.provincia,
                }
                await session.run(
                    "MERGE (n:Enterprise:Organization {id: $id}) SET n += $props",
                    id=str(o.id), props=props,
                )
                nodes_merged += 1

            users = (await db.execute(select(User))).scalars().all()
            user_org_map = {
                str(u.id): str(u.organization_id)
                for u in users if u.organization_id
            }

            follows = (await db.execute(
                select(Follow).where(Follow.follower_type == "user")
            )).scalars().all()

            seen: set[tuple[str, str]] = set()
            for f in follows:
                follower_org = user_org_map.get(str(f.follower_id))
                target_org = str(f.organization_id)
                if not follower_org or follower_org == target_org:
                    continue
                if follower_org in org_map and target_org in org_map:
                    key = (follower_org, target_org)
                    if key not in seen:
                        seen.add(key)
                        await session.run(
                            """
                            MATCH (a:Enterprise {id: $source}), (b:Enterprise {id: $target})
                            MERGE (a)-[:FOLLOWS]->(b)
                            """,
                            source=follower_org, target=target_org,
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
