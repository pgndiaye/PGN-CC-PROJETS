import React from 'react';

type OrderStatus = 'PENDING' | 'PAID' | 'CANCELLED';

const CONFIG: Record<OrderStatus, { label: string; bg: string; color: string }> = {
  PENDING:   { label: 'En attente', bg: '#f59e0b22', color: '#f59e0b' },
  PAID:      { label: 'Payée',      bg: '#10b98122', color: '#10b981' },
  CANCELLED: { label: 'Annulée',    bg: '#ef444422', color: '#ef4444' },
};

export default function StatusBadge({ status }: { status: OrderStatus }) {
  const cfg = CONFIG[status] ?? { label: status, bg: '#33333322', color: '#aaa' };
  return (
    <span style={{
      background: cfg.bg,
      color: cfg.color,
      border: `1px solid ${cfg.color}`,
      borderRadius: 12,
      padding: '2px 10px',
      fontSize: 12,
      fontWeight: 600,
      whiteSpace: 'nowrap',
    }}>
      {cfg.label}
    </span>
  );
}
