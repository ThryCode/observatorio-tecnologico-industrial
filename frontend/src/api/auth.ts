import client, { USE_MOCK } from './client';
import type {
  LoginRequest,
  TokenResponse,
  User,
  RegisterRequest,
  RejectRequest,
  PendingUser,
  PaginatedResponse,
} from '@/types';

const MOCK_USER: User = {
  id: 'mock-admin',
  username: 'admin',
  email: 'admin@mindus.gob.cu',
  full_name: 'Administrador MINDUS',
  role: 'admin_mindus',
  is_active: true,
  is_superuser: true,
  account_type: 'admin',
  status: 'approved',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export async function login(data: LoginRequest): Promise<TokenResponse> {
  if (USE_MOCK) {
    if (data.username !== 'admin') throw new Error('Invalid credentials');
    return { access_token: 'mock-token-admin', token_type: 'bearer' };
  }
  const res = await client.post<TokenResponse>('/auth/login', data);
  return res.data;
}

export async function getMe(): Promise<User> {
  if (USE_MOCK) return MOCK_USER;
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



