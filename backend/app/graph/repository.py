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

    @staticmethod
    def _serialize_node(node) -> dict:
        props = dict(node)
        node_id = props.get("id") or props.get("codigo") or node.element_id
        return {
            "id": str(node_id),
            "labels": list(node.labels),
            "props": props,
        }

    @staticmethod
    def _serialize_edge(rel) -> dict:
        def nid(n) -> str:
            props = dict(n)
            return str(props.get("id") or props.get("codigo") or n.element_id)
        return {
            "source": nid(rel.start_node),
            "target": nid(rel.end_node),
            "type": rel.type,
        }

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
                    RETURN [x IN nodes | {
                        id: coalesce(x.id, x.codigo),
                        labels: labels(x),
                        props: properties(x)
                    }] AS nodes,
                    [r IN relationships | {
                        source: coalesce(startNode(r).id, startNode(r).codigo),
                        target: coalesce(endNode(r).id, endNode(r).codigo),
                        type: type(r)
                    }] AS edges
                    """,
                    node_id=node_id,
                    depth=depth,
                )
                record = await result.single()
                if not record:
                    return {"nodes": [], "edges": [], "total_nodes": 0, "total_edges": 0}
                data = record.data()
                nodes = data["nodes"]
                edges = data["edges"]
                return {
                    "nodes": nodes,
                    "edges": edges,
                    "total_nodes": len(nodes),
                    "total_edges": len(edges),
                }
            # Cypher does not support parameterized variable-length ranges (*1..$depth).
            # depth is validated by FastAPI (ge=1, le=5) and cast to int here for safety.
            safe_depth = int(depth)
            result = await session.run(
                "MATCH (n) "
                "WHERE elementId(n) = $node_id OR n.id = $node_id OR n.codigo = $node_id "
                f"OPTIONAL MATCH (n)-[*1..{safe_depth}]-(m) "  # noqa: S608 — Cypher limitation
                "RETURN collect(DISTINCT n) + collect(DISTINCT m) AS all_nodes",
                node_id=node_id,
            )
            record = await result.single()
            if not record:
                return {"nodes": [], "edges": [], "total_nodes": 0, "total_edges": 0}
            node_ids = [
                x.get("id") or x.get("codigo")
                for x in record["all_nodes"]
                if x.get("id") or x.get("codigo")
            ]
            nodes = [
                {
                    "id": str(x.get("id") or x.get("codigo") or x.element_id),
                    "labels": list(x.labels),
                    "props": dict(x),
                }
                for x in record["all_nodes"]
            ]
            edges = []
            if node_ids:
                edge_result = await session.run(
                    """
                    MATCH (a)-[r]->(b)
                    WHERE coalesce(a.id, a.codigo) IN $node_ids
                      AND coalesce(b.id, b.codigo) IN $node_ids
                    RETURN coalesce(a.id, a.codigo) AS source,
                           coalesce(b.id, b.codigo) AS target,
                           type(r) AS type
                    """,
                    node_ids=node_ids,
                )
                edges = [dict(row) async for row in edge_result]
            return {
                "nodes": nodes,
                "edges": edges,
                "total_nodes": len(nodes),
                "total_edges": len(edges),
            }

    async def query_graph(self, limit: int = 500, sector_codigos: list[str] | None = None):
        async with self.driver.session() as session:
            if sector_codigos:
                nodes_result = await session.run(
                    """
                    MATCH (n)
                    WHERE n.codigo IN $sectors
                       OR EXISTS {
                           MATCH (n)-[:BELONGS_TO_SECTOR]->(s)
                           WHERE s.codigo IN $sectors
                         }
                    RETURN n.id AS id, n.codigo AS codigo, labels(n) AS labels,
                           properties(n) AS props
                    LIMIT $limit
                    """,
                    sectors=sector_codigos,
                    limit=limit,
                )
                nodes_data = await nodes_result.data()

                edges_result = await session.run(
                    """
                    MATCH (a)-[r]->(b)
                    WHERE a.codigo IN $sectors OR b.codigo IN $sectors
                       OR EXISTS {
                           MATCH (a)-[:BELONGS_TO_SECTOR]->(s)
                           WHERE s.codigo IN $sectors
                         }
                       OR EXISTS {
                           MATCH (b)-[:BELONGS_TO_SECTOR]->(s)
                           WHERE s.codigo IN $sectors
                         }
                    RETURN a.id AS sid, a.codigo AS scod, b.id AS tid, b.codigo AS tcod,
                           type(r) AS type
                    LIMIT $limit
                    """,
                    sectors=sector_codigos,
                    limit=limit,
                )
                edges_data = await edges_result.data()
            else:
                nodes_result = await session.run(
                    """
                    MATCH (n)
                    RETURN n.id AS id, n.codigo AS codigo, labels(n) AS labels,
                           properties(n) AS props
                    LIMIT $limit
                    """,
                    limit=limit,
                )
                nodes_data = await nodes_result.data()

                edges_result = await session.run(
                    """
                    MATCH (a)-[r]->(b)
                    RETURN a.id AS sid, a.codigo AS scod, b.id AS tid, b.codigo AS tcod,
                           type(r) AS type
                    LIMIT $limit
                    """,
                    limit=limit,
                )
                edges_data = await edges_result.data()

        nodes = [
            {
                "id": str(n["id"] or n["codigo"]),
                "labels": n["labels"],
                "props": n["props"],
            }
            for n in nodes_data
        ]
        edges = [
            {
                "source": str(e["sid"] or e["scod"]),
                "target": str(e["tid"] or e["tcod"]),
                "type": e["type"],
            }
            for e in edges_data
        ]
        return {
            "nodes": nodes,
            "edges": edges,
            "total_nodes": len(nodes),
            "total_edges": len(edges),
        }

    async def search_nodes(self, q: str, labels: list[str] | None = None, page: int = 1, per_page: int = 20):
        params: dict = {"q": re.escape(q)}
        label_clause = ""
        if labels:
            label_clause = "AND any(lbl IN labels(n) WHERE lbl IN $labels)"
            params["labels"] = labels
        skip = (page - 1) * per_page

        # label_clause is built from a fixed string template, not user input
        where_clause = (
            "WHERE (toLower(n.name) CONTAINS toLower($q) OR "
            "toLower(n.title) CONTAINS toLower($q) OR "
            "toLower(n.code) CONTAINS toLower($q) OR "
            "toLower(n.nombre) CONTAINS toLower($q))"
        )

        async with self.driver.session() as session:
            count_result = await session.run(
                f"MATCH (n) {where_clause} {label_clause} RETURN count(*) AS total",  # noqa: S608
                params,
            )
            total_record = await count_result.single()
            total = total_record["total"] if total_record else 0

            cypher = (
                f"MATCH (n) {where_clause} {label_clause} "  # noqa: S608
                "RETURN n, labels(n) AS node_labels SKIP $skip LIMIT $per_page"
            )
            result = await session.run(cypher, params | {"skip": skip, "per_page": per_page})
            items = [record.data() async for record in result]
            return {"items": items, "total": total, "page": page, "per_page": per_page}

    async def stats(self, sector_codigos: list[str] | None = None):
        async with self.driver.session() as session:
            if sector_codigos:
                result = await session.run(
                    """
                    MATCH (n)
                    WHERE n.codigo IN $sectors
                       OR EXISTS {
                           MATCH (n)-[:BELONGS_TO_SECTOR]->(s)
                           WHERE s.codigo IN $sectors
                         }
                    UNWIND labels(n) AS label
                    RETURN label, count(*) AS count
                    ORDER BY count DESC
                    """,
                    sectors=sector_codigos,
                )
            else:
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
                    raw_inventors = p.inventor or ""
                    for chunk in raw_inventors.split(";"):
                        name = chunk.strip()
                        if not name:
                            continue
                        person_id = f"person-{name.lower().replace(' ', '-')}"
                        if person_id not in seen_inventors:
                            seen_inventors.add(person_id)
                            all_inventor_nodes.append({
                                "id": person_id,
                                "name": name,
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

            # --- WORKS_AT: Person -> Organization (from professional profiles) ---
            from app.models.professional_profile import ProfessionalProfile
            from app.models.user import User

            profile_rows = (await db.execute(
                select(ProfessionalProfile.user_id, User.full_name, User.organization_id)
                .join(User, User.id == ProfessionalProfile.user_id)
                .where(User.organization_id.isnot(None))
            )).all()
            person_nodes = [
                {"id": f"person-user-{row[0]}", "name": row[1] or "Usuario"}
                for row in profile_rows
            ]
            for i in range(0, len(person_nodes), batch_size):
                batch = person_nodes[i:i+batch_size]
                if not batch:
                    continue
                result = await session.run(
                    """
                    UNWIND $batch AS item
                    MERGE (n:Person {id: item.id})
                    SET n.name = item.name, n.role = 'profesional'
                    RETURN count(*) AS merged
                    """,
                    batch=batch,
                )
                record = await result.single()
                nodes_merged += record["merged"]

            works_at_rels = [
                {"person_id": f"person-user-{row[0]}", "org_id": str(row[2])}
                for row in profile_rows
            ]
            for i in range(0, len(works_at_rels), batch_size):
                batch = works_at_rels[i:i+batch_size]
                if not batch:
                    continue
                await session.run(
                    """
                    UNWIND $batch AS item
                    MATCH (p:Person {id: item.person_id})
                    MATCH (o:Organization {id: item.org_id})
                    MERGE (p)-[:WORKS_AT]->(o)
                    """,
                    batch=batch,
                )
                rels_merged += len(batch)

            # --- Sector-based relationships: OPERATES_IN, REGULATES, MEASURES ---
            tech_rows = (await db.execute(
                select(Technology.id, Technology.sector_codigo)
            )).all()
            techs_by_sector: dict[str, list[str]] = {}
            for tech_id, sector_codigo in tech_rows:
                if sector_codigo:
                    techs_by_sector.setdefault(sector_codigo, []).append(str(tech_id))

            # OPERATES_IN: Organization -> Technology
            org_rows = (await db.execute(
                select(Organization.id, Organization.sector_codigo)
            )).all()
            operates_in_rels = []
            for org_id, sector_codigo in org_rows:
                for tech_id in techs_by_sector.get(sector_codigo or "", []):
                    operates_in_rels.append({"org_id": str(org_id), "tech_id": tech_id})
            for i in range(0, len(operates_in_rels), batch_size):
                batch = operates_in_rels[i:i+batch_size]
                if not batch:
                    continue
                await session.run(
                    """
                    UNWIND $batch AS item
                    MATCH (o:Organization {id: item.org_id})
                    MATCH (t:Technology {id: item.tech_id})
                    MERGE (o)-[:OPERATES_IN]->(t)
                    """,
                    batch=batch,
                )
                rels_merged += len(batch)

            # REGULATES: Regulation -> Technology
            reg_rows = (await db.execute(
                select(Regulation.id, Regulation.sector_codigo)
            )).all()
            regulates_rels = []
            for reg_id, sector_codigo in reg_rows:
                for tech_id in techs_by_sector.get(sector_codigo or "", []):
                    regulates_rels.append({"reg_id": str(reg_id), "tech_id": tech_id})
            for i in range(0, len(regulates_rels), batch_size):
                batch = regulates_rels[i:i+batch_size]
                if not batch:
                    continue
                await session.run(
                    """
                    UNWIND $batch AS item
                    MATCH (r:Regulation {id: item.reg_id})
                    MATCH (t:Technology {id: item.tech_id})
                    MERGE (r)-[:REGULATES]->(t)
                    """,
                    batch=batch,
                )
                rels_merged += len(batch)

            # MEASURES: Indicator -> Technology
            ind_rows = (await db.execute(
                select(Indicator.id, Indicator.sector_codigo)
            )).all()
            measures_rels = []
            for ind_id, sector_codigo in ind_rows:
                for tech_id in techs_by_sector.get(sector_codigo or "", []):
                    measures_rels.append({"ind_id": str(ind_id), "tech_id": tech_id})
            for i in range(0, len(measures_rels), batch_size):
                batch = measures_rels[i:i+batch_size]
                if not batch:
                    continue
                await session.run(
                    """
                    UNWIND $batch AS item
                    MATCH (ind:Indicator {id: item.ind_id})
                    MATCH (t:Technology {id: item.tech_id})
                    MERGE (ind)-[:MEASURES]->(t)
                    """,
                    batch=batch,
                )
                rels_merged += len(batch)

            deleted = await self._prune_stale_nodes(session, db)
            return {
                "nodes_merged": nodes_merged,
                "relationships_merged": rels_merged,
                "nodes_deleted": deleted,
            }

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

            follows = (await db.execute(select(Follow))).scalars().all()

            seen: set[tuple[str, str]] = set()
            for f in follows:
                if f.follower_type == "user":
                    follower_org = user_org_map.get(str(f.follower_id))
                elif f.follower_type == "organization":
                    follower_org = str(f.follower_id)
                else:
                    continue
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

    async def recommendations_for_org(self, org_id: str, limit: int = 20):
        async with self.driver.session() as session:
            result = await session.run(
                """
                MATCH (org:Organization {id: $org_id})-[:BELONGS_TO_SECTOR]->(s:IndustrialSector)
                WITH org, s
                MATCH (rec)-[:BELONGS_TO_SECTOR]->(s)
                WHERE rec <> org
                  AND NOT (org)-[:OPERATES_IN|HAS_PATENT|FOLLOWS]-(rec)
                RETURN rec, labels(rec) AS labels, s.nombre AS sector
                LIMIT $limit
                """,
                org_id=org_id,
                limit=limit,
            )
            rows = [record.data() async for record in result]

        items = []
        for row in rows:
            rec = row["rec"]
            props = dict(rec)
            node_id = str(props.get("id") or props.get("codigo") or props.get("element_id") or "")
            labels = row.get("labels") or []
            node_type = self._primary_label(labels)
            label = (
                props.get("nombre")
                or props.get("name")
                or props.get("title")
                or props.get("siglas")
                or node_id
            )
            reason = self._recommendation_reason(node_type, row.get("sector"))
            items.append({
                "id": node_id,
                "labels": labels,
                "type": node_type,
                "label": str(label),
                "reason": reason,
                "props": props,
            })
        return {"items": items, "total": len(items)}

    @staticmethod
    def _primary_label(labels: list[str]) -> str:
        priority = [
            "Technology", "Organization", "IndustrialSector", "Person",
            "Indicator", "Patent", "Regulation",
        ]
        for label in priority:
            if label in labels:
                return label
        return labels[0] if labels else "Unknown"

    @staticmethod
    def _recommendation_reason(node_type: str, sector: str | None) -> str:
        reasons = {
            "Technology": "Tecnología del sector",
            "Organization": "Empresa del sector",
            "IndustrialSector": "Sector industrial relacionado",
            "Person": "Persona vinculada al sector",
            "Indicator": "Indicador del sector",
            "Patent": "Patente del sector",
            "Regulation": "Normativa del sector",
        }
        base = reasons.get(node_type, "Relacionado por sector")
        return f"{base}: {sector}" if sector else base

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

    async def _prune_stale_nodes(self, session, db) -> int:
        from app.models.indicator import Indicator
        from app.models.industrial_sector import IndustrialSector
        from app.models.organization import Organization
        from app.models.patent import Patent
        from app.models.professional_profile import ProfessionalProfile
        from app.models.regulation import Regulation
        from app.models.technology import Technology
        from app.models.user import User

        deleted = 0

        sector_ids = [
            s.codigo for s in (await db.execute(select(IndustrialSector))).scalars().all()
        ]
        deleted += await self._delete_missing(session, "IndustrialSector", "codigo", sector_ids)

        org_ids = [
            str(o.id) for o in (await db.execute(select(Organization))).scalars().all()
        ]
        deleted += await self._delete_missing(session, "Organization", "id", org_ids)

        tech_ids = [
            str(t.id) for t in (await db.execute(select(Technology))).scalars().all()
        ]
        deleted += await self._delete_missing(session, "Technology", "id", tech_ids)

        pat_ids = [
            str(p.id) for p in (await db.execute(select(Patent))).scalars().all()
        ]
        deleted += await self._delete_missing(session, "Patent", "id", pat_ids)

        reg_ids = [
            str(r.id) for r in (await db.execute(select(Regulation))).scalars().all()
        ]
        deleted += await self._delete_missing(session, "Regulation", "id", reg_ids)

        ind_ids = [
            str(i.id) for i in (await db.execute(select(Indicator))).scalars().all()
        ]
        deleted += await self._delete_missing(session, "Indicator", "id", ind_ids)

        inventor_ids = [
            f"person-{chunk.strip().lower().replace(' ', '-')}"
            for p in (await db.execute(select(Patent))).scalars().all()
            for chunk in (p.inventor or "").split(";")
            if chunk.strip()
        ]
        profile_ids = [
            f"person-user-{row.user_id}"
            for row in (await db.execute(
                select(ProfessionalProfile.user_id)
                .join(User, User.id == ProfessionalProfile.user_id)
                .where(User.organization_id.isnot(None))
            )).all()
        ]
        person_ids = set(inventor_ids + profile_ids)
        deleted += await self._delete_missing(session, "Person", "id", list(person_ids))

        return deleted

    VALID_NODE_LABELS = frozenset({
        "Organization", "Patent", "Technology", "Regulation",
        "Indicator", "IndustrialSector", "Person",
    })
    VALID_NODE_KEYS = frozenset({"id", "codigo"})

    @classmethod
    async def _delete_missing(cls, session, label: str, key: str, valid_ids: list[str]) -> int:
        # Validate against whitelists to prevent injection via internal constants
        if label not in cls.VALID_NODE_LABELS:
            raise ValueError(f"Invalid node label: {label!r}")
        if key not in cls.VALID_NODE_KEYS:
            raise ValueError(f"Invalid node key: {key!r}")

        if not valid_ids:
            result = await session.run(
                f"MATCH (n:{label}) DETACH DELETE n RETURN count(*) AS deleted"  # noqa: S608 — validated label
            )
            record = await result.single()
            return record["deleted"] if record else 0
        # label and key are validated against whitelists above
        cypher = (
            f"MATCH (n:{label}) WHERE NOT coalesce(n.{key}, '') IN $valid_ids "  # noqa: S608
            "DETACH DELETE n RETURN count(*) AS deleted"
        )
        result = await session.run(cypher, valid_ids=valid_ids)
        record = await result.single()
        return record["deleted"] if record else 0
