'use client';

import React, { useEffect, useState, useCallback } from 'react';

interface DeliveryOrder {
  id: number;
  cliente: string;
  endereco: string;
  items: Array<{ qty: number; emoji: string; name: string }>;
  observacoes?: string;
  createdAt: number;
}

interface MesaOrder {
  id: number;
  cliente: string;
  pessoas: number;
  items: Array<{ qty: number; emoji: string; name: string }>;
  openTime: number;
}

export default function CozinhaPage() {
  const [deliveryOrders, setDeliveryOrders] = useState<DeliveryOrder[]>([]);
  const [mesas, setMesas] = useState<MesaOrder[]>([]);
  const [timeStr, setTimeStr] = useState('');
  const [lastUpdate, setLastUpdate] = useState('Atualizando...');

  useEffect(() => {
    const updateClock = () => {
      setTimeStr(new Date().toLocaleTimeString('pt-BR'));
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const loadData = useCallback(() => {
    try {
      const kitchenRaw = localStorage.getItem('plp_kitchen');
      if (kitchenRaw) {
        const parsed = JSON.parse(kitchenRaw);
        setDeliveryOrders(parsed.deliveryOrders || []);
        setMesas(parsed.mesas || []);
        setLastUpdate('Atualizado agora');
        return;
      }

      // Fallback
      const stateRaw = localStorage.getItem('plp_state');
      if (stateRaw) {
        const parsed = JSON.parse(stateRaw);
        const stateObj = parsed?.state || parsed;
        setDeliveryOrders((stateObj.deliveryOrders || []).filter((o: any) => o.status === 'preparando' || o.status === 'recebido'));
        setMesas((stateObj.mesas || []).filter((m: any) => m.status === 'occupied'));
        setLastUpdate('Atualizado agora');
      }
    } catch {}
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 3000);
    return () => clearInterval(interval);
  }, [loadData]);

  const markReady = (id: number) => {
    try {
      const raw = localStorage.getItem('plp_state');
      if (!raw) return;
      const parsed = JSON.parse(raw);
      const stateObj = parsed?.state || parsed;
      const order = stateObj.deliveryOrders?.find((o: any) => o.id === id);
      if (order) {
        if (order.status === 'recebido') order.status = 'preparando';
        else if (order.status === 'preparando') order.status = 'saiu';
        if (parsed?.state) {
          parsed.state = stateObj;
          localStorage.setItem('plp_state', JSON.stringify(parsed));
        } else {
          localStorage.setItem('plp_state', JSON.stringify(stateObj));
        }
        loadData();
      }
    } catch {}
  };

  const elapsedMins = (ms: number) => Math.floor((Date.now() - ms) / 60000);

  return (
    <div style={{ minHeight: '100vh', background: '#080810', color: '#f0f0f8', fontFamily: 'Inter, sans-serif' }}>
      {/* Header Cozinha */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '18px 28px',
          background: 'rgba(18,18,31,0.95)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '2rem' }}>👨‍🍳</span>
          <div>
            <div
              style={{
                fontSize: '1.2rem',
                fontWeight: 800,
                background: 'linear-gradient(135deg, #ff6b35, #e8439a)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              PizzaLanche Pro
            </div>
            <div style={{ fontSize: '0.75rem', color: '#7070a0', textTransform: 'uppercase', letterSpacing: '1.5px' }}>
              Painel da Cozinha (KDS)
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              background: 'rgba(46,204,113,0.15)',
              border: '1px solid rgba(46,204,113,0.35)',
              padding: '5px 14px',
              borderRadius: '99px',
              fontSize: '0.8rem',
              fontWeight: 700,
              color: '#2ecc71',
            }}
          >
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#2ecc71' }} />
            AO VIVO
          </div>

          <div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '2px' }}>{timeStr || '--:--:--'}</div>
            <div style={{ fontSize: '0.75rem', color: '#7070a0', textAlign: 'right' }}>{lastUpdate}</div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ padding: '24px 28px' }}>
        {/* Stats Bar */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
          <div
            style={{
              background: '#12121f',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '12px',
              padding: '10px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <span style={{ fontSize: '1.3rem' }}>🛵</span>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#7070a0', textTransform: 'uppercase' }}>Delivery</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>{deliveryOrders.length}</div>
            </div>
          </div>

          <div
            style={{
              background: '#12121f',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '12px',
              padding: '10px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <span style={{ fontSize: '1.3rem' }}>🍽️</span>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#7070a0', textTransform: 'uppercase' }}>Mesas</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>{mesas.length}</div>
            </div>
          </div>
        </div>

        {/* Empty State */}
        {deliveryOrders.length === 0 && mesas.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', color: '#7070a0' }}>
            <span style={{ fontSize: '4rem', display: 'block', marginBottom: '16px' }}>🎉</span>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f0f0f8', marginBottom: '8px' }}>Tudo em dia!</h3>
            <p>Nenhum pedido aguardando preparo na cozinha</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
            {/* Delivery Orders Cards */}
            {deliveryOrders.map((o) => {
              const mins = elapsedMins(o.createdAt);
              const isUrgent = mins >= 20;

              return (
                <div
                  key={o.id}
                  style={{
                    background: '#12121f',
                    borderRadius: '16px',
                    padding: '18px',
                    border: '2px solid',
                    borderColor: isUrgent ? '#e74c3c' : 'rgba(255,107,53,0.4)',
                    boxShadow: isUrgent ? '0 0 24px rgba(231,76,60,0.3)' : '0 0 20px rgba(255,107,53,0.1)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        padding: '3px 10px',
                        borderRadius: '99px',
                        background: 'rgba(255,107,53,0.2)',
                        color: '#ff6b35',
                        border: '1px solid rgba(255,107,53,0.4)',
                      }}
                    >
                      🛵 Delivery
                    </span>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: mins > 15 ? '#e74c3c' : '#2ecc71' }}>
                      ⏱ {mins < 1 ? '< 1 min' : `${mins} min`}
                    </span>
                  </div>

                  <div style={{ fontSize: '1.2rem', fontWeight: 900, marginBottom: '2px' }}>
                    {o.cliente} <span style={{ fontSize: '0.8rem', color: '#7070a0' }}>#{String(o.id).padStart(3, '0')}</span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#7070a0', marginBottom: '12px' }}>📍 {o.endereco}</div>

                  <div style={{ background: '#1a1a2e', borderRadius: '10px', padding: '12px', marginBottom: '12px' }}>
                    {o.items.map((item, i) => (
                      <div
                        key={i}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '4px 0',
                          borderBottom: i < o.items.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                        }}
                      >
                        <span style={{ fontSize: '1rem', fontWeight: 900, color: '#ff6b35', minWidth: '24px' }}>{item.qty}x</span>
                        <span>{item.emoji}</span>
                        <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{item.name}</span>
                      </div>
                    ))}
                  </div>

                  {o.observacoes && (
                    <div
                      style={{
                        background: 'rgba(243,156,18,0.1)',
                        border: '1px solid rgba(243,156,18,0.3)',
                        borderRadius: '8px',
                        padding: '7px 10px',
                        fontSize: '0.8rem',
                        color: '#f39c12',
                        marginBottom: '12px',
                      }}
                    >
                      ⚠️ {o.observacoes}
                    </div>
                  )}

                  <button
                    className="btn btn-green"
                    style={{ width: '100%', justifyContent: 'center', padding: '11px', fontWeight: 800 }}
                    onClick={() => markReady(o.id)}
                  >
                    ✅ Avançar / Pronto
                  </button>
                </div>
              );
            })}

            {/* Mesas Cards */}
            {mesas.map((m) => {
              const mins = elapsedMins(m.openTime);

              return (
                <div
                  key={m.id}
                  style={{
                    background: '#12121f',
                    borderRadius: '16px',
                    padding: '18px',
                    border: '2px solid rgba(79,142,247,0.4)',
                    boxShadow: '0 0 20px rgba(79,142,247,0.1)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        padding: '3px 10px',
                        borderRadius: '99px',
                        background: 'rgba(79,142,247,0.2)',
                        color: '#4f8ef7',
                        border: '1px solid rgba(79,142,247,0.4)',
                      }}
                    >
                      🍽️ Mesa {m.id}
                    </span>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#2ecc71' }}>⏱ {mins < 1 ? '< 1 min' : `${mins} min`}</span>
                  </div>

                  <div style={{ fontSize: '1.2rem', fontWeight: 900, marginBottom: '2px' }}>{m.cliente}</div>
                  <div style={{ fontSize: '0.8rem', color: '#7070a0', marginBottom: '12px' }}>👤 {m.pessoas} pessoa(s)</div>

                  <div style={{ background: '#1a1a2e', borderRadius: '10px', padding: '12px' }}>
                    {m.items.map((item, i) => (
                      <div
                        key={i}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '4px 0',
                          borderBottom: i < m.items.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                        }}
                      >
                        <span style={{ fontSize: '1rem', fontWeight: 900, color: '#4f8ef7', minWidth: '24px' }}>{item.qty}x</span>
                        <span>{item.emoji}</span>
                        <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{item.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
