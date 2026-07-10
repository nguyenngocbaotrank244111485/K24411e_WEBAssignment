/* =========================
   PROFILE PAGE LOGIC
   ========================= */

let currentUser = null;

document.addEventListener("DOMContentLoaded", async () => {
  updateCartBadge();

  currentUser = loadCurrentProfileUser();
  if (!currentUser) {
    showGuestState();
    return;
  }

  showProfileState();
  renderSidebar();
  renderInfoTab();
  renderSavedShipping();
  await renderHistoryTab();
  renderRecentOrdersTab();
});

/* ---------- HELPERS ---------- */
function normalize(v) {
  return String(v ?? "").trim().toLowerCase();
}

function getUserKey(user) {
  return user?.userId || user?.custId || user?.adId || user?.id || "";
}

function getUserName(user) {
  return user?.name || user?.custName || user?.adName || "—";
}

function getUserEmail(user) {
  return user?.email || user?.custEmail || user?.adEmail || "—";
}

function getUserAvatar(user) {
  return user?.avatar || user?.custAvatar || user?.adAvatar || "../images/default-avatar.png";
}

function getPasswordHash(user) {
  return user?.passwordHash || user?.custPasswordHash || user?.password || "";
}

function getUsers() {
  try {
    return JSON.parse(localStorage.getItem("printify_users") || "[]");
  } catch {
    return [];
  }
}

function getProductsCache() {
  try {
    return JSON.parse(localStorage.getItem("printify_products_cache") || "[]");
  } catch {
    return [];
  }
}

async function getProductsForHistory() {
  const cached = getProductsCache();
  if (cached.length) return cached;

  try {
    const res = await fetch("../dataset/products.json");
    if (!res.ok) return [];
    const data = await res.json();
    const flat = Array.isArray(data)
      ? data
      : (data.categories || []).flatMap(cat => cat.products || []);
    return flat;
  } catch {
    return [];
  }
}

function loadCurrentProfileUser() {
  const sessionUser = typeof getCurrentUser === "function" ? getCurrentUser() : null;
  if (!sessionUser) return null;

  const users = getUsers();
  const sid = normalize(getUserKey(sessionUser));
  const semail = normalize(getUserEmail(sessionUser));

  const stored = users.find(u =>
    normalize(getUserKey(u)) === sid ||
    normalize(getUserEmail(u)) === semail
  );

  return stored ? { ...stored, ...sessionUser } : sessionUser;
}

function persistCurrentUser() {
  if (!currentUser) return;

  const users = getUsers();
  const uid = normalize(getUserKey(currentUser));
  const uemail = normalize(getUserEmail(currentUser));

  const idx = users.findIndex(u =>
    normalize(getUserKey(u)) === uid ||
    normalize(getUserEmail(u)) === uemail
  );

  const payload = { ...currentUser };

  if (idx !== -1) {
    users[idx] = { ...users[idx], ...payload };
  } else {
    users.push(payload);
  }

  localStorage.setItem("printify_users", JSON.stringify(users));

  const remember = !!localStorage.getItem("printify_current_customer");
  if (typeof setCurrentUser === "function") {
    setCurrentUser(payload, remember);
  } else {
    sessionStorage.setItem("printify_current_customer", JSON.stringify(payload));
    if (remember) {
      localStorage.setItem("printify_current_customer", JSON.stringify(payload));
    }
  }

  currentUser = payload;
}

/* ---------- STATE SWITCH ---------- */
function showGuestState() {
  const guestBlock = document.getElementById("guest-block");
  const profileLayout = document.getElementById("profile-layout");
  if (guestBlock) guestBlock.style.display = "block";
  if (profileLayout) profileLayout.style.display = "none";
}

function showProfileState() {
  const guestBlock = document.getElementById("guest-block");
  const profileLayout = document.getElementById("profile-layout");
  if (guestBlock) guestBlock.style.display = "none";
  if (profileLayout) profileLayout.style.display = "grid";
}

/* ---------- TAB SWITCH ---------- */
function switchTab(tabName) {
  document.querySelectorAll(".profile-nav-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.tab === tabName);
  });

  document.querySelectorAll(".profile-tab-panel").forEach(panel => {
    panel.classList.toggle("active", panel.id === `tab-${tabName}`);
  });
}

/* ---------- SIDEBAR ---------- */
function renderSidebar() {
  const avatarSrc = getUserAvatar(currentUser);

  const sidebarAvatar = document.getElementById("sidebar-avatar");
  if (sidebarAvatar) {
    sidebarAvatar.src = avatarSrc;
    sidebarAvatar.onerror = function () {
      this.src = "../images/default-avatar.png";
    };
  }

  const sidebarName = document.getElementById("sidebar-name");
  const sidebarEmail = document.getElementById("sidebar-email");
  if (sidebarName) sidebarName.textContent = getUserName(currentUser);
  if (sidebarEmail) sidebarEmail.textContent = getUserEmail(currentUser);
}

/* ---------- TAB: ACCOUNT INFORMATION ---------- */
function renderInfoTab() {
  const infoAvatar = document.getElementById("info-avatar");
  if (infoAvatar) {
    infoAvatar.src = getUserAvatar(currentUser);
    infoAvatar.onerror = function () {
      this.src = "../images/default-avatar.png";
    };
  }

  const editName = document.getElementById("edit-name");
  const editEmail = document.getElementById("edit-email");
  if (editName) editName.value = getUserName(currentUser);
  if (editEmail) editEmail.value = getUserEmail(currentUser);

  const secQuestion = document.getElementById("sec-question");
  if (secQuestion && currentUser.secQuestion) {
    secQuestion.value = currentUser.secQuestion;
  }

  const secAnswer = document.getElementById("sec-answer");
  if (secAnswer) secAnswer.value = "";
}

/* ---------- AVATAR UPLOAD ---------- */
function handleAvatarChange(event) {
  if (!currentUser) return;

  const file = event.target.files[0];
  if (!file) return;

  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    showToast("Chỉ chấp nhận file JPG, PNG hoặc WebP.");
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    showToast("File ảnh quá lớn. Vui lòng chọn ảnh dưới 5MB.");
    return;
  }

  const reader = new FileReader();
  reader.onload = function (e) {
    const base64 = e.target.result;

    currentUser.avatar = base64;
    persistCurrentUser();

    const infoAvatar = document.getElementById("info-avatar");
    const sidebarAvatar = document.getElementById("sidebar-avatar");
    if (infoAvatar) infoAvatar.src = base64;
    if (sidebarAvatar) sidebarAvatar.src = base64;

    showToast("Đã cập nhật ảnh đại diện!");
  };
  reader.readAsDataURL(file);
}

/* ---------- SAVE PROFILE INFO ---------- */
function saveProfileInfo() {
  if (!currentUser) return;

  const nameInput = document.getElementById("edit-name");
  const name = nameInput ? nameInput.value.trim() : "";

  const err = document.getElementById("err-edit-name");
  if (err) err.textContent = "";
  if (nameInput) nameInput.classList.remove("field-invalid");

  if (!name) {
    if (err) err.textContent = "Vui lòng nhập họ và tên.";
    if (nameInput) nameInput.classList.add("field-invalid");
    return;
  }

  currentUser.name = name;
  persistCurrentUser();
  renderSidebar();

  showToast("Đã lưu thông tin tài khoản!");
}

/* ---------- SAVED SHIPPING INFO ---------- */
function renderSavedShipping() {
  const container = document.getElementById("saved-shipping-display");
  if (!container) return;

  const info = currentUser.savedShippingInfo || currentUser.shippingInfo || null;

  if (!info) {
    container.innerHTML = `<div class="empty-mini">Chưa có thông tin giao hàng nào được lưu. Thông tin sẽ được lưu tự động sau khi bạn đặt hàng lần đầu.</div>`;
    return;
  }

  container.innerHTML = `
    <div class="shipping-display-box">
      <strong>${info.name || "—"}</strong> · ${info.phone || "—"}<br>
      ${[info.address, info.ward, info.district, info.province].filter(Boolean).join(", ")}
    </div>
  `;
}

/* ---------- TAB: HISTORY OF PRODUCTS VIEWED ---------- */
async function renderHistoryTab() {
  const grid = document.getElementById("history-grid");
  if (!grid || !currentUser) return;

  const key = `printify_viewhistory_${getUserKey(currentUser)}`;
  let history = [];
  try {
    history = JSON.parse(localStorage.getItem(key) || "[]");
  } catch {
    history = [];
  }

  if (!history.length) {
    grid.innerHTML = `<div class="empty-mini" style="grid-column:1/-1">Bạn chưa xem sản phẩm nào.</div>`;
    return;
  }

  const products = await getProductsForHistory();

  const normalizedHistory = history
    .map(item => typeof item === "string" ? { productId: item, viewedAt: null } : item)
    .filter(item => item && item.productId);

  const html = normalizedHistory.map(h => {
    const product = products.find(p => (p.productId || p.id) === h.productId);
    if (!product) return "";

    return `
      <div class="history-card" onclick="window.location.href='productDetail.html?id=${product.productId || product.id}'">
        <div class="history-img-wrap">
          <img src="../${product.image || 'images/placeholder.png'}" onerror="this.src='../images/placeholder.png'">
        </div>
        <div class="history-info">
          <div class="history-name">${product.name || "—"}</div>
          <div class="history-time">${h.viewedAt ? formatRelativeTime(h.viewedAt) : "Vừa xem"}</div>
        </div>
      </div>
    `;
  }).join("");

  grid.innerHTML = html || `<div class="empty-mini" style="grid-column:1/-1">Bạn chưa xem sản phẩm nào.</div>`;
}

/* ---------- TAB: CURRENT ORDERS ---------- */
function renderRecentOrdersTab() {
  const container = document.getElementById("recent-orders-list");
  if (!container || !currentUser) return;

  const userId = getUserKey(currentUser);
  const orders = JSON.parse(localStorage.getItem("printify_orders") || "[]")
    .filter(o => (o.userId || o.custId) === userId || o.userId === userId || o.custId === userId)
    .sort((a, b) => new Date(b.createdAt || b.orderDate || 0) - new Date(a.createdAt || a.orderDate || 0))
    .slice(0, 5);

  if (orders.length === 0) {
    container.innerHTML = `<div class="empty-mini">Bạn chưa có đơn hàng nào. <a href="products.html" style="color:var(--mp-primary-dark);font-weight:700">Bắt đầu mua sắm</a></div>`;
    return;
  }

  container.innerHTML = orders.map(order => `
    <div class="recent-order-row" onclick="window.location.href='orders.html'">
      <div>
        <div class="ro-id">${order.orderId || "—"}</div>
        <div class="ro-date">${formatDate(order.createdAt || order.orderDate || new Date().toISOString())}</div>
      </div>
      <span class="status-badge ${statusToClass(order.status)}">${order.status || "—"}</span>
      <div class="ro-total">${formatVND(order.payment?.amount || order.total || 0)}</div>
    </div>
  `).join("");
}

/* ---------- SECURITY: ĐỔI MẬT KHẨU ---------- */
function changePassword() {
  if (!currentUser) return;

  clearSecurityErrors();

  const current = document.getElementById("current-password").value;
  const newPass = document.getElementById("new-password").value;
  const confirm = document.getElementById("confirm-password").value;

  let isValid = true;

  const currentHash = simpleHash(current);
  const storedHash = getPasswordHash(currentUser);

  if (!current) {
    setError("err-current-password", "current-password", "Vui lòng nhập mật khẩu hiện tại.");
    isValid = false;
  } else if (storedHash && currentHash !== storedHash) {
    setError("err-current-password", "current-password", "Mật khẩu hiện tại không đúng.");
    isValid = false;
  }

  const passRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
  if (!newPass) {
    setError("err-new-password", "new-password", "Vui lòng nhập mật khẩu mới.");
    isValid = false;
  } else if (!passRegex.test(newPass)) {
    setError("err-new-password", "new-password", "Mật khẩu cần ít nhất 8 ký tự, có chữ và số.");
    isValid = false;
  }

  if (confirm !== newPass) {
    setError("err-confirm-password", "confirm-password", "Xác nhận mật khẩu không khớp.");
    isValid = false;
  }

  if (!isValid) return;

  const hash = simpleHash(newPass);
  currentUser.passwordHash = hash;
  currentUser.custPasswordHash = hash;

  persistCurrentUser();

  document.getElementById("current-password").value = "";
  document.getElementById("new-password").value = "";
  document.getElementById("confirm-password").value = "";

  showToast("Đổi mật khẩu thành công!");
}

function clearSecurityErrors() {
  ["current-password", "new-password", "confirm-password"].forEach(id => {
    const input = document.getElementById(id);
    const err = document.getElementById("err-" + id);
    if (input) input.classList.remove("field-invalid");
    if (err) err.textContent = "";
  });
}

function setError(errId, inputId, message) {
  const err = document.getElementById(errId);
  const input = document.getElementById(inputId);
  if (err) err.textContent = message;
  if (input) input.classList.add("field-invalid");
}

/* ---------- SECURITY QUESTION ---------- */
function saveSecurityQuestion() {
  if (!currentUser) return;

  const question = document.getElementById("sec-question").value;
  const answer = document.getElementById("sec-answer").value.trim();

  if (!answer) {
    showToast("Vui lòng nhập câu trả lời bảo mật.");
    return;
  }

  currentUser.secQuestion = question;
  currentUser.secAnswer = simpleHash(answer.toLowerCase());
  currentUser.secAnswers = currentUser.secAnswer; // tương thích code cũ

  persistCurrentUser();

  document.getElementById("sec-answer").value = "";
  showToast("Đã lưu câu hỏi bảo mật!");
}

/* ---------- LOGOUT ---------- */
function confirmLogout() {
  const modal = document.getElementById("confirm-modal");
  if (modal) modal.style.display = "flex";
}

function closeConfirmModal() {
  const modal = document.getElementById("confirm-modal");
  if (modal) modal.style.display = "none";
}

function doLogout() {
  if (typeof clearCurrentUser === "function") {
    clearCurrentUser();
  } else {
    sessionStorage.removeItem("printify_current_customer");
    localStorage.removeItem("printify_current_customer");
  }
  window.location.href = "index.html";
}

/* ---------- FORMAT HELPERS ---------- */
function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return "h" + hash.toString(36);
}

function formatVND(amount) {
  return Number(amount || 0).toLocaleString("vi-VN") + "₫";
}

function formatDate(isoString) {
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("vi-VN");
}

function formatRelativeTime(isoString) {
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return "Vừa xem";

  const diffMs = Date.now() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "Vừa xem";
  if (diffMin < 60) return `${diffMin} phút trước`;

  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} giờ trước`;

  const diffDay = Math.floor(diffHour / 24);
  return `${diffDay} ngày trước`;
}

function statusToClass(status) {
  const map = {
    "Chờ xác nhận": "status-cho-xac-nhan",
    "Đang xử lý": "status-dang-xu-ly",
    "Đang giao": "status-dang-giao",
    "Hoàn tất": "status-hoan-tat",
    "Đã hủy": "status-da-huy"
  };
  return map[status] || "";
}

function updateCartBadge() {
  const cart = JSON.parse(localStorage.getItem("printify_cart") || "[]");
  const totalQty = cart.reduce((sum, item) => sum + (Number(item.qty) || 0), 0);
  const badge = document.getElementById("cart-badge");
  if (!badge) return;

  if (totalQty > 0) {
    badge.textContent = totalQty;
    badge.style.display = "flex";
  } else {
    badge.style.display = "none";
  }
}

function showToast(msg) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2500);
}