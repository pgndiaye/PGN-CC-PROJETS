import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api';

export type MobileMoneyMethod = 'WAVE' | 'ORANGE_MONEY';

export interface InitiatePaymentInput {
  orderId: string;
  paymentMethod: MobileMoneyMethod;
  customerPhone: string;
}

export interface PaymentSession {
  checkoutUrl: string;
  sessionToken: string;
  expiresAt?: string;
}

export function useInitiatePayment() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: InitiatePaymentInput): Promise<PaymentSession> => {
      const { data } = await apiClient.post<PaymentSession>('/payments/initiate', input);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}
