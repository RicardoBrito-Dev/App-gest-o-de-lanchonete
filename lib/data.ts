// =====================================================
// PizzaLanche Pro — lib/data.ts
// Types & default data
// =====================================================

export type MenuCategory = 'pizzas' | 'lanches' | 'bebidas' | 'sobremesas';

export interface MenuItem {
  id: number;
  cat: MenuCategory;
  name: string;
  emoji: string;
  price: number;
  desc: string;
}

export interface CartItem extends MenuItem {
  qty: number;
}

export interface Comanda {
  id: number;
  nome: string;
  pessoas: number;
  openTime: number;
  items: CartItem[];
}

export interface Mesa {
  id: number;
  status: 'free' | 'occupied';
  selectedComandaId: number | null;
  comandas: Comanda[];
}

export type DeliveryStatus = 'recebido' | 'preparando' | 'saiu' | 'entregue';

export interface DeliveryOrder {
  id: number;
  cliente: string;
  telefone: string;
  endereco: string;
  observacoes: string;
  items: CartItem[];
  total: number;
  status: DeliveryStatus;
  createdAt: number;
  onlineOrder?: boolean;
}

export interface Cliente {
  id: number;
  nome: string;
  telefone: string;
  endereco: string;
  obs: string;
}

export interface Lancamento {
  tipo: 'entrada' | 'saida';
  desc: string;
  valor: number;
  hora: string;
}

export interface Caixa {
  aberto: boolean;
  valorAbertura: number;
  horaAbertura: string | null;
  lancamentos: Lancamento[];
  paymentTotals: { dinheiro: number; cartao: number; pix: number };
  paymentCounts: { dinheiro: number; cartao: number; pix: number };
}

export interface ItemSale {
  name: string;
  emoji: string;
  cat: MenuCategory;
  qty: number;
  revenue: number;
}

export type PaymentMethod = 'dinheiro' | 'cartao' | 'pix';

export interface AppState {
  menu: MenuItem[];
  menuCounter: number;
  deliveryOrders: DeliveryOrder[];
  deliveryCounter: number;
  deliveryCart: CartItem[];
  mesas: Mesa[];
  totalMesas: number;
  clientes: Cliente[];
  clienteCounter: number;
  caixa: Caixa;
  faturamento: number;
  concluidos: number;
  hourlyData: number[];
  itemSales: Record<number, ItemSale>;
  catSales: Record<string, number>;
  selectedPayment: PaymentMethod;
  currentPage: string;
  selectedMesa: number | null;
  soundEnabled: boolean;
  soundVolume: number;
}

export const DEFAULT_MENU: MenuItem[] = [
  { id: 1,  cat: 'pizzas',     name: 'Calabresa',          emoji: '🍕', price: 42.90, desc: 'Calabresa fatiada, mozzarella e orégano' },
  { id: 2,  cat: 'pizzas',     name: 'Margherita',         emoji: '🍕', price: 38.90, desc: 'Tomate fresco, mozzarella de búfala e manjericão' },
  { id: 3,  cat: 'pizzas',     name: 'Frango c/ Catupiry', emoji: '🍕', price: 45.90, desc: 'Frango desfiado, catupiry cremoso e milho' },
  { id: 4,  cat: 'pizzas',     name: 'Portuguesa',         emoji: '🍕', price: 46.90, desc: 'Presunto, ovos, cebola, azeitona e pimentão' },
  { id: 5,  cat: 'pizzas',     name: 'Quatro Queijos',     emoji: '🍕', price: 48.90, desc: 'Mozzarella, parmesão, gorgonzola e catupiry' },
  { id: 6,  cat: 'pizzas',     name: 'Pepperoni',          emoji: '🍕', price: 49.90, desc: 'Pepperoni importado com mozzarella especial' },
  { id: 7,  cat: 'lanches',    name: 'X-Burguer',          emoji: '🍔', price: 22.90, desc: 'Pão, hambúrguer 180g, queijo e alface' },
  { id: 8,  cat: 'lanches',    name: 'X-Bacon',            emoji: '🍔', price: 27.90, desc: 'Hambúrguer, bacon crocante, queijo cheddar' },
  { id: 9,  cat: 'lanches',    name: 'X-Tudo',             emoji: '🍔', price: 32.90, desc: 'Completo com ovo, bacon, presunto e calabresa' },
  { id: 10, cat: 'lanches',    name: 'Hot Dog',             emoji: '🌭', price: 18.90, desc: 'Salsicha, purê, batata palha e molhos' },
  { id: 11, cat: 'lanches',    name: 'Misto Quente',       emoji: '🥪', price: 12.90, desc: 'Presunto e queijo na chapa' },
  { id: 12, cat: 'lanches',    name: 'Porção de Fritas',   emoji: '🍟', price: 19.90, desc: 'Batata frita crocante com molho especial' },
  { id: 13, cat: 'bebidas',    name: 'Coca-Cola 2L',       emoji: '🥤', price: 12.00, desc: 'Refrigerante gelado 2 litros' },
  { id: 14, cat: 'bebidas',    name: 'Coca-Cola Lata',     emoji: '🥫', price:  6.00, desc: 'Coca-Cola lata 350ml gelada' },
  { id: 15, cat: 'bebidas',    name: 'Suco Natural',       emoji: '🧃', price: 10.00, desc: 'Laranja, limão ou maracujá' },
  { id: 16, cat: 'bebidas',    name: 'Água Mineral',       emoji: '💧', price:  4.00, desc: 'Garrafa 500ml sem ou com gás' },
  { id: 17, cat: 'bebidas',    name: 'Cerveja',            emoji: '🍺', price:  8.00, desc: 'Cerveja gelada long neck 355ml' },
  { id: 18, cat: 'bebidas',    name: 'Energético',         emoji: '⚡', price: 13.00, desc: 'Energético 473ml gelado' },
  { id: 19, cat: 'sobremesas', name: 'Pizza Doce',         emoji: '🍫', price: 34.90, desc: 'Nutella, morango ou banana com canela' },
  { id: 20, cat: 'sobremesas', name: 'Petit Gateau',       emoji: '🎂', price: 18.90, desc: 'Com sorvete de creme e calda de chocolate' },
  { id: 21, cat: 'sobremesas', name: 'Pudim',              emoji: '🍮', price: 12.00, desc: 'Pudim de leite condensado caseiro' },
  { id: 22, cat: 'sobremesas', name: 'Açaí 500ml',         emoji: '🫐', price: 22.00, desc: 'Com granola, banana e leite condensado' },
];

export const CAT_LABELS: Record<string, string> = {
  pizzas: '🍕 Pizzas',
  lanches: '🍔 Lanches',
  bebidas: '🥤 Bebidas',
  sobremesas: '🍰 Sobremesas',
};

export const STATUS_LABELS: Record<string, string> = {
  recebido: '⏳ Recebido',
  preparando: '🔥 Preparando',
  saiu: '🛵 Saiu',
  entregue: '✅ Entregue',
};

export const STATUS_COLORS: Record<string, string> = {
  recebido: '#f39c12',
  preparando: '#e74c3c',
  saiu: '#4f8ef7',
  entregue: '#2ecc71',
};

export const KANBAN_NEXT_LABEL: Record<string, string | null> = {
  recebido: '🔥 Preparar',
  preparando: '🛵 Saiu',
  saiu: '✅ Entregue',
  entregue: null,
};
