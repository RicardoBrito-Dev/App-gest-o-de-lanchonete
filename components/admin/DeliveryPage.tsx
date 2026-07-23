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

  const kanbanStatuses: Array<'recebido' | 'preparando' | 'saiu' | 'entregue'> = [
    'recebido',
    'preparando',
    'saiu',
    'entregue',
  ];

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
              placeholder="Ex: sem cebola, troco para R$ 50"
              value={obs}
              onChange={(e) => setObs(e.target.value)}
            />
          </div>

          {/* Menu Selector */}
          <div>
            <label className="form-label">Adicionar Itens ao Pedido</label>
            <div className="cat-tabs" style={{ marginBottom: '10px' }}>
              {['all', 'pizzas', 'lanches', 'bebidas', 'sobremesas'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`cat-tab ${activeCat === cat ? 'active' : ''}`}
                  onClick={() => setActiveCat(cat)}
                  style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                >
                  {cat === 'all' ? 'Todos' : cat}
                </button>
              ))}
            </div>

            <div className="menu-grid" style={{ maxHeight: '200px', overflowY: 'auto' }}>
              {filteredMenu.map((item) => (
                <button key={item.id} type="button" className="menu-item-btn" onClick={() => addToDeliveryCart(item)}>
                  <span className="menu-item-emoji">{item.emoji}</span>
                  <span className="menu-item-name">{item.name}</span>
                  <span className="menu-item-price">{fmt(item.price)}</span>
                </button>
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
              🛵 Concluir Pedido
            </button>
          </div>
        </form>
      </div>

      {/* Kanban Board Column */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', alignItems: 'start' }}>
        {kanbanStatuses.map((status) => {
          const orders = deliveryOrders.filter((o) => o.status === status);
          const color = STATUS_COLORS[status];

          return (
            <div key={status} className="kanban-column">
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
