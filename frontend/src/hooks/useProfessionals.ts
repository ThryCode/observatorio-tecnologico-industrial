import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listProfessionals,
  listSpecialties,
  getMyProfessionalProfile,
  updateMyProfessionalProfile,
} from '@/api/professionals';
import type { ProfessionalProfile } from '@/types';

export function useProfessionalList(page = 1, perPage = 20, especialidad?: string, q?: string, sortBy?: string, sortOrder?: string) {
  return useQuery({
    queryKey: ['professionals', 'list', page, perPage, especialidad, q, sortBy, sortOrder],
    queryFn: () => listProfessionals(page, perPage, especialidad, q, sortBy, sortOrder),
  });
}

export function useSpecialties() {
  return useQuery({
    queryKey: ['professionals', 'specialties'],
    queryFn: listSpecialties,
    staleTime: 1000 * 60 * 30,
  });
}

export function useMyProfessionalProfile() {
  return useQuery({
    queryKey: ['professionals', 'me'],
    queryFn: getMyProfessionalProfile,
    retry: false,
  });
}

export function useUpdateMyProfessionalProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<ProfessionalProfile>) => updateMyProfessionalProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professionals', 'me'] });
    },
  });
}
