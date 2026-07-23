'use client';

import React, { useState } from 'react';
import { useStore } from '@/store/useStore';
import { fmt } from '@/lib/utils';
import { showToast } from '@/components/shared/Toast';

export default function CaixaPage() {
  const { caixa, faturamento, abrirCaixa, fecharCaixa, addLancamento } = useStore();

  const [valorAbertura, setValorAbertura] = useState('');
  const [showLancamentoModal, setShowLancamentoModal] = useState(false);
  const [lancTipo, setLancTipo] = useState<'entrada' | 'saida'>('entrada');
  const [lancDesc, setLancDesc] = useState('');
  const [lancValor, setLancValor] = useState('');

  const handleAbrirCaixa = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(valorAbertura) || 0;
    abrirCaixa(val);
    showToast(`Caixa aberto com ${fmt(val)}! 🔓`, 'success');
  };

  const handleFecharCaixa = () => {
    if (confirm('Deseja realmente fechar o caixa?')) {
      fecharCaixa();
      showToast('Caixa fechado! 🔒', 'info');
    }
  };

  const handleConfirmLancamento = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(lancValor) || 0;
    if (val <= 0) {
      showToast('Informe um valor válido!', 'error');
      return;
    }
    const desc = lancDesc.trim() || (lancTipo === 'entrada' ? 'Reforço' : 'Sangria');
    addLancamento({ tipo: lancTipo, desc, valor: val });
    showToast(`Lançamento (${lancTipo === 'entrada' ? '+' : '-'}${fmt(val)}) registrado!`, 'success');
    setShowLancamentoModal(false);
    setLancDesc('');
    setLancValor('');
  };

  const lancEntradas = caixa.lancamentos.filter((l) => l.tipo === 'entrada').reduce((s, l) => s + l.valor, 0);
  const lancSaidas = caixa.lancamentos.filter((l) => l.tipo === 'saida').reduce((s, l) => s + l.valor, 0);
  const saldoTotal = caixa.valorAbertura + faturamento + lancEntradas - lancSaidas;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* State Panel: Open or Closed */}
      {!caixa.aberto ? (
        <div className="card" style={{ maxWidth: '480px', margin: '40px auto', width: '100%', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🔒</div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '8px' }}>Caixa Fechado</h2>
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '24px' }}>
            Abra o caixa informando o valor inicial do fundo de troco para começar as vendas do dia.
          </p>

          <form onSubmit={handleAbrirCaixa} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label className="form-label">Valor de Abertura (Fundo de Troco)</label>
              <input
                type="number"
                step="0.01"
                className="input"
                placeholder="R$ 0,00"
                value={valorAbertura}
                onChange={(e) => setValorAbertura(e.target.value)}
                style={{ textAlign: 'center', fontSize: '1.2rem', fontWeight: 800 }}
                required
              />
            </div>
            <button type="submit" className="btn btn-green" style={{ width: '100%', justifyContent: 'center', padding: '12px' }}>
              🔓 Abrir Caixa Agora
            </button>
          </form>
        </div>
      ) : (
        <>
          {/* Top Actions & Banner */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span className="status-badge free" style={{ fontSize: '0.9rem', padding: '6px 16px' }}>
                🔓 CAIXA ABERTO (desde {caixa.horaAbertura})
              </span>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setLancTipo('entrada');
                  setShowLancamentoModal(true);
                }}
              >
                💵 Reforço (+ Suprimento)
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setLancTipo('saida');
                  setShowLancamentoModal(true);
                }}
              >
                💸 Sangria (- Retirada)
              </button>
              <button className="btn btn-secondary" style={{ color: 'var(--red)' }} onClick={handleFecharCaixa}>
                🔒 Fechar Caixa
              </button>
            </div>
          </div>

          {/* KPIs Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
            <div className="kpi-card">
              <div style={{ fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 700 }}>Fundo de Abertura</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, marginTop: '4px' }}>{fmt(caixa.valorAbertura)}</div>
            </div>
            <div className="kpi-card">
              <div style={{ fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 700 }}>Entradas / Vendas</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--green)', marginTop: '4px' }}>
                {fmt(faturamento + lancEntradas)}
              </div>
            </div>
            <div className="kpi-card">
              <div style={{ fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 700 }}>Saídas / Sangrias</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--red)', marginTop: '4px' }}>{fmt(lancSaidas)}</div>
            </div>
            <div className="kpi-card" style={{ border: '2px solid rgba(255, 107, 53, 0.4)', background: 'rgba(255, 107, 53, 0.05)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 700 }}>Saldo em Caixa</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--primary)', marginTop: '4px' }}>{fmt(saldoTotal)}</div>
            </div>
          </div>

          {/* Grid Layout: Payment Methods + Lancamentos List */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
            {/* Payment Summary */}
            <div className="card">
              <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '16px' }}>Formas de Pagamento</h3>
              <div className="payment-summary" style={{ gridTemplateColumns: '1fr' }}>
                <div className="payment-summary-item">
                  <div className="payment-summary-icon">💵</div>
                  <div className="payment-summary-label">Dinheiro</div>
                  <div className="payment-summary-val">{fmt(caixa.paymentTotals?.dinheiro || 0)}</div>
                  <div className="payment-summary-count">{caixa.paymentCounts?.dinheiro || 0} pedido(s)</div>
                </div>

                <div className="payment-summary-item">
                  <div className="payment-summary-icon">💳</div>
                  <div className="payment-summary-label">Cartão</div>
                  <div className="payment-summary-val">{fmt(caixa.paymentTotals?.cartao || 0)}</div>
                  <div className="payment-summary-count">{caixa.paymentCounts?.cartao || 0} pedido(s)</div>
                </div>

                <div className="payment-summary-item">
                  <div className="payment-summary-icon">📱</div>
                  <div className="payment-summary-label">PIX</div>
                  <div className="payment-summary-val">{fmt(caixa.paymentTotals?.pix || 0)}</div>
                  <div className="payment-summary-count">{caixa.paymentCounts?.pix || 0} pedido(s)</div>
                </div>
              </div>
            </div>

            {/* Lancamentos History */}
            <div className="card">
              <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '16px' }}>Movimentações do Caixa</h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div className="lancamento-item">
                  <span className="lancamento-desc">Abertura de Caixa (Fundo de Troco)</span>
                  <span className="lancamento-time">{caixa.horaAbertura}</span>
                  <span className="lancamento-val entrada">+{fmt(caixa.valorAbertura)}</span>
                </div>

                <div className="lancamento-item">
                  <span className="lancamento-desc">Vendas Acumuladas no Sistema</span>
                  <span className="lancamento-time">Hoje</span>
                  <span className="lancamento-val entrada">+{fmt(faturamento)}</span>
                </div>

                {caixa.lancamentos.map((l, i) => (
                  <div key={i} className="lancamento-item">
                    <span className="lancamento-desc">{l.desc}</span>
                    <span className="lancamento-time">{l.hora}</span>
                    <span className={`lancamento-val ${l.tipo}`}>
                      {l.tipo === 'entrada' ? '+' : '-'}
                      {fmt(l.valor)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Modal Suprimento / Sangria */}
      {showLancamentoModal && (
        <div className="modal-overlay" onClick={() => setShowLancamentoModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">
              <span>{lancTipo === 'entrada' ? '💵' : '💸'}</span> Registrar {lancTipo === 'entrada' ? 'Reforço de Caixa' : 'Sangria / Retirada'}
            </h3>

            <form onSubmit={handleConfirmLancamento} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label className="form-label">Descrição / Motivo</label>
                <input
                  type="text"
                  className="input"
                  placeholder={lancTipo === 'entrada' ? 'Ex: Troco adicional' : 'Ex: Pagamento de fornecedor'}
                  value={lancDesc}
                  onChange={(e) => setLancDesc(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="form-label">Valor (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  className="input"
                  placeholder="0,00"
                  value={lancValor}
                  onChange={(e) => setLancValor(e.target.value)}
                  required
                />
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowLancamentoModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Confirmar Lançamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
