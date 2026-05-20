import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api';

// ── Types ────────────────────────────────────────────────────────────────────

export type OrderStatus = 'PENDING' | 'PAID' | 'CANCELLED';
export type PaymentMethod = 'CASH' | 'ORANGE_MONEY' | 'WAVE';

export interface OrderLine {
  id: string;
  productName: string;
  productType?: string;
  qty: number;
  unitPrice: number;
  subtotal: number;
}

export interface OrderClient {
  id: string;
  name: string;
  phone?: string;
}

export interface Order {
  id: string;
  clientId: string;
  client?: OrderClient;
  total: number;
  status: OrderStatus;
  paymentMethod?: PaymentMethod;
  paymentRef?: string;
  notes?: string;
  lines?: OrderLine[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderLineInput {
  productName: string;
  productType?: string;
  qty: number;
  unitPrice: number;
}

export interface CreateOrderInput {
  clientId: string;
  lines: CreateOrderLineInput[];
  notes?: string;
}

export interface UpdateOrderInput {
  status?: OrderStatus;
  paymentMethod?: PaymentMethod;
  paymentRef?: string;
  notes?: string;
}

// ── useOrders ────────────────────────────────────────────────────────────────

export function useOrders(filters?: { clientId?: string; status?: OrderStatus }) {
  const params = new URLSearchParams();
  if (filters?.clientId) params.set('clientId', filters.clientId);
  if (filters?.status) params.set('status', filters.status);
  const qs = params.toString();

  return useQuery<Order[]>({
    queryKey: ['orders', filters],
    queryFn: async () => {
      const { data } = await apiClient.get<Order[]>(`/orders${qs ? `?${qs}` : ''}`);
      return data;
    },
  });
}

// ── useOrder ─────────────────────────────────────────────────────────────────

export function useOrder(id: string) {
  return useQuery<Order>({
    queryKey: ['orders', id],
    queryFn: async () => {
      const { data } = await apiClient.get<Order>(`/orders/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

// ── useCreateOrder ────────────────────────────────────────────────────────────

export function useCreateOrder() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateOrderInput) => {
      const { data } = await apiClient.post<Order>('/orders', input);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

// ── useUpdateOrder ────────────────────────────────────────────────────────────

export function useUpdateOrder(id: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateOrderInput) => {
      const { data } = await apiClient.patch<Order>(`/orders/${id}`, input);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}
