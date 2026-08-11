# Security Policy

## Reporting a Vulnerability

The Observatorio Tecnológico Industrial is a strategic platform for the **Ministerio de Industrias de Cuba (MINDUS)**. Security is a top priority.

If you discover a security vulnerability, please **do NOT open a public GitHub issue**. Instead, report it via one of the following channels:

- **GitHub Security Advisory**: Use the "Report a vulnerability" feature in the repository's Security tab.
- **Email**: Contact the internal MINDUS development team directly.

Please include the following in your report:

- Description of the vulnerability
- Steps to reproduce
- Affected versions/components
- Potential impact

## Response Timeline

| Severity | Initial Response | Patch Timeline |
|----------|-----------------|----------------|
| Critical | Within 24 hours | 48 hours |
| High | Within 48 hours | 5 business days |
| Medium | Within 5 business days | 15 business days |
| Low | Within 10 business days | Next release |

## Supported Versions

| Version | Supported |
|---------|-----------|
| main branch | ✅ Active development |
| Older releases | ❌ Not supported |

## Security Best Practices (Production)

- All default passwords must be changed before production deployment
- HTTPS is mandatory (Let's Encrypt or internal CA)
- Firewall must restrict ports 7687 (Neo4j) and 6379 (Redis) to localhost
- SQLite file must have restrictive permissions (backend-only access)
- JWT `SECRET_KEY` must be a cryptographically random string (`openssl rand -hex 32`)
- Rate limiting is enabled on all auth endpoints
- `.env` files containing secrets must NEVER be committed
