import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api';

interface StockItem {
  id: string;
  productName: string;
  productType?: string;
  sku?: string;
  qty: number;
  minQty: number;
  unitPrice: number;
}

export default function StockPage() {
  const { data: items, isLoading, isError } = useQuery<StockItem[]>({
    queryKey: ['stock'],
    queryFn: async () => {
      const { data } = await apiClient.get<StockItem[]>('/stock');
      return data;
    },
    refetchInterval: 30_000,
  });

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ color: '#00e5cc', marginBottom: 20, fontSize: 22 }}>Stock</h1>

      {isLoading && <p style={{ color: '#aaa' }}>Chargement...</p>}
      {isError && <p style={{ color: '#ef4444' }}>Erreur de chargement.</p>}

      {items && (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #2a2a4a', color: '#666', textAlign: 'left' }}>
              <th style={th}>Produit</th>
              <th style={th}>Type</th>
              <th style={th}>SKU</th>
              <th style={th}>Qté</th>
              <th style={th}>Prix unitaire</th>
              <th style={th}>État</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const isLow = item.qty <= item.minQty;
              return (
                <tr key={item.id} style={{ borderBottom: '1px solid #1e2040', background: isLow ? '#f59e0b08' : 'transparent' }}>
                  <td style={td}><strong style={{ color: '#fff' }}>{item.productName}</strong></td>
                  <td style={td}>{item.productType ?? '—'}</td>
                  <td style={{ ...td, fontFamily: 'monospace', fontSize: 12 }}>{item.sku ?? '—'}</td>
                  <td style={{ ...td, fontWeight: 700, color: isLow ? '#f59e0b' : '#00e5cc', fontSize: 18 }}>{item.qty}</td>
                  <td style={td}>{item.unitPrice.toLocaleString('fr-FR')} F</td>
                  <td style={td}>
                    {isLow ? (
                      <span style={{ color: '#f59e0b', fontWeight: 600, fontSize: 12 }}>⚠ Stock bas</span>
                    ) : (
                      <span style={{ color: '#10b981', fontSize: 12 }}>✓ OK</span>
                    )}
                  </td>
                </tr>
              );
            })}
            {items.length === 0 && (
              <tr>
                <td colSpan={6} style={{ ...td, textAlign: 'center', color: '#555', paddingTop: 32 }}>
                  Aucun article en stock.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}

const th: React.CSSProperties = { padding: '8px 12px', fontWeight: 600, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' };
const td: React.CSSProperties = { padding: '12px 12px', color: '#ccc', verticalAlign: 'middle' };
