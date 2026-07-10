---
name: alembic-migrations
description: Alembic database migration workflow for PostgreSQL
metadata:
  version: "1.0.0"
  category: "backend"
  tags: ["alembic", "postgresql", "migration", "database"]
---

# Alembic Migrations

## When To Use
- Adding new tables or columns to PostgreSQL
- Modifying existing schema
- Creating seed data
- Rolling back schema changes

## Workflow

### 1. Create Migration
```bash
cd backend
# Auto-generate from model changes
alembic revision --autogenerate -m "add_new_column_to_patents"

# Empty migration (manual)
alembic revision -m "custom_sql_operation"
```

### 2. Edit Migration File
```python
"""add_new_column_to_patents

Revision ID: abc123
Revises: def456
Create Date: 2026-07-10
"""
from alembic import op
import sqlalchemy as sa

def upgrade():
    # Add column
    op.add_column(
        "patents",
        sa.Column("new_field", sa.String(200), nullable=True)
    )
    # Add index
    op.create_index(
        "ix_patents_new_field", "patents", ["new_field"]
    )

def downgrade():
    # Reverse operations
    op.drop_index("ix_patents_new_field", table_name="patents")
    op.drop_column("patents", "new_field")
```

### 3. Test Migration
```bash
# Apply
alembic upgrade head

# Verify
psql -U observatorio -d observatorio_db -c "\d patents"

# Rollback
alembic downgrade -1

# Re-apply
alembic upgrade head
```

### 4. Data Migration Pattern
```python
def upgrade():
    # Schema change
    op.add_column("sectors", sa.Column("temp_col", sa.String(50)))
    
    # Data migration
    op.execute(
        "UPDATE sectors SET temp_col = 'default' WHERE temp_col IS NULL"
    )
    
    # Make NOT NULL after data is populated
    op.alter_column("sectors", "temp_col", nullable=False)

def downgrade():
    op.drop_column("sectors", "temp_col")
```

## Common Operations

### Tables
```python
# Create table
op.create_table(
    "new_table",
    sa.Column("id", sa.String(36), primary_key=True),
    sa.Column("name", sa.String(200), nullable=False),
    sa.Column("created_at", sa.DateTime, server_default=sa.func.now()),
)

# Drop table
op.drop_table("new_table")
```

### Columns
```python
# Add column
op.add_column("table", sa.Column("col", sa.String(100)))

# Modify column
op.alter_column("table", "col", type_=sa.String(200))

# Drop column
op.drop_column("table", "col")
```

### Indexes
```python
# Create index
op.create_index("ix_table_col", "table", ["col"])

# Drop index
op.drop_index("ix_table_col", table_name="table")
```

### Foreign Keys
```python
# Add FK
op.createForeignKey(
    "fk_table_ref",
    "table", ["ref_id"],
    "referenced", ["id"]
)

# Drop FK
op.drop_constraint("fk_table_ref", "table", type_="foreignkey")
```

## Guardrails
- ALWAYS include reversible operations (upgrade + downgrade)
- NEVER edit a committed migration
- ALWAYS test both directions before committing
- Use `op.execute()` for complex SQL
- Add comments for non-obvious operations

## Anti-Patterns
- DON'T skip the downgrade function
- DON'T use `op.execute()` without error handling
- DON'T create migrations that can't be rolled back
- DON'T modify existing migrations after push
- DON'T use ` nullable=False` on existing tables with data

## Done Checklist
- [ ] Both upgrade() and downgrade() implemented
- [ ] Migration applies cleanly: `alembic upgrade head`
- [ ] Migration rolls back cleanly: `alembic downgrade -1`
- [ ] No changes to existing migration files
- [ ] Data migrations handle NULL values
