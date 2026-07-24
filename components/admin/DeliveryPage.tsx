'use client';

import React, { useState } from 'react';
import { useStore } from '@/store/useStore';
import { fmt, fmtId, timeAgo } from '@/lib/utils';
import { KANBAN_NEXT_LABEL, STATUS_COLORS, STATUS_LABELS, MenuItem, DeliveryOrder } from '@/lib/data';
import { showToast } from '@/components/shared/Toast';

export default function DeliveryPage() {
  const {
    menu,
    deliveryCart,
    deliveryOrders,
    addToDeliveryCart,
    changeDeliveryQty,
    removeDeliveryItem,
    clearDeliveryCart,
    submitDelivery,
    advanceOrder,
    clientes,
  } = useStore();

  const [activeCat, setActiveCat] = useState<string>('all');
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [endereco, setEndereco] = useState('');
  const [obs, setObs] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<DeliveryOrder | null>(null);

  const filteredMenu = activeCat === 'all' ? menu : menu.filter((m) => m.cat === activeCat);

  const handleSelectCliente = (clientName: string) => {
    const found = clientes.find((c) => c.nome.toLowerCase() === clientName.toLowerCase());
    if (found) {
      setNome(found.nome);
      if (found.telefone) setTelefone(found.telefone);
      if (found.endereco) setEndereco(found.endereco);
    } else {
      setNome(clientName);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) {
      showToast('Informe o nome do cliente!', 'error');
      return;
    }
    if (!endereco.trim()) {
      showToast('Informe o endereço de entrega!', 'error');
      return;
    }
    if (deliveryCart.length === 0) {
      showToast('Adicione pelo menos um item ao carrinho!', 'error');
      return;
    }

    const order = submitDelivery(nome, telefone, endereco, obs);
    showToast(`Pedido ${fmtId(order.id)} criado com sucesso! 🛵`, 'success');
    setNome('');
    setTelefone('');
    setEndereco('');
    setObs('');
  };

  const totalCart = deliveryCart.reduce((acc, i) => acc + i.price * i.qty, 0);

  const activeStatuses: Array<'recebido' | 'preparando' | 'pronto' | 'saiu'> = [
    'recebido',
    'preparando',
    'pronto',
    'saiu',
  ];

  const entregueOrders = deliveryOrders.filter((o) => o.status === 'entregue');

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: '24px' }}>
      {/* Form & Cart Column */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Novo Pedido Delivery</h2>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label className="form-label">Cliente</label>
            <input
              type="text"
              className="input"
              placeholder="Nome do cliente"
              value={nome}
              onChange={(e) => handleSelectCliente(e.target.value)}
              list="clientes-list"
              required
            />
            <datalist id="clientes-list">
              {clientes.map((c) => (
                <option key={c.id} value={c.nome} />
              ))}
            </datalist>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label className="form-label">Telefone</label>
              <input
                type="text"
                className="input"
                placeholder="(00) 00000-0000"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
              />
            </div>
            <div>
              <label className="form-label">Endereço</label>
              <input
                type="text"
                className="input"
                placeholder="Rua, número, bairro"
                value={endereco}
                onChange={(e) => setEndereco(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="form-label">Observações</label>
            <input
              type="text"
              className="input"
              placeholder="Sem cebola, troco para R$ 50, etc."
              value={obs}
              onChange={(e) => setObs(e.target.value)}
            />
          </div>

          {/* Menu Item Quick Selector */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label className="form-label" style={{ marginBottom: 0 }}>Cardápio</label>
              <span style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>Clique para adicionar</span>
            </div>

            <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '8px' }}>
              {[
                { id: 'all', label: 'Todos' },
                { id: 'pizzas', label: '🍕 Pizzas' },
                { id: 'lanches', label: '🍔 Lanches' },
                { id: 'bebidas', label: '🥤 Bebidas' },
                { id: 'sobremesas', label: '🍰 Sobremesas' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  className={`cat-tab ${activeCat === cat.id ? 'active' : ''}`}
                  onClick={() => setActiveCat(cat.id)}
                  style={{ padding: '4px 9px', fontSize: '0.73rem', borderRadius: '6px' }}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                gap: '8px',
                maxHeight: '200px',
                overflowY: 'auto',
                padding: '4px',
                background: 'var(--card2)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border)',
              }}
            >
              {filteredMenu.map((item) => (
                <div
                  key={item.id}
                  onClick={() => addToDeliveryCart(item)}
                  style={{
                    padding: '8px',
                    background: 'var(--card)',
                    borderRadius: '6px',
                    border: '1px solid var(--border)',
                    cursor: 'pointer',
                    fontSize: '0.78rem',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ fontWeight: 700 }}>
                    {item.emoji} {item.name}
                  </div>
                  <div style={{ color: 'var(--primary)', fontWeight: 800 }}>{fmt(item.price)}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Cart List */}
          <div style={{ background: 'var(--card2)', borderRadius: 'var(--radius-sm)', padding: '12px', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--muted)', marginBottom: '8px', textTransform: 'uppercase' }}>
              Carrinho ({deliveryCart.reduce((s, i) => s + i.qty, 0)} itens)
            </div>

            {deliveryCart.length === 0 ? (
              <div className="empty-state small">Clique nos produtos acima para adicionar</div>
            ) : (
              <div>
                {deliveryCart.map((item) => (
                  <div key={item.id} className="cart-item">
                    <span>{item.emoji}</span>
                    <span className="cart-item-name">{item.name}</span>
                    <div className="cart-item-qty">
                      <button type="button" className="qty-btn" onClick={() => changeDeliveryQty(item.id, -1)}>
                        −
                      </button>
                      <span className="qty-value">{item.qty}</span>
                      <button type="button" className="qty-btn" onClick={() => changeDeliveryQty(item.id, 1)}>
                        +
                      </button>
                    </div>
                    <span className="cart-item-price">{fmt(item.price * item.qty)}</span>
                    <button type="button" className="btn-icon danger" style={{ padding: '2px 6px' }} onClick={() => removeDeliveryItem(item.id)}>
                      ✕
                    </button>
                  </div>
                ))}

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: '12px',
                    paddingTop: '8px',
                    borderTop: '1px solid var(--border)',
                    fontWeight: 800,
                  }}
                >
                  <span>Total</span>
                  <span style={{ color: 'var(--primary)', fontSize: '1.1rem' }}>{fmt(totalCart)}</span>
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={clearDeliveryCart}>
              Limpar
            </button>
            <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>
              🚀 Criar Pedido
            </button>
          </div>
        </form>
      </div>

      {/* Right Column: Active Kanban Grid + Full-Width Entregues Section */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Active Kanban (4 Columns) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', alignItems: 'start' }}>
          {activeStatuses.map((status) => {
            const orders = deliveryOrders.filter((o) => o.status === status);
            const color = STATUS_COLORS[status];

            return (
              <div key={status} className={`kanban-column ${status === 'pronto' ? 'pronto' : ''}`}>
                <div className="kanban-column-header">
                  <div className="kanban-column-title">
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: color }} />
                    {STATUS_LABELS[status]}
                  </div>
                  <span className="kanban-column-count">{orders.length}</span>
                </div>

                {orders.length === 0 ? (
                  <div className="empty-state small" style={{ margin: 'auto 0' }}>
                    Sem pedidos
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {orders.map((o) => {
                      const nextLabel = KANBAN_NEXT_LABEL[o.status];
                      const itemsSummary = o.items.map((i) => `${i.qty}x ${i.name}`).join(', ');
                      return (
                        <div
                          key={o.id}
                          className="kanban-card"
                          style={{ '--card-accent': color } as React.CSSProperties}
                          onClick={() => setSelectedOrder(o)}
                        >
                          <div className="kanban-card-header">
                            <span className="kanban-card-id">{fmtId(o.id)}</span>
                            <span className="kanban-card-time">⏱ {timeAgo(o.createdAt)}</span>
                          </div>

                          <div className="kanban-card-name">{o.cliente}</div>
                          <div className="kanban-card-addr">
                            <span>📍</span>
                            <span style={{ flex: 1 }}>{o.endereco}</span>
                          </div>

                          <div className="kanban-card-items-box">
                            {itemsSummary}
                          </div>

                          <div className="kanban-card-footer">
                            <span className="kanban-card-total">{fmt(o.total)}</span>
                            {nextLabel && (
                              <button
                                type="button"
                                className="kanban-advance-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  advanceOrder(o.id);
                                }}
                              >
                                {nextLabel}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Section Entregues - Full Width Below Active Kanban */}
        <div className="card" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
              paddingBottom: '12px',
              borderBottom: '1px solid var(--border)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '1.4rem' }}>🎉</span>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0 }}>Pedidos Entregues / Concluídos</h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
                  Histórico de pedidos finalizados com sucesso
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span
                style={{
                  background: 'rgba(39, 174, 96, 0.15)',
                  color: 'var(--green)',
                  border: '1px solid rgba(39, 174, 96, 0.3)',
                  padding: '4px 12px',
                  borderRadius: '99px',
                  fontSize: '0.8rem',
                  fontWeight: 800,
                }}
              >
                {entregueOrders.length} pedido(s) entregue(s)
              </span>
            </div>
          </div>

          {entregueOrders.length === 0 ? (
            <div className="empty-state" style={{ padding: '32px 16px' }}>
              Nenhum pedido entregue ainda hoje.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
              {entregueOrders.map((o) => {
                const itemsSummary = o.items.map((i) => `${i.qty}x ${i.name}`).join(', ');
                return (
                  <div
                    key={o.id}
                    onClick={() => setSelectedOrder(o)}
                    style={{
                      background: 'var(--card2)',
                      border: '1px solid rgba(39, 174, 96, 0.3)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '14px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="kanban-card-id">{fmtId(o.id)}</span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--green)', fontWeight: 700 }}>
                        ✅ Entregue
                      </span>
                    </div>

                    <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text)' }}>
                      {o.cliente}
                    </div>

                    <div style={{ fontSize: '0.78rem', color: 'var(--muted)', display: 'flex', gap: '4px' }}>
                      <span>📍</span>
                      <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {o.endereco}
                      </span>
                    </div>

                    <div
                      style={{
                        fontSize: '0.75rem',
                        color: 'var(--muted)',
                        background: 'rgba(0,0,0,0.2)',
                        padding: '6px 8px',
                        borderRadius: '6px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {itemsSummary}
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginTop: '4px',
                        paddingTop: '8px',
                        borderTop: '1px dashed var(--border)',
                      }}
                    >
                      <span style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>
                        ⏱ {timeAgo(o.createdAt)}
                      </span>
                      <span style={{ fontWeight: 800, color: 'var(--green)', fontSize: '0.95rem' }}>
                        {fmt(o.total)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal Detalhes do Pedido */}
      {selectedOrder && (
        <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">
              <span>🛵</span> Pedido {fmtId(selectedOrder.id)} — {selectedOrder.cliente}
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.9rem' }}>
              <div>
                <strong>Telefone:</strong> {selectedOrder.telefone || 'Não informado'}
              </div>
              <div>
                <strong>Endereço:</strong> {selectedOrder.endereco}
              </div>
              {selectedOrder.observacoes && (
                <div>
                  <strong>Obs:</strong> {selectedOrder.observacoes}
                </div>
              )}
              <div>
                <strong>Status:</strong>{' '}
                <span style={{ color: STATUS_COLORS[selectedOrder.status], fontWeight: 700 }}>
                  {STATUS_LABELS[selectedOrder.status]}
                </span>
              </div>

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px', marginTop: '8px' }}>
                <div style={{ fontWeight: 700, marginBottom: '8px' }}>Itens do Pedido:</div>
                {selectedOrder.items.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                    <span>
                      {item.qty}x {item.emoji} {item.name}
                    </span>
                    <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{fmt(item.price * item.qty)}</span>
                  </div>
                ))}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontWeight: 800,
                    fontSize: '1rem',
                    marginTop: '8px',
                    paddingTop: '8px',
                    borderTop: '1px dashed var(--border)',
                  }}
                >
                  <span>Total</span>
                  <span style={{ color: 'var(--primary)' }}>{fmt(selectedOrder.total)}</span>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setSelectedOrder(null)}>
                Fechar
              </button>
              {KANBAN_NEXT_LABEL[selectedOrder.status] && (
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    advanceOrder(selectedOrder.id);
                    setSelectedOrder(null);
                  }}
                >
                  {KANBAN_NEXT_LABEL[selectedOrder.status]}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
