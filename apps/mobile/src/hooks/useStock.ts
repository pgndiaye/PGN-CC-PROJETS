import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/api';

export interface StockItem {
  id: string;
  productName: string;
  productType?: string;
  sku?: string;
  qty: number;
  minQty: number;
  unitPrice: number;
  lowStock?: boolean;
}

export function useStock() {
  return useQuery<StockItem[]>({
    queryKey: ['stock'],
    queryFn: async () => {
      const { data } = await apiClient.get<StockItem[]>('/stock');
      return data.map((item) => ({ ...item, lowStock: item.qty <= item.minQty }));
    },
  });
}
