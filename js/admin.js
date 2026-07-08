const PATHS = {
  admins: '../dataset/adminAccounts.json',
  products: '../dataset/products.json',
  orders: '../dataset/ordersSample.json',
  returns: '../dataset/returnRequestsSample.json',
  surveyQ: '../dataset/surveyQuestion.json',
  surveyR: '../dataset/surveyResponses.json',
  marketplace: '../dataset/marketplace.json',
  customers: '../dataset/customerSample.json'
};

const KEYS = {
  adminSession: 'printify_admin_session',
  productsOverride: 'printify_admin_products_override',
  ordersOverride: 'printify_admin_orders_override',
  returnsOverride: 'printify_admin_returns_override',
  surveyOverride: 'printify_admin_survey_q_override'
};

const state = {
  admins: [],
  products: [],
  orders: [],
  returns: [],
  surveyQ: [],
  surveyR: [],
  marketplace: [],
  customers: [],
  admin: null,
  activeTab: 'dashboard',
  tamTab: 'questions',
  timeRange: '7d'
};

const $ = (id) => document.getElementById(id);

function normalize(v) {
  return String(v ?? '').trim().toLowerCase();
}

function money(n) {
  return Number(n || 0).toLocaleString('vi-VN') + '₫';
}

function fmtDate(v) {
  if (!v) return '';
  try {
    return new Date(v).toLocaleString('vi-VN');
  } catch {
    return String(v);
  }
}

function parseDateSafe(v) {
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

function uniqueBy(arr, keyFn) {
  const m = new Map();
  arr.forEach(item => m.set(keyFn(item), item));
  return [...m.values()];
}

function readLS(key, fallback = []) {
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
}

function writeLS(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

async function fetchJson(path, fallback = null) {
  try {
    const res = await fetch(path);
    if (!res.ok) {
      console.warn(`[PrintiFy Admin] Không tải được ${path} (status ${res.status}). Đang dùng dữ liệu rỗng.`);
      return fallback;
    }
    return await res.json();
  } catch (err) {
    console.error(`[PrintiFy Admin] Lỗi fetch ${path}:`, err);
    return fallback;
  }
}

function asArray(data, wrapperKey = null) {
  if (Array.isArray(data)) return data;
  if (data && wrapperKey && Array.isArray(data[wrapperKey])) return data[wrapperKey];
  return [];
}

// products.json thật có dạng { categories: [ { cateId, name, products: [...] }, ... ] }
// — mỗi category chứa mảng products RIÊNG. Cần gộp products của mọi category
// thành 1 mảng phẳng để các hàm filter/search/table hoạt động đúng.
function flattenProducts(data) {
  if (Array.isArray(data)) return data; // đã là mảng phẳng sẵn
  if (data && Array.isArray(data.categories)) {
    return data.categories.flatMap(cat => Array.isArray(cat.products) ? cat.products : []);
  }
  return [];
}
// (a) { status, requests: [...] }                         — 1 object duy nhất
// (b) [ { status, requests: [...] }, { status, requests: [...] }, ... ] — mảng nhiều nhóm theo status
// Cả 2 dạng đều cần "mở" requests[] ra và gắn lại status của nhóm cha vào
// từng request (vì bản thân mỗi request không có field status riêng).
function flattenReturns(data) {
  const groups = Array.isArray(data) ? data : [data];
  const out = [];
  groups.forEach(group => {
    if (!group) return;
    const list = Array.isArray(group.requests) ? group.requests : (Array.isArray(group) ? group : []);
    list.forEach(item => out.push({ ...item, status: item.status || group.status }));
  });
  return out;
}

function getAdminSession() {
  return JSON.parse(sessionStorage.getItem(KEYS.adminSession) || 'null');
}

function saveAdminSession(admin) {
  sessionStorage.setItem(KEYS.adminSession, JSON.stringify({
    adminId: admin.adId || admin.adminId || '',
    name: admin.adName || admin.username || 'Admin',
    email: admin.adEmail || admin.email || '',
    role: admin.role || 'staff',
    adAvatar: admin.adAvatar || ''
  }));
}

function setLoginMessage(msg, type = 'error') {
  const el = $('adminLoginMsg');
  if (!el) return;
  el.textContent = msg;
  el.className = `message ${type}`;
}

function openModal(title, html) {
  $('modalTitle').textContent = title;
  $('modalBody').innerHTML = html;
  $('modalOverlay').classList.remove('hidden');
}

function closeModal() {
  $('modalOverlay').classList.add('hidden');
  $('modalBody').innerHTML = '';
}

function showLoginState() {
  $('adminDisplayName').textContent = 'Admin';
  $('adminDisplayRole').textContent = 'Quản trị hệ thống';
  $('adminSessionInfo').textContent = 'Chưa đăng nhập';
  $('adminAvatar').textContent = 'AD';
  $('adminLoginWrap')?.classList.remove('hidden');
  $('adminApp')?.classList.add('hidden');
}

function showAdminApp() {
  $('adminLoginWrap')?.classList.add('hidden');
  $('adminApp')?.classList.remove('hidden');
}

function setPageFromSession(admin) {
  $('adminDisplayName').textContent = admin.name || 'Admin';
  $('adminDisplayRole').textContent = admin.role || 'Quản trị hệ thống';
  $('adminSessionInfo').textContent = `${admin.email || ''} · ${admin.role || ''}`.trim();
  $('adminAvatar').textContent = (admin.name || 'AD').trim().slice(0, 2).toUpperCase();
  applyRolePermissions(admin);
}

// NV17 exception: "Admin không có quyền chỉnh sửa câu hỏi: chỉ cho xem
// thống kê, ẩn nút Sửa/Xóa" — quyền này phải theo role đăng nhập thật,
// không phải một checkbox mà ai cũng tự bật/tắt được.
function applyRolePermissions(admin) {
  const isStaff = normalize(admin.role) === 'staff';
  const checkbox = $('staffViewOnly');
  if (!checkbox) return;
  checkbox.checked = isStaff;
  checkbox.disabled = isStaff; // staff không được tự bỏ chế độ chỉ xem
}

function setTab(tab) {
  state.activeTab = tab;
  document.querySelectorAll('.admin-nav').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });
  document.querySelectorAll('.admin-tab-panel').forEach(panel => panel.classList.add('hidden'));
  const target = $(`tab-${tab}`);
  if (target) target.classList.remove('hidden');

  if (tab === 'dashboard') renderDashboard();
  if (tab === 'products') renderProducts();
  if (tab === 'orders') renderOrders();
  if (tab === 'returns') renderReturns();
  if (tab === 'tam') renderTAM();
}

function setTamTab(tab) {
  state.tamTab = tab;
  document.querySelectorAll('.tam-tab').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tamtab === tab);
  });
  $('tamQuestionsPanel')?.classList.toggle('hidden', tab !== 'questions');
  $('tamStatsPanel')?.classList.toggle('hidden', tab !== 'stats');

  if (tab === 'questions') renderTAMQuestions();
  if (tab === 'stats') renderTAMStats();
}

function getCustomerName(id) {
  const c = state.customers.find(x => x.custId === id || x.userId === id);
  return c ? (c.custName || c.customerName || c.name || id) : id;
}

function getProductById(id) {
  return state.products.find(p => p.productId === id || p.id === id) || null;
}

function getProductName(id) {
  const p = getProductById(id);
  return p ? (p.name || p.productName || id) : id;
}

function getProductImage(id) {
  const p = getProductById(id);
  return p?.image || p?.images?.[0] || 'images/products/placeholder.png';
}

function getQuestionById(id) {
  return state.surveyQ.find(q => normalize(q.questionId) === normalize(id)) || null;
}

function inRange(dateValue, mode) {
  if (mode === 'all') return true;
  const d = parseDateSafe(dateValue);
  if (!d) return false;

  const now = new Date();
  const start = new Date(now);
  const end = new Date(now);
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  if (mode === 'today') {
    return d >= start && d <= end;
  }
  if (mode === '7d') {
    start.setDate(start.getDate() - 6);
    return d >= start && d <= end;
  }
  if (mode === '30d') {
    start.setDate(start.getDate() - 29);
    return d >= start && d <= end;
  }
  return true;
}

function getFilteredProducts() {
  const q = normalize($('productSearch')?.value || '');
  const cat = $('productCategoryFilter')?.value || '';
  const status = $('productStatusFilter')?.value || '';
  const stock = $('productStockFilter')?.value || '';

  return state.products.filter(p => {
    const hay = [p.productId || p.id, p.name, p.category, (p.tags || []).join(' ')].join(' ').toLowerCase();
    const passQ = !q || hay.includes(q);
    const passCat = !cat || p.category === cat;
    const passStatus = !status || ((status === 'active' && p.isActive !== false) || (status === 'inactive' && p.isActive === false));
    const passStock = !stock || ((stock === 'in' && p.inStock !== false) || (stock === 'out' && p.inStock === false));
    return passQ && passCat && passStatus && passStock;
  });
}

function getFilteredOrders() {
  const q = normalize($('orderSearch')?.value || '');
  const status = $('orderStatusFilter')?.value || '';
  const payment = $('orderPaymentFilter')?.value || '';

  return state.orders.filter(o => {
    const hay = [o.orderId, o.custId, o.userId, getCustomerName(o.custId || o.userId), o.payMethod, o.paymentMethod].join(' ').toLowerCase();
    const passQ = !q || hay.includes(q);
    const passStatus = !status || o.status === status;
    const passPay = !payment || (o.payMethod || o.paymentMethod || '') === payment;
    return passQ && passStatus && passPay && inRange(o.createdAt, state.timeRange);
  });
}

function getFilteredReturns() {
  const q = normalize($('returnSearch')?.value || '');
  const st = $('returnStatusFilter')?.value || '';

  return state.returns.filter(r => {
    const hay = [r.requestId, r.orderId, r.custId, getCustomerName(r.custId), r.reason, r.status].join(' ').toLowerCase();
    const passQ = !q || hay.includes(q);
    const passStatus = !st || normalize(r.status) === normalize(st);
    return passQ && passStatus && inRange(r.createdAt, state.timeRange);
  });
}

function getFilteredQuestions() {
  const q = normalize($('questionSearch')?.value || '');
  const dim = $('dimensionFilter')?.value || '';

  return state.surveyQ
    .slice()
    .sort((a, b) => Number(a.orderIndex || 0) - Number(b.orderIndex || 0))
    .filter(item => {
      const hay = [item.questionId, item.dimension, item.text, item.scaleType].join(' ').toLowerCase();
      const passQ = !q || hay.includes(q);
      const passDim = !dim || item.dimension === dim;
      return passQ && passDim;
    });
}

function getSurveyComments() {
  return state.surveyR
    .filter(r => String(r.comment || '').trim())
    .slice()
    .sort((a, b) => (parseDateSafe(b.submittedAt)?.getTime() || 0) - (parseDateSafe(a.submittedAt)?.getTime() || 0));
}

async function bootstrap() {
  const [admins, products, orders, returns, surveyQ, surveyR, marketplace, customers] = await Promise.all([
    fetchJson(PATHS.admins, []),
    fetchJson(PATHS.products, []),
    fetchJson(PATHS.orders, []),
    fetchJson(PATHS.returns, []),
    fetchJson(PATHS.surveyQ, []),
    fetchJson(PATHS.surveyR, []),
    fetchJson(PATHS.marketplace, []),
    fetchJson(PATHS.customers, [])
  ]);

  state.admins = asArray(admins);
  state.products = uniqueBy(
    readLS(KEYS.productsOverride, flattenProducts(products)),
    x => x.productId || x.id
  );
  state.orders = uniqueBy(
    readLS(KEYS.ordersOverride, asArray(orders)),
    x => x.orderId
  );
  state.returns = uniqueBy(
    readLS(KEYS.returnsOverride, flattenReturns(returns)),
    x => x.requestId
  );
  state.surveyQ = uniqueBy(
    readLS(KEYS.surveyOverride, asArray(surveyQ)),
    x => x.questionId
  );
  state.surveyR = asArray(surveyR, 'responses');
  state.marketplace = uniqueBy(asArray(marketplace), x => x.listingId);
  state.customers = asArray(customers);
}

function hasAnyDataInRange() {
  if (state.timeRange === 'all') return true;
  return (
    state.orders.some(o => inRange(o.createdAt, state.timeRange)) ||
    state.returns.some(r => inRange(r.createdAt, state.timeRange)) ||
    state.surveyR.some(r => inRange(r.submittedAt, state.timeRange)) ||
    state.marketplace.some(l => inRange(l.createdAt, state.timeRange))
  );
}

function renderDashboard() {
  const filteredOrders = state.orders.filter(o => inRange(o.createdAt, state.timeRange));
  const filteredReturns = state.returns.filter(r => inRange(r.createdAt, state.timeRange));
  const filteredListings = state.marketplace.filter(l => inRange(l.createdAt, state.timeRange));
  const filteredResponses = state.surveyR.filter(r => inRange(r.submittedAt, state.timeRange));

  const revenueByDay = {};
  filteredOrders.forEach(o => {
    if (normalize(o.status) !== 'hoàn tất') return;
    const key = String(o.createdAt || '').slice(0, 10) || 'unknown';
    revenueByDay[key] = (revenueByDay[key] || 0) + Number(o.totalAmount || 0);
  });

  const productCounter = {};
  filteredOrders.forEach(o => (o.items || []).forEach(it => {
    const id = it.productId || it.id || 'unknown';
    productCounter[id] = (productCounter[id] || 0) + Number(it.qty || it.quantity || 1);
  }));

  const totalOrders = filteredOrders.length;
  const completedOrders = filteredOrders.filter(o => normalize(o.status) === 'hoàn tất').length;
  const totalRevenue = filteredOrders
    .filter(o => normalize(o.status) === 'hoàn tất')
    .reduce((s, o) => s + Number(o.totalAmount || 0), 0);
  const completionRate = totalOrders ? Math.round((completedOrders / totalOrders) * 100) : 0;

  const stats = [
    { label: 'Tổng đơn', value: totalOrders, hint: 'đơn trong khoảng thời gian' },
    { label: 'Doanh thu ước tính', value: money(totalRevenue), hint: 'chỉ tính đơn hoàn tất' },
    { label: 'Tỷ lệ hoàn tất', value: `${completionRate}%`, hint: `${completedOrders}/${totalOrders} đơn` },
    { label: 'Yêu cầu hoàn hàng', value: filteredReturns.length, hint: 'đơn yêu cầu mới' },
    { label: 'Hội thoại TAM', value: filteredResponses.length, hint: 'phản hồi khảo sát' },
    { label: 'Marketplace active', value: filteredListings.filter(l => normalize(l.status) === 'đang bán').length, hint: 'listing đang bán' }
  ];

  $('dashboardStats').innerHTML = stats.map(s => `
    <article class="stat-card">
      <div class="stat-label">${s.label}</div>
      <div class="stat-value">${s.value}</div>
      <div class="stat-hint">${s.hint}</div>
    </article>
  `).join('');

  $('dashboardEmpty').classList.toggle('hidden', hasAnyDataInRange());

  const topProducts = Object.entries(productCounter).sort((a, b) => b[1] - a[1]).slice(0, 5);
  $('topProductsChart').innerHTML = topProducts.length
    ? topProducts.map(([id, qty], idx) => {
        const pct = topProducts[0][1] ? Math.round((qty / topProducts[0][1]) * 100) : 0;
        return `
          <div class="chart-row">
            <div class="chart-row-head">
              <strong>#${idx + 1} ${getProductName(id)}</strong>
              <span>${qty}</span>
            </div>
            <div class="bar-track"><div class="bar-fill" style="width:${Math.max(12, pct)}%"></div></div>
          </div>
        `;
      }).join('')
    : '<div class="empty-inline">Không có dữ liệu trong khoảng thời gian này.</div>';

  const revenueDates = Object.keys(revenueByDay).sort();
  $('revenueTimelineChart').innerHTML = revenueDates.length
    ? revenueDates.map(date => `
        <div class="timeline-row">
          <div class="timeline-label">${date}</div>
          <div class="timeline-value">${money(revenueByDay[date])}</div>
        </div>
      `).join('')
    : '<div class="empty-inline">Không có dữ liệu trong khoảng thời gian này.</div>';

  $('marketplaceList').innerHTML = filteredListings
    .filter(l => normalize(l.status) === 'đang bán')
    .slice(0, 6)
    .map(l => `
      <div class="mini-item">
        <img src="${l.watermarkedBase64 || l.thumbnailBase64 || 'images/products/placeholder.png'}" alt="">
        <div>
          <strong>${l.title}</strong>
          <span>${l.type === 'design' ? 'Thiết kế' : 'Sản phẩm'} · ${money(l.displayPrice || l.sellerPrice || 0)}</span>
        </div>
      </div>
    `).join('') || '<div class="empty-inline">Không có listing đang bán trong khoảng thời gian này.</div>';

  const recentComments = filteredResponses
    .slice()
    .sort((a, b) => (parseDateSafe(b.submittedAt)?.getTime() || 0) - (parseDateSafe(a.submittedAt)?.getTime() || 0))
    .slice(0, 5);

  $('recentSurveyComments').innerHTML = recentComments.length
    ? recentComments.map(r => `
        <div class="mini-comment">
          <strong>${r.custId || r.userId || 'User'} · ${fmtDate(r.submittedAt)}</strong>
          <span>${r.comment || '—'}</span>
        </div>
      `).join('')
    : '<div class="empty-inline">Không có phản hồi nào trong khoảng thời gian này.</div>';
}

function renderProducts() {
  const rows = getFilteredProducts();
  const categoryOptions = [...new Set(state.products.map(p => p.category).filter(Boolean))];
  $('productCategoryFilter').innerHTML = `<option value="">Tất cả category</option>` + categoryOptions.map(c => `<option value="${c}">${c}</option>`).join('');

  $('productsTbody').innerHTML = rows.length ? rows.map(p => {
    const pid = p.productId || p.id || '';
    return `
      <tr>
        <td><img class="thumb" src="${p.image || p.images?.[0] || 'images/products/placeholder.png'}" alt=""></td>
        <td>${pid}</td>
        <td>${p.name || ''}</td>
        <td>${p.category || ''}</td>
        <td>${money(p.price || 0)}</td>
        <td>${p.inStock === false ? 'Hết' : 'Còn'}</td>
        <td><span class="badge ${p.isActive === false ? 'badge-off' : 'badge-on'}">${p.isActive === false ? 'Inactive' : 'Active'}</span></td>
        <td>
          <button class="btn-mini" type="button" onclick="editProduct('${pid}')">Sửa</button>
          <button class="btn-mini" type="button" onclick="toggleProductActive('${pid}')">${p.isActive === false ? 'Hiện' : 'Ẩn'}</button>
        </td>
      </tr>
    `;
  }).join('') : `<tr><td colspan="8" class="empty-inline">Không có sản phẩm phù hợp.</td></tr>`;
}

const TIME_RANGE_LABELS = { today: 'Hôm nay', '7d': '7 ngày', '30d': '30 ngày', all: 'Tất cả' };

// Đơn hàng/Hoàn hàng vẫn bị lọc theo state.timeRange (control chỉ nằm ở tab
// Dashboard) — hiển thị 1 dòng nhắc để admin không tưởng nhầm là mất dữ liệu.
function renderTimeRangeHint(anchorId) {
  const anchor = $(anchorId);
  if (!anchor) return;
  const toolbar = anchor.closest('.section-card')?.querySelector('.toolbar-row');
  if (!toolbar) return;
  let hint = toolbar.parentElement.querySelector('.time-range-hint');
  if (!hint) {
    hint = document.createElement('div');
    hint.className = 'time-range-hint empty-inline';
    toolbar.insertAdjacentElement('afterend', hint);
  }
  hint.textContent = `Đang lọc theo khoảng thời gian: ${TIME_RANGE_LABELS[state.timeRange] || state.timeRange} (đổi tại bộ lọc trên tab Dashboard).`;
}

function renderOrders() {
  renderTimeRangeHint('orderSearch');
  const rows = getFilteredOrders();
  const payMethods = [...new Set(state.orders.map(o => o.payMethod || o.paymentMethod).filter(Boolean))];
  $('orderPaymentFilter').innerHTML = `<option value="">Tất cả phương thức</option>` + payMethods.map(m => `<option value="${m}">${m}</option>`).join('');

  $('ordersTbody').innerHTML = rows.length ? rows.map(o => `
    <tr>
      <td>${o.orderId}</td>
      <td>${getCustomerName(o.custId || o.userId)}</td>
      <td>${fmtDate(o.createdAt)}</td>
      <td>${money(o.totalAmount || 0)}</td>
      <td><span class="badge badge-order">${o.status || ''}</span></td>
      <td>${o.payMethod || o.paymentMethod || ''}</td>
      <td><button class="btn-mini" type="button" onclick="openOrderDetail('${o.orderId}')">Xem chi tiết</button></td>
    </tr>
  `).join('') : `<tr><td colspan="7" class="empty-inline">Không có đơn phù hợp.</td></tr>`;
}

function renderReturns() {
  renderTimeRangeHint('returnSearch');
  const rows = getFilteredReturns();
  $('returnsTbody').innerHTML = rows.length ? rows.map(r => `
    <tr>
      <td>${r.requestId}</td>
      <td>${r.orderId}</td>
      <td>${getCustomerName(r.custId)}</td>
      <td>${r.reason || ''}</td>
      <td>${fmtDate(r.createdAt)}</td>
      <td><span class="badge badge-return ${normalize(r.status)}">${r.status || ''}</span></td>
      <td><button class="btn-mini" type="button" onclick="openReturnDetail('${r.requestId}')">Xem chi tiết</button></td>
    </tr>
  `).join('') : `<tr><td colspan="7" class="empty-inline">Không có yêu cầu hoàn hàng phù hợp.</td></tr>`;
}

function averageForDimension(dim) {
  const qids = state.surveyQ.filter(q => q.dimension === dim).map(q => normalize(q.questionId));
  const scores = [];
  state.surveyR.forEach(r => (r.answers || []).forEach(a => {
    if (qids.includes(normalize(a.questionId))) scores.push(Number(a.score || 0));
  }));
  return scores.length ? scores.reduce((s, n) => s + n, 0) / scores.length : 0;
}

function renderTAMQuestions() {
  const rows = getFilteredQuestions();
  const staffOnly = $('staffViewOnly')?.checked;

  $('questionsTbody').innerHTML = rows.length ? rows.map(q => `
    <tr>
      <td>${q.orderIndex ?? ''}</td>
      <td>${q.dimension || ''}</td>
      <td>${q.questionId}</td>
      <td>${q.text || ''}</td>
      <td><span class="badge ${q.isActive === false ? 'badge-off' : 'badge-on'}">${q.isActive === false ? 'Inactive' : 'Active'}</span></td>
      <td>
        ${staffOnly ? '<span class="hint-mini">Staff chỉ xem</span>' : `
          <button class="btn-mini" type="button" onclick="editQuestion('${q.questionId}')">Sửa</button>
          <button class="btn-mini" type="button" onclick="toggleQuestion('${q.questionId}')">${q.isActive === false ? 'Bật' : 'Tắt'}</button>
          <button class="btn-mini btn-danger" type="button" onclick="deleteQuestion('${q.questionId}')">Xóa</button>
        `}
      </td>
    </tr>
  `).join('') : `<tr><td colspan="6" class="empty-inline">Không có câu hỏi phù hợp.</td></tr>`;
}

function renderTAMStats() {
  const dims = ['PU', 'EOU', 'SAT', 'PI'];

  $('tamStatsCards').innerHTML = dims.map(dim => {
    const avg = averageForDimension(dim);
    const count = state.surveyR.reduce((sum, r) => sum + (r.answers || []).filter(a => normalize(getQuestionById(a.questionId)?.dimension) === normalize(dim)).length, 0);
    return `
      <article class="stat-card">
        <div class="stat-label">${dim}</div>
        <div class="stat-value">${avg ? avg.toFixed(2) : '—'}</div>
        <div class="stat-hint">${count} câu trả lời</div>
      </article>
    `;
  }).join('');

  $('tamAverageBars').innerHTML = dims.map(dim => {
    const avg = averageForDimension(dim);
    const pct = Math.round((avg / 5) * 100);
    return `
      <div class="chart-row">
        <div class="chart-row-head">
          <strong>${dim}</strong>
          <span>${avg ? avg.toFixed(2) : '—'} / 5</span>
        </div>
        <div class="bar-track"><div class="bar-fill purple" style="width:${pct}%"></div></div>
      </div>
    `;
  }).join('');

  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  state.surveyR.forEach(r => (r.answers || []).forEach(a => {
    const s = Number(a.score || 0);
    if (distribution[s] !== undefined) distribution[s] += 1;
  }));
  const max = Math.max(...Object.values(distribution), 1);

  $('tamDistribution').innerHTML = Object.entries(distribution).map(([score, count]) => `
    <div class="dist-row">
      <span>${score}</span>
      <div class="dist-track"><div class="dist-fill" style="width:${Math.round((count / max) * 100)}%"></div></div>
      <strong>${count}</strong>
    </div>
  `).join('');

  const comments = getSurveyComments().slice(0, 8);
  $('tamCommentList').innerHTML = comments.length ? comments.map(r => `
    <div class="comment-item">
      <div class="comment-head">
        <strong>${r.custId || r.userId || 'User'}</strong>
        <span>${fmtDate(r.submittedAt)}</span>
      </div>
      <p>${r.comment || '—'}</p>
    </div>
  `).join('') : '<div class="empty-inline">Chưa có phản hồi.</div>';
}

function renderTAM() {
  if (state.tamTab === 'questions') renderTAMQuestions();
  else renderTAMStats();
}

function fillProductForm(p = null) {
  $('productForm').dataset.mode = p ? 'edit' : 'create';
  $('pf-id').value = p?.productId || p?.id || '';
  $('pf-name').value = p?.name || '';
  $('pf-category').value = p?.category || '';
  $('pf-price').value = p?.price ?? '';
  $('pf-tags').value = (p?.tags || []).join(', ');
  $('pf-image').value = p?.image || '';
  $('pf-active').checked = p?.isActive !== false;
  $('pf-stock').checked = p?.inStock !== false;
}

function fillQuestionForm(q = null) {
  $('surveyForm').dataset.mode = q ? 'edit' : 'create';
  $('sq-id').value = q?.questionId || '';
  $('sq-dimension').value = q?.dimension || 'PU';
  $('sq-text').value = q?.text || '';
  $('sq-scaleType').value = q?.scaleType || 'Likert5';
  $('sq-orderIndex').value = q?.orderIndex ?? '';
  $('sq-active').checked = q?.isActive !== false;
}

function saveProductsOverride() {
  writeLS(KEYS.productsOverride, state.products);
}

function saveOrdersOverride() {
  writeLS(KEYS.ordersOverride, state.orders);
}

function saveReturnsOverride() {
  writeLS(KEYS.returnsOverride, state.returns);
}

function saveSurveyOverride() {
  writeLS(KEYS.surveyOverride, state.surveyQ);
}

function renderProductModal(p = null) {
  const pid = p?.productId || p?.id || '';
  return `
    <form id="productModalForm" class="modal-form">
      <div class="form-grid">
        <div class="form-group">
          <label class="form-label">productId</label>
          <input class="form-input" id="mp-id" value="${pid}" />
        </div>
        <div class="form-group">
          <label class="form-label">Tên</label>
          <input class="form-input" id="mp-name" value="${p?.name || ''}" />
        </div>
        <div class="form-group">
          <label class="form-label">Category</label>
          <input class="form-input" id="mp-category" value="${p?.category || ''}" />
        </div>
        <div class="form-group">
          <label class="form-label">Giá</label>
          <input class="form-input" id="mp-price" type="number" value="${p?.price ?? 0}" />
        </div>
        <div class="form-group full">
          <label class="form-label">Tags</label>
          <input class="form-input" id="mp-tags" value="${(p?.tags || []).join(', ')}" />
        </div>
        <div class="form-group full">
          <label class="form-label">Ảnh</label>
          <input class="form-input" id="mp-image" value="${p?.image || ''}" />
        </div>
      </div>
      <div class="toolbar-row mt-12">
        <label class="remember"><input id="mp-active" type="checkbox" ${p?.isActive !== false ? 'checked' : ''}/> Hiển thị trên catalog</label>
        <label class="remember"><input id="mp-stock" type="checkbox" ${p?.inStock !== false ? 'checked' : ''}/> Còn hàng</label>
      </div>
      <div class="modal-actions">
        <button class="btn-primary" type="submit">Lưu</button>
        <button class="btn-secondary" type="button" id="btnCancelModalProduct">Hủy</button>
      </div>
    </form>
  `;
}

function renderQuestionModal(q = null) {
  return `
    <form id="questionModalForm" class="modal-form">
      <div class="form-grid">
        <div class="form-group">
          <label class="form-label">questionId</label>
          <input class="form-input" id="mq-id" value="${q?.questionId || ''}" />
        </div>
        <div class="form-group">
          <label class="form-label">Dimension</label>
          <select class="form-input" id="mq-dimension">
            ${['PU', 'EOU', 'SAT', 'PI'].map(d => `<option value="${d}" ${q?.dimension === d ? 'selected' : ''}>${d}</option>`).join('')}
          </select>
        </div>
        <div class="form-group full">
          <label class="form-label">Nội dung</label>
          <textarea class="form-input" id="mq-text" rows="4">${q?.text || ''}</textarea>
        </div>
        <div class="form-group">
          <label class="form-label">ScaleType</label>
          <input class="form-input" id="mq-scaleType" value="${q?.scaleType || 'Likert5'}" />
        </div>
        <div class="form-group">
          <label class="form-label">OrderIndex</label>
          <input class="form-input" id="mq-orderIndex" type="number" value="${q?.orderIndex ?? 1}" />
        </div>
      </div>
      <div class="toolbar-row mt-12">
        <label class="remember"><input id="mq-active" type="checkbox" ${q?.isActive !== false ? 'checked' : ''}/> Active</label>
      </div>
      <div class="modal-actions">
        <button class="btn-primary" type="submit">Lưu</button>
        <button class="btn-secondary" type="button" id="btnCancelModalQuestion">Hủy</button>
      </div>
    </form>
  `;
}

function openProductModal(p = null) {
  openModal(p ? 'Sửa sản phẩm' : 'Thêm sản phẩm', renderProductModal(p));
  $('productModalForm').dataset.mode = p ? 'edit' : 'create';
  $('productModalForm').addEventListener('submit', saveProductFromModal);
  $('btnCancelModalProduct').addEventListener('click', closeModal);
}

function openQuestionModal(q = null) {
  openModal(q ? 'Sửa câu hỏi TAM' : 'Thêm câu hỏi TAM', renderQuestionModal(q));
  $('questionModalForm').addEventListener('submit', saveQuestionFromModal);
  $('btnCancelModalQuestion').addEventListener('click', closeModal);
}

const ALLOWED_IMAGE_EXT = ['jpg', 'jpeg', 'png', 'webp'];

function hasAllowedImageExt(pathOrUrl) {
  const clean = String(pathOrUrl || '').split('?')[0].trim();
  const ext = clean.split('.').pop()?.toLowerCase();
  return ALLOWED_IMAGE_EXT.includes(ext);
}

function saveProductFromModal(e) {
  e.preventDefault();
  const mode = $('productModalForm').dataset.mode || 'create';
  const obj = {
    productId: $('mp-id').value.trim(),
    name: $('mp-name').value.trim(),
    category: $('mp-category').value.trim(),
    price: Number($('mp-price').value || 0),
    tags: $('mp-tags').value.split(',').map(s => s.trim()).filter(Boolean),
    image: $('mp-image').value.trim(),
    inStock: $('mp-stock').checked,
    isActive: $('mp-active').checked
  };

  if (!obj.productId || !obj.name || !obj.category || !(obj.price > 0)) {
    alert('Thiếu dữ liệu sản phẩm. Vui lòng nhập đủ Mã SP, Tên, Category và Giá > 0.');
    return;
  }

  if (obj.image && !hasAllowedImageExt(obj.image)) {
    alert('Ảnh không hợp lệ. Chỉ chấp nhận định dạng JPG, PNG hoặc WebP.');
    return;
  }

  const idx = state.products.findIndex(x => (x.productId || x.id) === obj.productId);

  // NV13: "Mã sản phẩm trùng: từ chối lưu, gợi ý mã khác" — chỉ áp dụng khi
  // đang THÊM MỚI. Khi đang SỬA sản phẩm hiện có thì trùng mã là bình thường.
  if (mode === 'create' && idx >= 0) {
    alert(`Mã sản phẩm "${obj.productId}" đã tồn tại. Vui lòng chọn mã khác.`);
    return;
  }

  if (idx >= 0) state.products[idx] = { ...state.products[idx], ...obj };
  else state.products.unshift(obj);

  saveProductsOverride();
  renderProducts();
  renderDashboard();
  closeModal();
}

function saveQuestionFromModal(e) {
  e.preventDefault();
  const obj = {
    questionId: $('mq-id').value.trim(),
    dimension: $('mq-dimension').value,
    text: $('mq-text').value.trim(),
    scaleType: $('mq-scaleType').value.trim() || 'Likert5',
    orderIndex: Number($('mq-orderIndex').value || 0),
    isActive: $('mq-active').checked
  };
  if (!obj.questionId || !obj.text) {
    alert('Thiếu dữ liệu câu hỏi.');
    return;
  }
  const idx = state.surveyQ.findIndex(x => x.questionId === obj.questionId);
  if (idx >= 0) state.surveyQ[idx] = { ...state.surveyQ[idx], ...obj };
  else state.surveyQ.unshift(obj);

  saveSurveyOverride();
  renderTAMQuestions();
  renderTAMStats();
  renderDashboard();
  closeModal();
}

function openOrderDetail(orderId) {
  const o = state.orders.find(x => x.orderId === orderId);
  if (!o) return;

  const items = (o.items || []).map(it => `
    <div class="detail-item">
      <img src="${getProductImage(it.productId)}" alt="">
      <div>
        <strong>${getProductName(it.productId)}</strong>
        <span>SL: ${it.qty || it.quantity || 1} · Giá: ${money(it.price || 0)}</span>
        <span>Design: ${it.designId || '—'}</span>
      </div>
    </div>
  `).join('');

  const timeline = (o.timeline || []).map(t => `
    <div class="timeline-entry">
      <strong>${t.status}</strong>
      <span>${fmtDate(t.time)}</span>
    </div>
  `).join('');

  openModal(`Chi tiết đơn ${o.orderId}`, `
    <div class="detail-grid">
      <div class="detail-block">
        <h4>Thông tin đơn</h4>
        <p><strong>Khách:</strong> ${getCustomerName(o.custId || o.userId)}</p>
        <p><strong>Ngày tạo:</strong> ${fmtDate(o.createdAt)}</p>
        <p><strong>Thanh toán:</strong> ${o.payMethod || o.paymentMethod || ''}</p>
        <p><strong>Tổng tiền:</strong> ${money(o.totalAmount || 0)}</p>
      </div>

      <div class="detail-block">
        <h4>Shipping</h4>
        <p>${o.shipInfo?.name || o.shippingInfo?.name || ''}</p>
        <p>${o.shipInfo?.phone || o.shippingInfo?.phone || ''}</p>
        <p>${[o.shipInfo?.address || o.shippingInfo?.address, o.shipInfo?.ward || o.shippingInfo?.ward, o.shipInfo?.district || o.shippingInfo?.district, o.shipInfo?.city || o.shippingInfo?.city].filter(Boolean).join(', ')}</p>
      </div>

      <div class="detail-block full">
        <h4>Sản phẩm</h4>
        ${items || '<div class="empty-inline">Không có items.</div>'}
      </div>

      <div class="detail-block full">
        <h4>Timeline</h4>
        ${timeline || '<div class="empty-inline">Chưa có timeline.</div>'}
      </div>
    </div>

    <div class="modal-actions">
      <select class="form-input" id="modalOrderStatus">
        ${['Chờ xác nhận', 'Đang xử lý', 'Đang giao', 'Hoàn tất', 'Đã hủy'].map(st => `<option ${st === o.status ? 'selected' : ''}>${st}</option>`).join('')}
      </select>
      <button class="btn-primary" type="button" id="btnSaveOrderModal">Lưu</button>
    </div>
  `);

  $('btnSaveOrderModal').addEventListener('click', () => {
    o.status = $('modalOrderStatus').value;
    o.timeline = o.timeline || [];
    o.timeline.push({ status: o.status, time: new Date().toISOString() });
    saveOrdersOverride();
    renderOrders();
    renderDashboard();
    closeModal();
  });
}

const RETURN_DEADLINE_DAYS = 7;

// NV15 — quá 7 ngày kể từ ngày ĐƠN HOÀN TẤT (không phải ngày gửi request)
function isReturnExpired(order) {
  if (!order) return false;
  const completedEntry = (order.timeline || []).find(t => normalize(t.status) === 'hoàn tất');
  const baseDate = parseDateSafe(completedEntry?.time) || parseDateSafe(order.createdAt);
  if (!baseDate) return false;
  const deadline = new Date(baseDate);
  deadline.setDate(deadline.getDate() + RETURN_DEADLINE_DAYS);
  return new Date() > deadline;
}

function hasDuplicatePendingReturn(r) {
  return state.returns.some(other =>
    other.requestId !== r.requestId &&
    other.orderId === r.orderId &&
    normalize(other.status) === 'pending'
  );
}

function openReturnDetail(requestId) {
  const r = state.returns.find(x => x.requestId === requestId);
  if (!r) return;

  const order = state.orders.find(o => o.orderId === r.orderId);
  const expired = isReturnExpired(order);
  const missingImages = !(r.images || []).length;
  const duplicate = hasDuplicatePendingReturn(r);
  const isPending = normalize(r.status) === 'pending' || normalize(r.status) === 'đang xét duyệt';
  const blockDecision = isPending && (expired || missingImages);

  const warnings = [];
  if (expired) warnings.push('⚠️ Đã quá thời hạn hoàn hàng 7 ngày kể từ ngày đơn hoàn tất — chỉ được xem, không thể chấp nhận/từ chối.');
  if (missingImages) warnings.push('⚠️ Thiếu ảnh/video minh chứng — không thể xử lý cho đến khi khách bổ sung.');
  if (duplicate) warnings.push('⚠️ Đơn này còn một yêu cầu hoàn hàng khác đang chờ xét duyệt — kiểm tra kỹ trước khi quyết định.');

  openModal(`Xét duyệt ${r.requestId}`, `
    <div class="detail-grid">
      ${warnings.length ? `
        <div class="detail-block full">
          <div class="empty-inline" style="color:#b91c1c;">
            ${warnings.map(w => `<div>${w}</div>`).join('')}
          </div>
        </div>
      ` : ''}

      <div class="detail-block">
        <h4>Request</h4>
        <p><strong>Order:</strong> ${r.orderId}</p>
        <p><strong>Khách:</strong> ${getCustomerName(r.custId)}</p>
        <p><strong>Lý do:</strong> ${r.reason || ''}</p>
        <p><strong>Ngày gửi:</strong> ${fmtDate(r.createdAt)}</p>
      </div>

      <div class="detail-block">
        <h4>Đơn gốc</h4>
        <p><strong>Trạng thái:</strong> ${order?.status || '—'}</p>
        <p><strong>Tổng tiền:</strong> ${money(order?.totalAmount || 0)}</p>
      </div>

      <div class="detail-block full">
        <h4>Mô tả</h4>
        <p>${r.description || '—'}</p>
      </div>

      <div class="detail-block full">
        <h4>Minh chứng</h4>
        <div class="evidence-grid">
          ${(r.images || []).map(src => `<img src="${src}" alt="">`).join('') || '<div class="empty-inline">Không có ảnh.</div>'}
        </div>
      </div>

      <div class="detail-block full">
        <h4>Admin note</h4>
        <textarea class="form-input" id="modalReturnNote" rows="4">${r.adminNote || ''}</textarea>
      </div>
    </div>

    <div class="modal-actions">
      <button class="btn-primary" type="button" id="btnApproveReturn" ${blockDecision ? 'disabled' : ''}>Chấp nhận</button>
      <button class="btn-danger" type="button" id="btnRejectReturn" ${blockDecision ? 'disabled' : ''}>Từ chối</button>
    </div>
  `);

  $('btnApproveReturn').addEventListener('click', () => {
    if (blockDecision) return;
    r.status = 'approved';
    r.adminNote = $('modalReturnNote').value.trim();
    r.resolvedAt = new Date().toISOString();
    saveReturnsOverride();
    renderReturns();
    renderDashboard();
    closeModal();
  });

  $('btnRejectReturn').addEventListener('click', () => {
    if (blockDecision) return;
    r.status = 'denied';
    r.adminNote = $('modalReturnNote').value.trim();
    r.resolvedAt = new Date().toISOString();
    saveReturnsOverride();
    renderReturns();
    renderDashboard();
    closeModal();
  });
}

function deleteQuestion(id) {
  if (!confirm('Xóa câu hỏi này?')) return;
  state.surveyQ = state.surveyQ.filter(q => q.questionId !== id);
  saveSurveyOverride();
  renderTAMQuestions();
  renderTAMStats();
  renderDashboard();
}

function toggleQuestion(id) {
  const idx = state.surveyQ.findIndex(x => x.questionId === id);
  if (idx < 0) return;
  state.surveyQ[idx].isActive = !(state.surveyQ[idx].isActive !== false);
  saveSurveyOverride();
  renderTAMQuestions();
  renderTAMStats();
  renderDashboard();
}

function toggleProductActive(id) {
  const idx = state.products.findIndex(x => (x.productId || x.id) === id);
  if (idx < 0) return;
  state.products[idx].isActive = !(state.products[idx].isActive !== false);
  saveProductsOverride();
  renderProducts();
  renderDashboard();
}

function editProduct(id) {
  const p = state.products.find(x => (x.productId || x.id) === id);
  if (!p) return;
  openProductModal(p);
}

function editQuestion(id) {
  const q = state.surveyQ.find(x => x.questionId === id);
  if (!q) return;
  openQuestionModal(q);
}

function exportReport() {
  const payload = {
    exportedAt: new Date().toISOString(),
    timeRange: state.timeRange,
    stats: {
      totalOrders: getFilteredOrders().length,
      totalReturns: getFilteredReturns().length,
      totalQuestions: state.surveyQ.length,
      totalResponses: state.surveyR.length
    }
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `printify_admin_report_${state.timeRange}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function exportTAM() {
  const rows = [
    ['responseId', 'custId', 'questionId', 'score', 'comment', 'submittedAt'].join(','),
    ...state.surveyR.flatMap(r => (r.answers || []).map(a => [
      r.responseId,
      r.custId || r.userId || '',
      a.questionId,
      a.score,
      `"${String(r.comment || '').replace(/"/g, '""')}"`,
      r.submittedAt || ''
    ].join(',')))
  ];

  const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'tam_report.csv';
  a.click();
  URL.revokeObjectURL(url);
}

function openAddProduct() {
  openProductModal(null);
}

function openAddQuestion() {
  openQuestionModal(null);
}

function logoutAdmin() {
  sessionStorage.removeItem(KEYS.adminSession);
  state.admin = null;

  if ($('adminLoginForm')) $('adminLoginForm').reset();
  if ($('adminEmail')) $('adminEmail').value = '';
  if ($('adminPassword')) $('adminPassword').value = '';

  closeModal();
  showLoginState();
  setLoginMessage('Đã đăng xuất.', 'success');
}

document.addEventListener('DOMContentLoaded', async () => {
  await bootstrap();

  // Luôn mở màn hình đăng nhập trước
  sessionStorage.removeItem(KEYS.adminSession);
  state.admin = null;

  showLoginState();
  setLoginMessage('');
  $('adminLoginForm')?.reset();
  if ($('adminEmail')) $('adminEmail').value = '';
  if ($('adminPassword')) $('adminPassword').value = '';

  $('adminLoginForm')?.addEventListener('submit', (e) => {
    e.preventDefault();

    const email = $('adminEmail').value.trim();
    const password = $('adminPassword').value.trim();

    if (!email || !password) {
      setLoginMessage('Vui lòng nhập email và mật khẩu.');
      return;
    }

    const admin = state.admins.find(a =>
      normalize(a.adEmail) === normalize(email) ||
      normalize(a.username) === normalize(email)
    );

    if (!admin) {
      setLoginMessage('Không tìm thấy tài khoản admin.');
      return;
    }

    const stored = String(admin.password ?? admin.passwordHash ?? '');
    if (stored !== password) {
      setLoginMessage('Mật khẩu không đúng. Vui lòng thử lại.');
      return;
    }

    saveAdminSession(admin);
    state.admin = {
      name: admin.adName || admin.username || 'Admin',
      role: admin.role || 'staff',
      email: admin.adEmail || admin.email || ''
    };

    // #adminLoginMsg nằm bên trong #adminLoginWrap. Nếu chuyển sang
    // showAdminApp() ngay lập tức, wrap này bị ẩn và message "Đăng nhập
    // thành công" sẽ không bao giờ được nhìn thấy. Nên hiện message trước,
    // đợi một nhịp ngắn rồi mới chuyển màn hình.
    setLoginMessage('Đăng nhập thành công.', 'success');
    setPageFromSession(state.admin);

    setTimeout(() => {
      showAdminApp();
      renderDashboard();
    }, 400);
  });

  $('btnLogoutAdmin')?.addEventListener('click', logoutAdmin);

  document.querySelectorAll('.admin-nav').forEach(btn => {
    btn.addEventListener('click', () => setTab(btn.dataset.tab));
  });

  document.querySelectorAll('.tam-tab').forEach(btn => {
    btn.addEventListener('click', () => setTamTab(btn.dataset.tamtab));
  });

  $('timeRangeFilter')?.addEventListener('change', (e) => {
    state.timeRange = e.target.value;
    renderDashboard();
  });

  $('btnExportReport')?.addEventListener('click', exportReport);
  $('btnExportTam')?.addEventListener('click', exportTAM);
  $('btnAddProduct')?.addEventListener('click', openAddProduct);
  $('btnAddQuestion')?.addEventListener('click', openAddQuestion);

  $('productSearch')?.addEventListener('input', renderProducts);
  $('productCategoryFilter')?.addEventListener('change', renderProducts);
  $('productStatusFilter')?.addEventListener('change', renderProducts);
  $('productStockFilter')?.addEventListener('change', renderProducts);

  $('orderSearch')?.addEventListener('input', renderOrders);
  $('orderStatusFilter')?.addEventListener('change', renderOrders);
  $('orderPaymentFilter')?.addEventListener('change', renderOrders);

  $('returnSearch')?.addEventListener('input', renderReturns);
  $('returnStatusFilter')?.addEventListener('change', renderReturns);

  $('questionSearch')?.addEventListener('input', renderTAMQuestions);
  $('dimensionFilter')?.addEventListener('change', renderTAMQuestions);
  $('staffViewOnly')?.addEventListener('change', renderTAMQuestions);

  $('btnCloseModal')?.addEventListener('click', closeModal);
  $('modalOverlay')?.addEventListener('click', (e) => {
    if (e.target === $('modalOverlay')) closeModal();
  });

  window.switchTab = setTab;
  window.editProduct = editProduct;
  window.toggleProductActive = toggleProductActive;
  window.openOrderDetail = openOrderDetail;
  window.openReturnDetail = openReturnDetail;
  window.editQuestion = editQuestion;
  window.toggleQuestion = toggleQuestion;
  window.deleteQuestion = deleteQuestion;

  setTab('dashboard');
});