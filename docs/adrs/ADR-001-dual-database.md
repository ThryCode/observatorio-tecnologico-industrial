# ADR-001: Dual Database Architecture (PostgreSQL + Neo4j)

## Status

Accepted

## Context

The Observatorio Tecnologico Industrial needs to:
1. Store structured relational data (users, patents, technologies, organizations, etc.)
2. Model and query complex relationships between entities (organization follows, patent relationships, sector connections)
3. Support graph traversals and recommendations

## Decision

Use PostgreSQL as the primary relational database and Neo4j as a secondary graph database.

- **PostgreSQL**: All CRUD operations, user management, authentication, structured queries
- **Neo4j**: Graph explorer, enterprise graph visualization, relationship queries, recommendations

Data flows from PostgreSQL to Neo4j via `sync_all()` and `sync_enterprise_graph()` batch operations.

## Consequences

### Positive
- PostgreSQL handles ACID transactions for critical data
- Neo4j excels at graph traversals (recommendations, path finding, relationship queries)
- Each database is used for its strengths
- Neo4j can be optional (system works without it)

### Negative
- Data synchronization required between databases
- Two data stores to maintain
- Eventual consistency between PostgreSQL and Neo4j

## Alternatives Considered

1. **PostgreSQL only**: Use recursive CTEs for graph queries. Rejected: complex, slower for deep traversals.
2. **Neo4j only**: Use Neo4j for everything. Rejected: weaker for relational queries, less mature for CRUD.
3. **Property graph in PostgreSQL**: Use Apache AGE extension. Rejected: less mature ecosystem.

## Related

- `backend/app/graph/repository.py` - Neo4j queries
- `backend/app/graph/sync.py` - Synchronization logic
- `backend/app/services/graph_service.py` - PostgreSQL-based graph service
