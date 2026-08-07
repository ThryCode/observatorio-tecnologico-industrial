# ADR-006: Security Architecture

## Status

Accepted

## Context

The Observatorio handles sensitive data for a government ministry (MINDUS). Security requirements include:
1. Authentication (who are you?)
2. Authorization (what can you do?)
3. Data protection (encrypt sensitive data)
4. Audit trail (track changes)

## Decision

Implement security with:

### Authentication
- JWT tokens (python-jose)
- bcrypt password hashing (passlib)
- Refresh token pattern (short-lived access tokens)

### Authorization
- Role-Based Access Control (RBAC)
- 6 roles: admin_mindus, rep_cti, analista, profesional, cliente, visitante
- `require_role()` dependency for endpoint protection

### Data Protection
- Passwords hashed with bcrypt
- Secrets in .env files (never committed)
- CORS configured for specific origins

### Audit Trail
- Audit logs for create/update/delete operations
- `created_at` and `updated_at` timestamps
- `created_by` tracking

## Consequences

### Positive
- Industry-standard security practices
- Stateless authentication (scalable)
- Fine-grained access control
- Compliance with government requirements

### Negative
- Token management complexity
- Role configuration overhead
- Need to protect against common attacks (CSRF, XSS)

## Implementation

```python
# Password hashing
from app.core.security import get_password_hash, verify_password

hashed = get_password_hash("password")
verify_password("password", hashed)  # True

# JWT token
from app.core.security import create_access_token

token = create_access_token({"sub": user.id, "role": user.role})

# Role check
from app.dependencies import require_role

@router.get("/admin-only")
async def admin_endpoint(user: User = Depends(require_role("admin_mindus"))):
    return {"message": "Admin only"}
```

## Related

- `backend/app/core/security.py` - JWT + bcrypt
- `backend/app/dependencies.py` - Auth dependencies
- `backend/app/models/user.py` - User model with roles
