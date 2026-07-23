'use client';

import React from 'react';
import { useStore } from '@/store/useStore';
import { fmt } from '@/lib/utils';

export default function Topbar() {
  const { currentPage, deliveryOrders, mesas, faturamento, caixa } = useStore();

  const titles: Record<string, string> = {
    dashboard: 'Dashboard',
    delivery: 'Delivery & Entregas',
    mesas: 'Gestão de Mesas e Comandas',
    caixa: 'Controle de Caixa',
    clientes: 'Gestão de Clientes',
    cardapio: 'Cardápio & Produtos',
    relatorios: 'Relatórios & Desempenho',
  };

  const activeDelivery = deliveryOrders.filter((o) => o.status !== 'entregue').length;
  const occupiedMesas = mesas.filter((m) => m.status === 'occupied').length;

  return (
    <header
      style={{
        height: '70px',
        padding: '0 24px',
        borderBottom: '1px solid var(--border)',
        background: 'rgba(18, 18, 31, 0.8)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 40,
      }}
    >
      <h1 style={{ fontSize: '1.25rem', fontWeight: 800 }}>{titles[currentPage] || 'Painel'}</h1>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Status Pill Caixa */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 12px',
            borderRadius: '99px',
            background: caixa.aberto ? 'rgba(46, 204, 113, 0.15)' : 'rgba(231, 76, 60, 0.15)',
            border: '1px solid',
            borderColor: caixa.aberto ? 'rgba(46, 204, 113, 0.3)' : 'rgba(231, 76, 60, 0.3)',
            fontSize: '0.78rem',
            fontWeight: 700,
            color: caixa.aberto ? 'var(--green)' : 'var(--red)',
          }}
        >
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: caixa.aberto ? 'var(--green)' : 'var(--red)',
            }}
          />
          {caixa.aberto ? 'Caixa Aberto' : 'Caixa Fechado'}
        </div>

        {/* Quick Stats */}
        <div style={{ display: 'flex', gap: '16px', borderLeft: '1px solid var(--border)', paddingLeft: '16px' }}>
          <div>
            <div style={{ fontSize: '0.68rem', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 700 }}>
              Ativos Hoje
            </div>
            <div style={{ fontSize: '0.9rem', fontWeight: 800 }}>{activeDelivery + occupiedMesas} pedidos</div>
          </div>
          <div>
            <div style={{ fontSize: '0.68rem', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 700 }}>
              Faturamento
            </div>
            <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--primary)' }}>{fmt(faturamento)}</div>
          </div>
        </div>
      </div>
    </header>
  );
}
