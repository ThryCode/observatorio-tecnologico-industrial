
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.follow import Follow
from app.models.organization import Organization
from app.models.patent import Patent, PatentStatus
from app.models.user import User
from app.schemas.graph import EnterpriseGraphEdge, EnterpriseGraphNode, EnterpriseGraphPatent, EnterpriseGraphResponse


class GraphService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_enterprise_graph(self) -> EnterpriseGraphResponse:
        orgs_result = await self.db.execute(select(Organization))
        orgs = {str(o.id): o for o in orgs_result.scalars().all()}

        users_result = await self.db.execute(select(User))
        user_org_map = {
            str(u.id): str(u.organization_id)
            for u in users_result.scalars().all()
            if u.organization_id
        }

        follows_result = await self.db.execute(
            select(Follow).where(Follow.follower_type == "user")
        )
        follows = follows_result.scalars().all()

        org_ids = list(orgs.keys())
        patents_result = await self.db.execute(
            select(Patent).where(Patent.organization_id.in_([UUID(oid) for oid in org_ids]))
        )
        all_patents = patents_result.scalars().all()

        patents_by_org: dict[str, list[Patent]] = {}
        for p in all_patents:
            oid = str(p.organization_id)
            if oid not in patents_by_org:
                patents_by_org[oid] = []
            patents_by_org[oid].append(p)

        nodes: list[EnterpriseGraphNode] = []
        for o in orgs.values():
            oid = str(o.id)
            org_patents = patents_by_org.get(oid, [])
            patent_list = [
                EnterpriseGraphPatent(
                    id=str(p.id),
                    title=p.title,
                    patent_number=p.patent_number,
                    status=p.status or "filed",
                    filing_date=str(p.filing_date) if p.filing_date else None,
                    publication_date=str(p.publication_date) if p.publication_date else None,
                    technological_sector=p.technological_sector,
                    country=p.country,
                )
                for p in org_patents
            ]
            active = sum(1 for p in org_patents if p.status in (PatentStatus.GRANTED, PatentStatus.EXAMINATION))
            pending = sum(1 for p in org_patents if p.status == PatentStatus.FILED)
            nodes.append(EnterpriseGraphNode(
                id=oid,
                type="organization",
                label=f"{o.nombre} ({o.siglas})",
                siglas=o.siglas,
                sector=o.sector_codigo,
                tipo=o.tipo,
                provincia=o.provincia,
                patents=patent_list,
                patents_active=active,
                patents_pending=pending,
            ))

        edges: list[EnterpriseGraphEdge] = []
        seen_edges: set[str] = set()
        for f in follows:
            follower_org_id = user_org_map.get(str(f.follower_id))
            if not follower_org_id or follower_org_id == str(f.organization_id):
                continue
            if follower_org_id in orgs and str(f.organization_id) in orgs:
                key = f"{follower_org_id}->{f.organization_id}"
                if key not in seen_edges:
                    seen_edges.add(key)
                    edges.append(EnterpriseGraphEdge(
                        source=follower_org_id,
                        target=str(f.organization_id),
                        type="FOLLOWS",
                    ))

        return EnterpriseGraphResponse(nodes=nodes, edges=edges)
