---
name: knowledge-graph
description: Industrial knowledge graph domain model and query patterns
metadata:
  version: "1.0.0"
  category: "domain"
  tags: ["neo4j", "knowledge-graph", "industrial", "cuba"]
---

# Knowledge Graph Domain

## When To Use
- Working with the Neo4j graph layer
- Creating graph exploration features
- Understanding the industrial domain model
- Debugging graph queries

## Domain Model

### Industrial Sectors (Sectores Industriales)
| Codigo | Nombre | Description |
|--------|--------|-------------|
| SID | Siderometalurgia | Iron, steel, and metalworking |
| MET | Metalurgia | Non-ferrous metals |
| ELE | Electricidad | Electricity and electronics |
| QUI | Quimica | Chemicals and petrochemicals |
| AUT | Automotriz | Automotive industry |

### Core Entities

#### Technology (Tecnologia)
- Properties: id, name, trl_level (1-9), sector_codigo
- TRL = Technology Readiness Level
- Relationships: RELATES_TO, REGULATES, OPERATES_IN, MEASURES

#### Company (Empresa)
- Properties: id, nombre, siglas, tipo, pais, provincia
- Types: state enterprise, private, mixed, foreign
- Relationships: HAS_PATENT, OPERATES_IN, WORKS_AT

#### Patent (Patente)
- Properties: id, title, patent_number, applicant, filing_date, status, country
- Statuses: filed, examination, granted, expired, rejected
- Relationships: IS_AUTHOR_OF (from Person), HAS_PATENT (from Company)

#### Regulation (Normativa)
- Properties: id, title, regulation_number, issuing_body, category
- Categories: law, decree, resolution, standard, norm
- Relationships: REGULATES (to Technology)

#### Indicator (Indicador)
- Properties: id, name, code, value, source, period
- Periods: monthly, quarterly, annual
- Relationships: MEASURES (to Technology)

## Common Query Patterns

### Sector Overview
```cypher
MATCH (c:Company)-[:OPERATES_IN]->(t:Technology)
WHERE t.sector = $sector
RETURN c.nombre, count(t) as technologies
ORDER BY technologies DESC
```

### Patent Landscape
```cypher
MATCH (p:Patent)
WHERE p.filing_date >= $start_date
RETURN p.status, count(p) as count
GROUP BY p.status
```

### Technology Landscape
```cypher
MATCH (t:Technology)-[:RELATES_TO]-(related:Technology)
WHERE t.sector = $sector
RETURN t.name, related.name, t.trl_level
ORDER BY t.trl_level DESC
```

### Regulatory Impact
```cypher
MATCH (r:Regulation)-[:REGULATES]->(t:Technology)
WHERE r.category = $category
RETURN r.title, t.name, r.issuing_body
```

## Integration Pattern
The graph layer is OPTIONAL - API endpoints should work even if Neo4j is unavailable:
```python
try:
    graph_data = await graph_repository.search(query)
except ServiceUnavailable:
    graph_data = []  # Graceful degradation
```

## Guardrails
- Graph queries are READ-ONLY in API endpoints
- Always handle ServiceUnavailable
- Use parameterized Cypher (never string concat)
- Limit result sets with LIMIT
- Return empty list on graph errors (don't crash)

## Anti-Patterns
- DON'T require Neo4j for core functionality
- DON'T execute write operations via API
- DON'T skip error handling
- DON'T return unbounded results
- DON'T expose raw Cypher errors to clients
