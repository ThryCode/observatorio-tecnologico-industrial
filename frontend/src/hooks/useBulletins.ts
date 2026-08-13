import { useQuery } from '@tanstack/react-query';
import { listBulletins } from '@/api/bulletins';
import { queryKeys } from '@/lib/queryKeys';

export function useBulletins(page = 1, perPage = 20, sectorCodigo?: string, categoria?: string, q?: string, fechaDesde?: string, fechaHasta?: string, sortBy?: string, sortOrder?: string) {
  return useQuery({
    queryKey: queryKeys.bulletins.list(page, perPage, sectorCodigo, categoria, q, fechaDesde, fechaHasta, sortBy, sortOrder),
    queryFn: () => listBulletins(page, perPage, sectorCodigo, categoria, q, fechaDesde, fechaHasta, sortBy, sortOrder),
  });
}
