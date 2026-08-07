# ADR-005: Testing Strategy

## Status

Accepted

## Context

The project needs comprehensive testing to ensure:
1. API endpoints work correctly
2. Business logic is validated
3. Authentication/authorization is enforced
4. Database operations are correct
5. Frontend components render properly

## Decision

Use a multi-layer testing approach:

### Backend (pytest)
- **Unit tests**: Service layer, validators, utilities
- **Integration tests**: API endpoints with real database
- **Fixtures**: Reusable test data via conftest.py
- **Async**: pytest-asyncio for async test support

### Frontend (Vitest)
- **Unit tests**: Utility functions, API clients
- **Component tests**: React components with Testing Library
- **Hook tests**: TanStack Query hooks with mocked API

## Consequences

### Positive
- High confidence in changes
- Fast feedback loop
- Catch regressions early
- Documentation of expected behavior

### Negative
- Test maintenance overhead
- Slower CI pipeline
- Need to mock external dependencies

## Patterns

```python
# Backend: API test
@pytest.mark.asyncio
async def test_create_technology(client, tech_payload, auth_headers):
    headers = await auth_headers(role="admin_mindus")
    response = await client.post("/api/v1/technologies", json=tech_payload, headers=headers)
    assert response.status_code == 201
```

```typescript
// Frontend: Hook test
describe('usePatents', () => {
  it('returns patents list', async () => {
    const { usePatents } = await import('@/hooks/usePatents');
    const { result } = renderHook(() => usePatents(1, 20), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});
```

## Coverage

- Backend: 175 tests
- Frontend: 86 tests
- Total: 261 tests

## Related

- `backend/tests/` - pytest tests
- `frontend/src/test/` - Vitest tests
- `backend/tests/conftest.py` - Shared fixtures
