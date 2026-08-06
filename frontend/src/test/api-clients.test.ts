import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/api/client', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: {} }),
    post: vi.fn().mockResolvedValue({ data: {} }),
    put: vi.fn().mockResolvedValue({ data: {} }),
    patch: vi.fn().mockResolvedValue({ data: {} }),
    delete: vi.fn().mockResolvedValue({ data: {} }),
  },
  USE_MOCK: false,
}));

describe('professionals API client', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('listProfessionals calls GET with page and per_page', async () => {
    const client = (await import('@/api/client')).default;
    const { listProfessionals } = await import('@/api/professionals');

    await listProfessionals(1, 20);

    expect(client.get).toHaveBeenCalledWith(
      expect.stringContaining('page=1'),
    );
  });

  it('listSpecialties calls GET', async () => {
    const client = (await import('@/api/client')).default;
    const { listSpecialties } = await import('@/api/professionals');

    await listSpecialties();

    expect(client.get).toHaveBeenCalledWith('/professionals/specialties');
  });
});

describe('alerts API client', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('listAlerts calls GET with unread_only param when unreadOnly=true', async () => {
    const client = (await import('@/api/client')).default;
    const { listAlerts } = await import('@/api/alerts');

    await listAlerts(true);

    expect(client.get).toHaveBeenCalledWith(
      expect.stringContaining('unread_only=true'),
    );
  });

  it('listAlerts calls GET without unread_only param when unreadOnly=false', async () => {
    const client = (await import('@/api/client')).default;
    const { listAlerts } = await import('@/api/alerts');

    await listAlerts(false);

    expect(client.get).toHaveBeenCalledWith(
      expect.stringContaining('/alerts'),
    );
    expect(client.get).not.toHaveBeenCalledWith(
      expect.stringContaining('unread_only'),
    );
  });
});