import client from './client';
import type {
  LoginRequest,
  TokenResponse,
  User,
  RegisterRequest,
  RejectRequest,
  PendingUser,
  PaginatedResponse,
  Organization,
  ProfessionalProfile,
  ProfessionalListItem,
} from '@/types';

export async function login(data: LoginRequest): Promise<TokenResponse> {
  const res = await client.post<TokenResponse>('/auth/login', data);
  return res.data;
}

export async function getMe(): Promise<User> {
  const res = await client.get<User>('/auth/me');
  return res.data;
}

export async function registerPublic(data: RegisterRequest): Promise<{ detail: string }> {
  const res = await client.post<{ detail: string }>('/auth/register/public', data);
  return res.data;
}

export async function listPending(): Promise<PaginatedResponse<PendingUser>> {
  const res = await client.get<PaginatedResponse<PendingUser>>('/auth/pending');
  return res.data;
}

export async function approveUser(userId: string): Promise<User> {
  const res = await client.post<User>(`/auth/${userId}/approve`);
  return res.data;
}

export async function rejectUser(userId: string, data: RejectRequest): Promise<User> {
  const res = await client.post<User>(`/auth/${userId}/reject`, data);
  return res.data;
}

export async function getMyOrganization(): Promise<Organization> {
  const res = await client.get<Organization>('/auth/me/organization');
  return res.data;
}

export async function updateMyOrganization(data: Partial<Organization>): Promise<Organization> {
  const res = await client.put<Organization>('/auth/me/organization', data);
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
