'use client';

import React from 'react';
import { useStore } from '@/store/useStore';
import { fmt, fmtId, timeAgo } from '@/lib/utils';
import { STATUS_COLORS, STATUS_LABELS } from '@/lib/data';

export default function Dashboard() {
  const { faturamento, deliveryOrders, mesas, concluidos, setCurrentPage, setSelectedMesa } = useStore();

  const activeDelivery = deliveryOrders.filter((o) => o.status !== 'entregue').length;
  const occupiedMesas = mesas.filter((m) => m.status === 'occupied').length;
  const freeMesas = 12 - occupiedMesas;

  const recents = [...deliveryOrders].reverse().slice(0, 6);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* KPIs Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div className="kpi-card">
          <div style={{ fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>
            Faturamento Hoje
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--primary)', margin: '6px 0' }}>{fmt(faturamento)}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--green)', fontWeight: 600 }}>
            {faturamento > 0 ? `+${fmt(faturamento)} hoje` : 'Iniciando vendas...'}
          </div>
        </div>

        <div className="kpi-card" onClick={() => setCurrentPage('delivery')} style={{ cursor: 'pointer' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>
            Delivery Ativos
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, margin: '6px 0' }}>{deliveryOrders.length}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600 }}>{activeDelivery} em andamento</div>
        </div>

        <div className="kpi-card" onClick={() => setCurrentPage('mesas')} style={{ cursor: 'pointer' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>
            Ocupação de Mesas
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, margin: '6px 0' }}>{occupiedMesas}/12</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--blue)', fontWeight: 600 }}>{freeMesas} mesa(s) livre(s)</div>
        </div>

        <div className="kpi-card">
          <div style={{ fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>
            Pedidos Concluídos
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, margin: '6px 0' }}>{concluidos}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--green)', fontWeight: 600 }}>Vendas fechadas com sucesso</div>
        </div>
      </div>

      {/* Main Grid: Recents + Status Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
        {/* Recent Orders List */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>Últimos Pedidos</h3>
            <button className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '6px 12px' }} onClick={() => setCurrentPage('delivery')}>
              Ver todos →
            </button>
          </div>

          {recents.length === 0 ? (
            <div className="empty-state">Nenhum pedido registrado hoje</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {recents.map((o) => (
                <div
                  key={o.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--card2)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '1.4rem' }}>🛵</span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                        {o.cliente} <span style={{ color: 'var(--muted)', fontSize: '0.75rem' }}>{fmtId(o.id)}</span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                        {timeAgo(o.createdAt)} · <span style={{ color: 'var(--primary)', fontWeight: 700 }}>{fmt(o.total)}</span>
                      </div>
                    </div>
                  </div>

                  <span
                    style={{
                      padding: '4px 10px',
                      borderRadius: '99px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      background: `${STATUS_COLORS[o.status]}22`,
                      color: STATUS_COLORS[o.status],
                    }}
                  >
                    {STATUS_LABELS[o.status]}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Mesas Quick View */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>Mesas Abertas</h3>
            <button className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '6px 12px' }} onClick={() => setCurrentPage('mesas')}>
              Gerenciar →
            </button>
          </div>

          <div className="mesas-map">
            {mesas.map((m) => {
              const numComandas = m.comandas ? m.comandas.length : 0;
              const hasItems = m.comandas ? m.comandas.some((c) => c.items.length > 0) : false;

              let mesaState: 'free' | 'waiting' | 'occupied';
              let lightColor: 'green' | 'yellow' | 'red';
              let mesaEmoji: string;
              let statusLabel: string;

              if (numComandas === 0) {
                mesaState = 'free';   lightColor = 'green';  mesaEmoji = '🪑'; statusLabel = 'Livre';
              } else if (!hasItems) {
                mesaState = 'waiting'; lightColor = 'yellow'; mesaEmoji = '⏳'; statusLabel = 'Aguard.';
              } else {
                mesaState = 'occupied'; lightColor = 'red';  mesaEmoji = '👥'; statusLabel = `${numComandas}x`;
              }

              return (
                <div
                  key={m.id}
                  className={`mesa-card ${mesaState}`}
                  onClick={() => {
                    setSelectedMesa(m.id);
                    setCurrentPage('mesas');
                  }}
                  style={{ padding: '10px' }}
                >
                  <div className="mesa-indicator-row" style={{ marginBottom: '4px' }}>
                    <span className={`status-light ${lightColor}`} />
                    <span style={{ fontSize: '1.1rem' }}>{mesaEmoji}</span>
                  </div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 800 }}>Mesa {m.id}</div>
                  <div className={`mesa-status-text ${lightColor}`} style={{ fontSize: '0.65rem' }}>{statusLabel}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
