// ════════════════════════════════════════════════════════
// marketplace-part2.js
// Chứa: TAB SWITCHING, MODAL, SEARCH/FILTER,
//        SUCCESS CARD, TOAST, UI HELPERS, INIT CALL
// ════════════════════════════════════════════════════════

// ── TAB SWITCHING ──────────────────────────────────────
function switchTab(tab) {
  currentTab = tab;

  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });

  document.querySelectorAll('.tab-panel').forEach(p => p.style.display = 'none');

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

// ── SEARCH & FILTER (Tab 5.3) ──────────────────────────
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

// ── MODAL ──────────────────────────────────────────────
function openModal() {
  document.getElementById('listing-modal').classList.add('show');
  document.body.style.overflow = 'hidden';
}
function closeModal() {
  document.getElementById('listing-modal').classList.remove('show');
  document.body.style.overflow = '';
}
// Click overlay đóng modal
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('listing-modal').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeModal();
  });
});

// ── SUCCESS CARD (hiện sau khi đăng bán thành công) ────
function showSuccessCard(type, listing) {
  const panel  = type === 'design' ? 'panel-51' : 'panel-52';
  const cardId = type === 'design' ? 'success-51' : 'success-52';

  // Tạo hoặc cập nhật success card
  let card = document.getElementById(cardId);
  if (!card) {
    card = document.createElement('div');
    card.id = cardId;
    card.className = 'success-card';
    document.getElementById(panel).prepend(card);
  }
  card.innerHTML = `
    <div class="success-icon">✅</div>
    <div class="success-title">Đăng bán thành công!</div>
    <div class="success-details">
      <strong>${listing.title}</strong><br>
      Giá bán: ${formatPrice(listing.sellerPrice)} → Hiển thị: <strong>${formatPrice(listing.displayPrice)}</strong><br>
      Phí sàn ${PLATFORM_CONFIG.feePercent}%: ${formatPrice(listing.displayPrice - listing.sellerPrice)}<br>
      ID: <code>${listing.listingId}</code>
    </div>
    <div style="display:flex;gap:8px;margin-top:10px">
      <button class="btn-secondary" onclick="switchTab('my')">📋 Xem listing của tôi</button>
      <button class="btn-secondary" onclick="switchTab('5.3')">🛍 Xem marketplace</button>
    </div>
  `;
  card.style.display = 'block';
  card.scrollIntoView({ behavior: 'smooth' });
}

// ── TOAST ──────────────────────────────────────────────
let toastTimer;
function showToast(msg, duration = 3000) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), duration);
}

// ── INIT ───────────────────────────────────────────────
// Gọi sau khi DOM ready
document.addEventListener('DOMContentLoaded', () => {
  initMarketplace();

  if (!sessionStorage.getItem('printify_session')) {
    const demoUser = { userId: 'u0099', name: 'Demo User', email: 'demo@printify.vn' };
    sessionStorage.setItem('printify_session', JSON.stringify(demoUser));
    location.reload();
  }
});