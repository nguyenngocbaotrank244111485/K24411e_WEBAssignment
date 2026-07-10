// marketplace2.js
let toastTimer;
let activeFilter53 = 'all';
let searchQuery53 = '';

function getRequestedTabSafe() {
  const params = new URLSearchParams(window.location.search);
  const tab = params.get('tab');
  return ['5.1', '5.2', '5.3', 'my'].includes(tab) ? tab : '5.3';
}

function switchTab(tab) {
  const protectedTabs = ['5.1', '5.2', 'my'];
  const guest = !(typeof isLoggedIn === 'function' ? isLoggedIn() : !!getCurrentUserId());

  if (protectedTabs.includes(tab) && guest) {
    setAuthWarning(true, '⚠️ Bạn cần đăng nhập để đăng bán hoặc xem listing của mình.');
    showToast('Vui lòng đăng nhập để dùng tính năng này.');

    if (typeof redirectToLogin === 'function') {
      redirectToLogin(`../interface/marketplace.html?tab=${tab}`);
    } else {
      window.location.href = '../interface/login.html';
    }
    return;
  }

  currentTab = tab;
  setAuthWarning(false);

  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });

  document.querySelectorAll('.tab-panel').forEach(p => (p.style.display = 'none'));

  switch (tab) {
    case '5.1':
      document.getElementById('panel-51').style.display = 'block';
      loadMyDesigns();
      break;

    case '5.2':
      document.getElementById('panel-52').style.display = 'block';
      loadMyOrders();
      break;

    case '5.3':
      document.getElementById('panel-53').style.display = 'block';
      renderBuyTab();
      break;

    case 'my':
      document.getElementById('panel-my').style.display = 'block';
      renderMyListings();
      break;
  }
}

function handleSearch53(value) {
  searchQuery53 = value.trim();
  renderBuyTab();
}

function handleFilter53(type) {
  activeFilter53 = type;
  document.querySelectorAll('.filter-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.filter === type)
  );
  renderBuyTab();
}

function openModal() {
  const modal = document.getElementById('listing-modal');
  if (!modal) return;
  modal.classList.remove('hidden');
  modal.classList.add('show');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  const modal = document.getElementById('listing-modal');
  if (!modal) return;
  modal.classList.remove('show');
  modal.classList.add('hidden');
  document.body.style.overflow = '';
}

function showSuccessCard(type, listing) {
  const panel = type === 'design' ? 'panel-51' : 'panel-52';
  const cardId = type === 'design' ? 'success-51' : 'success-52';

  let card = document.getElementById(cardId);
  if (!card) {
    card = document.createElement('div');
    card.id = cardId;
    card.className = 'success-card';
    const panelEl = document.getElementById(panel);
    if (!panelEl) return;
    panelEl.prepend(card);
  }

  card.innerHTML = `
    <div class="success-icon">✅</div>
    <div class="success-title">Đăng bán thành công!</div>
    <div class="success-details">
      <strong>${listing.title}</strong><br>
      Giá bán: ${formatPrice(listing.sellerPrice)} → Hiển thị: <strong>${formatPrice(listing.displayPrice)}</strong><br>
      Phí sàn ${PLATFORM_CONFIG.feePercent}%: ${formatPrice((listing.platformFee || (listing.displayPrice - listing.sellerPrice)))}
      <br>
      ID: <code>${listing.listingId}</code>
    </div>
    <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap">
      <button class="btn-secondary" onclick="switchTab('my')">📋 Xem listing của tôi</button>
      <button class="btn-secondary" onclick="switchTab('5.3')">🛍 Xem marketplace</button>
    </div>
  `;
  card.style.display = 'block';
  card.scrollIntoView({ behavior: 'smooth' });
}

function showToast(msg, duration = 3000) {
  const t = document.getElementById('toast');
  if (!t) return;

  t.textContent = msg;
  t.classList.add('show');

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), duration);
}

function renderMyListingsSafe() {
  renderMyListings();
}

document.addEventListener('DOMContentLoaded', () => {
  const overlay = document.getElementById('listing-modal');
  if (overlay) {
    overlay.addEventListener('click', e => {
      if (e.target === e.currentTarget) closeModal();
    });
  }

  initMarketplace();
  closeModal();
});

window.addEventListener('printify-auth-changed', () => {
  refreshCurrentUser();

  if (!getCurrentUserId() && ['5.1', '5.2', 'my'].includes(currentTab)) {
    currentTab = '5.3';
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === '5.3');
    });
    document.querySelectorAll('.tab-panel').forEach(p => (p.style.display = 'none'));
    document.getElementById('panel-53').style.display = 'block';
    renderBuyTab();
    setAuthWarning(false);
    return;
  }

  switch (currentTab) {
    case '5.1':
      loadMyDesigns();
      break;
    case '5.2':
      loadMyOrders();
      break;
    case '5.3':
      renderBuyTab();
      break;
    case 'my':
      renderMyListingsSafe();
      break;
  }
});