import { useQuery } from '@tanstack/react-query';
import { listBulletins } from '@/api/bulletins';

export function useBulletins() {
  return useQuery({
    queryKey: ['bulletins'],
    queryFn: listBulletins,
  });
}
