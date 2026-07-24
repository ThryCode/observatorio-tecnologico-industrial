import client from './client';
import type { FollowCountResponse } from '@/types';

export async function followOrganization(orgId: string): Promise<void> {
  await client.post(`/follows/${orgId}`);
}

export async function unfollowOrganization(orgId: string): Promise<void> {
  await client.delete(`/follows/${orgId}`);
}

export async function getFollowStatus(orgId: string): Promise<FollowCountResponse> {
  const res = await client.get<FollowCountResponse>(`/follows/${orgId}/status`);
  return res.data;
}

export async function getOrganizationFollowStats(orgId: string): Promise<{ followers_count: number; following_count: number }> {
  const res = await client.get<{ followers_count: number; following_count: number }>(`/follows/organization/${orgId}/stats`);
  return res.data;
}
