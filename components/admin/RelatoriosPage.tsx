'use client';

import React from 'react';
import { useStore } from '@/store/useStore';
import { fmt } from '@/lib/utils';

export default function RelatoriosPage() {
  const { faturamento, concluidos, mesas, menu, clientes, itemSales, catSales, caixa } = useStore();

  const salesList = Object.values(itemSales || {}).sort((a, b) => b.qty - a.qty);
  const maxQty = salesList[0]?.qty || 1;

  const avgTicket = concluidos > 0 ? faturamento / concluidos : 0;
  const occupiedNow = mesas.filter((m) => m.status === 'occupied').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Resumo Geral KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <div className="kpi-card">
          <div style={{ fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 700 }}>Faturamento Total</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--primary)', marginTop: '4px' }}>{fmt(faturamento)}</div>
        </div>

        <div className="kpi-card">
          <div style={{ fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 700 }}>Pedidos Concluídos</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, marginTop: '4px' }}>{concluidos}</div>
        </div>

        <div className="kpi-card">
          <div style={{ fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 700 }}>Ticket Médio</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--green)', marginTop: '4px' }}>{fmt(avgTicket)}</div>
        </div>

        <div className="kpi-card">
          <div style={{ fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 700 }}>Mesas Abertas Agora</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--blue)', marginTop: '4px' }}>{occupiedNow}</div>
        </div>
      </div>

      {/* Grid: Sales by Category & Top Products */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
        {/* Category Breakdown */}
        <div className="card">
          <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '16px' }}>Vendas por Categoria</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {['pizzas', 'lanches', 'bebidas', 'sobremesas'].map((c) => {
              const val = catSales[c] || 0;
              const percent = faturamento > 0 ? ((val / faturamento) * 100).toFixed(1) : 0;
              const labels: Record<string, string> = { pizzas: '🍕 Pizzas', lanches: '🍔 Lanches', bebidas: '🥤 Bebidas', sobremesas: '🍰 Sobremesas' };
              return (
                <div key={c} style={{ background: 'var(--card2)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', fontWeight: 700, marginBottom: '6px' }}>
                    <span>{labels[c]}</span>
                    <span style={{ color: 'var(--primary)' }}>{fmt(val)}</span>
                  </div>
                  <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '99px', overflow: 'hidden' }}>
                    <div style={{ width: `${percent}%`, height: '100%', background: 'linear-gradient(90deg, var(--primary), var(--secondary))' }} />
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--muted)', textAlign: 'right', marginTop: '4px' }}>{percent}% do total</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top 10 Products Ranking */}
        <div className="card">
          <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '16px' }}>Ranking de Produtos Mais Vendidos</h3>

          {salesList.length === 0 ? (
            <div className="empty-state">Nenhuma venda registrada no sistema ainda</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {salesList.slice(0, 10).map((item, index) => {
                const medals = ['🥇', '🥈', '🥉'];
                return (
                  <div key={index} className="ranking-item">
                    <span className={`ranking-pos ${index < 3 ? 'gold' : ''}`}>{medals[index] || `${index + 1}º`}</span>
                    <span style={{ fontSize: '1.2rem' }}>{item.emoji}</span>
                    <span className="ranking-name">{item.name}</span>
                    <div className="ranking-bar-wrap">
                      <div className="ranking-bar" style={{ width: `${(item.qty / maxQty) * 100}%` }} />
                    </div>
                    <span className="ranking-qty">{item.qty}x</span>
                    <span className="ranking-val">{fmt(item.revenue)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
