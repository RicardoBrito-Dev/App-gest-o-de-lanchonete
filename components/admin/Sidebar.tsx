'use client';

import React, { useEffect, useState } from 'react';
import { useStore } from '@/store/useStore';

export default function Sidebar() {
  const { currentPage, setCurrentPage, deliveryOrders, mesas, caixa } = useStore();
  const [timeStr, setTimeStr] = useState('');
  const [dateStr, setDateStr] = useState('');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      const s = String(now.getSeconds()).padStart(2, '0');
      setTimeStr(`${h}:${m}:${s}`);

      const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
      const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      setDateStr(`${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]}`);
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const activeDelivery = deliveryOrders.filter((o) => o.status !== 'entregue').length;
  const occupiedMesas = mesas.filter((m) => m.status === 'occupied').length;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'delivery', label: 'Delivery', icon: '🛵', badge: activeDelivery },
    { id: 'mesas', label: 'Mesas', icon: '🍽️', badge: occupiedMesas },
    { id: 'caixa', label: 'Caixa', icon: '💰', dot: !caixa.aberto },
    { id: 'clientes', label: 'Clientes', icon: '👤' },
    { id: 'cardapio', label: 'Cardápio', icon: '🍕' },
    { id: 'relatorios', label: 'Relatórios', icon: '📈' },
  ];

  return (
    <aside
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        width: 'var(--sidebar-w)',
        background: 'var(--card)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 50,
      }}
    >
      {/* Brand Header */}
      <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '2rem' }}>🍕</span>
          <div>
            <div
              style={{
                fontSize: '1.1rem',
                fontWeight: 800,
                background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              PizzaLanche
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700 }}>
              PRO MANAGER
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {navItems.map((item) => {
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                background: isActive ? 'rgba(255, 107, 53, 0.12)' : 'transparent',
                border: '1px solid',
                borderColor: isActive ? 'rgba(255, 107, 53, 0.3)' : 'transparent',
                color: isActive ? 'var(--primary)' : 'var(--text)',
                fontWeight: isActive ? 700 : 600,
                fontSize: '0.88rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.1rem' }}>{item.icon}</span>
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && item.badge > 0 && (
                <span
                  style={{
                    background: 'var(--primary)',
                    color: 'white',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '99px',
                  }}
                >
                  {item.badge}
                </span>
              )}
              {item.dot && (
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: 'var(--red)',
                  }}
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Clock & Links */}
      <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)', background: 'rgba(0,0,0,0.15)' }}>
        <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text)', letterSpacing: '1px' }}>{timeStr || '--:--:--'}</div>
        <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '2px' }}>{dateStr || '...'}</div>

        <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
          <a
            href="/cozinha"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary"
            style={{ flex: 1, padding: '6px', fontSize: '0.72rem', justifyContent: 'center' }}
          >
            👨‍🍳 Cozinha
          </a>
          <a
            href="/cardapio"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary"
            style={{ flex: 1, padding: '6px', fontSize: '0.72rem', justifyContent: 'center' }}
          >
            📱 Online
          </a>
        </div>
      </div>
    </aside>
  );
}
