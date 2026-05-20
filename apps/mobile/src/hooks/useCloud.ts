import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api';
import { saveSubscriptions, getCachedSubscriptions } from '../lib/offlineCache';

export interface CloudSubscription {
  id: string;
  clientId: string;
  serialNumber: string;
  planMonths: number;
  activatedAt: string;
  expiresAt: string;
  notes: string | null;
  isActive: boolean;
  client: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
}

export interface CreateSubscriptionInput {
  clientId: string;
  serialNumber: string;
  planMonths: number;
  activatedAt?: string;
  notes?: string;
}

interface FindAllOptions {
  clientId?: string;
  expiring?: number;
}

export function useSubscriptions(options: FindAllOptions = {}) {
  return useQuery<CloudSubscription[]>({
    queryKey: ['cloud', options],
    queryFn: async () => {
      try {
        const params: Record<string, string> = {};
        if (options.clientId) params.clientId = options.clientId;
        if (options.expiring != null) params.expiring = String(options.expiring);
        const { data } = await apiClient.get<CloudSubscription[]>('/cloud', {
          params: Object.keys(params).length ? params : undefined,
        });
        if (!options.clientId && options.expiring == null) {
          saveSubscriptions(data).catch(() => undefined);
        }
        return data;
      } catch (error: unknown) {
        if (isNetworkError(error) && !options.clientId && options.expiring == null) {
          const cached = await getCachedSubscriptions();
          if (cached.length > 0) return cached;
        }
        throw error;
      }
    },
  });
}

export function useSubscription(id: string) {
  return useQuery<CloudSubscription>({
    queryKey: ['cloud', id],
    queryFn: async () => {
      const { data } = await apiClient.get<CloudSubscription>(`/cloud/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateSubscriptionInput) => {
      const { data } = await apiClient.post<CloudSubscription>('/cloud', input);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cloud'] });
    },
  });
}

export function useRenewSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, additionalMonths }: { id: string; additionalMonths: number }) => {
      const { data } = await apiClient.patch<CloudSubscription>(`/cloud/${id}/renew`, {
        additionalMonths,
      });
      return data;
    },
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: ['cloud'] });
      qc.invalidateQueries({ queryKey: ['cloud', id] });
    },
  });
}

function isNetworkError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const e = error as { code?: string; message?: string };
  return (
    e.code === 'ECONNABORTED' ||
    e.code === 'ERR_NETWORK' ||
    e.message?.includes('Network Error') === true
  );
}
