import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api';
import StatusBadge from '../components/StatusBadge';

type OrderStatus = 'PENDING' | 'PAID' | 'CANCELLED';

interface Order {
  id: string;
  total: number;
  status: OrderStatus;
  paymentMethod?: string;
  createdAt: string;
  client?: { name: string; phone?: string };
}

const STATUS_FILTERS: Array<{ label: string; value: OrderStatus | '' }> = [
  { label: 'Toutes', value: '' },
  { label: 'En attente', value: 'PENDING' },
  { label: 'Payées', value: 'PAID' },
  { label: 'Annulées', value: 'CANCELLED' },
];

export default function OrdersPage() {
  const [filter, setFilter] = useState<OrderStatus | ''>('');

  const { data: orders, isLoading, isError } = useQuery<Order[]>({
    queryKey: ['orders', filter],
    queryFn: async () => {
      const params = filter ? `?status=${filter}` : '';
      const { data } = await apiClient.get<Order[]>(`/orders${params}`);
      return data;
    },
    refetchInterval: 15_000,
  });

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ color: '#00e5cc', marginBottom: 20, fontSize: 22 }}>Commandes</h1>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            style={{
              background: filter === f.value ? '#00e5cc' : '#16213e',
              color: filter === f.value ? '#000' : '#aaa',
              border: '1px solid ' + (filter === f.value ? '#00e5cc' : '#2a2a4a'),
              borderRadius: 8,
              padding: '6px 14px',
              cursor: 'pointer',
              fontWeight: filter === f.value ? 700 : 400,
              fontSize: 13,
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading && <p style={{ color: '#aaa' }}>Chargement...</p>}
      {isError && <p style={{ color: '#ef4444' }}>Erreur de chargement.</p>}

      {orders && (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #2a2a4a', color: '#666', textAlign: 'left' }}>
              <th style={th}>Référence</th>
              <th style={th}>Client</th>
              <th style={th}>Total</th>
              <th style={th}>Paiement</th>
              <th style={th}>Statut</th>
              <th style={th}>Date</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} style={{ borderBottom: '1px solid #1e2040' }}>
                <td style={td}><code style={{ color: '#00e5cc', fontSize: 12 }}>#{o.id.slice(-8).toUpperCase()}</code></td>
                <td style={td}>{o.client?.name ?? '—'}</td>
                <td style={td}><strong>{o.total.toLocaleString('fr-FR')} F</strong></td>
                <td style={td}>{paymentLabel(o.paymentMethod)}</td>
                <td style={td}><StatusBadge status={o.status} /></td>
                <td style={td}>{new Date(o.createdAt).toLocaleDateString('fr-FR')}</td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={6} style={{ ...td, textAlign: 'center', color: '#555', paddingTop: 32 }}>
                  Aucune commande.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}

function paymentLabel(method?: string) {
  if (!method) return '—';
  if (method === 'WAVE') return '🌊 Wave';
  if (method === 'ORANGE_MONEY') return '🟠 Orange Money';
  if (method === 'CASH') return '💵 Espèces';
  return method;
}

const th: React.CSSProperties = { padding: '8px 12px', fontWeight: 600, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' };
const td: React.CSSProperties = { padding: '12px 12px', color: '#ccc', verticalAlign: 'middle' };
