import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api';
import { saveClients, getCachedClients } from '../lib/offlineCache';

export interface Client {
  id: string;
  name: string;
  phone: string;
  address: string | null;
  city: string;
  type: 'ENTREPRISE' | 'PARTICULIER';
  createdAt: string;
  updatedAt: string;
}

export interface CreateClientInput {
  name: string;
  phone: string;
  address?: string;
  city: string;
  type?: 'ENTREPRISE' | 'PARTICULIER';
}

export function useClients(search?: string) {
  return useQuery<Client[]>({
    queryKey: ['clients', { search }],
    queryFn: async () => {
      try {
        const { data } = await apiClient.get<Client[]>('/clients', {
          params: search ? { search } : undefined,
        });
        if (!search) {
          saveClients(data).catch(() => undefined);
        }
        return data;
      } catch (error: unknown) {
        if (isNetworkError(error) && !search) {
          const cached = await getCachedClients();
          if (cached.length > 0) return cached;
        }
        throw error;
      }
    },
  });
}

export function useClient(id: string) {
  return useQuery<Client>({
    queryKey: ['clients', id],
    queryFn: async () => {
      const { data } = await apiClient.get<Client>(`/clients/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useClientQr(id: string) {
  return useQuery<{ qrDataUrl: string }>({
    queryKey: ['clients', id, 'qr'],
    queryFn: async () => {
      const { data } = await apiClient.get<{ qrDataUrl: string }>(`/clients/${id}/qr`);
      return data;
    },
    enabled: !!id,
    staleTime: Infinity,
  });
}

export function useCreateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateClientInput) => {
      const { data } = await apiClient.post<Client>('/clients', input);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clients'] });
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
