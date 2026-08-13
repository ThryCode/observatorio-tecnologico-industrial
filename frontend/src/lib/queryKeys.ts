/**
 * Centralized TanStack Query keys.
 * - `queryKeys.<entidad>.all` -> prefijo para invalidar/refetchear TODAS las variantes de una entidad
 * - `queryKeys.<entidad>.list(...)` -> key completa de una consulta con filtros
 * - Singletons (una sola variante) -> `queryKeys.<entidad>()`
 */
export const queryKeys = {
  industrialSectors: {
    all: ['industrial-sectors'] as const,
    list: (page = 1, perPage = 20) => ['industrial-sectors', page, perPage] as const,
  },
  organizations: {
    all: ['organizations'] as const,
    list: (page = 1, perPage = 20, sectorCodigo?: string, q?: string, pais?: string, provincia?: string, sortBy?: string, sortOrder?: string) =>
      ['organizations', page, perPage, sectorCodigo, q, pais, provincia, sortBy, sortOrder] as const,
  },
  bulletins: {
    all: ['bulletins'] as const,
    list: (page = 1, perPage = 20, sectorCodigo?: string, categoria?: string, q?: string, fechaDesde?: string, fechaHasta?: string, sortBy?: string, sortOrder?: string) =>
      ['bulletins', page, perPage, sectorCodigo, categoria, q, fechaDesde, fechaHasta, sortBy, sortOrder] as const,
  },
  alerts: {
    all: ['alerts'] as const,
    list: (unreadOnly = false, page = 1, perPage = 20, q?: string, severidad?: string, sector?: string, fechaDesde?: string, fechaHasta?: string, sortBy?: string, sortOrder?: string) =>
      ['alerts', { unreadOnly, page, perPage, q, severidad, sector, fechaDesde, fechaHasta, sortBy, sortOrder }] as const,
  },
  technologies: {
    all: ['technologies'] as const,
    list: (page = 1, perPage = 20, sector?: string, q?: string, trlNivel?: number, sortBy?: string, sortOrder?: string) =>
      ['technologies', page, perPage, sector, q, trlNivel, sortBy, sortOrder] as const,
  },
  patents: {
    all: ['patents'] as const,
    list: (page = 1, perPage = 20, sector?: string, status?: string, q?: string, fechaDesde?: string, fechaHasta?: string, sortBy?: string, sortOrder?: string) =>
      ['patents', page, perPage, sector, status, q, fechaDesde, fechaHasta, sortBy, sortOrder] as const,
  },
  regulations: {
    all: ['regulations'] as const,
    list: (page = 1, perPage = 20, category?: string, q?: string, sectorCodigo?: string, fechaDesde?: string, fechaHasta?: string, sortBy?: string, sortOrder?: string) =>
      ['regulations', page, perPage, category, q, sectorCodigo, fechaDesde, fechaHasta, sortBy, sortOrder] as const,
  },
  indicators: {
    all: ['indicators'] as const,
    list: (page = 1, perPage = 20, sector?: string, period?: string, q?: string, sortBy?: string, sortOrder?: string) =>
      ['indicators', page, perPage, sector, period, q, sortBy, sortOrder] as const,
  },
  researchPublications: {
    all: ['research-publications'] as const,
    list: (page = 1, perPage = 20, sector?: string, q?: string, fechaDesde?: string, fechaHasta?: string, sortBy?: string, sortOrder?: string, mine?: boolean) =>
      ['research-publications', page, perPage, sector, q, fechaDesde, fechaHasta, sortBy, sortOrder, mine] as const,
  },
  professionals: {
    all: ['professionals'] as const,
    list: (page = 1, perPage = 20, especialidad?: string, q?: string, sortBy?: string, sortOrder?: string) =>
      ['professionals', 'list', page, perPage, especialidad, q, sortBy, sortOrder] as const,
    specialties: () => ['professionals', 'specialties'] as const,
    me: () => ['professionals', 'me'] as const,
  },
  competitiveness: (periodo?: string, sectorCodigo?: string, q?: string, sortBy?: string, sortOrder?: string) =>
    ['competitiveness', periodo, sectorCodigo, q, sortBy, sortOrder] as const,
  dashboardKPIs: (sectorCodigos?: string) => ['dashboard', 'kpis', sectorCodigos] as const,
  timelineEvents: (sectorCodigos?: string) => ['dashboard', 'timeline', sectorCodigos] as const,
  dashboardSectors: () => ['dashboard', 'sectors'] as const,
  graphStats: (sectorCodigos?: string[]) => ['graph', 'stats', sectorCodigos] as const,
  knowledgeGraph: (limit = 500, sectorCodigos?: string[]) => ['graph', 'query', limit, sectorCodigos] as const,
  graphSearch: (q: string, labels?: string[]) => ['graph', 'search', q, labels] as const,
  graphExplore: (nodeId: string, depth = 2) => ['graph', 'explore', nodeId, depth] as const,
  graphEnterprise: () => ['graph', 'enterprise'] as const,
  graphRecommendations: (orgId: string | null, limit = 20) => ['graph', 'recommendations', orgId, limit] as const,
  myOrganization: () => ['my-organization'] as const,
  orgFollowStats: {
    all: ['org-follow-stats'] as const,
    list: (orgId?: string) => ['org-follow-stats', orgId] as const,
  },
  followStatus: (orgId: string) => ['follow-status', orgId] as const,
  patentMaps: () => ['patentMaps'] as const,
  pendingUsers: () => ['pending-users'] as const,
  health: () => ['health'] as const,
} as const;
