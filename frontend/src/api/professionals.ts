import client from './client';
import type { PaginatedResponse, ProfessionalListItem, ProfessionalProfile } from '@/types';

export async function listProfessionals(
  page = 1,
  perPage = 20,
  especialidad?: string,
): Promise<PaginatedResponse<ProfessionalListItem>> {
  const params = new URLSearchParams({ page: String(page), per_page: String(perPage) });
  if (especialidad) params.set('especialidad', especialidad);
  const res = await client.get<PaginatedResponse<ProfessionalListItem>>(
    `/professionals?${params.toString()}`,
  );
  return res.data;
}

export async function listSpecialties(): Promise<{ items: string[] }> {
  const res = await client.get<{ items: string[] }>('/professionals/specialties');
  return res.data;
}

export async function getMyProfessionalProfile(): Promise<ProfessionalProfile> {
  const res = await client.get<ProfessionalProfile>('/professionals/me');
  return res.data;
}

export async function updateMyProfessionalProfile(
  data: Partial<ProfessionalProfile>,
): Promise<ProfessionalProfile> {
  const res = await client.put<ProfessionalProfile>('/professionals/me', data);
  return res.data;
}
