/* =====================================================
   PIZZALANCHE PRO — Cardápio Digital do Cliente (JS)
   ===================================================== */

const DEFAULT_MENU = [
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

function getRestaurantMenu() {
  try {
    const raw = localStorage.getItem('plp_state');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.menu && parsed.menu.length > 0) return parsed.menu;
    }
  } catch(e) {}
  return DEFAULT_MENU;
}

const clientState = {
  menu: getRestaurantMenu(),
  cart: [],
  activeCat: 'all',
  searchQuery: '',
  orderType: 'entrega', // 'entrega' | 'retirada'
  paymentOption: 'pix',
  taxaEntrega: 5.00,
  currentOrderId: null,
};

function fmt(v) { return `R$ ${(+v||0).toFixed(2).replace('.', ',')}`; }
function fmtId(n) { return `#${String(n).padStart(3, '0')}`; }

// ==================== MENU RENDER ====================
function renderMenu() {
  const container = document.getElementById('menu-sections');
  let items = clientState.menu;

  if (clientState.activeCat !== 'all') {
    items = items.filter(i => i.cat === clientState.activeCat);
  }
  if (clientState.searchQuery) {
    const q = clientState.searchQuery.toLowerCase();
    items = items.filter(i => i.name.toLowerCase().includes(q) || (i.desc||'').toLowerCase().includes(q));
  }

  if (items.length === 0) {
    container.innerHTML = '<div style="text-align:center;padding:40px 20px;color:var(--text-muted)">Nenhum item encontrado</div>';
    return;
  }

  const categories = ['pizzas', 'lanches', 'bebidas', 'sobremesas'];
  const catNames = { pizzas: '🍕 Pizzas', lanches: '🍔 Lanches', bebidas: '🥤 Bebidas', sobremesas: '🍰 Sobremesas' };

  let html = '';
  categories.forEach(cat => {
    const catItems = items.filter(i => i.cat === cat);
    if (catItems.length > 0) {
      html += `
        <div class="category-section">
          <h2 class="category-title">${catNames[cat]}</h2>
          <div class="menu-items-grid">
            ${catItems.map(item => `
              <div class="product-card">
                <div class="product-emoji">${item.emoji}</div>
                <div class="product-info">
                  <div class="product-name">${item.name}</div>
                  <div class="product-desc">${item.desc||''}</div>
                  <div class="product-price">${fmt(item.price)}</div>
                </div>
                <button class="btn-add-product" onclick="addToCart(${item.id})">+ Adicionar</button>
              </div>`).join('')}
          </div>
        </div>`;
    }
  });

  container.innerHTML = html;
}

function filterMenu() {
  clientState.searchQuery = document.getElementById('search-input').value;
  renderMenu();
}

document.getElementById('category-pills').addEventListener('click', e => {
  const btn = e.target.closest('.cat-pill');
  if (!btn) return;
  clientState.activeCat = btn.dataset.cat;
  document.querySelectorAll('.cat-pill').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderMenu();
});

// ==================== CART LOGIC ====================
function addToCart(itemId) {
  const item = clientState.menu.find(m => m.id === itemId);
  if (!item) return;
  const existing = clientState.cart.find(c => c.id === itemId);
  if (existing) existing.qty++;
  else clientState.cart.push({ ...item, qty: 1 });
  updateCartUI();
}

function updateCartUI() {
  const bar = document.getElementById('cart-floating-bar');
  const totalCount = clientState.cart.reduce((s, i) => s + i.qty, 0);
  const subtotal = clientState.cart.reduce((s, i) => s + i.price * i.qty, 0);
  const taxa = clientState.orderType === 'entrega' ? clientState.taxaEntrega : 0;
  const grandTotal = subtotal + taxa;

  if (totalCount > 0) {
    document.getElementById('cart-badge-count').textContent = totalCount;
    document.getElementById('cart-bar-total').textContent = fmt(grandTotal);
    bar.style.display = 'flex';
  } else {
    bar.style.display = 'none';
    closeCartDrawer();
  }

  // Drawer items
  const drawerItems = document.getElementById('cart-drawer-items');
  if (clientState.cart.length === 0) {
    drawerItems.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text-muted)">Seu carrinho está vazio</div>';
  } else {
    drawerItems.innerHTML = clientState.cart.map(item => `
      <div class="drawer-item">
        <span>${item.emoji}</span>
        <span class="drawer-item-name">${item.name}</span>
        <div class="drawer-item-qty">
          <button class="qty-btn" onclick="changeQty(${item.id}, -1)">−</button>
          <span class="qty-val">${item.qty}</span>
          <button class="qty-btn" onclick="changeQty(${item.id}, 1)">+</button>
        </div>
        <span class="drawer-item-price">${fmt(item.price * item.qty)}</span>
      </div>`).join('');
  }

  document.getElementById('subtotal-val').textContent = fmt(subtotal);
  document.getElementById('taxa-row').style.display = clientState.orderType === 'entrega' ? 'flex' : 'none';
  document.getElementById('taxa-val').textContent = fmt(clientState.taxaEntrega);
  document.getElementById('total-val').textContent = fmt(grandTotal);
}

function changeQty(itemId, delta) {
  const item = clientState.cart.find(c => c.id === itemId);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) {
    clientState.cart = clientState.cart.filter(c => c.id !== itemId);
  }
  updateCartUI();
}

function openCartDrawer() {
  document.getElementById('cart-drawer-overlay').style.display = 'flex';
}
function closeCartDrawer(e) {
  if (e && e.stopPropagation) e.stopPropagation();
  document.getElementById('cart-drawer-overlay').style.display = 'none';
}

function setOrderType(type) {
  clientState.orderType = type;
  document.getElementById('type-entrega').classList.toggle('active', type === 'entrega');
  document.getElementById('type-retirada').classList.toggle('active', type === 'retirada');
  document.getElementById('address-fields').style.display = type === 'entrega' ? 'block' : 'none';
  updateCartUI();
}

function setPaymentOption(opt) {
  clientState.paymentOption = opt;
  ['pix', 'cartao', 'dinheiro'].forEach(o => {
    document.getElementById(`pay-opt-${o}`).classList.toggle('active', o === opt);
  });
  document.getElementById('troco-box').style.display = opt === 'dinheiro' ? 'block' : 'none';
}

// ==================== SUBMIT ORDER ====================
function submitClientOrder() {
  if (clientState.cart.length === 0) { alert('Adicione itens ao carrinho primeiro!'); return; }

  const nome = document.getElementById('cli-nome').value.trim();
  const tel = document.getElementById('cli-tel').value.trim();
  const end = document.getElementById('cli-end').value.trim();
  const compl = document.getElementById('cli-compl').value.trim();
  const obs = document.getElementById('cli-obs').value.trim();

  if (!nome) { alert('Informe seu nome!'); document.getElementById('cli-nome').focus(); return; }
  if (!tel) { alert('Informe seu telefone/WhatsApp!'); document.getElementById('cli-tel').focus(); return; }

  let fullAddress = 'Retirada no Local';
  if (clientState.orderType === 'entrega') {
    if (!end) { alert('Informe o endereço de entrega!'); document.getElementById('cli-end').focus(); return; }
    fullAddress = end + (compl ? ` (${compl})` : '');
  }

  const subtotal = clientState.cart.reduce((s, i) => s + i.price * i.qty, 0);
  const taxa = clientState.orderType === 'entrega' ? clientState.taxaEntrega : 0;
  const total = subtotal + taxa;

  let payDesc = { pix: 'PIX', cartao: 'Cartão na Entrega', dinheiro: 'Dinheiro' }[clientState.paymentOption];
  if (clientState.paymentOption === 'dinheiro') {
    const troco = document.getElementById('cli-troco').value;
    if (troco) payDesc += ` (Troco para R$ ${troco})`;
  }

  // Load current restaurant state
  let restaurantState = null;
  try {
    const raw = localStorage.getItem('plp_state');
    if (raw) restaurantState = JSON.parse(raw);
  } catch(e) {}

  if (!restaurantState) {
    alert('Restaurante não inicializado. Abra o painel de gestão primeiro!');
    return;
  }

  const newOrderId = restaurantState.deliveryCounter++;
  const order = {
    id: newOrderId,
    cliente: nome,
    telefone: tel,
    endereco: fullAddress,
    observacoes: `${obs ? obs + ' | ' : ''}Pagamento: ${payDesc} | Tipo: ${clientState.orderType.toUpperCase()}`,
    items: [...clientState.cart],
    total,
    status: 'recebido',
    createdAt: Date.now(),
    onlineOrder: true,
  };

  restaurantState.deliveryOrders.push(order);
  restaurantState.hourlyData[restaurantState.hourlyData.length - 1]++;

  // Sync back to localStorage
  try {
    localStorage.setItem('plp_state', JSON.stringify(restaurantState));
    // Trigger kitchen sync
    const kitchenData = {
      timestamp: Date.now(),
      deliveryOrders: restaurantState.deliveryOrders.filter(o => o.status === 'preparando' || o.status === 'recebido'),
      mesas: restaurantState.mesas
        .filter(m => m.comandas && m.comandas.length > 0)
        .flatMap(m => m.comandas.map(c => ({ id: m.id, comandaId: c.id, cliente: `${c.nome} (Mesa ${m.id})`, items: c.items, openTime: c.openTime })))
    };
    localStorage.setItem('plp_kitchen', JSON.stringify(kitchenData));
  } catch(e) {}

  clientState.currentOrderId = newOrderId;
  closeCartDrawer();
  clientState.cart = [];
  updateCartUI();

  // Show tracking view
  showTrackingView(order);
}

// ==================== TRACKING ====================
function showTrackingView(order) {
  document.getElementById('menu-view').style.display = 'none';
  document.getElementById('tracking-view').style.display = 'block';
  document.getElementById('cart-floating-bar').style.display = 'none';

  document.getElementById('track-order-id').textContent = `Pedido ${fmtId(order.id)}`;
  document.getElementById('track-order-time').textContent = new Date(order.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  document.getElementById('track-total-val').textContent = fmt(order.total);
  document.getElementById('track-address-box').innerHTML = `<strong>Entrega para:</strong><br>${order.cliente}<br>📍 ${order.endereco}<br>📞 ${order.telefone}`;

  document.getElementById('track-items-list').innerHTML = order.items.map(i => `
    <div style="display:flex;justify-content:space-between">
      <span>${i.qty}x ${i.emoji} ${i.name}</span>
      <span style="font-weight:700;color:var(--primary)">${fmt(i.price * i.qty)}</span>
    </div>`).join('');

  updateTrackingStatus(order.status);
  startTrackingPoll();
}

function updateTrackingStatus(status) {
  const statusInfo = {
    recebido: {
      icon: '⏳',
      title: 'Pedido Recebido!',
      desc: 'Seu pedido já entrou no nosso sistema e aguarda envio para a cozinha.',
    },
    preparando: {
      icon: '🔥',
      title: 'Em Preparo na Cozinha!',
      desc: 'Nossos chefs já estão preparando seu pedido com todo o carinho.',
    },
    saiu: {
      icon: '🛵',
      title: 'Saiu para Entrega!',
      desc: 'Seu pedido já está com o entregador e a caminho do seu endereço.',
    },
    entregue: {
      icon: '✅',
      title: 'Pedido Entregue!',
      desc: 'Obrigado por pedir na PizzaLanche Pro! Tenha um ótimo apetite. ❤️',
    }
  };

  const info = statusInfo[status] || statusInfo['recebido'];
  document.getElementById('track-status-icon').textContent = info.icon;
  document.getElementById('track-status-title').textContent = info.title;
  document.getElementById('track-status-desc').textContent = info.desc;

  const steps = ['recebido', 'preparando', 'saiu', 'entregue'];
  const currentIdx = steps.indexOf(status);

  steps.forEach((s, idx) => {
    const el = document.getElementById(`step-${s}`);
    if (idx < currentIdx) {
      el.className = 'timeline-step done';
    } else if (idx === currentIdx) {
      el.className = 'timeline-step active';
    } else {
      el.className = 'timeline-step';
    }
  });
}

function startTrackingPoll() {
  if (!clientState.currentOrderId) return;
  setInterval(() => {
    try {
      const raw = localStorage.getItem('plp_state');
      if (!raw) return;
      const state = JSON.parse(raw);
      const order = state.deliveryOrders.find(o => o.id === clientState.currentOrderId);
      if (order) updateTrackingStatus(order.status);
    } catch(e) {}
  }, 4000);
}

function resetToMenu() {
  clientState.currentOrderId = null;
  document.getElementById('tracking-view').style.display = 'none';
  document.getElementById('menu-view').style.display = 'block';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ==================== INIT ====================
renderMenu();
