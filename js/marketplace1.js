// ════════════════════════════════════════════════════════
// marketplace-part1.js
// Chứa: CONFIG, STATE, DATA HELPERS, WATERMARK,
//        5.1 ĐĂNG BÁN THIẾT KẾ, 5.2 ĐĂNG BÁN SẢN PHẨM,
//        5.3 MUA THIẾT KẾ / SP
// ════════════════════════════════════════════════════════

const PLATFORM_CONFIG = {
  feePercent: 20,
  maxReportBeforeHide: 2
};

const MARKETPLACE_JSON_URL = '../dataset/marketplace.json';
const STORAGE_KEYS = {
  market: 'printify_market',
  orders: 'printify_orders',
  designs: 'printify_designs',
  txn: 'printify_txn'
};

let currentTab = '5.3';
let currentUser = null;
let allListings = [];
let allOrders = [];
let allDesigns = [];
let seedListings = [];
let selectedOrderItem = null;

const MARKETPLACE_DEMO_MODE = true;

function safeParseJSON(raw, fallback = null) {
  try {
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function formatPrice(n) {
  return Number(n || 0).toLocaleString('vi-VN') + '₫';
}

function calcDisplayPrice(sellerPrice) {
  return Math.ceil(Number(sellerPrice || 0) * (1 + PLATFORM_CONFIG.feePercent / 100));
}

function genId(prefix) {
  return `${prefix}-${Date.now()}`;
}

function getSessionUser() {
  if (typeof getCurrentUser === 'function') return getCurrentUser();
  return safeParseJSON(sessionStorage.getItem('printify_session'), null);
}

function refreshCurrentUser() {
  currentUser = getSessionUser();
  return currentUser;
}

function getCurrentUserId() {
  const u = refreshCurrentUser();
  return u?.userId || u?.custId || u?.adId || '';
}

function getCurrentUserName() {
  const u = refreshCurrentUser();
  return u?.name || u?.custName || u?.adName || '';
}

function setAuthWarning(visible, message) {
  const warn = document.getElementById('auth-warning');
  if (!warn) return;

  if (message) warn.innerHTML = message;
  warn.style.display = visible ? 'flex' : 'none';
}

function requireMarketplaceAuth(returnTo = '../interface/marketplace.html?tab=5.3') {
  if (getCurrentUserId()) {
    setAuthWarning(false);
    return true;
  }

  setAuthWarning(true, '⚠️ Bạn cần đăng nhập để đăng bán hoặc mua trên Marketplace.');

  if (typeof redirectToLogin === 'function') {
    redirectToLogin(returnTo);
  } else {
    window.location.href = '../interface/login.html';
  }
  return false;
}

function saveListing(listing) {
  allListings.unshift(listing);
  localStorage.setItem(STORAGE_KEYS.market, JSON.stringify(allListings));
}

function updateListing(listingId, updates) {
  allListings = allListings.map(l =>
    l.listingId === listingId
      ? { ...l, ...updates, updatedAt: new Date().toISOString() }
      : l
  );
  localStorage.setItem(STORAGE_KEYS.market, JSON.stringify(allListings));
}

function saveTransaction(tx) {
  const txns = safeParseJSON(localStorage.getItem(STORAGE_KEYS.txn), []);
  txns.push(tx);
  localStorage.setItem(STORAGE_KEYS.txn, JSON.stringify(txns));
}

function mergeListings(seed, saved) {
  const map = new Map();
  [...(seed || []), ...(saved || [])].forEach(item => {
    if (item && item.listingId) map.set(item.listingId, item);
  });
  return [...map.values()];
}

async function loadSeedMarketplace() {
  try {
    const res = await fetch(MARKETPLACE_JSON_URL);
    if (!res.ok) throw new Error('Cannot fetch marketplace.json');
    const data = await res.json();
    seedListings = Array.isArray(data) ? data : (data.listings || []);
  } catch (err) {
    console.error(err);
    seedListings = [];
  }
}

async function initMarketplace() {
  refreshCurrentUser();

  await loadSeedMarketplace();

  const savedMarket = safeParseJSON(localStorage.getItem(STORAGE_KEYS.market), []);
  allListings = mergeListings(seedListings, savedMarket);
  allOrders = safeParseJSON(localStorage.getItem(STORAGE_KEYS.orders), []);
  allDesigns = safeParseJSON(localStorage.getItem(STORAGE_KEYS.designs), []);

  if (!localStorage.getItem(STORAGE_KEYS.market) && seedListings.length) {
    localStorage.setItem(STORAGE_KEYS.market, JSON.stringify(seedListings));
  }

  setAuthWarning(false);

  const requestedTab = getRequestedTab();
  if (requestedTab === '5.1' || requestedTab === '5.2' || requestedTab === 'my') {
    if (!getCurrentUserId()) {
      setAuthWarning(true, '⚠️ Bạn cần đăng nhập để đăng bán hoặc xem listing của mình.');
      if (typeof redirectToLogin === 'function') {
        redirectToLogin(`../interface/marketplace.html?tab=${requestedTab}`);
      } else {
        window.location.href = '../interface/login.html';
      }
      return;
    }
  }

  switchTab(requestedTab);
}

function getRequestedTab() {
  const params = new URLSearchParams(window.location.search);
  const tab = params.get('tab');
  return ['5.1', '5.2', '5.3', 'my'].includes(tab) ? tab : '5.3';
}

async function submitDesignListing() {
  if (!requireMarketplaceAuth(`../interface/marketplace.html?tab=5.1`)) return;

  const sellerId = getCurrentUserId();
  const sellerName = getCurrentUserName();

  const designId = document.getElementById('design-select').value;
  const title = document.getElementById('listing-title-51').value.trim();
  const desc = document.getElementById('listing-desc-51').value.trim();
  const tags = document.getElementById('listing-tags-51').value
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
  const sellerPrice = parseFloat(document.getElementById('seller-price-51').value);

  if (!designId) { showToast('⚠️ Vui lòng chọn thiết kế!'); return; }
  if (!title) { showToast('⚠️ Vui lòng nhập tiêu đề!'); return; }
  if (!desc) { showToast('⚠️ Vui lòng nhập mô tả!'); return; }
  if (!sellerPrice || sellerPrice < 10000) { showToast('⚠️ Giá bán không hợp lệ!'); return; }

  const design = allDesigns.find(d => d.designId === designId);
  if (!design) { showToast('⚠️ Không tìm thấy thiết kế đã lưu!'); return; }

  const watermarkedBase64 = await addWatermark(
    design.thumbnailBase64,
    sellerId,
    sellerName
  );

  const platformFee = calcDisplayPrice(sellerPrice) - sellerPrice;

  const listing = {
    listingId: genId('MAR'),
    type: 'design',
    sellerId,
    sellerName,
    productId: design.productId,
    designId: design.designId,
    orderId: null,
    color: null,
    size: null,
    title,
    description: desc,
    tags,
    thumbnailBase64: design.thumbnailBase64,
    watermarkedBase64,
    sellerPrice,
    displayPrice: calcDisplayPrice(sellerPrice),
    platformFee,
    quantity: null,
    soldQuantity: 0,
    income: 0,
    status: 'Đang bán',
    reportCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  saveListing(listing);
  showToast('✅ Đã đăng bán thiết kế thành công!');
  showSuccessCard('design', listing);
  loadMyDesigns();
  renderBuyTab();
  renderMyListings();
}

function addWatermark(thumbnailBase64, userId, userName) {
  return new Promise((resolve) => {
    const cvs = document.createElement('canvas');
    cvs.width = 500;
    cvs.height = 500;
    const ctx = cvs.getContext('2d');

    const img = new Image();
    img.onload = function () {
      ctx.drawImage(img, 0, 0, 500, 500);

      const wmText = `${userId} · ${userName}`;
      ctx.font = 'bold 15px Arial';
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 3;

      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 2; col++) {
          ctx.save();
          ctx.translate(125 + col * 250, 100 + row * 150);
          ctx.rotate(-Math.PI / 6);
          ctx.fillStyle = 'rgba(255,255,255,0.40)';
          ctx.fillText(wmText, 0, 0);
          ctx.restore();
        }
      }

      ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      ctx.lineWidth = 1;
      ctx.strokeRect(1, 1, 498, 498);

      resolve(cvs.toDataURL('image/png', 0.75));
    };
    img.src = thumbnailBase64;
  });
}

// ══════════════════════════════════════════════════════
// 5.1 — ĐĂNG BÁN THIẾT KẾ
// ══════════════════════════════════════════════════════

function loadMyDesigns() {
  const container = document.getElementById('design-select');
  if (!container) return;

  if (!getCurrentUserId()) {
    container.innerHTML = '<option value="">-- Vui lòng đăng nhập --</option>';
    return;
  }

  const myDesigns = allDesigns.filter(d => d.userId === getCurrentUserId());
  container.innerHTML = '<option value="">-- Chọn thiết kế --</option>' +
    myDesigns.map(d =>
      `<option value="${d.designId}">${d.designId} | ${d.productId} | ${new Date(d.savedAt).toLocaleDateString('vi-VN')}</option>`
    ).join('');

  container.onchange = function () {
    const design = myDesigns.find(d => d.designId === this.value);
    if (design) {
      document.getElementById('design-preview-img').src = design.thumbnailBase64;
      document.getElementById('design-preview-wrap').style.display = 'block';
    } else {
      document.getElementById('design-preview-wrap').style.display = 'none';
    }
  };
}

document.addEventListener('DOMContentLoaded', () => {
  const priceInput51 = document.getElementById('seller-price-51');
  if (priceInput51) {
    priceInput51.addEventListener('input', function () {
      const v = parseFloat(this.value) || 0;
      const display = calcDisplayPrice(v);
      document.getElementById('display-price-51').textContent =
        v > 0 ? `Giá hiển thị trên web: ${formatPrice(display)} (bao gồm phí sàn ${PLATFORM_CONFIG.feePercent}%)` : '';
    });
  }

  const priceInput52 = document.getElementById('seller-price-52');
  if (priceInput52) {
    priceInput52.addEventListener('input', function () {
      const v = parseFloat(this.value) || 0;
      const display = calcDisplayPrice(v);
      document.getElementById('display-price-52').textContent =
        v > 0 ? `Giá hiển thị: ${formatPrice(display)} (phí sàn ${PLATFORM_CONFIG.feePercent}%)` : '';
    });
  }
});

// Submit đăng bán thiết kế
function submitDesignListing() {
  if (!requireMarketplaceAuth(`../interface/marketplace.html?tab=5.1`)) return;

  const sellerId = getCurrentUserId();
  const sellerName = getCurrentUserName();

  const designId = document.getElementById('design-select').value;
  const title = document.getElementById('listing-title-51').value.trim();
  const desc = document.getElementById('listing-desc-51').value.trim();
  const tags = document.getElementById('listing-tags-51').value
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
  const sellerPrice = parseFloat(document.getElementById('seller-price-51').value);

  if (!designId) { showToast('⚠️ Vui lòng chọn thiết kế!'); return; }
  if (!title) { showToast('⚠️ Vui lòng nhập tiêu đề!'); return; }
  if (!desc) { showToast('⚠️ Vui lòng nhập mô tả!'); return; }
  if (!sellerPrice || sellerPrice < 10000) { showToast('⚠️ Giá bán không hợp lệ!'); return; }

  const design = allDesigns.find(d => d.designId === designId);
  if (!design) { showToast('⚠️ Không tìm thấy thiết kế đã lưu!'); return; }

  addWatermark(design.thumbnailBase64, sellerId, sellerName).then((watermarkedBase64) => {
    const platformFee = calcDisplayPrice(sellerPrice) - sellerPrice;

    const listing = {
      listingId: genId('MAR'),
      type: 'design',
      sellerId,
      sellerName,
      productId: design.productId,
      designId,
      orderId: null,
      color: null,
      size: null,
      title,
      description: desc,
      tags,
      thumbnailBase64: design.thumbnailBase64,
      watermarkedBase64,
      sellerPrice,
      displayPrice: calcDisplayPrice(sellerPrice),
      platformFee,
      quantity: null,
      soldQuantity: 0,
      income: 0,
      status: 'Đang bán',
      reportCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    saveListing(listing);
    showToast('✅ Đã đăng bán thiết kế thành công!');
    showSuccessCard('design', listing);
    loadMyDesigns();
    renderBuyTab();
    renderMyListings();
  });
}

// ══════════════════════════════════════════════════════
// 5.2 — ĐĂNG BÁN SẢN PHẨM ĐÃ IN ẤN
// ══════════════════════════════════════════════════════

function loadMyOrders() {
  const container = document.getElementById('order-list-52');
  if (!container) return;

  if (!getCurrentUserId()) {
    container.innerHTML = '<div class="empty-state">Vui lòng đăng nhập để xem đơn hàng.</div>';
    return;
  }

  let myOrders = allOrders.filter(o =>
    o.custId === getCurrentUserId() && o.status === 'Hoàn tất'
  );

  if (!myOrders.length && MARKETPLACE_DEMO_MODE) {
    seedDemoOrders();
    myOrders = allOrders.filter(o =>
      o.custId === getCurrentUserId() && o.status === 'Hoàn tất'
    );
  }

  if (!myOrders.length) {
    container.innerHTML = '<div class="empty-state">Bạn chưa có đơn hàng nào hoàn tất.</div>';
    return;
  }

  container.innerHTML = myOrders.map(order =>
    order.items.map(item => {
      const soldListings = allListings.filter(l =>
        l.orderId === order.orderId &&
        l.sellerId === getCurrentUserId() &&
        l.status !== 'Đã gỡ'
      );
      const totalListed = soldListings.reduce((sum, l) => sum + (l.quantity || 0), 0);
      const maxQty = item.qty - totalListed;
      const canSell = maxQty > 0;

      return `
        <div class="order-item-card ${canSell ? '' : 'exhausted'}">
          <img src="${item.thumbnailBase64 || 'images/products/placeholder.png'}"
               alt="${item.productName}" class="order-item-thumb">
          <div class="order-item-info">
            <div class="oi-name">${item.productName || item.productId}</div>
            <div class="oi-meta">Đơn: ${order.orderId}</div>
            <div class="oi-meta">
              Đã nhận: ${item.qty} | Đã đăng bán: ${totalListed} | Còn bán: <strong>${maxQty}</strong>
            </div>
            <div class="oi-price">Giá gốc: ${formatPrice(item.price)}</div>
          </div>
          <button class="btn-select-item ${canSell ? '' : 'btn-disabled'}"
                  onclick="${canSell ? `selectOrderItem('${order.orderId}','${item.productId}','${item.designId}',${item.qty},${totalListed},${item.price},'${item.productName}','${item.thumbnailBase64 || ''}','${item.color || ''}','${item.size || ''}')` : ''}"
                  ${canSell ? '' : 'disabled'}>
            ${canSell ? 'Chọn bán' : 'Hết hàng'}
          </button>
        </div>`;
    }).join('')
  ).join('');
}

function selectOrderItem(orderId, productId, designId, totalQty, listedQty, originalPrice, productName, thumbnailBase64, color, size) {
  selectedOrderItem = {
    orderId, productId, designId, totalQty, listedQty, originalPrice,
    productName, thumbnailBase64, color, size
  };

  const maxQty = totalQty - listedQty;

  document.getElementById('item-name-52').value = productName || productId;
  document.getElementById('item-maxqty-52').textContent = `Tối đa: ${maxQty}`;
  document.getElementById('item-qty-52').max = maxQty;
  document.getElementById('item-qty-52').value = 1;
  document.getElementById('item-original-price-52').textContent = `Giá gốc: ${formatPrice(originalPrice)}`;

  document.getElementById('form-52-wrap').style.display = 'block';
  document.getElementById('form-52-wrap').scrollIntoView({ behavior: 'smooth' });
  showToast(`✅ Đã chọn ${productName || productId} từ đơn ${orderId}`);
}

document.addEventListener('DOMContentLoaded', () => {
  const qtyInput = document.getElementById('item-qty-52');
  if (qtyInput) {
    qtyInput.addEventListener('input', function () {
      if (!selectedOrderItem) return;
      const maxQty = selectedOrderItem.totalQty - selectedOrderItem.listedQty;
      if (parseInt(this.value) > maxQty) {
        this.value = maxQty;
        showToast(`⚠️ Số lượng tối đa có thể bán: ${maxQty}`);
      }
    });
  }
});

function submitProductListing() {
  if (!requireMarketplaceAuth(`../interface/marketplace.html?tab=5.2`)) return;

  if (!selectedOrderItem) {
    showToast('⚠️ Vui lòng chọn sản phẩm từ lịch sử!');
    return;
  }

  const sellerId = getCurrentUserId();
  const sellerName = getCurrentUserName();

  const title = document.getElementById('item-name-52').value.trim();
  const qty = parseInt(document.getElementById('item-qty-52').value);
  const sellerPrice = parseFloat(document.getElementById('seller-price-52').value);
  const maxQty = selectedOrderItem.totalQty - selectedOrderItem.listedQty;

  if (!title) { showToast('⚠️ Vui lòng nhập tên sản phẩm!'); return; }
  if (!qty || qty < 1) { showToast('⚠️ Số lượng phải ≥ 1!'); return; }
  if (qty > maxQty) {
    showToast(`❌ Số lượng vượt quá giới hạn! Tối đa: ${maxQty}`);
    return;
  }
  if (!sellerPrice || sellerPrice <= 0) {
    showToast('⚠️ Giá bán phải > 0!');
    return;
  }

  const design = allDesigns.find(d => d.designId === selectedOrderItem.designId);
  const thumbnail = design ? design.thumbnailBase64 : selectedOrderItem.thumbnailBase64 || '';

  const listing = {
    listingId: genId('MAR'),
    type: 'product',
    sellerId,
    sellerName,
    productId: selectedOrderItem.productId,
    designId: selectedOrderItem.designId,
    orderId: selectedOrderItem.orderId,
    color: selectedOrderItem.color || 'white',
    size: selectedOrderItem.size || 'M',
    title,
    description: document.getElementById('item-desc-52').value.trim(),
    tags: [],
    thumbnailBase64: thumbnail,
    watermarkedBase64: null,
    sellerPrice,
    displayPrice: calcDisplayPrice(sellerPrice),
    platformFee: calcDisplayPrice(sellerPrice) - sellerPrice,
    quantity: qty,
    soldQuantity: 0,
    income: 0,
    status: 'Đang bán',
    reportCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  saveListing(listing);

  showToast('✅ Đã đăng bán sản phẩm thành công!');
  showSuccessCard('product', listing);

  document.getElementById('form-52-wrap').style.display = 'none';
  document.getElementById('item-qty-52').value = 1;
  document.getElementById('seller-price-52').value = '';
  document.getElementById('display-price-52').textContent = '';
  selectedOrderItem = null;
  loadMyOrders();
}

function seedDemoOrders() {
  if (!getCurrentUserId() || allOrders.length > 0) return;

  allOrders = [
    {
      orderId: 'OD-DEMO-001',
      custId: getCurrentUserId(),
      status: 'Hoàn tất',
      completedAt: new Date().toISOString(),
      items: [
        {
          productId: 'p001',
          productName: 'Áo Thun Unisex Basic',
          designId: 'DSN-DEMO-001',
          thumbnailBase64: 'images/products/tshirt-demo.png',
          qty: 2,
          price: 150000,
          color: 'white',
          size: 'M'
        },
        {
          productId: 'p005',
          productName: 'Tote Bag Canvas',
          designId: 'DSN-DEMO-002',
          thumbnailBase64: 'images/products/tote-demo.png',
          qty: 1,
          price: 85000,
          color: 'natural',
          size: 'One Size'
        }
      ]
    }
  ];

  localStorage.setItem(STORAGE_KEYS.orders, JSON.stringify(allOrders));
  showToast('✅ Đã tạo dữ liệu demo đơn hoàn tất');
}

// ══════════════════════════════════════════════════════
// 5.3 — MUA THIẾT KẾ / SẢN PHẨM CỦA NGƯỜI KHÁC
// ══════════════════════════════════════════════════════

function renderBuyTab() {
  const container = document.getElementById('buy-listing-grid');
  if (!container) return;

  const keyword = searchQuery53.toLowerCase().trim();

  let listings = allListings.filter(l => l.status === 'Đang bán');

  if (activeFilter53 !== 'all') {
    listings = listings.filter(l => l.type === activeFilter53);
  }

  if (keyword) {
    listings = listings.filter(l => {
      const hay = [
        l.title,
        l.description,
        ...(l.tags || []),
        l.productId,
        l.designId,
        l.sellerName
      ].join(' ').toLowerCase();
      return hay.includes(keyword);
    });
  }

  if (!listings.length) {
    container.innerHTML = '<div class="empty-state" style="grid-column:1/-1">Không có listing phù hợp.</div>';
    return;
  }

  container.innerHTML = listings.map(l => {
    const remain = l.type === 'product'
      ? Math.max(0, (l.quantity || 0) - (l.soldQuantity || 0))
      : null;

    const previewImg = l.watermarkedBase64 || l.thumbnailBase64 || 'images/products/placeholder.png';

    return `
      <div class="listing-card" onclick="openListingDetail('${l.listingId}')">
        <div class="listing-img-wrap">
          <img src="${previewImg}" alt="${l.title}" class="listing-img">
          <span class="listing-type-badge ${l.type === 'design' ? 'badge-design' : 'badge-product'}">
            ${l.type === 'design' ? '🎨 Thiết kế' : '📦 Sản phẩm'}
          </span>
          ${l.type === 'product' ? `<span class="listing-qty-badge">Còn ${remain}</span>` : ''}
        </div>
        <div class="listing-info">
          <div class="listing-title">${l.title}</div>
          <div class="listing-tags">
            ${(l.tags || []).slice(0, 3).map(t => `<span class="tag">${t}</span>`).join('')}
          </div>
          <div class="listing-price">${formatPrice(l.displayPrice)}</div>
          <div class="listing-seller">bởi ${getSellerName(l.sellerId)}</div>
        </div>
      </div>
    `;
  }).join('');
}

// ── BÁO CÁO VI PHẠM ────────────────────────────────────
function reportListing(listingId) {
  if (!requireMarketplaceAuth(`../interface/marketplace.html?tab=5.3`)) return;

  if (!confirm('Bạn chắc chắn muốn báo cáo thiết kế này vi phạm bản quyền?')) return;

  const listing = allListings.find(l => l.listingId === listingId);
  if (!listing) return;

  listing.reportCount = (listing.reportCount || 0) + 1;

  if (listing.reportCount >= PLATFORM_CONFIG.maxReportBeforeHide) {
    listing.status = 'Tạm ẩn';
    listing.updatedAt = new Date().toISOString();
    showToast('⚠️ Thiết kế đã bị tạm ẩn do đủ báo cáo vi phạm.');
  } else {
    showToast(`📢 Đã báo cáo! (${listing.reportCount}/${PLATFORM_CONFIG.maxReportBeforeHide} báo cáo)`);
  }

  localStorage.setItem(STORAGE_KEYS.market, JSON.stringify(allListings));
  closeModal();
  renderBuyTab();
}

// ── GỠ BÁN (người bán tự gỡ) ──────────────────────────
function removeListing(listingId) {
  if (!requireMarketplaceAuth(`../interface/marketplace.html?tab=my`)) return;

  if (!confirm('Gỡ bán listing này? Lịch sử giao dịch sẽ được giữ lại.')) return;
  updateListing(listingId, { status: 'Đã gỡ' });
  allListings = safeParseJSON(localStorage.getItem(STORAGE_KEYS.market), []);
  showToast('✅ Đã gỡ bán listing.');
  renderMyListings();
}

// ── DANH SÁCH CỦA TÔI (người bán xem) ────────────────
function renderMyListings() {
  const container = document.getElementById('my-listings-container');
  if (!container) return;

  if (!getCurrentUserId()) {
    container.innerHTML = '<div class="empty-state">Vui lòng đăng nhập để xem listing của bạn.</div>';
    return;
  }

  const myListings = allListings.filter(l => l.sellerId === getCurrentUserId());
  if (!myListings.length) {
    container.innerHTML = '<div class="empty-state">Bạn chưa có listing nào.</div>';
    return;
  }

  container.innerHTML = myListings.map(l => `
    <div class="my-listing-row">
      <img src="${l.thumbnailBase64 || ''}" alt="${l.title}" class="my-listing-thumb">
      <div class="my-listing-info">
        <div class="my-listing-title">${l.title}</div>
        <div class="my-listing-meta">
          <span class="status-badge status-${String(l.status).replace(/\s/g,'-')}">${l.status}</span>
          ${l.type === 'design'
            ? `Đã bán: ${l.soldQuantity} lần`
            : `Đã bán: ${l.soldQuantity}/${l.quantity}`}
          &nbsp;·&nbsp; ${formatPrice(l.displayPrice)}
          &nbsp;·&nbsp; Báo cáo: ${l.reportCount || 0}
        </div>
      </div>
      ${l.status === 'Đang bán'
        ? `<button class="btn-remove" onclick="removeListing('${l.listingId}')">Gỡ bán</button>`
        : '<span style="font-size:12px;color:#94A3B8">Đã gỡ</span>'}
    </div>
  `).join('');
}

function getSellerName(sellerId) {
  const users = safeParseJSON(localStorage.getItem('printify_users'), []);
  const user = users.find(u => u.userId === sellerId);
  return user ? (user.name || user.custName || user.adName || 'Người dùng') : 'Người dùng ẩn danh';
}

// Mở chi tiết listing
function openListingDetail(listingId) {
  const l = allListings.find(x => x.listingId === listingId);
  if (!l) return;

  document.getElementById('modal-img').src = l.watermarkedBase64 || l.thumbnailBase64 || '';
  document.getElementById('modal-title').textContent = l.title;
  document.getElementById('modal-desc').textContent = l.description || 'Không có mô tả';
  document.getElementById('modal-type').textContent = l.type === 'design' ? '🎨 Thiết kế' : '📦 Sản phẩm in';
  document.getElementById('modal-price').textContent = formatPrice(l.displayPrice);
  document.getElementById('modal-seller').textContent = 'Người bán: ' + getSellerName(l.sellerId);
  document.getElementById('modal-wm-note').style.display = l.type === 'design' ? 'block' : 'none';

  const qtyWrap = document.getElementById('modal-qty-wrap');
  const editorBtn = document.getElementById('modal-btn-editor');
  const cartBtn = document.getElementById('modal-btn-cart');

  if (l.type === 'product') {
    const remain = Math.max(0, (l.quantity || 0) - (l.soldQuantity || 0));
    qtyWrap.style.display = 'flex';
    document.getElementById('modal-qty-label').textContent = `Còn lại: ${remain}`;
    document.getElementById('modal-qty-input').max = remain;
    document.getElementById('modal-qty-input').value = 1;
    editorBtn.textContent = '✏️ Mở trong Editor';
    cartBtn.textContent = '🛒 Mua & Thêm vào giỏ hàng';
  } else {
    qtyWrap.style.display = 'none';
    editorBtn.textContent = '✏️ Mở trong Editor để chỉnh sửa thêm';
    cartBtn.textContent = '🛒 Mua thiết kế & Thêm vào giỏ hàng';
  }

  editorBtn.onclick = () => {
    closeModal();
    buyAndOpenEditor(l);
  };
  cartBtn.onclick = () => {
    closeModal();
    buyAndAddToCart(l);
  };
  document.getElementById('modal-btn-report').onclick = () => reportListing(l.listingId);

  openModal();
}

// Mua để mở trong editor (5.3 → NV04)
function buyAndOpenEditor(listing) {
  if (!requireMarketplaceAuth(`../interface/marketplace.html?tab=5.3`)) return;

  const qty = listing.type === 'product'
    ? parseInt(document.getElementById('modal-qty-input').value) || 1
    : 1;

  if (listing.type === 'product') {
    const remain = Math.max(0, (listing.quantity || 0) - (listing.soldQuantity || 0));
    if (qty > remain) {
      showToast(`⚠️ Số lượng vượt quá giới hạn! Tối đa: ${remain}`);
      return;
    }
  }

  processPurchase(listing, qty);

  const targetDesignId = listing.designId || listing.productId || '';
  if (targetDesignId) {
    sessionStorage.setItem('load_design_id', targetDesignId);
  }

  showToast('✅ Đã mua! Đang mở editor...');
  setTimeout(() => {
    window.location.href = 'editor.html?designId=' + encodeURIComponent(targetDesignId);
  }, 1200);
}

// Mua và thêm vào giỏ (5.3 → NV06)
function buyAndAddToCart(listing) {
  if (!requireMarketplaceAuth(`../interface/marketplace.html?tab=5.3`)) return;

  const qty = listing.type === 'product'
    ? parseInt(document.getElementById('modal-qty-input').value) || 1
    : 1;

  if (listing.type === 'product') {
    const remain = Math.max(0, (listing.quantity || 0) - (listing.soldQuantity || 0));
    if (qty > remain) {
      showToast(`⚠️ Số lượng vượt quá giới hạn! Tối đa: ${remain}`);
      return;
    }
  }

  processPurchase(listing, qty);

  const cartItem = {
    cartItemId: genId('CI'),
    userId: getCurrentUserId(),
    productId: listing.productId,
    designId: listing.designId,
    color: listing.color || 'white',
    size: listing.size || 'M',
    quantity: qty,
    unitPrice: listing.displayPrice,
    thumbnailBase64: listing.thumbnailBase64,
    fromListing: listing.listingId
  };

  const cart = safeParseJSON(localStorage.getItem('printify_cart'), []);
  cart.push(cartItem);
  localStorage.setItem('printify_cart', JSON.stringify(cart));

  showToast('🛒 Đã thêm vào giỏ hàng!');
  closeModal();
}

// Xử lý giao dịch: lưu DS9, cập nhật DS8 soldQuantity
function processPurchase(listing, qty) {
  const tx = {
    txId: genId('TX'),
    listingId: listing.listingId,
    buyerId: getCurrentUserId(),
    sellerId: listing.sellerId,
    amount: listing.displayPrice * qty,
    sellerReceived: listing.sellerPrice * qty,
    platformFee: (listing.displayPrice - listing.sellerPrice) * qty,
    qty,
    createdAt: new Date().toISOString()
  };
  saveTransaction(tx);

  const updatedListing = allListings.find(l => l.listingId === listing.listingId);
  if (updatedListing) {
    updatedListing.soldQuantity = (updatedListing.soldQuantity || 0) + qty;

    if (updatedListing.type === 'product' &&
        updatedListing.soldQuantity >= updatedListing.quantity) {
      updatedListing.status = 'Hết hàng';
    }
    updatedListing.updatedAt = new Date().toISOString();
    localStorage.setItem(STORAGE_KEYS.market, JSON.stringify(allListings));
  }
}