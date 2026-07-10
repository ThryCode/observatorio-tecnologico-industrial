---
name: neo4j-cypher
description: Neo4j Cypher query patterns for the industrial knowledge graph
metadata:
  version: "1.0.0"
  category: "backend"
  tags: ["neo4j", "cypher", "graph", "knowledge-graph"]
---

# Neo4j Cypher Patterns

## When To Use
- Writing Cypher queries in `backend/app/graph/repository.py`
- Modifying graph models in `backend/app/graph/models.py`
- Creating graph exploration endpoints in `backend/app/api/v1/graph.py`
- Debugging graph connectivity issues

## Graph Schema

### Node Labels
| Label | Properties | Description |
|-------|-----------|-------------|
| Technology | id, name, trl_level | Technologies being tracked |
| Company | id, name, siglas, pais | Organizations and companies |
| Patent | id, title, patent_number, status | Patents |
| Regulation | id, title, category | Laws, decrees, standards |
| Person | id, name, role | People in the ecosystem |
| Indicator | id, name, code, value | Industrial indicators |

### Relationships
| Relationship | From -> To | Properties |
|-------------|-----------|------------|
| HAS_PATENT | Company -> Patent | filing_date |
| RELATES_TO | Technology -> Technology | strength |
| REGULATES | Regulation -> Technology | |
| OPERATES_IN | Company -> Technology | |
| WORKS_AT | Person -> Company | role, since |
| IS_AUTHOR_OF | Person -> Patent | contribution |
| MEASURES | Indicator -> Technology | period |

## Query Patterns

### Parameterized Queries (ALWAYS use $params)
```cypher
// Correct
MATCH (t:Technology {id: $tech_id})
MATCH (c:Company)-[:HAS_PATENT]->(p:Patent)
WHERE p.status = $status
RETURN t, c, p

// WRONG - never concatenate strings
MATCH (t {id: '" + tech_id + "'})
```

### Exploration Queries
```cypher
// Find related technologies
MATCH (t:Technology {id: $id})-[:RELATES_TO]-(related:Technology)
RETURN related.name, related.trl_level
LIMIT 10

// Company patent portfolio
MATCH (c:Company {id: $id})-[:HAS_PATENT]->(p:Patent)
RETURN p.title, p.status, p.filing_date
ORDER BY p.filing_date DESC

// Sector overview
MATCH (c:Company)-[:OPERATES_IN]->(t:Technology)
WHERE t.sector = $sector
RETURN c.name, count(t) as tech_count
ORDER BY tech_count DESC
```

### APOC Procedures
```cypher
// Pagination with APOC
CALL apoc.cypher.runPage('MATCH (n:Technology) RETURN n', {}, $skip, $limit)

// Graph stats
CALL apoc.meta.stats() YIELD nodeCount, relCount
RETURN nodeCount, relCount
```

## Repository Pattern
```python
# backend/app/graph/repository.py
class GraphRepository:
    def __init__(self, driver):
        self.driver = driver

    async def search_technologies(self, query: str, limit: int = 10):
        async with self.driver.session() as session:
            result = await session.run(
                "MATCH (t:Technology) WHERE t.name CONTAINS $query "
                "RETURN t LIMIT $limit",
                query=query, limit=limit
            )
            return [dict(record["t"]) async for record in result]
```

## Guardrails
- ALWAYS use parameterized queries (`$param`)
- NEVER use string concatenation in Cypher
- Handle `ServiceUnavailable` gracefully (graph is optional)
- Use `async with driver.session()` for connection management
- Limit result sets (never return unbounded results)

## Anti-Patterns
- DON'T execute raw Cypher from route handlers
- DON'T skip error handling for Neo4j connections
- DON'T create cycles in relationships
- DON'T use `CREATE` without `MERGE` (duplicates)
- DON'T return entire graph (use LIMIT)

## Done Checklist
- [ ] Query uses parameterized `$params`
- [ ] Error handling for ServiceUnavailable
- [ ] Result set is bounded with LIMIT
- [ ] Repository method has type hints
- [ ] Query tested against sample data
