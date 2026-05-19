import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { UserRole } from '@ezviz/types';
import { apiClient, clearTokens, saveTokens } from '../lib/api';

// ── Types ────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
}

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

// ── useLogin ─────────────────────────────────────────────────────────────────

export function useLogin() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const { data } = await apiClient.post<LoginResponse>('/auth/login', { email, password });
      await saveTokens(data.accessToken, data.refreshToken);
      return data.user;
    },
    onSuccess: (user) => {
      qc.setQueryData<AuthUser>(['auth', 'me'], user);
    },
  });
}

// ── useLogout ────────────────────────────────────────────────────────────────

export function useLogout() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      try {
        await apiClient.post('/auth/logout');
      } finally {
        await clearTokens();
      }
    },
    onSuccess: () => {
      qc.removeQueries({ queryKey: ['auth'] });
      qc.clear();
    },
  });
}

// ── useMe ────────────────────────────────────────────────────────────────────

export function useMe() {
  return useQuery<AuthUser>({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const { data } = await apiClient.get<AuthUser>('/auth/me');
      return data;
    },
    retry: false,
  });
}
