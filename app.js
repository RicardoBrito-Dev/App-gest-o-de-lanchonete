/* ======================================================
   PIZZALANCHE PRO — app.js v2
   Dashboard · Delivery · Mesas · Caixa · Clientes
   Cardápio CRUD · Relatórios · Sons · Impressão · Cozinha
   ====================================================== */

// ==================== AUDIO ====================
let audioCtx = null;
function getAudioCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}
function playBeep(freq = 880, dur = 0.12, type = 'sine', vol = 0.3) {
  try {
    const ctx = getAudioCtx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(vol, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    o.start(ctx.currentTime); o.stop(ctx.currentTime + dur);
  } catch(e) {}
}
function soundNewOrder() { playBeep(660,0.1,'sine'); setTimeout(()=>playBeep(880,0.15,'sine'),120); setTimeout(()=>playBeep(1100,0.2,'sine'),260); }
function soundAdvance()  { playBeep(660,0.08,'sine'); setTimeout(()=>playBeep(780,0.1,'sine'),100); }
function soundDone()     { playBeep(880,0.1,'sine'); setTimeout(()=>playBeep(1100,0.1,'sine'),110); setTimeout(()=>playBeep(1320,0.18,'triangle'),230); }
function soundWarning()  { playBeep(440,0.2,'square',0.2); }
function soundCaixa()    { playBeep(523,0.1,'sine'); setTimeout(()=>playBeep(659,0.1,'sine'),100); setTimeout(()=>playBeep(784,0.2,'sine'),200); }

// ==================== STATE ====================
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

function loadState() {
  try {
    const saved = localStorage.getItem('plp_state');
    if (saved) return JSON.parse(saved);
  } catch(e) {}
  return null;
}

function buildInitialState() {
  return {
    menu: JSON.parse(JSON.stringify(DEFAULT_MENU)),
    menuCounter: 100,
    deliveryOrders: [],
    deliveryCounter: 1,
    mesas: Array.from({ length: 12 }, (_, i) => ({
      id: i + 1, status: 'free', cliente: '', pessoas: 0, openTime: null, items: [],
    })),
    clientes: [],
    clienteCounter: 1,
    caixa: { aberto: false, valorAbertura: 0, horaAbertura: null, lancamentos: [], paymentTotals: { dinheiro: 0, cartao: 0, pix: 0 }, paymentCounts: { dinheiro: 0, cartao: 0, pix: 0 } },
    faturamento: 0,
    concluidos: 0,
    hourlyData: Array(12).fill(0),
    itemSales: {},         // itemId -> { qty, revenue }
    catSales: { pizzas: 0, lanches: 0, bebidas: 0, sobremesas: 0 },
    selectedPayment: 'dinheiro',
  };
}

let state = loadState() || buildInitialState();

function migrateMesas() {
  if (!state.mesas) {
    state.mesas = Array.from({ length: 12 }, (_, i) => ({ id: i + 1, status: 'free', selectedComandaId: null, comandas: [] }));
    return;
  }
  state.mesas.forEach(m => {
    if (!m.comandas) {
      m.comandas = [];
      if (m.items && m.items.length > 0) {
        const cId = Date.now() + Math.floor(Math.random() * 1000);
        m.comandas.push({
          id: cId,
          nome: m.cliente || 'Comanda 1',
          pessoas: m.pessoas || 1,
          openTime: m.openTime || Date.now(),
          items: m.items
        });
        m.selectedComandaId = cId;
        m.status = 'occupied';
      } else {
        m.status = 'free';
        m.selectedComandaId = null;
      }
      delete m.items; delete m.cliente; delete m.pessoas; delete m.openTime;
    } else {
      if (m.comandas.length > 0) {
        m.status = 'occupied';
        if (!m.selectedComandaId || !m.comandas.some(c => c.id === m.selectedComandaId)) {
          m.selectedComandaId = m.comandas[0].id;
        }
      } else {
        m.status = 'free';
        m.selectedComandaId = null;
      }
    }
  });
}
migrateMesas();

function saveState() {
  try { localStorage.setItem('plp_state', JSON.stringify(state)); } catch(e) {}
  syncKitchen();
}

function syncKitchen() {
  const activeComandas = [];
  state.mesas.filter(m => m.comandas && m.comandas.length > 0).forEach(m => {
    m.comandas.forEach(c => {
      if (c.items && c.items.length > 0) {
        activeComandas.push({
          id: m.id,
          comandaId: c.id,
          cliente: `${c.nome} (Mesa ${m.id})`,
          pessoas: c.pessoas,
          items: c.items,
          openTime: c.openTime
        });
      }
    });
  });
  const kitchenData = {
    timestamp: Date.now(),
    deliveryOrders: state.deliveryOrders.filter(o => o.status === 'preparando' || o.status === 'recebido'),
    mesas: activeComandas
  };
  try { localStorage.setItem('plp_kitchen', JSON.stringify(kitchenData)); } catch(e) {}
}

// ==================== UTILS ====================
function fmt(val) { return `R$ ${(+val||0).toFixed(2).replace('.', ',')}`; }
function fmtId(n) { return `#${String(n).padStart(3, '0')}`; }
function timeAgo(ms) {
  const diff = Math.floor((Date.now() - ms) / 60000);
  if (diff < 1) return 'agora';
  if (diff < 60) return `${diff} min`;
  return `${Math.floor(diff/60)}h${diff%60>0?diff%60+'m':''}`;
}
function getHourLabel(hoursAgo) {
  const d = new Date(Date.now() - hoursAgo * 3600000);
  return d.getHours() + 'h';
}
function nowTimeStr() {
  const d = new Date();
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function toast(msg, type = 'info') {
  const tc = document.getElementById('toast-container');
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
  t.innerHTML = `<span>${icons[type]||'ℹ️'}</span><span>${msg}</span>`;
  tc.appendChild(t);
  setTimeout(() => { if (t.parentNode) tc.removeChild(t); }, 3200);
}

// ==================== CLOCK ====================
function updateClock() {
  const now = new Date();
  const h = String(now.getHours()).padStart(2,'0');
  const m = String(now.getMinutes()).padStart(2,'0');
  const s = String(now.getSeconds()).padStart(2,'0');
  document.getElementById('sidebar-time').textContent = `${h}:${m}:${s}`;
  const days = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
  const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  document.getElementById('sidebar-date').textContent = `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]}`;
}
setInterval(updateClock, 1000);
updateClock();

// ==================== NAVIGATION ====================
const PAGE_TITLES = { dashboard:'Dashboard', delivery:'Delivery', mesas:'Mesas', caixa:'Controle de Caixa', clientes:'Clientes', cardapio:'Cardápio', relatorios:'Relatórios' };

function setPage(page) {
  state.currentPage = page;
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item[data-page]').forEach(n => n.classList.remove('active'));
  document.getElementById(`page-${page}`).classList.add('active');
  const navBtn = document.getElementById(`nav-${page}`);
  if (navBtn) navBtn.classList.add('active');
  document.getElementById('page-title').textContent = PAGE_TITLES[page] || page;
  const renders = { dashboard: renderDashboard, delivery: ()=>renderDeliveryMenu(), mesas: renderMesas, caixa: renderCaixa, clientes: renderClientes, cardapio: renderCardapio, relatorios: renderRelatorios };
  if (renders[page]) renders[page]();
  if (window.innerWidth <= 900) document.getElementById('sidebar').classList.remove('open');
}

document.querySelectorAll('.nav-item[data-page]').forEach(btn => {
  btn.addEventListener('click', () => setPage(btn.dataset.page));
});
document.getElementById('menu-toggle').addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('open');
});

// ==================== BADGES & TOPBAR ====================
function updateBadges() {
  const activeDelivery = state.deliveryOrders.filter(o => o.status !== 'entregue').length;
  const occupiedMesas  = state.mesas.filter(m => m.status === 'occupied').length;
  const bDel = document.getElementById('badge-delivery');
  bDel.textContent = activeDelivery; bDel.classList.toggle('show', activeDelivery > 0);
  const bMes = document.getElementById('badge-mesas');
  bMes.textContent = occupiedMesas; bMes.classList.toggle('show', occupiedMesas > 0);
  const bCaixa = document.getElementById('badge-caixa');
  bCaixa.style.display = !state.caixa.aberto ? 'flex' : 'none';
  document.getElementById('top-pedidos').textContent = activeDelivery + occupiedMesas;
  document.getElementById('top-faturamento').textContent = fmt(state.faturamento);
  // Caixa pill
  const dot = document.getElementById('caixa-pill-dot');
  const lbl = document.getElementById('caixa-pill-label');
  if (state.caixa.aberto) {
    dot.className = 'caixa-pill-dot open';
    lbl.textContent = 'Caixa Aberto';
  } else {
    dot.className = 'caixa-pill-dot';
    lbl.textContent = 'Caixa Fechado';
  }
}

// ==================== DASHBOARD ====================
function renderDashboard() {
  const activeDelivery = state.deliveryOrders.filter(o => o.status !== 'entregue').length;
  const occupiedMesas  = state.mesas.filter(m => m.status === 'occupied').length;
  const freeMesas = 12 - occupiedMesas;
  document.getElementById('kpi-faturamento').textContent = fmt(state.faturamento);
  document.getElementById('kpi-faturamento-trend').textContent = state.faturamento > 0 ? `+${fmt(state.faturamento)}` : 'Iniciando...';
  document.getElementById('kpi-delivery').textContent = state.deliveryOrders.length;
  document.getElementById('kpi-delivery-trend').textContent = `${activeDelivery} ativo(s)`;
  document.getElementById('kpi-mesas').textContent = `${occupiedMesas}/12`;
  document.getElementById('kpi-mesas-trend').textContent = `${freeMesas} livre(s)`;
  document.getElementById('kpi-concluidos').textContent = state.concluidos;
  updateBadges();

  // Recent list
  const recentEl = document.getElementById('recent-list');
  const recents = [...state.deliveryOrders].reverse().slice(0, 6);
  if (recents.length === 0) { recentEl.innerHTML = '<div class="empty-state">Nenhum pedido ainda</div>'; }
  else {
    const SC = { recebido:'#f39c12', preparando:'#e74c3c', saiu:'#4f8ef7', entregue:'#2ecc71' };
    const SL = { recebido:'⏳ Recebido', preparando:'🔥 Preparando', saiu:'🛵 Saiu', entregue:'✅ Entregue' };
    recentEl.innerHTML = recents.map(o => `
      <div class="recent-item" onclick="openPedidoModal(${o.id})">
        <span class="recent-item-icon">🛵</span>
        <div class="recent-item-info">
          <div class="recent-item-name">${o.cliente} ${fmtId(o.id)}</div>
          <div class="recent-item-sub">${timeAgo(o.createdAt)} · ${fmt(o.total)}</div>
        </div>
        <span class="recent-item-status" style="background:${SC[o.status]}22;color:${SC[o.status]}">${SL[o.status]}</span>
      </div>`).join('');
  }

  // Status overview
  ['recebido','preparando','saiu','entregue'].forEach(s => {
    const el = document.getElementById(`ov-${s}`);
    const orders = state.deliveryOrders.filter(o => o.status === s);
    el.innerHTML = orders.length === 0
      ? '<div style="color:var(--text-muted);font-size:0.75rem;text-align:center;padding:8px">Nenhum</div>'
      : orders.map(o => `<div class="status-mini-item"><div class="status-mini-name">${o.cliente} ${fmtId(o.id)}</div><div class="status-mini-sub">${fmt(o.total)}</div></div>`).join('');
  });
  drawChart();
}

function drawChart() {
  const canvas = document.getElementById('pedidos-chart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.parentElement.clientWidth || 600;
  const H = 200;
  canvas.width = W; canvas.height = H;
  const data = state.hourlyData;
  const maxVal = Math.max(...data, 5);
  const pad = { top: 20, right: 16, bottom: 34, left: 34 };
  const chartW = W - pad.left - pad.right;
  const chartH = H - pad.top - pad.bottom;
  const barW = chartW / data.length;
  ctx.clearRect(0, 0, W, H);
  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = pad.top + (chartH / 4) * i;
    ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(W - pad.right, y); ctx.stroke();
    ctx.fillStyle = 'rgba(144,144,176,0.6)'; ctx.font = '10px Inter'; ctx.textAlign = 'right';
    ctx.fillText(Math.round(maxVal - (maxVal/4)*i), pad.left - 6, y + 4);
  }
  data.forEach((val, i) => {
    const barH = (val / maxVal) * chartH;
    const x = pad.left + i * barW + barW * 0.15;
    const y = pad.top + chartH - barH;
    const bw = barW * 0.7;
    ctx.fillStyle = 'rgba(255,255,255,0.03)';
    ctx.beginPath(); ctx.roundRect(x, pad.top, bw, chartH, 4); ctx.fill();
    const g = ctx.createLinearGradient(0, y, 0, pad.top + chartH);
    g.addColorStop(0, '#ff6b35'); g.addColorStop(1, '#e8439a');
    ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(x, y, bw, barH, [4,4,0,0]); ctx.fill();
    ctx.fillStyle = 'rgba(144,144,176,0.7)'; ctx.font = '10px Inter'; ctx.textAlign = 'center';
    ctx.fillText(getHourLabel(11 - i), x + bw/2, H - 5);
  });
}

// ==================== DELIVERY ====================
let delActiveCat = 'all';

function renderDeliveryMenu() {
  updateClientesDatalist();
  const grid = document.getElementById('del-menu-grid');
  const items = delActiveCat === 'all' ? state.menu : state.menu.filter(m => m.cat === delActiveCat);
  grid.innerHTML = items.map(item => `
    <button class="menu-item-btn" onclick="addToDeliveryCart(${item.id})">
      <span class="menu-item-emoji">${item.emoji}</span>
      <span class="menu-item-name">${item.name}</span>
      <span class="menu-item-price">${fmt(item.price)}</span>
    </button>`).join('');
}

document.getElementById('del-cat-tabs').addEventListener('click', e => {
  const tab = e.target.closest('.cat-tab'); if (!tab) return;
  delActiveCat = tab.dataset.cat;
  document.querySelectorAll('#del-cat-tabs .cat-tab').forEach(t => t.classList.remove('active'));
  tab.classList.add('active');
  renderDeliveryMenu();
});

function addToDeliveryCart(itemId) {
  if (!state.deliveryCart) state.deliveryCart = [];
  const mi = state.menu.find(m => m.id === itemId); if (!mi) return;
  const existing = state.deliveryCart.find(c => c.id === itemId);
  if (existing) existing.qty++; else state.deliveryCart.push({ ...mi, qty: 1 });
  renderDeliveryCart();
  toast(`${mi.emoji} ${mi.name} adicionado!`, 'success');
}

function renderDeliveryCart() {
  if (!state.deliveryCart) state.deliveryCart = [];
  const list = document.getElementById('del-cart-list');
  const totalEl = document.getElementById('del-cart-total');
  if (state.deliveryCart.length === 0) {
    list.innerHTML = '<div class="empty-state small">Nenhum item adicionado</div>';
    totalEl.style.display = 'none'; return;
  }
  list.innerHTML = state.deliveryCart.map(item => `
    <div class="cart-item">
      <span>${item.emoji}</span>
      <span class="cart-item-name">${item.name}</span>
      <div class="cart-item-qty">
        <button class="qty-btn" onclick="changeDelQty(${item.id},-1)">−</button>
        <span class="qty-value">${item.qty}</span>
        <button class="qty-btn" onclick="changeDelQty(${item.id},1)">+</button>
      </div>
      <span class="cart-item-price">${fmt(item.price*item.qty)}</span>
      <button class="cart-item-remove" onclick="removeDelItem(${item.id})">✕</button>
    </div>`).join('');
  const total = state.deliveryCart.reduce((s,i) => s+i.price*i.qty, 0);
  document.getElementById('del-total-value').textContent = fmt(total);
  totalEl.style.display = 'flex';
}

function changeDelQty(id, delta) {
  const item = state.deliveryCart.find(c => c.id === id); if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) removeDelItem(id); else renderDeliveryCart();
}
function removeDelItem(id) { state.deliveryCart = state.deliveryCart.filter(c => c.id !== id); renderDeliveryCart(); }

function clearDeliveryForm() {
  state.deliveryCart = [];
  ['del-nome','del-tel','del-end','del-obs'].forEach(id => document.getElementById(id).value = '');
  renderDeliveryCart();
}

function submitDelivery() {
  if (!state.deliveryCart) state.deliveryCart = [];
  const nome = document.getElementById('del-nome').value.trim();
  const tel  = document.getElementById('del-tel').value.trim();
  const end  = document.getElementById('del-end').value.trim();
  const obs  = document.getElementById('del-obs').value.trim();
  if (!nome) { toast('Informe o nome do cliente!', 'error'); return; }
  if (!end)  { toast('Informe o endereço!', 'error'); return; }
  if (state.deliveryCart.length === 0) { toast('Adicione pelo menos um item!', 'error'); return; }
  if (!state.caixa.aberto) { toast('⚠️ Abra o caixa antes de registrar pedidos!', 'warning'); soundWarning(); }
  const total = state.deliveryCart.reduce((s,i) => s+i.price*i.qty, 0);
  const order = {
    id: state.deliveryCounter++, cliente: nome, telefone: tel, endereco: end,
    observacoes: obs, items: [...state.deliveryCart], total, status: 'recebido', createdAt: Date.now(),
  };
  state.deliveryOrders.push(order);
  state.hourlyData[state.hourlyData.length - 1]++;
  // Auto-register or update client
  upsertCliente({ nome, telefone: tel, endereco: end });
  clearDeliveryForm();
  renderKanban();
  renderDashboard();
  saveState();
  soundNewOrder();
  toast(`Pedido ${fmtId(order.id)} criado! 🛵`, 'success');
}

// ==================== KANBAN ====================
const KANBAN_STATUSES = ['recebido','preparando','saiu','entregue'];
const KANBAN_NEXT_LABEL = { recebido:'🔥 Preparar', preparando:'🛵 Saiu', saiu:'✅ Entregue', entregue: null };

function renderKanban() {
  KANBAN_STATUSES.forEach(status => {
    const orders = state.deliveryOrders.filter(o => o.status === status);
    document.getElementById(`count-${status}`).textContent = orders.length;
    const container = document.getElementById(`items-${status}`);
    if (orders.length === 0) { container.innerHTML = '<div class="empty-state small">Nenhum pedido</div>'; return; }
    container.innerHTML = orders.map(o => {
      const nextLabel = KANBAN_NEXT_LABEL[o.status];
      const itemsStr = o.items.map(i => `${i.qty}x ${i.name}`).join(', ');
      return `
        <div class="kanban-card" onclick="openPedidoModal(${o.id})">
          <div class="kanban-card-header"><span class="kanban-card-id">${fmtId(o.id)}</span><span class="kanban-card-time">${timeAgo(o.createdAt)}</span></div>
          <div class="kanban-card-name">${o.cliente}</div>
          <div class="kanban-card-addr">📍 ${o.endereco}</div>
          <div class="kanban-card-items">${itemsStr}</div>
          <div class="kanban-card-footer">
            <span class="kanban-card-total">${fmt(o.total)}</span>
            <div style="display:flex;gap:4px">
              <button class="kanban-print-btn" onclick="printDeliveryComanda(event,${o.id})">🖨️</button>
              ${nextLabel ? `<button class="kanban-advance-btn" onclick="advanceOrder(event,${o.id})">${nextLabel}</button>`
                          : `<button class="kanban-advance-btn" disabled>Concluído</button>`}
            </div>
          </div>
        </div>`;
    }).join('');
  });
  updateBadges();
}

function advanceOrder(event, orderId) {
  event.stopPropagation();
  const order = state.deliveryOrders.find(o => o.id === orderId); if (!order) return;
  const idx = KANBAN_STATUSES.indexOf(order.status);
  if (idx < KANBAN_STATUSES.length - 1) {
    order.status = KANBAN_STATUSES[idx + 1];
    if (order.status === 'entregue') {
      state.faturamento += order.total;
      state.concluidos++;
      // Track sales
      order.items.forEach(i => trackItemSale(i, state.selectedPayment || 'dinheiro'));
      updatePaymentTotal(order.total, state.selectedPayment || 'dinheiro');
      soundDone();
    } else {
      soundAdvance();
    }
    renderKanban(); renderDashboard(); saveState();
    const labels = { preparando:'Em preparo 🔥', saiu:'Saiu para entrega 🛵', entregue:'Entregue ✅' };
    toast(`Pedido ${fmtId(order.id)}: ${labels[order.status]}`, 'info');
  }
}

function openPedidoModal(orderId) {
  const o = state.deliveryOrders.find(o => o.id === orderId); if (!o) return;
  const modal = document.getElementById('modal-pedido');
  document.getElementById('modal-pedido-title').textContent = `Pedido ${fmtId(o.id)} — ${o.cliente}`;
  const SC = { recebido:'#f39c12', preparando:'#e74c3c', saiu:'#4f8ef7', entregue:'#2ecc71' };
  const SL = { recebido:'⏳ Recebido', preparando:'🔥 Preparando', saiu:'🛵 Saiu', entregue:'✅ Entregue' };
  document.getElementById('modal-pedido-body').innerHTML = `
    <div class="pedido-detail-info">
      <div class="pedido-info-item"><div class="pedido-info-label">Cliente</div><div class="pedido-info-value">${o.cliente}</div></div>
      <div class="pedido-info-item"><div class="pedido-info-label">Telefone</div><div class="pedido-info-value">${o.telefone||'—'}</div></div>
      <div class="pedido-info-item" style="grid-column:1/-1"><div class="pedido-info-label">Endereço</div><div class="pedido-info-value">${o.endereco}</div></div>
      ${o.observacoes?`<div class="pedido-info-item" style="grid-column:1/-1"><div class="pedido-info-label">Obs</div><div class="pedido-info-value">${o.observacoes}</div></div>`:''}
      <div class="pedido-info-item"><div class="pedido-info-label">Status</div><div class="pedido-info-value" style="color:${SC[o.status]}">${SL[o.status]}</div></div>
      <div class="pedido-info-item"><div class="pedido-info-label">Horário</div><div class="pedido-info-value">${new Date(o.createdAt).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</div></div>
    </div>
    <h3 class="form-section-title">Itens</h3>
    <ul class="pedido-detail-items">
      ${o.items.map(i=>`<li><span>${i.qty}x ${i.emoji} ${i.name}</span><span style="color:var(--primary)">${fmt(i.price*i.qty)}</span></li>`).join('')}
      <li style="font-weight:800"><span>Total</span><span style="color:var(--primary)">${fmt(o.total)}</span></li>
    </ul>`;
  const nextLabel = KANBAN_NEXT_LABEL[o.status];
  document.getElementById('modal-pedido-footer').innerHTML = `
    <button class="btn btn-secondary" onclick="closeModal('modal-pedido')">Fechar</button>
    <button class="btn btn-secondary" onclick="printDeliveryComanda(event,${o.id})">🖨️ Imprimir</button>
    ${nextLabel && o.status !== 'entregue' ? `<button class="btn btn-primary" onclick="advanceFromModal(${o.id})">${nextLabel}</button>` : ''}`;
  modal.style.display = 'flex';
}

function advanceFromModal(orderId) {
  advanceOrder({ stopPropagation: ()=>{} }, orderId);
  closeModal('modal-pedido');
  if (state.deliveryOrders.find(o=>o.id===orderId)) openPedidoModal(orderId);
}

// ==================== MESAS ====================
let mesaActiveCat = 'all';
state.selectedMesa = state.selectedMesa || null;

function renderMesas() {
  updateClientesDatalist('mesa');
  const grid = document.getElementById('mesas-grid');
  grid.innerHTML = state.mesas.map(m => {
    const numComandas = m.comandas ? m.comandas.length : 0;
    const total = (m.comandas || []).reduce((st, c) => st + (c.items||[]).reduce((s,i) => s+i.price*i.qty, 0), 0);
    const isOccupied = numComandas > 0;
    return `
      <div class="mesa-card ${isOccupied ? 'occupied' : 'free'} ${state.selectedMesa===m.id?'selected':''}" onclick="selectMesa(${m.id})" id="mesa-card-${m.id}">
        <div class="mesa-icon">${!isOccupied ? '🪑' : '👥'}</div>
        <div class="mesa-num">Mesa ${m.id}</div>
        <div class="mesa-status-text">${!isOccupied ? 'Livre' : 'Ocupada'}</div>
        ${isOccupied ? `<div class="mesa-comanda-badge">${numComandas} comanda(s)</div><div class="mesa-total">${fmt(total)}</div>` : ''}
      </div>`;
  }).join('');
  updateBadges();
}

function selectMesa(id) {
  state.selectedMesa = id;
  const mesa = state.mesas.find(m => m.id === id);
  if (mesa && mesa.comandas && mesa.comandas.length > 0) {
    if (!mesa.selectedComandaId || !mesa.comandas.some(c => c.id === mesa.selectedComandaId)) {
      mesa.selectedComandaId = mesa.comandas[0].id;
    }
  }
  renderMesas();
  renderMesaDetail();
}

function renderMesaDetail() {
  const mesa = state.mesas.find(m => m.id === state.selectedMesa); if (!mesa) return;
  document.getElementById('mesa-detail-empty').style.display = 'none';
  document.getElementById('mesa-detail-content').style.display = 'block';
  document.getElementById('mesa-detail-title').textContent = `Mesa ${mesa.id}`;
  const isOccupied = mesa.comandas && mesa.comandas.length > 0;
  const badge = document.getElementById('mesa-status-badge');
  badge.textContent = !isOccupied ? 'Livre' : `Ocupada (${mesa.comandas.length} comanda${mesa.comandas.length>1?'s':''})`;
  badge.className = `mesa-status-badge ${!isOccupied ? 'free' : 'occupied'}`;

  document.getElementById('mesa-open-form').style.display = 'block';
  const btnOpen = document.querySelector('#mesa-open-form button');
  if (btnOpen) btnOpen.textContent = isOccupied ? '+ Abrir Mais Uma Comanda nesta Mesa' : '+ Abrir Comanda nesta Mesa';

  document.getElementById('mesa-active-content').style.display = isOccupied ? 'block' : 'none';
  if (isOccupied) renderMesaActive(mesa);
}

function renderMesaActive(mesa) {
  const tabsEl = document.getElementById('mesa-comandas-tabs');
  const totalMesa = mesa.comandas.reduce((st, c) => st + (c.items||[]).reduce((s,i)=>s+i.price*i.qty, 0), 0);

  tabsEl.innerHTML = mesa.comandas.map(c => {
    const cTotal = (c.items||[]).reduce((s,i)=>s+i.price*i.qty, 0);
    const isActive = c.id === mesa.selectedComandaId;
    return `<button class="comanda-tab ${isActive ? 'active' : ''}" onclick="selectComandaTab(${c.id})">
      <span>📋 ${c.nome}</span>
      <span style="font-weight:800;color:var(--primary)">${fmt(cTotal)}</span>
    </button>`;
  }).join('') + `<button class="comanda-tab-add" onclick="focusMesaOpenForm()">+ Nova Comanda</button>`;

  const currentComanda = mesa.comandas.find(c => c.id === mesa.selectedComandaId) || mesa.comandas[0];
  if (currentComanda) {
    mesa.selectedComandaId = currentComanda.id;
    const elapsed = currentComanda.openTime ? Math.floor((Date.now() - currentComanda.openTime)/60000) : 0;
    const cTotal = (currentComanda.items||[]).reduce((s,i)=>s+i.price*i.qty, 0);

    document.getElementById('mesa-info-cliente').textContent = `👤 Comanda: ${currentComanda.nome}`;
    document.getElementById('mesa-info-tempo').textContent = `⏱ ${elapsed} min`;
    document.getElementById('mesa-info-subtotal').textContent = `Subtotal: ${fmt(cTotal)}`;
    document.getElementById('mesa-info-total-mesa').textContent = `Total Mesa: ${fmt(totalMesa)}`;
    document.getElementById('mesa-comanda-cart-title').textContent = `Itens: ${currentComanda.nome}`;

    renderMesaMenu();
    renderMesaComandaList(currentComanda);
  }
}

function selectComandaTab(comandaId) {
  const mesa = state.mesas.find(m => m.id === state.selectedMesa);
  if (!mesa) return;
  mesa.selectedComandaId = comandaId;
  renderMesaDetail();
}

function focusMesaOpenForm() {
  const input = document.getElementById('mesa-cliente');
  input.focus();
  input.scrollIntoView({ behavior: 'smooth' });
}

function renderMesaMenu() {
  const grid = document.getElementById('mesa-menu-grid');
  const items = mesaActiveCat === 'all' ? state.menu : state.menu.filter(m => m.cat === mesaActiveCat);
  grid.innerHTML = items.map(item => `
    <button class="menu-item-btn" onclick="addToMesaCart(${item.id})">
      <span class="menu-item-emoji">${item.emoji}</span>
      <span class="menu-item-name">${item.name}</span>
      <span class="menu-item-price">${fmt(item.price)}</span>
    </button>`).join('');
}

document.getElementById('mesa-cat-tabs').addEventListener('click', e => {
  const tab = e.target.closest('.cat-tab'); if (!tab) return;
  mesaActiveCat = tab.dataset.cat;
  document.querySelectorAll('#mesa-cat-tabs .cat-tab').forEach(t => t.classList.remove('active'));
  tab.classList.add('active');
  renderMesaMenu();
});

function addToMesaCart(itemId) {
  const mesa = state.mesas.find(m => m.id === state.selectedMesa);
  if (!mesa || !mesa.comandas || mesa.comandas.length === 0) return;
  const comanda = mesa.comandas.find(c => c.id === mesa.selectedComandaId) || mesa.comandas[0];
  if (!comanda) return;
  const mi = state.menu.find(m => m.id === itemId); if (!mi) return;
  if (!comanda.items) comanda.items = [];
  const existing = comanda.items.find(c => c.id === itemId);
  if (existing) existing.qty++; else comanda.items.push({ ...mi, qty: 1 });
  renderMesaActive(mesa); renderMesas(); saveState();
  toast(`${mi.emoji} ${mi.name} → ${comanda.nome}`, 'success');
}

function renderMesaComandaList(comanda) {
  const list = document.getElementById('mesa-cart-list');
  const totalEl = document.getElementById('mesa-cart-total');
  if (!comanda.items || comanda.items.length === 0) {
    list.innerHTML = '<div class="empty-state small">Nenhum item nesta comanda</div>';
    totalEl.style.display = 'none'; return;
  }
  list.innerHTML = comanda.items.map(item => `
    <div class="cart-item">
      <span>${item.emoji}</span>
      <span class="cart-item-name">${item.name}</span>
      <div class="cart-item-qty">
        <button class="qty-btn" onclick="changeMesaQty(${item.id},-1)">−</button>
        <span class="qty-value">${item.qty}</span>
        <button class="qty-btn" onclick="changeMesaQty(${item.id},1)">+</button>
      </div>
      <span class="cart-item-price">${fmt(item.price*item.qty)}</span>
      <button class="cart-item-remove" onclick="removeMesaItem(${item.id})">✕</button>
    </div>`).join('');
  const total = comanda.items.reduce((s,i) => s+i.price*i.qty, 0);
  document.getElementById('mesa-total-value').textContent = fmt(total);
  totalEl.style.display = 'flex';
}

function changeMesaQty(itemId, delta) {
  const mesa = state.mesas.find(m => m.id === state.selectedMesa); if (!mesa) return;
  const comanda = mesa.comandas.find(c => c.id === mesa.selectedComandaId); if (!comanda) return;
  const item = comanda.items.find(i => i.id === itemId); if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) removeMesaItem(itemId); else { renderMesaActive(mesa); renderMesas(); saveState(); }
}
function removeMesaItem(itemId) {
  const mesa = state.mesas.find(m => m.id === state.selectedMesa); if (!mesa) return;
  const comanda = mesa.comandas.find(c => c.id === mesa.selectedComandaId); if (!comanda) return;
  comanda.items = comanda.items.filter(i => i.id !== itemId);
  renderMesaActive(mesa); renderMesas(); saveState();
}

function deleteCurrentComandaIfEmpty() {
  const mesa = state.mesas.find(m => m.id === state.selectedMesa); if (!mesa) return;
  const comanda = mesa.comandas.find(c => c.id === mesa.selectedComandaId); if (!comanda) return;
  if (comanda.items && comanda.items.length > 0) {
    if (!confirm(`A comanda "${comanda.nome}" possui itens. Deseja cancelar sem cobrar?`)) return;
  }
  mesa.comandas = mesa.comandas.filter(c => c.id !== comanda.id);
  if (mesa.comandas.length > 0) {
    mesa.selectedComandaId = mesa.comandas[0].id;
  } else {
    mesa.status = 'free';
    mesa.selectedComandaId = null;
  }
  renderMesas(); renderMesaDetail(); updateBadges(); saveState();
  toast(`Comanda "${comanda.nome}" cancelada.`, 'info');
}

function openMesa() {
  const mesa = state.mesas.find(m => m.id === state.selectedMesa); if (!mesa) return;
  if (!state.caixa.aberto) { toast('⚠️ Abra o caixa antes de atender mesas!', 'warning'); soundWarning(); }
  if (!mesa.comandas) mesa.comandas = [];
  const nomeInput = document.getElementById('mesa-cliente').value.trim();
  const cliente = nomeInput || `Comanda ${mesa.comandas.length + 1}`;
  const pessoas = parseInt(document.getElementById('mesa-pessoas').value) || 1;
  const cId = Date.now() + Math.floor(Math.random() * 1000);
  const newComanda = { id: cId, nome: cliente, pessoas, openTime: Date.now(), items: [] };
  mesa.comandas.push(newComanda);
  mesa.selectedComandaId = cId;
  mesa.status = 'occupied';
  document.getElementById('mesa-cliente').value = '';
  document.getElementById('mesa-pessoas').value = '1';
  renderMesas(); renderMesaDetail(); updateBadges(); saveState();
  soundNewOrder();
  toast(`Comanda "${cliente}" aberta na Mesa ${mesa.id}! 🍽️`, 'success');
}

function callWaiter() {
  const mesa = state.mesas.find(m => m.id === state.selectedMesa); if (!mesa) return;
  soundWarning();
  toast(`🔔 Garçom chamado para Mesa ${mesa.id}!`, 'warning');
}

let fechamentoMode = 'comanda'; // 'comanda' or 'mesa'

function closeMesaModal(mode = 'comanda') {
  const mesa = state.mesas.find(m => m.id === state.selectedMesa);
  if (!mesa || !mesa.comandas || mesa.comandas.length === 0) return;
  fechamentoMode = mode;
  let itemsToPay = [];
  let total = 0;
  let titleStr = '';

  if (mode === 'comanda') {
    const comanda = mesa.comandas.find(c => c.id === mesa.selectedComandaId) || mesa.comandas[0];
    itemsToPay = comanda.items || [];
    total = itemsToPay.reduce((s,i) => s+i.price*i.qty, 0);
    titleStr = `Mesa ${mesa.id} — Comanda "${comanda.nome}"`;
  } else {
    mesa.comandas.forEach(c => { itemsToPay.push(...(c.items||[])); });
    total = itemsToPay.reduce((s,i) => s+i.price*i.qty, 0);
    titleStr = `Mesa ${mesa.id} — Todas as Comandas (${mesa.comandas.length})`;
  }

  const resumo = document.getElementById('fechamento-resumo');
  resumo.innerHTML = `
    <div style="background:var(--bg-card2);border-radius:var(--radius-sm);padding:14px;margin-bottom:14px">
      <div style="font-size:0.76rem;color:var(--text-muted);margin-bottom:7px;text-transform:uppercase;font-weight:700">${titleStr}</div>
      <ul class="pedido-detail-items">
        ${itemsToPay.length > 0 ? itemsToPay.map(i=>`<li><span>${i.qty}x ${i.emoji} ${i.name}</span><span style="color:var(--primary)">${fmt(i.price*i.qty)}</span></li>`).join('') : '<li>Nenhum item adicionado</li>'}
        <li style="font-weight:800"><span>Total a Pagar</span><span style="color:var(--primary)">${fmt(total)}</span></li>
      </ul>
    </div>`;
  document.getElementById('divisao-partes').value = 1;
  document.getElementById('divisao-result').textContent = fmt(total);
  document.getElementById('valor-recebido').value = '';
  document.getElementById('troco-result').style.display = 'none';
  selectPayment('dinheiro');
  document.getElementById('modal-fechamento').style.display = 'flex';
}

function calcDivisao() {
  const mesa = state.mesas.find(m => m.id === state.selectedMesa); if (!mesa) return;
  const partes = parseInt(document.getElementById('divisao-partes').value) || 1;
  let total = 0;
  if (fechamentoMode === 'comanda') {
    const comanda = mesa.comandas.find(c => c.id === mesa.selectedComandaId);
    if (comanda) total = (comanda.items||[]).reduce((s,i) => s+i.price*i.qty, 0);
  } else {
    mesa.comandas.forEach(c => total += (c.items||[]).reduce((s,i) => s+i.price*i.qty, 0));
  }
  document.getElementById('divisao-result').textContent = fmt(total / partes);
}

function selectPayment(method) {
  state.selectedPayment = method;
  ['dinheiro','cartao','pix'].forEach(m => document.getElementById(`pay-${m}`).classList.toggle('active', m===method));
  document.getElementById('troco-section').style.display = method==='dinheiro' ? 'block' : 'none';
  document.getElementById('troco-result').style.display = 'none';
}

function calcTroco() {
  const mesa = state.mesas.find(m => m.id === state.selectedMesa); if (!mesa) return;
  let total = 0;
  if (fechamentoMode === 'comanda') {
    const comanda = mesa.comandas.find(c => c.id === mesa.selectedComandaId);
    if (comanda) total = (comanda.items||[]).reduce((s,i) => s+i.price*i.qty, 0);
  } else {
    mesa.comandas.forEach(c => total += (c.items||[]).reduce((s,i) => s+i.price*i.qty, 0));
  }
  const recebido = parseFloat(document.getElementById('valor-recebido').value) || 0;
  const troco = recebido - total;
  const trocoEl = document.getElementById('troco-result');
  if (recebido > 0) {
    trocoEl.style.display = 'block';
    trocoEl.textContent = troco >= 0 ? `Troco: ${fmt(troco)}` : `⚠️ Valor insuficiente (falta ${fmt(Math.abs(troco))})`;
    trocoEl.style.color = troco >= 0 ? 'var(--accent-green)' : 'var(--accent-red)';
  }
}

function confirmFechamento() {
  const mesa = state.mesas.find(m => m.id === state.selectedMesa); if (!mesa) return;
  let itemsPaid = [];
  let totalPaid = 0;

  if (fechamentoMode === 'comanda') {
    const comanda = mesa.comandas.find(c => c.id === mesa.selectedComandaId);
    if (comanda) {
      itemsPaid = comanda.items || [];
      totalPaid = itemsPaid.reduce((s,i) => s+i.price*i.qty, 0);
      mesa.comandas = mesa.comandas.filter(c => c.id !== comanda.id);
      if (mesa.comandas.length > 0) {
        mesa.selectedComandaId = mesa.comandas[0].id;
      } else {
        mesa.status = 'free';
        mesa.selectedComandaId = null;
      }
    }
  } else {
    mesa.comandas.forEach(c => itemsPaid.push(...(c.items||[])));
    totalPaid = itemsPaid.reduce((s,i) => s+i.price*i.qty, 0);
    mesa.comandas = [];
    mesa.status = 'free';
    mesa.selectedComandaId = null;
  }

  state.faturamento += totalPaid;
  state.concluidos++;
  itemsPaid.forEach(i => trackItemSale(i, state.selectedPayment));
  updatePaymentTotal(totalPaid, state.selectedPayment);
  const payLabels = { dinheiro:'💵 Dinheiro', cartao:'💳 Cartão', pix:'📱 PIX' };
  toast(`Pagamento de ${fmt(totalPaid)} (${payLabels[state.selectedPayment]}) concluído! ✅`, 'success');
  soundDone();

  closeModal('modal-fechamento');
  renderMesas(); renderMesaDetail(); updateBadges(); renderDashboard(); saveState();
}


// ==================== SALES TRACKING ====================
function trackItemSale(item, payment) {
  if (!state.itemSales[item.id]) state.itemSales[item.id] = { name: item.name, emoji: item.emoji, cat: item.cat, qty: 0, revenue: 0 };
  state.itemSales[item.id].qty += item.qty;
  state.itemSales[item.id].revenue += item.price * item.qty;
  if (!state.catSales) state.catSales = { pizzas:0, lanches:0, bebidas:0, sobremesas:0 };
  state.catSales[item.cat] = (state.catSales[item.cat] || 0) + item.price * item.qty;
}

function updatePaymentTotal(amount, method) {
  if (!state.caixa.paymentTotals) state.caixa.paymentTotals = { dinheiro:0, cartao:0, pix:0 };
  if (!state.caixa.paymentCounts) state.caixa.paymentCounts = { dinheiro:0, cartao:0, pix:0 };
  state.caixa.paymentTotals[method] = (state.caixa.paymentTotals[method] || 0) + amount;
  state.caixa.paymentCounts[method] = (state.caixa.paymentCounts[method] || 0) + 1;
}

// ==================== CAIXA ====================
function renderCaixa() {
  const cPanel = document.getElementById('caixa-closed-panel');
  const oPanel = document.getElementById('caixa-open-panel');
  if (!state.caixa.aberto) {
    cPanel.style.display = 'block'; oPanel.style.display = 'none';
  } else {
    cPanel.style.display = 'none'; oPanel.style.display = 'block';
    const pt = state.caixa.paymentTotals || {};
    const entradas = state.deliveryOrders.filter(o => o.status === 'entregue').reduce((s,o) => s+o.total, 0)
      + state.mesas.filter(m => m.status === 'free').reduce((s,m) => s, 0); // already in faturamento
    const lancEntradas = state.caixa.lancamentos.filter(l => l.tipo==='entrada').reduce((s,l)=>s+l.valor,0);
    const lancSaidas   = state.caixa.lancamentos.filter(l => l.tipo==='saida').reduce((s,l)=>s+l.valor,0);
    const saldo = (state.caixa.valorAbertura||0) + state.faturamento + lancEntradas - lancSaidas;
    document.getElementById('caixa-kpi-abertura').textContent = fmt(state.caixa.valorAbertura||0);
    document.getElementById('caixa-kpi-entradas').textContent = fmt(state.faturamento + lancEntradas);
    document.getElementById('caixa-kpi-saidas').textContent = fmt(lancSaidas);
    document.getElementById('caixa-kpi-saldo').textContent = fmt(saldo);
    // Lancamentos list
    const lancList = document.getElementById('caixa-lancamentos-list');
    const allLanc = [
      { tipo:'entrada', desc:`Abertura de caixa`, valor: state.caixa.valorAbertura||0, hora: state.caixa.horaAbertura||'--:--' },
      { tipo:'entrada', desc:`Vendas acumuladas`, valor: state.faturamento, hora: nowTimeStr() },
      ...state.caixa.lancamentos,
    ];
    lancList.innerHTML = allLanc.length === 0 ? '<div class="empty-state">Nenhum lançamento</div>'
      : allLanc.map(l => `
          <div class="lancamento-item ${l.tipo}">
            <span class="lancamento-desc">${l.desc}</span>
            <span class="lancamento-time">${l.hora}</span>
            <span class="lancamento-val ${l.tipo}">${l.tipo==='entrada'?'+':'-'}${fmt(l.valor)}</span>
          </div>`).join('');
    // Payment summary
    renderPaymentSummary('payment-summary', state.caixa.paymentTotals||{}, state.caixa.paymentCounts||{});
  }
}

function renderPaymentSummary(elId, totals, counts) {
  const el = document.getElementById(elId);
  if (!el) return;
  const items = [
    { k:'dinheiro', icon:'💵', label:'Dinheiro' },
    { k:'cartao',   icon:'💳', label:'Cartão' },
    { k:'pix',      icon:'📱', label:'PIX' },
  ];
  el.innerHTML = items.map(({k,icon,label}) => `
    <div class="payment-summary-item">
      <div class="payment-summary-icon">${icon}</div>
      <div class="payment-summary-label">${label}</div>
      <div class="payment-summary-val">${fmt(totals[k]||0)}</div>
      <div class="payment-summary-count">${counts[k]||0} pedidos</div>
    </div>`).join('');
}

function abrirCaixa() {
  const val = parseFloat(document.getElementById('caixa-abertura-valor').value) || 0;
  state.caixa.aberto = true;
  state.caixa.valorAbertura = val;
  state.caixa.horaAbertura = nowTimeStr();
  state.caixa.lancamentos = [];
  saveState(); renderCaixa(); updateBadges();
  soundCaixa();
  toast(`Caixa aberto com ${fmt(val)}! 🔓`, 'success');
}

function fecharCaixa() {
  if (!confirm('Deseja realmente fechar o caixa?')) return;
  state.caixa.aberto = false;
  saveState(); renderCaixa(); updateBadges();
  soundCaixa();
  toast('Caixa fechado! 🔒', 'info');
}

let lancamentoTipo = 'entrada';
function openLancamento(tipo) {
  lancamentoTipo = tipo;
  document.getElementById('lancamento-title').textContent = tipo === 'entrada' ? '💵 Reforço de Caixa' : '💸 Sangria de Caixa';
  document.getElementById('lancamento-desc').value = '';
  document.getElementById('lancamento-valor').value = '';
  document.getElementById('modal-lancamento').style.display = 'flex';
}

function confirmLancamento() {
  const desc  = document.getElementById('lancamento-desc').value.trim() || (lancamentoTipo==='entrada'?'Reforço':'Sangria');
  const valor = parseFloat(document.getElementById('lancamento-valor').value) || 0;
  if (valor <= 0) { toast('Informe um valor válido!', 'error'); return; }
  state.caixa.lancamentos.push({ tipo: lancamentoTipo, desc, valor, hora: nowTimeStr() });
  saveState(); closeModal('modal-lancamento'); renderCaixa();
  toast(`Lançamento registrado: ${fmt(valor)}`, 'success');
}

// ==================== CLIENTES ====================
function renderClientes() {
  const search = (document.getElementById('clientes-search')?.value || '').toLowerCase();
  const clientes = state.clientes.filter(c =>
    c.nome.toLowerCase().includes(search) || (c.telefone||'').includes(search)
  );
  const tbody = document.getElementById('clientes-tbody');
  const empty = document.getElementById('clientes-empty');
  if (clientes.length === 0) {
    tbody.innerHTML = ''; empty.style.display = 'block'; return;
  }
  empty.style.display = 'none';
  tbody.innerHTML = clientes.map(c => {
    const pedidos = state.deliveryOrders.filter(o => o.cliente === c.nome);
    const gasto = pedidos.reduce((s,o) => s+o.total, 0);
    return `
      <tr>
        <td style="font-weight:600">${c.nome}</td>
        <td>${c.telefone||'—'}</td>
        <td style="color:var(--text-muted)">${c.endereco||'—'}</td>
        <td style="text-align:center"><span style="background:var(--primary-glow);color:var(--primary);padding:2px 10px;border-radius:99px;font-weight:700;font-size:0.8rem">${pedidos.length}</span></td>
        <td style="font-weight:700;color:var(--primary)">${fmt(gasto)}</td>
        <td><div class="actions">
          <button class="btn-icon" onclick="openClienteModal(${c.id})" title="Editar">✏️</button>
          <button class="btn-icon danger" onclick="deleteCliente(${c.id})" title="Excluir">🗑️</button>
        </div></td>
      </tr>`;
  }).join('');
}

let editingClienteId = null;
function openClienteModal(id) {
  editingClienteId = id || null;
  const modal = document.getElementById('modal-cliente');
  document.getElementById('modal-cliente-title').textContent = id ? 'Editar Cliente' : 'Novo Cliente';
  if (id) {
    const c = state.clientes.find(c => c.id === id);
    if (c) {
      document.getElementById('cli-nome').value = c.nome || '';
      document.getElementById('cli-tel').value  = c.telefone || '';
      document.getElementById('cli-end').value  = c.endereco || '';
      document.getElementById('cli-obs').value  = c.obs || '';
      // Historico
      const pedidos = state.deliveryOrders.filter(o => o.cliente === c.nome);
      if (pedidos.length > 0) {
        document.getElementById('cli-historico').style.display = 'block';
        document.getElementById('cli-historico-list').innerHTML = pedidos.slice(-5).reverse().map(p => `
          <div class="cliente-historico-item">
            <span>${fmtId(p.id)} · ${new Date(p.createdAt).toLocaleDateString('pt-BR')} · ${p.items.map(i=>`${i.qty}x ${i.name}`).join(', ')}</span>
            <span style="font-weight:800;color:var(--primary)">${fmt(p.total)}</span>
          </div>`).join('');
      } else { document.getElementById('cli-historico').style.display = 'none'; }
    }
  } else {
    ['cli-nome','cli-tel','cli-end','cli-obs'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('cli-historico').style.display = 'none';
  }
  modal.style.display = 'flex';
}

function saveCliente() {
  const nome = document.getElementById('cli-nome').value.trim();
  if (!nome) { toast('Informe o nome!', 'error'); return; }
  const data = {
    nome, telefone: document.getElementById('cli-tel').value.trim(),
    endereco: document.getElementById('cli-end').value.trim(),
    obs: document.getElementById('cli-obs').value.trim(),
  };
  if (editingClienteId) {
    const c = state.clientes.find(c => c.id === editingClienteId);
    if (c) Object.assign(c, data);
  } else {
    state.clientes.push({ id: state.clienteCounter++, ...data });
  }
  saveState(); closeModal('modal-cliente'); renderClientes();
  toast('Cliente salvo!', 'success');
}

function deleteCliente(id) {
  if (!confirm('Excluir este cliente?')) return;
  state.clientes = state.clientes.filter(c => c.id !== id);
  saveState(); renderClientes();
  toast('Cliente removido.', 'info');
}

function upsertCliente({ nome, telefone, endereco }) {
  if (!nome) return;
  const existing = state.clientes.find(c => c.nome.toLowerCase() === nome.toLowerCase());
  if (!existing) {
    state.clientes.push({ id: state.clienteCounter++, nome, telefone: telefone||'', endereco: endereco||'', obs: '' });
  } else {
    if (telefone && !existing.telefone) existing.telefone = telefone;
    if (endereco && !existing.endereco) existing.endereco = endereco;
  }
}

function updateClientesDatalist(suffix='') {
  const id = suffix ? `clientes-datalist-${suffix}` : 'clientes-datalist';
  const dl = document.getElementById(id); if (!dl) return;
  dl.innerHTML = state.clientes.map(c => `<option value="${c.nome}">`).join('');
}

function autocompleteCliente(value, context='') {
  const c = state.clientes.find(c => c.nome.toLowerCase() === value.toLowerCase());
  if (!c) return;
  if (context === 'mesa') {
    // just name is enough for mesa
  } else {
    if (c.telefone) document.getElementById('del-tel').value = c.telefone;
    if (c.endereco) document.getElementById('del-end').value = c.endereco;
  }
}

// ==================== CARDÁPIO CRUD ====================
let cardapioActiveCat = 'all';
let editingMenuItemId = null;

function renderCardapio() {
  const items = cardapioActiveCat === 'all' ? state.menu : state.menu.filter(m => m.cat === cardapioActiveCat);
  const grid = document.getElementById('cardapio-grid');
  grid.innerHTML = items.map(item => `
    <div class="menu-display-item">
      <div class="menu-display-emoji">${item.emoji}</div>
      <span class="menu-display-cat cat-${item.cat}">${catLabel(item.cat)}</span>
      <div class="menu-display-name">${item.name}</div>
      <div class="menu-display-desc">${item.desc}</div>
      <div class="menu-display-price">${fmt(item.price)}</div>
      <div class="menu-item-actions">
        <button class="btn-icon" onclick="openMenuItemModal(${item.id})" title="Editar">✏️ Editar</button>
        <button class="btn-icon danger" onclick="deleteMenuItem(${item.id})" title="Excluir">🗑️</button>
      </div>
    </div>`).join('');
}

function catLabel(cat) { return { pizzas:'🍕 Pizza', lanches:'🍔 Lanche', bebidas:'🥤 Bebida', sobremesas:'🍰 Sobremesa' }[cat]||cat; }

document.getElementById('cardapio-tabs').addEventListener('click', e => {
  const tab = e.target.closest('.cat-tab'); if (!tab) return;
  cardapioActiveCat = tab.dataset.cat;
  document.querySelectorAll('#cardapio-tabs .cat-tab').forEach(t => t.classList.remove('active'));
  tab.classList.add('active');
  renderCardapio();
});

function openMenuItemModal(id) {
  editingMenuItemId = id || null;
  document.getElementById('menu-item-title').textContent = id ? 'Editar Item' : 'Novo Item';
  if (id) {
    const item = state.menu.find(m => m.id === id);
    if (item) {
      document.getElementById('mi-emoji').value = item.emoji;
      document.getElementById('mi-cat').value   = item.cat;
      document.getElementById('mi-nome').value  = item.name;
      document.getElementById('mi-desc').value  = item.desc;
      document.getElementById('mi-preco').value = item.price;
    }
  } else {
    document.getElementById('mi-emoji').value = '🍕';
    document.getElementById('mi-cat').value   = 'pizzas';
    ['mi-nome','mi-desc','mi-preco'].forEach(id => document.getElementById(id).value = '');
  }
  document.getElementById('modal-menu-item').style.display = 'flex';
}

function saveMenuItem() {
  const emoji = document.getElementById('mi-emoji').value.trim() || '🍽️';
  const cat   = document.getElementById('mi-cat').value;
  const name  = document.getElementById('mi-nome').value.trim();
  const desc  = document.getElementById('mi-desc').value.trim();
  const price = parseFloat(document.getElementById('mi-preco').value) || 0;
  if (!name) { toast('Informe o nome do item!', 'error'); return; }
  if (price <= 0) { toast('Informe um preço válido!', 'error'); return; }
  if (editingMenuItemId) {
    const item = state.menu.find(m => m.id === editingMenuItemId);
    if (item) Object.assign(item, { emoji, cat, name, desc, price });
  } else {
    state.menu.push({ id: ++state.menuCounter, emoji, cat, name, desc, price });
  }
  saveState(); closeModal('modal-menu-item'); renderCardapio();
  toast(`Item ${name} salvo!`, 'success');
}

function deleteMenuItem(id) {
  if (!confirm('Excluir este item do cardápio?')) return;
  state.menu = state.menu.filter(m => m.id !== id);
  saveState(); renderCardapio();
  toast('Item removido.', 'info');
}

// ==================== RELATÓRIOS ====================
function renderRelatorios() {
  // Vendas por hora
  drawRelChart();
  // Categoria pie
  drawCatChart();
  // Ranking
  renderRanking();
  // Payment summary
  renderPaymentSummary('rel-payment-summary', state.caixa.paymentTotals||{}, state.caixa.paymentCounts||{});
  // Resumo geral
  const totalPedidos = state.deliveryOrders.filter(o=>o.status==='entregue').length + state.concluidos;
  const avgTicket    = state.concluidos > 0 ? state.faturamento / state.concluidos : 0;
  const occupiedNow  = state.mesas.filter(m=>m.status==='occupied').length;
  document.getElementById('resumo-geral').innerHTML = `
    <div class="resumo-item"><div class="resumo-label">Faturamento Total</div><div class="resumo-value" style="color:var(--primary)">${fmt(state.faturamento)}</div></div>
    <div class="resumo-item"><div class="resumo-label">Pedidos Concluídos</div><div class="resumo-value">${state.concluidos}</div></div>
    <div class="resumo-item"><div class="resumo-label">Ticket Médio</div><div class="resumo-value" style="color:var(--accent-green)">${fmt(avgTicket)}</div></div>
    <div class="resumo-item"><div class="resumo-label">Mesas Abertas Agora</div><div class="resumo-value">${occupiedNow}</div></div>
    <div class="resumo-item"><div class="resumo-label">Itens no Cardápio</div><div class="resumo-value">${state.menu.length}</div></div>
    <div class="resumo-item"><div class="resumo-label">Clientes Cadastrados</div><div class="resumo-value">${state.clientes.length}</div></div>`;
}

function drawRelChart() {
  const canvas = document.getElementById('rel-chart-hora'); if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.parentElement.clientWidth || 600; const H = 220;
  canvas.width = W; canvas.height = H;
  const data = state.hourlyData;
  const maxVal = Math.max(...data, 5);
  const pad = {top:20,right:16,bottom:34,left:34};
  const cW = W-pad.left-pad.right; const cH = H-pad.top-pad.bottom;
  const barW = cW/data.length;
  ctx.clearRect(0,0,W,H);
  ctx.strokeStyle='rgba(255,255,255,0.05)'; ctx.lineWidth=1;
  for(let i=0;i<=4;i++){
    const y=pad.top+(cH/4)*i; ctx.beginPath(); ctx.moveTo(pad.left,y); ctx.lineTo(W-pad.right,y); ctx.stroke();
    ctx.fillStyle='rgba(144,144,176,0.6)'; ctx.font='10px Inter'; ctx.textAlign='right';
    ctx.fillText(Math.round(maxVal-(maxVal/4)*i),pad.left-5,y+4);
  }
  data.forEach((val,i)=>{
    const barH=(val/maxVal)*cH; const x=pad.left+i*barW+barW*0.1; const y=pad.top+cH-barH; const bw=barW*0.8;
    ctx.fillStyle='rgba(255,255,255,0.03)'; ctx.beginPath(); ctx.roundRect(x,pad.top,bw,cH,4); ctx.fill();
    const g=ctx.createLinearGradient(0,y,0,pad.top+cH); g.addColorStop(0,'#ff6b35'); g.addColorStop(1,'#e8439a');
    ctx.fillStyle=g; ctx.beginPath(); ctx.roundRect(x,y,bw,barH,[4,4,0,0]); ctx.fill();
    ctx.fillStyle='rgba(144,144,176,0.7)'; ctx.font='10px Inter'; ctx.textAlign='center';
    ctx.fillText(getHourLabel(11-i),x+bw/2,H-5);
  });
}

function drawCatChart() {
  const canvas = document.getElementById('rel-chart-cat'); if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.parentElement.clientWidth || 300; const H = 220;
  canvas.width = W; canvas.height = H;
  const cats = state.catSales || {};
  const colors = { pizzas:'#ff6b35', lanches:'#f39c12', bebidas:'#4f8ef7', sobremesas:'#e8439a' };
  const labels = { pizzas:'Pizzas', lanches:'Lanches', bebidas:'Bebidas', sobremesas:'Sobremesas' };
  const data = Object.entries(cats).filter(([,v])=>v>0);
  const total = data.reduce((s,[,v])=>s+v,0);
  if (total === 0) {
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle='rgba(144,144,176,0.4)'; ctx.font='14px Inter'; ctx.textAlign='center';
    ctx.fillText('Sem dados ainda', W/2, H/2); return;
  }
  const cx=W/2, cy=H/2, r=Math.min(cx,cy)-20;
  let startAngle = -Math.PI/2;
  ctx.clearRect(0,0,W,H);
  data.forEach(([cat,val]) => {
    const slice = (val/total)*Math.PI*2;
    ctx.beginPath(); ctx.moveTo(cx,cy); ctx.arc(cx,cy,r,startAngle,startAngle+slice);
    ctx.fillStyle=colors[cat]; ctx.fill();
    ctx.strokeStyle=W>200?'rgba(15,15,28,0.8)':'transparent'; ctx.lineWidth=3; ctx.stroke();
    startAngle+=slice;
  });
  // Center hole
  ctx.beginPath(); ctx.arc(cx,cy,r*0.5,'rgba(15,15,28,1)','rgba(15,15,28,1)');
  ctx.fillStyle='#16162a'; ctx.fill();
  ctx.fillStyle='rgba(240,240,248,0.8)'; ctx.font='bold 11px Inter'; ctx.textAlign='center';
  ctx.fillText(fmt(total),cx,cy+4);
  // Legend
  const legendEl = document.getElementById('cat-legend');
  if (legendEl) {
    legendEl.innerHTML = data.map(([cat,val])=>`
      <div class="cat-legend-item">
        <span class="cat-legend-dot" style="background:${colors[cat]}"></span>
        ${labels[cat]}: <strong>${fmt(val)}</strong>
      </div>`).join('');
  }
}

function renderRanking() {
  const el = document.getElementById('ranking-list');
  const sales = Object.values(state.itemSales||{}).sort((a,b)=>b.qty-a.qty).slice(0,10);
  if (sales.length === 0) { el.innerHTML = '<div class="empty-state">Nenhuma venda ainda</div>'; return; }
  const maxQty = sales[0].qty;
  const medals = ['🥇','🥈','🥉'];
  el.innerHTML = sales.map((s,i) => `
    <div class="ranking-item">
      <span class="ranking-pos ${i===0?'gold':i===1?'silver':i===2?'bronze':''}">${medals[i]||`${i+1}º`}</span>
      <span class="ranking-emoji">${s.emoji}</span>
      <span class="ranking-name">${s.name}</span>
      <div class="ranking-bar-wrap"><div class="ranking-bar" style="width:${(s.qty/maxQty)*100}%"></div></div>
      <span class="ranking-qty">${s.qty}x</span>
      <span class="ranking-val">${fmt(s.revenue)}</span>
    </div>`).join('');
}

// ==================== IMPRESSÃO ====================
function buildComandaHTML(titulo, linhas, total, extra='') {
  const now = new Date().toLocaleString('pt-BR');
  return `
    <div style="width:80mm;font-family:'Courier New',monospace;font-size:12px;color:#000;padding:10px">
      <div style="text-align:center;border-bottom:2px dashed #000;padding-bottom:8px;margin-bottom:8px">
        <div style="font-size:16px;font-weight:bold">🍕 PizzaLanche Pro</div>
        <div style="font-size:10px">${now}</div>
        <div style="font-weight:bold;font-size:13px;margin-top:4px">${titulo}</div>
      </div>
      ${extra ? `<div style="margin-bottom:8px;border-bottom:1px dashed #000;padding-bottom:6px">${extra}</div>` : ''}
      <div style="border-bottom:1px dashed #000;padding-bottom:8px;margin-bottom:8px">
        <div style="display:flex;justify-content:space-between;font-weight:bold;margin-bottom:4px">
          <span>ITEM</span><span>TOTAL</span>
        </div>
        ${linhas}
      </div>
      <div style="display:flex;justify-content:space-between;font-weight:bold;font-size:14px">
        <span>TOTAL</span><span>${fmt(total)}</span>
      </div>
      <div style="text-align:center;margin-top:12px;font-size:10px;color:#555">
        Obrigado pela preferência! ❤️
      </div>
    </div>`;
}

function printDeliveryComanda(event, orderId) {
  if (event) event.stopPropagation();
  const o = state.deliveryOrders.find(o => o.id === orderId); if (!o) return;
  const linhas = o.items.map(i =>
    `<div style="display:flex;justify-content:space-between;margin-bottom:2px"><span>${i.qty}x ${i.name}</span><span>${fmt(i.price*i.qty)}</span></div>`
  ).join('');
  const extra = `<div>Cliente: <b>${o.cliente}</b></div><div>Tel: ${o.telefone||'—'}</div><div>End: ${o.endereco}</div>${o.observacoes?`<div>Obs: ${o.observacoes}</div>`:''}`;
  printContent(buildComandaHTML(`DELIVERY ${fmtId(o.id)}`, linhas, o.total, extra));
}

function printMesaComanda(mode = 'comanda') {
  const mesa = state.mesas.find(m => m.id === state.selectedMesa); if (!mesa) return;
  if (!mesa.comandas || mesa.comandas.length === 0) return;

  if (mode === 'comanda') {
    const comanda = mesa.comandas.find(c => c.id === mesa.selectedComandaId) || mesa.comandas[0];
    const total = (comanda.items||[]).reduce((s,i)=>s+i.price*i.qty,0);
    const linhas = (comanda.items||[]).map(i =>
      `<div style="display:flex;justify-content:space-between;margin-bottom:2px"><span>${i.qty}x ${i.name}</span><span>${fmt(i.price*i.qty)}</span></div>`
    ).join('');
    const extra = `<div>Mesa: <b>${mesa.id}</b></div><div>Comanda: <b>${comanda.nome}</b></div><div>Pessoas: ${comanda.pessoas||1}</div>`;
    printContent(buildComandaHTML(`MESA ${mesa.id} — ${comanda.nome}`, linhas, total, extra));
  } else {
    let allLinhas = '';
    let grandTotal = 0;
    mesa.comandas.forEach(c => {
      const cTotal = (c.items||[]).reduce((s,i)=>s+i.price*i.qty,0);
      grandTotal += cTotal;
      allLinhas += `<div style="font-weight:bold;margin-top:6px;border-bottom:1px dashed #000">Comanda: ${c.nome} (${fmt(cTotal)})</div>`;
      allLinhas += (c.items||[]).map(i =>
        `<div style="display:flex;justify-content:space-between;margin-bottom:2px"><span>${i.qty}x ${i.name}</span><span>${fmt(i.price*i.qty)}</span></div>`
      ).join('');
    });
    const extra = `<div>Mesa: <b>${mesa.id}</b> (${mesa.comandas.length} comandas)</div>`;
    printContent(buildComandaHTML(`MESA ${mesa.id} — CONTA TOTAL`, allLinhas, grandTotal, extra));
  }
}

function printContent(html) {
  const w = window.open('', '_blank', 'width=400,height=600,toolbar=0,menubar=0');
  w.document.write(`<!DOCTYPE html><html><head><title>Comanda</title><style>body{margin:0;padding:0;background:#fff}@media print{body{margin:0}}</style></head><body>${html}<script>window.onload=()=>{window.print();setTimeout(()=>window.close(),500)}<\/script></body></html>`);
  w.document.close();
}

// ==================== KITCHEN ====================
function openKitchen() {
  syncKitchen();
  window.open('cozinha.html', '_blank', 'width=1200,height=800');
}

// ==================== MODALS ====================
function closeModal(id) { document.getElementById(id).style.display = 'none'; }
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.style.display = 'none'; });
});

// ==================== DEMO DATA ====================
function loadDemoData() {
  if (state.deliveryOrders.length > 0 || state.faturamento > 0) return; // already has data
  const demoOrders = [
    { nome:'João Silva',      tel:'(11)99999-1234', end:'Rua das Flores, 123', items:[1,13], status:'entregue', pay:'dinheiro' },
    { nome:'Maria Souza',     tel:'(11)98888-5678', end:'Av. Brasil, 456',      items:[7,8,14], status:'preparando', pay:'pix' },
    { nome:'Carlos Oliveira', tel:'(11)97777-9012', end:'Rua Boa Vista, 789',   items:[3,16], status:'recebido', pay:'cartao' },
    { nome:'Ana Lima',        tel:'(11)96666-3456', end:'R. das Acácias, 321',  items:[5,19,17], status:'saiu', pay:'cartao' },
    { nome:'Pedro Nunes',     tel:'(11)95555-7890', end:'Av. Paulista, 1000',   items:[6,20,13], status:'entregue', pay:'pix' },
  ];
  demoOrders.forEach(d => {
    const items = d.items.map(id => ({ ...state.menu.find(m => m.id === id), qty: 1 }));
    const total = items.reduce((s,i)=>s+i.price*i.qty,0);
    const order = { id: state.deliveryCounter++, cliente: d.nome, telefone: d.tel, endereco: d.end, observacoes:'', items, total, status: d.status, createdAt: Date.now()-Math.random()*7200000 };
    if (d.status==='entregue') {
      state.faturamento+=total; state.concluidos++;
      items.forEach(i => trackItemSale(i, d.pay));
      updatePaymentTotal(total, d.pay);
    }
    state.deliveryOrders.push(order);
    upsertCliente({ nome: d.nome, telefone: d.tel, endereco: d.end });
  });

  // Occupied demo mesas
  [2, 5, 8].forEach((mesaId, i) => {
    const mesa = state.mesas.find(m => m.id === mesaId);
    const c1Id = 200 + i * 2 + 1;
    const c2Id = 200 + i * 2 + 2;
    const clientes = [['Pedro', 'Lucas'], ['Julia', 'Marcos'], ['Família Fernandes', 'Convidado']][i];
    mesa.status = 'occupied';
    mesa.comandas = [
      { id: c1Id, nome: clientes[0], pessoas: 2, openTime: Date.now() - [25, 12, 48][i] * 60000, items: [{ ...state.menu.find(m => m.id === [2, 7, 1][i]), qty: 2 }] },
      { id: c2Id, nome: clientes[1], pessoas: 1, openTime: Date.now() - [20, 10, 30][i] * 60000, items: [{ ...state.menu.find(m => m.id === [13, 14, 17][i]), qty: 2 }] }
    ];
    mesa.selectedComandaId = c1Id;
  });

  state.hourlyData=[1,3,2,5,4,7,6,8,5,9,4,3];
  state.caixa.aberto=true; state.caixa.valorAbertura=300; state.caixa.horaAbertura='08:00';
  state.catSales={ pizzas:356.30, lanches:102.60, bebidas:48.00, sobremesas:34.90 };
  saveState();
}

function openClientMenu() {
  window.open('cardapio-online.html', '_blank', 'width=480,height=850');
}

// ==================== INIT ====================
let lastOrderCount = state.deliveryOrders.length;

function checkNewOnlineOrders() {
  const saved = loadState();
  if (!saved || !saved.deliveryOrders) return;
  if (saved.deliveryOrders.length > lastOrderCount) {
    const newCount = saved.deliveryOrders.length - lastOrderCount;
    state.deliveryOrders = saved.deliveryOrders;
    state.deliveryCounter = saved.deliveryCounter;
    lastOrderCount = saved.deliveryOrders.length;
    soundNewOrder();
    toast(`🔔 ${newCount} novo(s) pedido(s) online recebido(s)!`, 'success');
    renderDashboard();
    renderKanban();
    updateBadges();
  }
}

function init() {
  if (!state.deliveryCart) state.deliveryCart = [];
  loadDemoData();
  lastOrderCount = state.deliveryOrders.length;
  renderDashboard();
  renderKanban();
  renderMesas();
  renderCardapio();
  renderDeliveryMenu();
  updateBadges();

  // Check for online orders every 3 seconds
  setInterval(checkNewOnlineOrders, 3000);

  setInterval(() => {
    if (state.currentPage==='dashboard') renderDashboard();
    if (state.currentPage==='mesas' && state.selectedMesa) {
      const m=state.mesas.find(m=>m.id===state.selectedMesa);
      if(m && m.status==='occupied') renderMesaActive(m);
    }
    if (state.currentPage==='relatorios') renderRelatorios();
  }, 30000);
}

init();

