'use client';

import React, { useState } from 'react';
import { useStore } from '@/store/useStore';
import { fmt, timeAgo } from '@/lib/utils';
import { showToast } from '@/components/shared/Toast';

export default function MesasPage() {
  const {
    mesas,
    totalMesas,
    setTotalMesas,
    menu,
    selectedMesa,
    setSelectedMesa,
    setSelectedComanda,
    openComanda,
    addToMesaCart,
    changeMesaQty,
    removeMesaItem,
    cancelComanda,
    confirmFechamento,
    selectedPayment,
    setSelectedPayment,
    clientes,
  } = useStore();

  const [activeCat, setActiveCat] = useState('all');
  const [comandaNome, setComandaNome] = useState('');
  const [comandaPessoas, setComandaPessoas] = useState(1);
  const [showFechamento, setShowFechamento] = useState(false);
  const [fechamentoMode, setFechamentoMode] = useState<'comanda' | 'mesa'>('comanda');
  const [customValorStr, setCustomValorStr] = useState('');
  const [dividirPessoas, setDividirPessoas] = useState(1);

  const mesa = mesas.find((m) => m.id === selectedMesa);
  const isOccupied = mesa && mesa.comandas.length > 0;
  const currentComanda = mesa?.comandas.find((c) => c.id === mesa.selectedComandaId) || mesa?.comandas[0];

  const filteredMenu = activeCat === 'all' ? menu : menu.filter((m) => m.cat === activeCat);

  const getOriginalTotal = (mode: 'comanda' | 'mesa') => {
    if (!mesa) return 0;
    if (mode === 'comanda') {
      return currentComanda?.items.reduce((s, i) => s + i.price * i.qty, 0) || 0;
    }
    return mesa.comandas.reduce((st, c) => st + c.items.reduce((s, i) => s + i.price * i.qty, 0), 0);
  };

  const openFechamentoModal = (mode: 'comanda' | 'mesa') => {
    setFechamentoMode(mode);
    setDividirPessoas(1);
    const total = getOriginalTotal(mode);
    setCustomValorStr(total.toFixed(2));
    setShowFechamento(true);
  };

  const handleSplitChange = (people: number) => {
    const num = Math.max(1, people);
    setDividirPessoas(num);
    const total = getOriginalTotal(fechamentoMode);
    setCustomValorStr((total / num).toFixed(2));
  };

  const handleOpenComanda = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMesa) return;
    const nome = comandaNome.trim() || `Comanda ${(mesa?.comandas.length || 0) + 1}`;
    openComanda(selectedMesa, nome, comandaPessoas);
    showToast(`Comanda "${nome}" aberta na Mesa ${selectedMesa}! 🍽️`, 'success');
    setComandaNome('');
    setComandaPessoas(1);
  };

  const handleConfirmFechamento = () => {
    const valToPay = parseFloat(customValorStr);
    const finalVal = isNaN(valToPay) ? getOriginalTotal(fechamentoMode) : valToPay;
    confirmFechamento(fechamentoMode, finalVal);
    setShowFechamento(false);
    showToast(`Pagamento de ${fmt(finalVal)} via ${selectedPayment.toUpperCase()} concluído! ✅`, 'success');
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: '24px' }}>
      {/* Left Column: Mesas Map */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Mapa de Mesas</h2>
          {/* Legenda */}
          <div className="mesa-legend">
            <div className="mesa-legend-item">
              <span className="status-light green" />
              Livre
            </div>
            <div className="mesa-legend-item">
              <span className="status-light yellow" />
              Aguardando
            </div>
            <div className="mesa-legend-item">
              <span className="status-light red" />
              Ocupada
            </div>
          </div>
        </div>

        <div className="mesas-map">
          {mesas.map((m) => {
            const numComandas = m.comandas.length;
            const hasItems = m.comandas.some((c) => c.items.length > 0);
            const totalMesa = m.comandas.reduce(
              (st, c) => st + c.items.reduce((s, i) => s + i.price * i.qty, 0),
              0,
            );
            const isSelected = m.id === selectedMesa;

            // Derive the visual state
            let mesaState: 'free' | 'waiting' | 'occupied';
            let lightColor: 'green' | 'yellow' | 'red';
            let statusLabel: string;
            let mesaEmoji: string;

            if (numComandas === 0) {
              mesaState = 'free';
              lightColor = 'green';
              statusLabel = 'Livre';
              mesaEmoji = '🪑';
            } else if (!hasItems) {
              mesaState = 'waiting';
              lightColor = 'yellow';
              statusLabel = 'Aguardando';
              mesaEmoji = '⏳';
            } else {
              mesaState = 'occupied';
              lightColor = 'red';
              statusLabel = 'Ocupada';
              mesaEmoji = '👥';
            }

            return (
              <div
                key={m.id}
                className={`mesa-card ${mesaState} ${isSelected ? 'selected' : ''}`}
                onClick={() => setSelectedMesa(m.id)}
              >
                {/* Indicator light + icon row */}
                <div className="mesa-indicator-row">
                  <span className={`status-light ${lightColor}`} />
                  <span className="mesa-icon">{mesaEmoji}</span>
                </div>

                <div className="mesa-num">Mesa {m.id}</div>
                <div className={`mesa-status-text ${lightColor}`}>{statusLabel}</div>

                {numComandas > 0 && (
                  <>
                    <div className="mesa-comanda-badge">{numComandas} comanda(s)</div>
                    {totalMesa > 0 && <div className="mesa-total">{fmt(totalMesa)}</div>}
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* Summary bar */}
        <div
          style={{
            display: 'flex',
            gap: '12px',
            paddingTop: '14px',
            borderTop: '1px solid var(--border)',
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
          {[
            { label: 'Total no Estabelecimento', color: 'var(--text)', count: mesas.length, isTotal: true },
            { label: 'Livres',      color: 'var(--green)',  count: mesas.filter((m) => m.comandas.length === 0).length },
            { label: 'Aguardando', color: 'var(--yellow)', count: mesas.filter((m) => m.comandas.length > 0 && !m.comandas.some((c) => c.items.length > 0)).length },
            { label: 'Ocupadas',   color: 'var(--red)',    count: mesas.filter((m) => m.comandas.some((c) => c.items.length > 0)).length },
          ].map(({ label, color, count, isTotal }) => (
            <div
              key={label}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px',
                background: isTotal ? 'rgba(255, 107, 53, 0.08)' : 'var(--card2)',
                border: '1px solid',
                borderColor: isTotal ? 'rgba(255, 107, 53, 0.3)' : 'var(--border)',
                borderRadius: 'var(--radius-sm)',
                padding: '8px 14px',
                flex: 1,
                minWidth: '130px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.3rem', fontWeight: 900, color }}>{count}</span>
                <span style={{ fontSize: '0.78rem', color: 'var(--muted)', fontWeight: 600 }}>{label}</span>
              </div>

              {isTotal && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <button
                    type="button"
                    className="qty-btn"
                    style={{ width: '24px', height: '24px', fontSize: '0.85rem' }}
                    title="Diminuir total de mesas"
                    onClick={() => {
                      if (mesas.length > 1) {
                        setTotalMesas(mesas.length - 1);
                        showToast(`Capacidade ajustada para ${mesas.length - 1} mesas.`, 'info');
                      }
                    }}
                  >
                    −
                  </button>
                  <button
                    type="button"
                    className="qty-btn"
                    style={{ width: '24px', height: '24px', fontSize: '0.85rem' }}
                    title="Aumentar total de mesas"
                    onClick={() => {
                      setTotalMesas(mesas.length + 1);
                      showToast(`Nova mesa adicionada! Total: ${mesas.length + 1} mesas. 🪑`, 'success');
                    }}
                  >
                    +
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Right Column: Selected Mesa Detail */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {!mesa ? (
          <div className="empty-state">
            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🍽️</div>
            Selecione uma mesa ao lado para gerenciar
          </div>
        ) : (
          <>
            {/* Mesa Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 900 }}>Mesa {mesa.id}</h2>
              {(() => {
                const hasItems = mesa.comandas.some((c) => c.items.length > 0);
                if (mesa.comandas.length === 0) {
                  return (
                    <span className="status-badge free">
                      <span className="status-light green" />
                      Livre
                    </span>
                  );
                } else if (!hasItems) {
                  return (
                    <span className="status-badge waiting">
                      <span className="status-light yellow" />
                      Aguardando Pedido
                    </span>
                  );
                } else {
                  return (
                    <span className="status-badge occupied">
                      <span className="status-light red" />
                      {`Ocupada · ${mesa.comandas.length} comanda(s)`}
                    </span>
                  );
                }
              })()}
            </div>

            {/* Abrir Nova Comanda Form */}
            <form
              onSubmit={handleOpenComanda}
              style={{ background: 'var(--card2)', padding: '14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
            >
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--muted)', marginBottom: '8px', textTransform: 'uppercase' }}>
                {isOccupied ? '+ Abrir Mais Uma Comanda' : 'Abrir Primeira Comanda'}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: '8px' }}>
                <input
                  type="text"
                  className="input"
                  placeholder="Nome do cliente/comanda"
                  value={comandaNome}
                  onChange={(e) => setComandaNome(e.target.value)}
                  list="clientes-list-mesa"
                />
                <datalist id="clientes-list-mesa">
                  {clientes.map((c) => (
                    <option key={c.id} value={c.nome} />
                  ))}
                </datalist>

                <input
                  type="number"
                  className="input"
                  min="1"
                  placeholder="Pessoas"
                  value={comandaPessoas}
                  onChange={(e) => setComandaPessoas(parseInt(e.target.value) || 1)}
                />

                <button type="submit" className="btn btn-primary" style={{ padding: '0 14px' }}>
                  Abrir
                </button>
              </div>
            </form>

            {/* Active Comandas */}
            {isOccupied && currentComanda && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* Comanda Tabs */}
                <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
                  {mesa.comandas.map((c) => {
                    const cTotal = c.items.reduce((s, i) => s + i.price * i.qty, 0);
                    const isActive = c.id === mesa.selectedComandaId;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        className={`comanda-tab ${isActive ? 'active' : ''}`}
                        onClick={() => setSelectedComanda(mesa.id, c.id)}
                      >
                        <span>📋 {c.nome}</span>
                        <span style={{ fontWeight: 800, color: 'var(--primary)' }}>{fmt(cTotal)}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Comanda Info Header */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '0.82rem',
                    background: 'rgba(0,0,0,0.2)',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  <span>⏱ {timeAgo(currentComanda.openTime)}</span>
                  <span>👤 {currentComanda.pessoas} pessoa(s)</span>
                  <span style={{ fontWeight: 800, color: 'var(--primary)' }}>
                    Total Comanda: {fmt(currentComanda.items.reduce((s, i) => s + i.price * i.qty, 0))}
                  </span>
                </div>

                {/* Menu to add items */}
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--muted)', marginBottom: '6px', textTransform: 'uppercase' }}>
                    Adicionar Item à Comanda ({currentComanda.nome})
                  </div>
                  <div className="cat-tabs" style={{ marginBottom: '8px' }}>
                    {['all', 'pizzas', 'lanches', 'bebidas', 'sobremesas'].map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        className={`cat-tab ${activeCat === cat ? 'active' : ''}`}
                        onClick={() => setActiveCat(cat)}
                        style={{ fontSize: '0.72rem', padding: '3px 8px' }}
                      >
                        {cat === 'all' ? 'Todos' : cat}
                      </button>
                    ))}
                  </div>

                  <div className="menu-grid" style={{ maxHeight: '160px', overflowY: 'auto' }}>
                    {filteredMenu.map((item) => (
                      <button key={item.id} type="button" className="menu-item-btn" onClick={() => addToMesaCart(item.id)}>
                        <span className="menu-item-emoji">{item.emoji}</span>
                        <span className="menu-item-name">{item.name}</span>
                        <span className="menu-item-price">{fmt(item.price)}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Comanda Items List */}
                <div style={{ background: 'var(--card2)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--muted)', marginBottom: '8px', textTransform: 'uppercase' }}>
                    Itens Lançados ({currentComanda.items.length})
                  </div>

                  {currentComanda.items.length === 0 ? (
                    <div className="empty-state small">Nenhum item consumido ainda</div>
                  ) : (
                    <div>
                      {currentComanda.items.map((item) => (
                        <div key={item.id} className="cart-item">
                          <span>{item.emoji}</span>
                          <span className="cart-item-name">{item.name}</span>
                          <div className="cart-item-qty">
                            <button type="button" className="qty-btn" onClick={() => changeMesaQty(item.id, -1)}>
                              −
                            </button>
                            <span className="qty-value">{item.qty}</span>
                            <button type="button" className="qty-btn" onClick={() => changeMesaQty(item.id, 1)}>
                              +
                            </button>
                          </div>
                          <span className="cart-item-price">{fmt(item.price * item.qty)}</span>
                          <button
                            type="button"
                            className="btn-icon danger"
                            style={{ padding: '2px 6px' }}
                            onClick={() => removeMesaItem(item.id)}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ color: 'var(--red)' }}
                    onClick={() => {
                      if (confirm(`Cancelar comanda "${currentComanda.nome}"?`)) {
                        cancelComanda(mesa.id, currentComanda.id);
                        showToast('Comanda cancelada.', 'info');
                      }
                    }}
                  >
                    Canc. Comanda
                  </button>

                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => openFechamentoModal('comanda')}
                  >
                    Fechar Comanda
                  </button>

                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => openFechamentoModal('mesa')}
                  >
                    Fechar Toda a Mesa
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal Fechamento & Divisão de Conta */}
      {showFechamento && mesa && (
        <div className="modal-overlay" onClick={() => setShowFechamento(false)}>
          <div className="modal-box" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">
              <span>💳</span> Fechamento de {fechamentoMode === 'comanda' ? `Comanda (${currentComanda?.nome})` : `Mesa ${mesa.id}`}
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Forma de Pagamento */}
              <div style={{ background: 'var(--card2)', padding: '14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--muted)', marginBottom: '8px' }}>FORMA DE PAGAMENTO</div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {(['dinheiro', 'cartao', 'pix'] as const).map((method) => (
                    <button
                      key={method}
                      type="button"
                      className={`pay-btn ${selectedPayment === method ? 'active' : ''}`}
                      onClick={() => setSelectedPayment(method)}
                    >
                      {method === 'dinheiro' && '💵 Dinheiro'}
                      {method === 'cartao' && '💳 Cartão'}
                      {method === 'pix' && '📱 PIX'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Calculadora de Divisão de Conta */}
              <div style={{ background: 'var(--card2)', padding: '14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--muted)' }}>DIVIDIR CONTA (OPCIONAL)</div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--primary)', fontWeight: 700 }}>
                    Total Consumido: {fmt(getOriginalTotal(fechamentoMode))}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      type="button"
                      className={`cat-tab ${dividirPessoas === num ? 'active' : ''}`}
                      style={{ fontSize: '0.75rem', padding: '5px 10px' }}
                      onClick={() => handleSplitChange(num)}
                    >
                      {num === 1 ? 'Total Inteiro (1x)' : `÷ ${num} pessoas`}
                    </button>
                  ))}
                </div>

                {dividirPessoas > 1 && (
                  <div style={{ fontSize: '0.78rem', color: 'var(--green)', fontWeight: 700, background: 'rgba(46,204,113,0.1)', padding: '6px 10px', borderRadius: '6px' }}>
                    💡 Calculado: {fmt(getOriginalTotal(fechamentoMode) / dividirPessoas)} por pessoa ({dividirPessoas}x)
                  </div>
                )}
              </div>

              {/* Campo Editável de Valor a Pagar */}
              <div style={{ background: 'var(--card2)', padding: '14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                <label className="form-label" style={{ color: 'var(--text)', fontWeight: 700, fontSize: '0.85rem' }}>
                  Valor a Ser Cobrado / Pago Agora (R$)
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--primary)' }}>R$</span>
                  <input
                    type="number"
                    step="0.01"
                    className="input"
                    placeholder="0.00"
                    value={customValorStr}
                    onChange={(e) => setCustomValorStr(e.target.value)}
                    style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--primary)' }}
                  />
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ fontSize: '0.75rem', padding: '10px 12px', whiteSpace: 'nowrap' }}
                    onClick={() => {
                      setDividirPessoas(1);
                      setCustomValorStr(getOriginalTotal(fechamentoMode).toFixed(2));
                    }}
                  >
                    Resetar
                  </button>
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: '6px' }}>
                  * Você pode editar manualmente o valor caso alguém esteja pagando apenas uma parte da conta ou um item compartilhado.
                </div>
              </div>

              {/* Summary Card */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontWeight: 900,
                  fontSize: '1.15rem',
                  padding: '14px',
                  background: 'rgba(255, 107, 53, 0.1)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid rgba(255, 107, 53, 0.3)',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'uppercase' }}>Lançamento no Caixa</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text)', marginTop: '2px' }}>
                    {selectedPayment === 'dinheiro' && '💵 Dinheiro'}
                    {selectedPayment === 'cartao' && '💳 Cartão'}
                    {selectedPayment === 'pix' && '📱 PIX'}
                  </div>
                </div>
                <span style={{ color: 'var(--primary)', fontSize: '1.4rem' }}>
                  {fmt(parseFloat(customValorStr) || 0)}
                </span>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowFechamento(false)}>
                Cancelar
              </button>
              <button className="btn btn-green" onClick={handleConfirmFechamento}>
                ✅ Confirmar Pagamento ({fmt(parseFloat(customValorStr) || 0)})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
