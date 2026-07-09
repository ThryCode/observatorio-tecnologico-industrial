from neo4j import AsyncGraphDatabase


class GraphRepository:
    def __init__(self, driver: AsyncGraphDatabase):
        self.driver = driver

    async def explore_node(self, node_id: str, depth: int = 2):
        async with self.driver.session() as session:
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

    async def search_nodes(self, q: str, labels: list[str] | None = None):
        params = {"q": f"(?i).*{q}.*"}
        label_filter = ""
        if labels:
            label_filter = "AND any(lbl IN labels(n) WHERE lbl IN $labels)"
            params["labels"] = labels

        async with self.driver.session() as session:
            result = await session.run(
                f"""
                MATCH (n)
                WHERE (
                    n.name =~ $q OR
                    n.title =~ $q OR
                    n.code =~ $q
                )
                {label_filter}
                RETURN n, labels(n) AS labels
                LIMIT 50
                """,
                params,
            )
            return [record.data() async for record in result]

    async def stats(self):
        async with self.driver.session() as session:
            result = await session.run(
                """
                MATCH (n)
                RETURN labels(n) AS label, count(*) AS count
                ORDER BY count DESC
                """
            )
            return [record.data() async for record in result]
