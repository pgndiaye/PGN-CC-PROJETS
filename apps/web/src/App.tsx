import React, { useState } from 'react';
import OrdersPage from './pages/OrdersPage';
import StockPage from './pages/StockPage';

type Tab = 'orders' | 'stock';

const TABS: Array<{ id: Tab; label: string; icon: string }> = [
  { id: 'orders', label: 'Commandes', icon: '🛒' },
  { id: 'stock',  label: 'Stock',     icon: '📦' },
];

export default function App() {
  const [tab, setTab] = useState<Tab>('orders');

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{ background: '#16213e', borderBottom: '1px solid #2a2a4a', padding: '0 24px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ color: '#00e5cc', fontWeight: 800, fontSize: 18, marginRight: 24 }}>EZVIZ Sénégal</span>
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              background: 'none',
              border: 'none',
              borderBottom: tab === t.id ? '2px solid #00e5cc' : '2px solid transparent',
              color: tab === t.id ? '#00e5cc' : '#aaa',
              padding: '16px 16px 14px',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: tab === t.id ? 700 : 400,
            }}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </header>

      <main style={{ flex: 1 }}>
        {tab === 'orders' && <OrdersPage />}
        {tab === 'stock' && <StockPage />}
      </main>
    </div>
  );
}
