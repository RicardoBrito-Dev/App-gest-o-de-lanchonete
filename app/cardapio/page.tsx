'use client';

import React, { useState, useEffect } from 'react';
import { fmt, fmtId } from '@/lib/utils';
import { DEFAULT_MENU, MenuItem, CartItem } from '@/lib/data';

export default function CardapioOnlinePage() {
  const [menu, setMenu] = useState<MenuItem[]>(DEFAULT_MENU);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeCat, setActiveCat] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [orderType, setOrderType] = useState<'entrega' | 'retirada'>('entrega');
  const [paymentOption, setPaymentOption] = useState<'pix' | 'cartao' | 'dinheiro'>('pix');
  const [troco, setTroco] = useState('');
  const [taxaEntrega] = useState(5.0);

  // Form Fields
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [endereco, setEndereco] = useState('');
  const [complemento, setComplemento] = useState('');
  const [obs, setObs] = useState('');

  // Cart Drawer & Tracking View
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [trackingOrder, setTrackingOrder] = useState<any>(null);

  // Helper to extract state object from Zustand localStorage
  const getPlpState = () => {
    try {
      const raw = localStorage.getItem('plp_state');
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed?.state || parsed;
    } catch {
      return null;
    }
  };

  // Helper to save state back preserving Zustand container format
  const savePlpState = (updatedState: any) => {
    try {
      const raw = localStorage.getItem('plp_state');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.state) {
          parsed.state = { ...parsed.state, ...updatedState };
          localStorage.setItem('plp_state', JSON.stringify(parsed));
          return;
        }
      }
      localStorage.setItem('plp_state', JSON.stringify({ state: updatedState, version: 0 }));
    } catch {}
  };

  // Load menu from main system if available
  useEffect(() => {
    const state = getPlpState();
    if (state?.menu && state.menu.length > 0) {
      setMenu(state.menu);
    }
  }, []);

  // Poll status when tracking order
  useEffect(() => {
    if (!trackingOrder) return;
    const interval = setInterval(() => {
      const state = getPlpState();
      if (state?.deliveryOrders) {
        const found = state.deliveryOrders.find((o: any) => o.id === trackingOrder.id);
        if (found) {
          setTrackingOrder(found);
        }
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [trackingOrder]);

  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) => (i.id === item.id ? { ...i, qty: i.qty + 1 } : i));
      }
      return [...prev, { ...item, qty: 1 }];
    });
  };

  const changeQty = (id: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) => (i.id === id ? { ...i, qty: i.qty + delta } : i))
        .filter((i) => i.qty > 0),
    );
  };

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const taxa = orderType === 'entrega' ? taxaEntrega : 0;
  const grandTotal = subtotal + taxa;
  const totalCount = cart.reduce((s, i) => s + i.qty, 0);

  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return alert('Adicione itens ao carrinho!');
    if (!nome.trim()) return alert('Informe seu nome!');
    if (!telefone.trim()) return alert('Informe seu telefone/WhatsApp!');
    if (orderType === 'entrega' && !endereco.trim()) return alert('Informe o endereço de entrega!');

    let fullAddress = 'Retirada no Local';
    if (orderType === 'entrega') {
      fullAddress = endereco + (complemento ? ` (${complemento})` : '');
    }

    const payDescMap = { pix: 'PIX', cartao: 'Cartão na Entrega', dinheiro: 'Dinheiro' };
    let payDesc = payDescMap[paymentOption];
    if (paymentOption === 'dinheiro' && troco) {
      payDesc += ` (Troco para R$ ${troco})`;
    }

    try {
      let state = getPlpState();

      if (!state) {
        state = {
          deliveryOrders: [],
          deliveryCounter: 1,
          hourlyData: Array(12).fill(0),
          mesas: [],
          menu,
        };
      }

      const newOrderId = state.deliveryCounter || 1;
      const order = {
        id: newOrderId,
        cliente: nome,
        telefone,
        endereco: fullAddress,
        observacoes: `${obs ? obs + ' | ' : ''}Pagamento: ${payDesc} | Tipo: ${orderType.toUpperCase()}`,
        items: [...cart],
        total: grandTotal,
        status: 'recebido',
        createdAt: Date.now(),
        onlineOrder: true,
      };

      const updatedOrders = [...(state.deliveryOrders || []), order];
      const updatedCounter = newOrderId + 1;
      const updatedHourly = [...(state.hourlyData || Array(12).fill(0))];
      if (updatedHourly.length > 0) {
        updatedHourly[updatedHourly.length - 1]++;
      }

      savePlpState({
        ...state,
        deliveryOrders: updatedOrders,
        deliveryCounter: updatedCounter,
        hourlyData: updatedHourly,
      });

      // Trigger kitchen sync
      const activeMesas = (state.mesas || [])
        .filter((m: any) => m.comandas && m.comandas.length > 0)
        .flatMap((m: any) =>
          m.comandas.map((c: any) => ({
            id: m.id,
            comandaId: c.id,
            cliente: `${c.nome} (Mesa ${m.id})`,
            items: c.items,
            openTime: c.openTime,
          })),
        );

      const kitchenData = {
        timestamp: Date.now(),
        deliveryOrders: updatedOrders.filter((o: any) => o.status === 'preparando' || o.status === 'recebido'),
        mesas: activeMesas,
      };
      localStorage.setItem('plp_kitchen', JSON.stringify(kitchenData));

      setCart([]);
      setIsDrawerOpen(false);
      setTrackingOrder(order);
    } catch (err) {
      console.error(err);
      alert('Erro ao enviar pedido. Tente novamente.');
    }
  };

  const filteredItems = menu.filter((item) => {
    const matchesCat = activeCat === 'all' || item.cat === activeCat;
    const matchesSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) || (item.desc || '').toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a12', color: '#f0f0f8', fontFamily: 'Inter, sans-serif', paddingBottom: '90px' }}>
      {/* Mobile Topbar / Header */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 40,
          background: 'rgba(18, 18, 30, 0.95)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          padding: '16px 20px',
        }}
      >
        <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.8rem' }}>🍕</span>
            <div>
              <div
                style={{
                  fontSize: '1.1rem',
                  fontWeight: 900,
                  background: 'linear-gradient(135deg, #ff6b35, #e8439a)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                PizzaLanche Pro
              </div>
              <div style={{ fontSize: '0.72rem', color: '#7070a0' }}>Cardápio Digital & Pedidos</div>
            </div>
          </div>

          {trackingOrder && (
            <button
              onClick={() => setTrackingOrder(null)}
              style={{
                fontSize: '0.8rem',
                fontWeight: 700,
                color: '#ff6b35',
                background: 'rgba(255,107,53,0.1)',
                padding: '6px 12px',
                borderRadius: '99px',
                border: '1px solid rgba(255,107,53,0.3)',
                cursor: 'pointer',
              }}
            >
              ← Ver Cardápio
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
        {trackingOrder ? (
          /* Tracking View */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ background: '#12121f', borderRadius: '16px', padding: '20px', border: '1px solid rgba(255,255,255,0.08)', textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '8px' }}>
                {trackingOrder.status === 'recebido' && '⏳'}
                {trackingOrder.status === 'preparando' && '🔥'}
                {trackingOrder.status === 'saiu' && '🛵'}
                {trackingOrder.status === 'entregue' && '✅'}
              </div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 900, marginBottom: '4px' }}>
                {trackingOrder.status === 'recebido' && 'Pedido Recebido!'}
                {trackingOrder.status === 'preparando' && 'Em Preparo na Cozinha!'}
                {trackingOrder.status === 'saiu' && 'Saiu para Entrega!'}
                {trackingOrder.status === 'entregue' && 'Pedido Entregue!'}
              </h2>
              <div style={{ fontSize: '0.85rem', color: '#7070a0' }}>Pedido {fmtId(trackingOrder.id)}</div>
            </div>

            {/* Timeline Steps */}
            <div style={{ background: '#12121f', borderRadius: '16px', padding: '20px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {[
                  { key: 'recebido', label: '1. Confirmado pelo restaurante' },
                  { key: 'preparando', label: '2. Em preparo pelos chefs' },
                  { key: 'saiu', label: '3. Saiu com o entregador' },
                  { key: 'entregue', label: '4. Entregue com sucesso' },
                ].map((step, idx) => {
                  const steps = ['recebido', 'preparando', 'saiu', 'entregue'];
                  const currentIdx = steps.indexOf(trackingOrder.status);
                  const isDone = idx <= currentIdx;
                  return (
                    <div key={step.key} style={{ display: 'flex', alignItems: 'center', gap: '12px', opacity: isDone ? 1 : 0.4 }}>
                      <span
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          background: isDone ? '#ff6b35' : '#1a1a2e',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.75rem',
                          fontWeight: 800,
                        }}
                      >
                        {isDone ? '✓' : idx + 1}
                      </span>
                      <span style={{ fontSize: '0.9rem', fontWeight: isDone ? 700 : 500 }}>{step.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Resumo do Pedido */}
            <div style={{ background: '#12121f', borderRadius: '16px', padding: '20px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 800, marginBottom: '12px', textTransform: 'uppercase', color: '#7070a0' }}>
                Resumo dos Itens
              </h3>
              {trackingOrder.items.map((i: any, idx: number) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '0.9rem' }}>
                  <span>
                    {i.qty}x {i.emoji} {i.name}
                  </span>
                  <span style={{ fontWeight: 700, color: '#ff6b35' }}>{fmt(i.price * i.qty)}</span>
                </div>
              ))}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontWeight: 900,
                  fontSize: '1.1rem',
                  marginTop: '12px',
                  paddingTop: '10px',
                  borderTop: '1px dashed rgba(255,255,255,0.1)',
                }}
              >
                <span>Total</span>
                <span style={{ color: '#ff6b35' }}>{fmt(trackingOrder.total)}</span>
              </div>
            </div>
          </div>
        ) : (
          /* Cardápio Menu View */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Search Input */}
            <input
              type="text"
              className="input"
              placeholder="🔍 Buscar pizzas, lanches, bebidas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ background: '#12121f', borderRadius: '99px', padding: '12px 20px' }}
            />

            {/* Category Pills */}
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
              {[
                { id: 'all', label: 'Todos' },
                { id: 'pizzas', label: '🍕 Pizzas' },
                { id: 'lanches', label: '🍔 Lanches' },
                { id: 'bebidas', label: '🥤 Bebidas' },
                { id: 'sobremesas', label: '🍰 Sobremesas' },
              ].map((c) => (
                <button
                  key={c.id}
                  className={`cat-tab ${activeCat === c.id ? 'active' : ''}`}
                  onClick={() => setActiveCat(c.id)}
                  style={{ whiteSpace: 'nowrap' }}
                >
                  {c.label}
                </button>
              ))}
            </div>

            {/* Items Grid */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  style={{
                    background: '#12121f',
                    borderRadius: '16px',
                    padding: '16px',
                    border: '1px solid rgba(255,255,255,0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                  }}
                >
                  <span style={{ fontSize: '2.5rem' }}>{item.emoji}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.95rem', fontWeight: 800 }}>{item.name}</div>
                    <div style={{ fontSize: '0.78rem', color: '#7070a0', margin: '2px 0 6px 0', lineHeight: 1.3 }}>{item.desc}</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 900, color: '#ff6b35' }}>{fmt(item.price)}</div>
                  </div>

                  <button
                    className="btn btn-primary"
                    style={{ padding: '8px 14px', fontSize: '0.8rem' }}
                    onClick={() => addToCart(item)}
                  >
                    + Adicionar
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Floating Bottom Cart Bar */}
      {totalCount > 0 && !trackingOrder && (
        <div
          style={{
            position: 'fixed',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 'calc(100% - 40px)',
            maxWidth: '560px',
            background: 'linear-gradient(135deg, #ff6b35, #e8439a)',
            borderRadius: '99px',
            padding: '14px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 10px 30px rgba(255,107,53,0.5)',
            cursor: 'pointer',
            zIndex: 50,
          }}
          onClick={() => setIsDrawerOpen(true)}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              style={{
                background: 'white',
                color: '#ff6b35',
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900,
                fontSize: '0.8rem',
              }}
            >
              {totalCount}
            </span>
            <span style={{ fontWeight: 800, color: 'white', fontSize: '0.95rem' }}>Ver Carrinho</span>
          </div>

          <span style={{ fontWeight: 900, color: 'white', fontSize: '1.1rem' }}>{fmt(grandTotal)}</span>
        </div>
      )}

      {/* Cart & Checkout Drawer Overlay */}
      {isDrawerOpen && (
        <div className="modal-overlay" onClick={() => setIsDrawerOpen(false)}>
          <div className="modal-box" style={{ maxWidth: '540px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 900 }}>🛒 Seu Carrinho</h3>
              <button
                className="btn-icon"
                onClick={() => setIsDrawerOpen(false)}
                style={{ borderRadius: '50%', width: '32px', height: '32px', padding: 0 }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitOrder} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Order Type Toggle */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <button
                  type="button"
                  className={`pay-btn ${orderType === 'entrega' ? 'active' : ''}`}
                  onClick={() => setOrderType('entrega')}
                >
                  🛵 Entrega (+ R$ 5,00)
                </button>
                <button
                  type="button"
                  className={`pay-btn ${orderType === 'retirada' ? 'active' : ''}`}
                  onClick={() => setOrderType('retirada')}
                >
                  🏪 Retirar no Local
                </button>
              </div>

              {/* Items List */}
              <div style={{ background: '#1a1a2e', padding: '12px', borderRadius: '12px', maxHeight: '180px', overflowY: 'auto' }}>
                {cart.map((item) => (
                  <div key={item.id} className="cart-item">
                    <span>{item.emoji}</span>
                    <span className="cart-item-name">{item.name}</span>
                    <div className="cart-item-qty">
                      <button type="button" className="qty-btn" onClick={() => changeQty(item.id, -1)}>
                        −
                      </button>
                      <span className="qty-value">{item.qty}</span>
                      <button type="button" className="qty-btn" onClick={() => changeQty(item.id, 1)}>
                        +
                      </button>
                    </div>
                    <span className="cart-item-price">{fmt(item.price * item.qty)}</span>
                  </div>
                ))}
              </div>

              {/* Form Info */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <input
                    type="text"
                    className="input"
                    placeholder="Seu Nome *"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    required
                  />
                  <input
                    type="text"
                    className="input"
                    placeholder="WhatsApp / Tel *"
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                    required
                  />
                </div>

                {orderType === 'entrega' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px' }}>
                    <input
                      type="text"
                      className="input"
                      placeholder="Endereço de entrega *"
                      value={endereco}
                      onChange={(e) => setEndereco(e.target.value)}
                      required
                    />
                    <input
                      type="text"
                      className="input"
                      placeholder="Complemento"
                      value={complemento}
                      onChange={(e) => setComplemento(e.target.value)}
                    />
                  </div>
                )}

                <input
                  type="text"
                  className="input"
                  placeholder="Observações do pedido (ex: tirar azeitona)"
                  value={obs}
                  onChange={(e) => setObs(e.target.value)}
                />
              </div>

              {/* Payment Methods */}
              <div>
                <label className="form-label">Forma de Pagamento</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  {(['pix', 'cartao', 'dinheiro'] as const).map((method) => (
                    <button
                      key={method}
                      type="button"
                      className={`pay-btn ${paymentOption === method ? 'active' : ''}`}
                      onClick={() => setPaymentOption(method)}
                    >
                      {method === 'pix' && '📱 PIX'}
                      {method === 'cartao' && '💳 Cartão'}
                      {method === 'dinheiro' && '💵 Dinheiro'}
                    </button>
                  ))}
                </div>

                {paymentOption === 'dinheiro' && (
                  <input
                    type="number"
                    className="input"
                    placeholder="Precisa de troco para quanto? (R$)"
                    value={troco}
                    onChange={(e) => setTroco(e.target.value)}
                    style={{ marginTop: '8px' }}
                  />
                )}
              </div>

              {/* Totals */}
              <div
                style={{
                  background: 'rgba(255, 107, 53, 0.1)',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 107, 53, 0.3)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#7070a0', marginBottom: '4px' }}>
                  <span>Subtotal:</span>
                  <span>{fmt(subtotal)}</span>
                </div>
                {orderType === 'entrega' && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#7070a0', marginBottom: '6px' }}>
                    <span>Taxa de Entrega:</span>
                    <span>{fmt(taxaEntrega)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, fontSize: '1.1rem' }}>
                  <span>Total Final:</span>
                  <span style={{ color: '#ff6b35' }}>{fmt(grandTotal)}</span>
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: '1rem' }}>
                🚀 Confirmar e Enviar Pedido
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
