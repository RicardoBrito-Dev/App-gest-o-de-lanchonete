// =====================================================
// PizzaLanche Pro — store/useStore.ts
// Zustand global store with localStorage persistence
// =====================================================
'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  AppState, MenuItem, CartItem, DeliveryOrder, Mesa, Comanda,
  Cliente, Lancamento, PaymentMethod, ItemSale, DEFAULT_MENU,
} from '@/lib/data';
import { nowTimeStr } from '@/lib/utils';

function buildInitialState(): AppState {
  return {
    menu: JSON.parse(JSON.stringify(DEFAULT_MENU)),
    menuCounter: 100,
    deliveryOrders: [],
    deliveryCounter: 1,
    deliveryCart: [],
    totalMesas: 12,
    mesas: Array.from({ length: 12 }, (_, i) => ({
      id: i + 1,
      status: 'free' as const,
      selectedComandaId: null,
      comandas: [],
    })),
    clientes: [],
    clienteCounter: 1,
    caixa: {
      aberto: false,
      valorAbertura: 0,
      horaAbertura: null,
      lancamentos: [],
      paymentTotals: { dinheiro: 0, cartao: 0, pix: 0 },
      paymentCounts: { dinheiro: 0, cartao: 0, pix: 0 },
    },
    faturamento: 0,
    concluidos: 0,
    hourlyData: Array(12).fill(0),
    itemSales: {},
    catSales: { pizzas: 0, lanches: 0, bebidas: 0, sobremesas: 0 },
    selectedPayment: 'dinheiro',
    currentPage: 'dashboard',
    selectedMesa: null,
  };
}

interface StoreActions {
  // Navigation
  setCurrentPage: (page: string) => void;
  setSelectedMesa: (id: number | null) => void;
  setSelectedPayment: (method: PaymentMethod) => void;
  setSelectedComanda: (mesaId: number, comandaId: number) => void;

  // Delivery cart
  addToDeliveryCart: (item: MenuItem) => void;
  changeDeliveryQty: (itemId: number, delta: number) => void;
  removeDeliveryItem: (itemId: number) => void;
  clearDeliveryCart: () => void;

  // Delivery orders
  submitDelivery: (cliente: string, telefone: string, endereco: string, obs: string) => DeliveryOrder;
  advanceOrder: (orderId: number) => void;
  injectOnlineOrder: (order: DeliveryOrder, counter: number) => void;

  // Mesas
  setTotalMesas: (total: number) => void;
  openComanda: (mesaId: number, nome: string, pessoas: number) => void;
  addToMesaCart: (itemId: number) => void;
  changeMesaQty: (itemId: number, delta: number) => void;
  removeMesaItem: (itemId: number) => void;
  cancelComanda: (mesaId: number, comandaId: number) => void;
  confirmFechamento: (mode: 'comanda' | 'mesa', customAmount?: number) => void;

  // Caixa
  abrirCaixa: (valor: number) => void;
  fecharCaixa: () => void;
  addLancamento: (lancamento: Omit<Lancamento, 'hora'>) => void;

  // Clientes
  saveCliente: (data: Partial<Cliente>, editingId: number | null) => void;
  deleteCliente: (id: number) => void;
  upsertCliente: (data: { nome: string; telefone?: string; endereco?: string }) => void;

  // Menu CRUD
  saveMenuItem: (data: Omit<MenuItem, 'id'>, editingId: number | null) => void;
  deleteMenuItem: (id: number) => void;

  // Sales tracking
  trackItemSale: (item: CartItem, payment: PaymentMethod) => void;
  updatePaymentTotal: (amount: number, method: PaymentMethod) => void;

  // Kitchen sync
  syncKitchen: () => void;

  // Demo data
  loadDemoData: () => void;
}

type Store = AppState & StoreActions;

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      ...buildInitialState(),

      // ── Navigation ──────────────────────────────────────
      setCurrentPage: (page) => set({ currentPage: page }),
      setSelectedMesa: (id) => set({ selectedMesa: id }),
      setSelectedPayment: (method) => set({ selectedPayment: method }),
      setSelectedComanda: (mesaId, comandaId) =>
        set((s) => ({
          mesas: s.mesas.map((m) =>
            m.id === mesaId ? { ...m, selectedComandaId: comandaId } : m,
          ),
        })),

      // ── Total Mesas Config ───────────────────────────────
      setTotalMesas: (total) =>
        set((s) => {
          const clampedTotal = Math.max(1, Math.min(50, total));
          const currentCount = s.mesas.length;

          if (clampedTotal === currentCount) return {};

          let newMesas = [...s.mesas];

          if (clampedTotal > currentCount) {
            // Add new empty tables
            for (let i = currentCount + 1; i <= clampedTotal; i++) {
              newMesas.push({ id: i, status: 'free', selectedComandaId: null, comandas: [] });
            }
          } else {
            // Remove tables from the end — only free ones
            // Keep going backwards removing free tables until we hit the target
            let removed = 0;
            const toRemove = currentCount - clampedTotal;
            newMesas = [...s.mesas];
            for (let i = newMesas.length - 1; i >= 0 && removed < toRemove; i--) {
              if (newMesas[i].comandas.length === 0) {
                newMesas.splice(i, 1);
                removed++;
              }
            }
          }

          return { mesas: newMesas, totalMesas: clampedTotal };
        }),

      // ── Delivery Cart ────────────────────────────────────
      addToDeliveryCart: (item) =>
        set((s) => {
          const existing = s.deliveryCart.find((c) => c.id === item.id);
          return {
            deliveryCart: existing
              ? s.deliveryCart.map((c) =>
                  c.id === item.id ? { ...c, qty: c.qty + 1 } : c,
                )
              : [...s.deliveryCart, { ...item, qty: 1 }],
          };
        }),

      changeDeliveryQty: (itemId, delta) =>
        set((s) => {
          const updated = s.deliveryCart
            .map((c) => (c.id === itemId ? { ...c, qty: c.qty + delta } : c))
            .filter((c) => c.qty > 0);
          return { deliveryCart: updated };
        }),

      removeDeliveryItem: (itemId) =>
        set((s) => ({ deliveryCart: s.deliveryCart.filter((c) => c.id !== itemId) })),

      clearDeliveryCart: () => set({ deliveryCart: [] }),

      // ── Delivery Orders ──────────────────────────────────
      submitDelivery: (cliente, telefone, endereco, obs) => {
        const s = get();
        const total = s.deliveryCart.reduce((acc, i) => acc + i.price * i.qty, 0);
        const order: DeliveryOrder = {
          id: s.deliveryCounter,
          cliente,
          telefone,
          endereco,
          observacoes: obs,
          items: [...s.deliveryCart],
          total,
          status: 'recebido',
          createdAt: Date.now(),
        };
        const newHourly = [...s.hourlyData];
        newHourly[newHourly.length - 1]++;
        set({
          deliveryOrders: [...s.deliveryOrders, order],
          deliveryCounter: s.deliveryCounter + 1,
          hourlyData: newHourly,
          deliveryCart: [],
        });
        get().upsertCliente({ nome: cliente, telefone, endereco });
        get().syncKitchen();
        return order;
      },

      advanceOrder: (orderId) => {
        const s = get();
        const statuses: DeliveryOrder['status'][] = ['recebido', 'preparando', 'saiu', 'entregue'];
        const order = s.deliveryOrders.find((o) => o.id === orderId);
        if (!order) return;
        const idx = statuses.indexOf(order.status);
        if (idx >= statuses.length - 1) return;
        const newStatus = statuses[idx + 1];
        const updatedOrders = s.deliveryOrders.map((o) =>
          o.id === orderId ? { ...o, status: newStatus } : o,
        );
        let extra: Partial<AppState> = {};
        if (newStatus === 'entregue') {
          order.items.forEach((i) => get().trackItemSale(i, s.selectedPayment));
          get().updatePaymentTotal(order.total, s.selectedPayment);
          extra = {
            faturamento: s.faturamento + order.total,
            concluidos: s.concluidos + 1,
          };
        }
        set({ deliveryOrders: updatedOrders, ...extra });
        get().syncKitchen();
      },

      injectOnlineOrder: (order, counter) =>
        set((s) => ({
          deliveryOrders: [...s.deliveryOrders, order],
          deliveryCounter: counter,
        })),

      // ── Mesas ────────────────────────────────────────────
      openComanda: (mesaId, nome, pessoas) => {
        const cId = Date.now() + Math.floor(Math.random() * 1000);
        const newComanda: Comanda = { id: cId, nome, pessoas, openTime: Date.now(), items: [] };
        set((s) => ({
          mesas: s.mesas.map((m) =>
            m.id === mesaId
              ? {
                  ...m,
                  status: 'occupied',
                  comandas: [...m.comandas, newComanda],
                  selectedComandaId: cId,
                }
              : m,
          ),
        }));
        get().syncKitchen();
      },

      addToMesaCart: (itemId) => {
        const s = get();
        const mesa = s.mesas.find((m) => m.id === s.selectedMesa);
        if (!mesa || mesa.comandas.length === 0) return;
        const comanda = mesa.comandas.find((c) => c.id === mesa.selectedComandaId) || mesa.comandas[0];
        if (!comanda) return;
        const mi = s.menu.find((m) => m.id === itemId);
        if (!mi) return;
        set((prev) => ({
          mesas: prev.mesas.map((m) => {
            if (m.id !== prev.selectedMesa) return m;
            return {
              ...m,
              comandas: m.comandas.map((c) => {
                if (c.id !== comanda.id) return c;
                const existing = c.items.find((i) => i.id === itemId);
                return {
                  ...c,
                  items: existing
                    ? c.items.map((i) => (i.id === itemId ? { ...i, qty: i.qty + 1 } : i))
                    : [...c.items, { ...mi, qty: 1 }],
                };
              }),
            };
          }),
        }));
        get().syncKitchen();
      },

      changeMesaQty: (itemId, delta) => {
        const s = get();
        const mesa = s.mesas.find((m) => m.id === s.selectedMesa);
        if (!mesa) return;
        set((prev) => ({
          mesas: prev.mesas.map((m) => {
            if (m.id !== prev.selectedMesa) return m;
            return {
              ...m,
              comandas: m.comandas.map((c) => {
                if (c.id !== mesa.selectedComandaId) return c;
                const updated = c.items
                  .map((i) => (i.id === itemId ? { ...i, qty: i.qty + delta } : i))
                  .filter((i) => i.qty > 0);
                return { ...c, items: updated };
              }),
            };
          }),
        }));
        get().syncKitchen();
      },

      removeMesaItem: (itemId) => {
        const s = get();
        const mesa = s.mesas.find((m) => m.id === s.selectedMesa);
        if (!mesa) return;
        set((prev) => ({
          mesas: prev.mesas.map((m) => {
            if (m.id !== prev.selectedMesa) return m;
            return {
              ...m,
              comandas: m.comandas.map((c) => {
                if (c.id !== mesa.selectedComandaId) return c;
                return { ...c, items: c.items.filter((i) => i.id !== itemId) };
              }),
            };
          }),
        }));
        get().syncKitchen();
      },

      cancelComanda: (mesaId, comandaId) => {
        set((s) => ({
          mesas: s.mesas.map((m) => {
            if (m.id !== mesaId) return m;
            const newComandas = m.comandas.filter((c) => c.id !== comandaId);
            return {
              ...m,
              comandas: newComandas,
              status: newComandas.length > 0 ? 'occupied' : 'free',
              selectedComandaId: newComandas.length > 0 ? newComandas[0].id : null,
            };
          }),
        }));
        get().syncKitchen();
      },

      confirmFechamento: (mode, customAmount) => {
        const s = get();
        const mesa = s.mesas.find((m) => m.id === s.selectedMesa);
        if (!mesa || mesa.comandas.length === 0) return;
        let itemsPaid: CartItem[] = [];

        if (mode === 'comanda') {
          const comanda = mesa.comandas.find((c) => c.id === mesa.selectedComandaId);
          if (comanda) itemsPaid = comanda.items;
        } else {
          mesa.comandas.forEach((c) => itemsPaid.push(...c.items));
        }

        const calculatedTotal = itemsPaid.reduce((acc, i) => acc + i.price * i.qty, 0);
        const totalPaid = customAmount !== undefined && customAmount >= 0 ? customAmount : calculatedTotal;

        itemsPaid.forEach((i) => get().trackItemSale(i, s.selectedPayment));
        get().updatePaymentTotal(totalPaid, s.selectedPayment);

        set((prev) => ({
          faturamento: prev.faturamento + totalPaid,
          concluidos: prev.concluidos + 1,
          mesas: prev.mesas.map((m) => {
            if (m.id !== prev.selectedMesa) return m;
            if (mode === 'comanda') {
              const remaining = m.comandas.filter((c) => c.id !== mesa.selectedComandaId);
              return {
                ...m,
                comandas: remaining,
                status: remaining.length > 0 ? 'occupied' : 'free',
                selectedComandaId: remaining.length > 0 ? remaining[0].id : null,
              };
            } else {
              return { ...m, comandas: [], status: 'free', selectedComandaId: null };
            }
          }),
        }));
        get().syncKitchen();
      },

      // ── Caixa ────────────────────────────────────────────
      abrirCaixa: (valor) =>
        set((s) => ({
          caixa: {
            ...s.caixa,
            aberto: true,
            valorAbertura: valor,
            horaAbertura: nowTimeStr(),
            lancamentos: [],
          },
        })),

      fecharCaixa: () =>
        set((s) => ({ caixa: { ...s.caixa, aberto: false } })),

      addLancamento: ({ tipo, desc, valor }) =>
        set((s) => ({
          caixa: {
            ...s.caixa,
            lancamentos: [...s.caixa.lancamentos, { tipo, desc, valor, hora: nowTimeStr() }],
          },
        })),

      // ── Clientes ─────────────────────────────────────────
      saveCliente: (data, editingId) =>
        set((s) => {
          if (editingId) {
            return {
              clientes: s.clientes.map((c) =>
                c.id === editingId ? { ...c, ...data } : c,
              ),
            };
          }
          return {
            clientes: [...s.clientes, { id: s.clienteCounter, nome: '', telefone: '', endereco: '', obs: '', ...data }],
            clienteCounter: s.clienteCounter + 1,
          };
        }),

      deleteCliente: (id) =>
        set((s) => ({ clientes: s.clientes.filter((c) => c.id !== id) })),

      upsertCliente: ({ nome, telefone = '', endereco = '' }) => {
        if (!nome) return;
        set((s) => {
          const existing = s.clientes.find(
            (c) => c.nome.toLowerCase() === nome.toLowerCase(),
          );
          if (!existing) {
            return {
              clientes: [...s.clientes, { id: s.clienteCounter, nome, telefone, endereco, obs: '' }],
              clienteCounter: s.clienteCounter + 1,
            };
          }
          return {
            clientes: s.clientes.map((c) => {
              if (c.nome.toLowerCase() !== nome.toLowerCase()) return c;
              return {
                ...c,
                telefone: telefone && !c.telefone ? telefone : c.telefone,
                endereco: endereco && !c.endereco ? endereco : c.endereco,
              };
            }),
          };
        });
      },

      // ── Menu CRUD ────────────────────────────────────────
      saveMenuItem: (data, editingId) =>
        set((s) => {
          if (editingId) {
            return { menu: s.menu.map((m) => (m.id === editingId ? { ...m, ...data } : m)) };
          }
          return {
            menu: [...s.menu, { id: s.menuCounter + 1, ...data }],
            menuCounter: s.menuCounter + 1,
          };
        }),

      deleteMenuItem: (id) =>
        set((s) => ({ menu: s.menu.filter((m) => m.id !== id) })),

      // ── Sales Tracking ───────────────────────────────────
      trackItemSale: (item, payment) =>
        set((s) => {
          const existing: ItemSale = s.itemSales[item.id] || { name: item.name, emoji: item.emoji, cat: item.cat, qty: 0, revenue: 0 };
          return {
            itemSales: {
              ...s.itemSales,
              [item.id]: { ...existing, qty: existing.qty + item.qty, revenue: existing.revenue + item.price * item.qty },
            },
            catSales: {
              ...s.catSales,
              [item.cat]: (s.catSales[item.cat] || 0) + item.price * item.qty,
            },
          };
        }),

      updatePaymentTotal: (amount, method) =>
        set((s) => ({
          caixa: {
            ...s.caixa,
            paymentTotals: { ...s.caixa.paymentTotals, [method]: (s.caixa.paymentTotals[method] || 0) + amount },
            paymentCounts: { ...s.caixa.paymentCounts, [method]: (s.caixa.paymentCounts[method] || 0) + 1 },
          },
        })),

      // ── Kitchen Sync ─────────────────────────────────────
      syncKitchen: () => {
        const s = get();
        const activeComandas = s.mesas
          .filter((m) => m.comandas && m.comandas.length > 0)
          .flatMap((m) =>
            m.comandas
              .filter((c) => c.items && c.items.length > 0)
              .map((c) => ({
                id: m.id,
                comandaId: c.id,
                cliente: `${c.nome} (Mesa ${m.id})`,
                pessoas: c.pessoas,
                items: c.items,
                openTime: c.openTime,
              })),
          );
        const kitchenData = {
          timestamp: Date.now(),
          deliveryOrders: s.deliveryOrders.filter(
            (o) => o.status === 'preparando' || o.status === 'recebido',
          ),
          mesas: activeComandas,
        };
        try {
          localStorage.setItem('plp_kitchen', JSON.stringify(kitchenData));
        } catch {}
      },

      // ── Demo Data ────────────────────────────────────────
      loadDemoData: () => {
        const s = get();
        if (s.deliveryOrders.length > 0 || s.faturamento > 0) return;

        const demoOrders = [
          { nome: 'João Silva',      tel: '(11)99999-1234', end: 'Rua das Flores, 123',  itemIds: [1, 13], status: 'entregue' as const,   pay: 'dinheiro' as const },
          { nome: 'Maria Souza',     tel: '(11)98888-5678', end: 'Av. Brasil, 456',       itemIds: [7, 8, 14], status: 'preparando' as const, pay: 'pix' as const },
          { nome: 'Carlos Oliveira', tel: '(11)97777-9012', end: 'Rua Boa Vista, 789',    itemIds: [3, 16], status: 'recebido' as const,   pay: 'cartao' as const },
          { nome: 'Ana Lima',        tel: '(11)96666-3456', end: 'R. das Acácias, 321',   itemIds: [5, 19, 17], status: 'saiu' as const,    pay: 'cartao' as const },
          { nome: 'Pedro Nunes',     tel: '(11)95555-7890', end: 'Av. Paulista, 1000',    itemIds: [6, 20, 13], status: 'entregue' as const, pay: 'pix' as const },
        ];

        let counter = s.deliveryCounter;
        const orders: DeliveryOrder[] = [];
        let faturamento = s.faturamento;
        let concluidos = s.concluidos;
        const itemSales = { ...s.itemSales };
        const catSales = { ...s.catSales };
        const paymentTotals = { ...s.caixa.paymentTotals };
        const paymentCounts = { ...s.caixa.paymentCounts };
        const clientes = [...s.clientes];
        let clienteCounter = s.clienteCounter;

        demoOrders.forEach((d) => {
          const items: CartItem[] = d.itemIds.map((id) => ({ ...s.menu.find((m) => m.id === id)!, qty: 1 }));
          const total = items.reduce((acc, i) => acc + i.price * i.qty, 0);
          const order: DeliveryOrder = {
            id: counter++,
            cliente: d.nome,
            telefone: d.tel,
            endereco: d.end,
            observacoes: '',
            items,
            total,
            status: d.status,
            createdAt: Date.now() - Math.random() * 7200000,
          };
          if (d.status === 'entregue') {
            faturamento += total;
            concluidos++;
            items.forEach((i) => {
              const ex = itemSales[i.id] || { name: i.name, emoji: i.emoji, cat: i.cat, qty: 0, revenue: 0 };
              itemSales[i.id] = { ...ex, qty: ex.qty + i.qty, revenue: ex.revenue + i.price * i.qty };
              catSales[i.cat] = (catSales[i.cat] || 0) + i.price * i.qty;
            });
            paymentTotals[d.pay] = (paymentTotals[d.pay] || 0) + total;
            paymentCounts[d.pay] = (paymentCounts[d.pay] || 0) + 1;
          }
          orders.push(order);
          if (!clientes.find((c) => c.nome.toLowerCase() === d.nome.toLowerCase())) {
            clientes.push({ id: clienteCounter++, nome: d.nome, telefone: d.tel, endereco: d.end, obs: '' });
          }
        });

        const mesasDemo = s.mesas.map((m) => {
          const demoMesas: Record<number, Comanda[]> = {
            2: [
              { id: 201, nome: 'Pedro', pessoas: 2, openTime: Date.now() - 25 * 60000, items: [{ ...s.menu.find((x) => x.id === 2)!, qty: 2 }] },
              { id: 202, nome: 'Lucas', pessoas: 1, openTime: Date.now() - 20 * 60000, items: [{ ...s.menu.find((x) => x.id === 13)!, qty: 2 }] },
            ],
            5: [
              { id: 203, nome: 'Julia', pessoas: 2, openTime: Date.now() - 12 * 60000, items: [{ ...s.menu.find((x) => x.id === 7)!, qty: 2 }] },
              { id: 204, nome: 'Marcos', pessoas: 1, openTime: Date.now() - 10 * 60000, items: [{ ...s.menu.find((x) => x.id === 14)!, qty: 2 }] },
            ],
            8: [
              { id: 205, nome: 'Família Fernandes', pessoas: 4, openTime: Date.now() - 48 * 60000, items: [{ ...s.menu.find((x) => x.id === 1)!, qty: 2 }] },
              { id: 206, nome: 'Convidado', pessoas: 1, openTime: Date.now() - 30 * 60000, items: [{ ...s.menu.find((x) => x.id === 17)!, qty: 2 }] },
            ],
          };
          if (demoMesas[m.id]) {
            return { ...m, status: 'occupied' as const, comandas: demoMesas[m.id], selectedComandaId: demoMesas[m.id][0].id };
          }
          return m;
        });

        set({
          deliveryOrders: orders,
          deliveryCounter: counter,
          faturamento,
          concluidos,
          itemSales,
          catSales,
          clientes,
          clienteCounter,
          hourlyData: [1, 3, 2, 5, 4, 7, 6, 8, 5, 9, 4, 3],
          mesas: mesasDemo,
          caixa: {
            ...s.caixa,
            aberto: true,
            valorAbertura: 300,
            horaAbertura: '08:00',
            paymentTotals,
            paymentCounts,
          },
        });
        get().syncKitchen();
      },
    }),
    {
      name: 'plp_state',
    },
  ),
);
