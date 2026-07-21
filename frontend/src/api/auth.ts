import client from './client';
import type {
  LoginRequest,
  TokenResponse,
  User,
  RegisterRequest,
  RejectRequest,
  PendingUser,
  PaginatedResponse,
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
