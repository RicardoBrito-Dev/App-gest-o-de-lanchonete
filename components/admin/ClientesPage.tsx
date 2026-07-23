'use client';

import React, { useState } from 'react';
import { useStore } from '@/store/useStore';
import { fmt, fmtId } from '@/lib/utils';
import { Cliente } from '@/lib/data';
import { showToast } from '@/components/shared/Toast';

export default function ClientesPage() {
  const { clientes, deliveryOrders, saveCliente, deleteCliente } = useStore();

  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [endereco, setEndereco] = useState('');
  const [obs, setObs] = useState('');

  const filteredClientes = clientes.filter(
    (c) => c.nome.toLowerCase().includes(search.toLowerCase()) || (c.telefone || '').includes(search),
  );

  const handleOpenModal = (cliente?: Cliente) => {
    if (cliente) {
      setEditingId(cliente.id);
      setNome(cliente.nome);
      setTelefone(cliente.telefone || '');
      setEndereco(cliente.endereco || '');
      setObs(cliente.obs || '');
    } else {
      setEditingId(null);
      setNome('');
      setTelefone('');
      setEndereco('');
      setObs('');
    }
    setShowModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) {
      showToast('Informe o nome do cliente!', 'error');
      return;
    }

    saveCliente({ nome, telefone, endereco, obs }, editingId);
    showToast(`Cliente ${nome} salvo com sucesso!`, 'success');
    setShowModal(false);
  };

  const handleDelete = (id: number, name: string) => {
    if (confirm(`Deseja remover o cliente "${name}"?`)) {
      deleteCliente(id);
      showToast('Cliente removido.', 'info');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <input
          type="text"
          className="input"
          placeholder="🔍 Buscar cliente por nome ou telefone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: '360px' }}
        />

        <button className="btn btn-primary" onClick={() => handleOpenModal()}>
          + Novo Cliente
        </button>
      </div>

      {/* Clientes Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {filteredClientes.length === 0 ? (
          <div className="empty-state">Nenhum cliente cadastrado ainda</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Telefone</th>
                <th>Endereço</th>
                <th style={{ textAlign: 'center' }}>Pedidos</th>
                <th>Total Gasto</th>
                <th style={{ textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredClientes.map((c) => {
                const pedidos = deliveryOrders.filter((o) => o.cliente.toLowerCase() === c.nome.toLowerCase());
                const totalGasto = pedidos.reduce((s, o) => s + o.total, 0);

                return (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 700 }}>{c.nome}</td>
                    <td>{c.telefone || '—'}</td>
                    <td style={{ color: 'var(--muted)' }}>{c.endereco || '—'}</td>
                    <td style={{ textAlign: 'center' }}>
                      <span style={{ background: 'var(--card2)', padding: '2px 10px', borderRadius: '99px', fontWeight: 700 }}>
                        {pedidos.length}
                      </span>
                    </td>
                    <td style={{ fontWeight: 800, color: 'var(--primary)' }}>{fmt(totalGasto)}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button className="btn-icon" onClick={() => handleOpenModal(c)}>
                          ✏️ Editar
                        </button>
                        <button className="btn-icon danger" onClick={() => handleDelete(c.id, c.nome)}>
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Cadastro/Edição */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">
              <span>👤</span> {editingId ? 'Editar Cliente' : 'Novo Cliente'}
            </h3>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label className="form-label">Nome Completo</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Nome do cliente"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label className="form-label">Telefone / WhatsApp</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="(00) 00000-0000"
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                  />
                </div>
                <div>
                  <label className="form-label">Endereço de Entrega</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="Rua, número, complemento"
                    value={endereco}
                    onChange={(e) => setEndereco(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Observações Internas</label>
                <textarea
                  className="input"
                  placeholder="Preferências, pontos de referência..."
                  value={obs}
                  onChange={(e) => setObs(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Salvar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
