'use client';

import React, { useState } from 'react';
import { useStore } from '@/store/useStore';
import { fmt } from '@/lib/utils';
import { CAT_LABELS, MenuItem, MenuCategory } from '@/lib/data';
import { showToast } from '@/components/shared/Toast';

export default function CardapioPage() {
  const { menu, saveMenuItem, deleteMenuItem } = useStore();

  const [activeCat, setActiveCat] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [emoji, setEmoji] = useState('🍕');
  const [cat, setCat] = useState<MenuCategory>('pizzas');
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [price, setPrice] = useState('');

  const filteredMenu = activeCat === 'all' ? menu : menu.filter((m) => m.cat === activeCat);

  const handleOpenModal = (item?: MenuItem) => {
    if (item) {
      setEditingId(item.id);
      setEmoji(item.emoji);
      setCat(item.cat);
      setName(item.name);
      setDesc(item.desc);
      setPrice(String(item.price));
    } else {
      setEditingId(null);
      setEmoji('🍕');
      setCat('pizzas');
      setName('');
      setDesc('');
      setPrice('');
    }
    setShowModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedPrice = parseFloat(price) || 0;
    if (!name.trim()) {
      showToast('Informe o nome do item!', 'error');
      return;
    }
    if (parsedPrice <= 0) {
      showToast('Informe um preço válido!', 'error');
      return;
    }

    saveMenuItem({ emoji, cat, name, desc, price: parsedPrice }, editingId);
    showToast(`Item "${name}" salvo!`, 'success');
    setShowModal(false);
  };

  const handleDelete = (id: number, itemName: string) => {
    if (confirm(`Remover "${itemName}" do cardápio?`)) {
      deleteMenuItem(id);
      showToast('Item removido.', 'info');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header Tabs & Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="cat-tabs">
          {['all', 'pizzas', 'lanches', 'bebidas', 'sobremesas'].map((c) => (
            <button key={c} className={`cat-tab ${activeCat === c ? 'active' : ''}`} onClick={() => setActiveCat(c)}>
              {c === 'all' ? 'Todos os Itens' : CAT_LABELS[c]}
            </button>
          ))}
        </div>

        <button className="btn btn-primary" onClick={() => handleOpenModal()}>
          + Novo Produto
        </button>
      </div>

      {/* Products Grid */}
      <div className="menu-display-grid">
        {filteredMenu.map((item) => (
          <div key={item.id} className="menu-display-item">
            <div className="menu-display-emoji">{item.emoji}</div>
            <span className={`menu-display-cat cat-${item.cat}`}>{CAT_LABELS[item.cat]}</span>
            <div className="menu-display-name">{item.name}</div>
            <div className="menu-display-desc">{item.desc}</div>
            <div className="menu-display-price">{fmt(item.price)}</div>

            <div className="menu-item-actions">
              <button className="btn-icon" style={{ flex: 1 }} onClick={() => handleOpenModal(item)}>
                ✏️ Editar
              </button>
              <button className="btn-icon danger" onClick={() => handleDelete(item.id, item.name)}>
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Add/Edit Item */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">
              <span>🍕</span> {editingId ? 'Editar Item do Cardápio' : 'Novo Produto'}
            </h3>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '10px' }}>
                <div>
                  <label className="form-label">Emoji</label>
                  <input
                    type="text"
                    className="input"
                    value={emoji}
                    onChange={(e) => setEmoji(e.target.value)}
                    style={{ textAlign: 'center', fontSize: '1.2rem' }}
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Categoria</label>
                  <select className="input" value={cat} onChange={(e) => setCat(e.target.value as MenuCategory)}>
                    <option value="pizzas">🍕 Pizzas</option>
                    <option value="lanches">🍔 Lanches</option>
                    <option value="bebidas">🥤 Bebidas</option>
                    <option value="sobremesas">🍰 Sobremesas</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="form-label">Nome do Produto</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Ex: Pizza Calabresa Especial"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="form-label">Descrição / Ingredientes</label>
                <textarea
                  className="input"
                  placeholder="Molho de tomate, queijo, calabresa fatiada..."
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  rows={2}
                />
              </div>

              <div>
                <label className="form-label">Preço de Venda (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  className="input"
                  placeholder="0,00"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                />
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Salvar Produto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
