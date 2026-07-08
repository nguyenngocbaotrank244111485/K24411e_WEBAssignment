/* =========================
   PROFILE PAGE LOGIC
   Đọc/ghi DS1 UserInfo (localStorage 'printify_users'),
   DS2 Session (sessionStorage 'printify_session'),
   DS7 ViewHistory, DS6 Orders (chỉ đọc, hiển thị gần đây)
   ========================= */

let currentUser = null;

document.addEventListener("DOMContentLoaded", () => {
  updateCartBadge();

  const session = getSession();
  if (!session) {
    showGuestState();
    return;
  }

  const users = getUsers();
  currentUser = users.find(u => u.userId === session.userId);

  if (!currentUser) {
    showGuestState();
    return;
  }

  showProfileState();
  renderSidebar();
  renderInfoTab();
  renderSavedShipping();
  renderHistoryTab();
  renderRecentOrdersTab();
});

/* ---------- STATE SWITCH ---------- */
function showGuestState() {
  document.getElementById("guest-block").style.display = "block";
  document.getElementById("profile-layout").style.display = "none";
}

function showProfileState() {
  document.getElementById("guest-block").style.display = "none";
  document.getElementById("profile-layout").style.display = "grid";
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
  const avatarSrc = currentUser.avatar || "../images/default-avatar.png";
  document.getElementById("sidebar-avatar").src = avatarSrc;
  document.getElementById("sidebar-avatar").onerror = function () {
    this.src = "../images/default-avatar.png";
  };
  document.getElementById("sidebar-name").textContent = currentUser.name || currentUser.custNname || "—";
  document.getElementById("sidebar-email").textContent = currentUser.email || currentUser.custEmail || "—";
}

/* ---------- TAB: THÔNG TIN TÀI KHOẢN ---------- */
function renderInfoTab() {
  const avatarSrc = currentUser.avatar || "../images/default-avatar.png";
  document.getElementById("info-avatar").src = avatarSrc;
  document.getElementById("info-avatar").onerror = function () {
    this.src = "../images/default-avatar.png";
  };
  document.getElementById("edit-name").value = currentUser.name || currentUser.custNname || "";
  document.getElementById("edit-email").value = currentUser.email || currentUser.custEmail || "";

  if (currentUser.secQuestion) {
    document.getElementById("sec-question").value = currentUser.secQuestion;
  }
}

/* ---------- AVATAR UPLOAD ---------- */
function handleAvatarChange(event) {
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
    document.getElementById("info-avatar").src = base64;
    document.getElementById("sidebar-avatar").src = base64;
    currentUser.avatar = base64;
    persistCurrentUser();
    showToast("Đã cập nhật ảnh đại diện!");
  };
  reader.readAsDataURL(file);
}

/* ---------- SAVE PROFILE INFO ---------- */
function saveProfileInfo() {
  const nameInput = document.getElementById("edit-name");
  const name = nameInput.value.trim();

  document.getElementById("err-edit-name").textContent = "";
  nameInput.classList.remove("field-invalid");

  if (!name) {
    document.getElementById("err-edit-name").textContent = "Vui lòng nhập họ và tên.";
    nameInput.classList.add("field-invalid");
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
  const info = currentUser.savedShippingInfo;

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

/* ---------- TAB: LỊCH SỬ XEM SẢN PHẨM (DS7) ---------- */
function renderHistoryTab() {
  const grid = document.getElementById("history-grid");
  const key = `printify_viewhistory_${currentUser.userId}`;
  const history = JSON.parse(localStorage.getItem(key) || "[]");

  if (history.length === 0) {
    grid.innerHTML = `<div class="empty-mini" style="grid-column:1/-1">Bạn chưa xem sản phẩm nào.</div>`;
    return;
  }

  const products = getProductsCache();

  grid.innerHTML = history.map(h => {
    const product = products.find(p => p.id === h.productId);
    if (!product) return "";
    return `
      <div class="history-card" onclick="window.location.href='productDetail.html?id=${product.id}'">
        <div class="history-img-wrap">
          <img src="../${product.image}" onerror="this.src='../images/placeholder.png'">
        </div>
        <div class="history-info">
          <div class="history-name">${product.name}</div>
          <div class="history-time">${formatRelativeTime(h.viewedAt)}</div>
        </div>
      </div>
    `;
  }).join("");
}

/* ---------- TAB: ĐƠN HÀNG GẦN ĐÂY (DS6, chỉ đọc) ---------- */
function renderRecentOrdersTab() {
  const container = document.getElementById("recent-orders-list");
  const orders = JSON.parse(localStorage.getItem("printify_orders") || "[]")
    .filter(o => o.userId === currentUser.userId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  if (orders.length === 0) {
    container.innerHTML = `<div class="empty-mini">Bạn chưa có đơn hàng nào. <a href="products.html" style="color:var(--mp-primary-dark);font-weight:700">Bắt đầu mua sắm</a></div>`;
    return;
  }

  container.innerHTML = orders.map(order => `
    <div class="recent-order-row" onclick="window.location.href='orders.html'">
      <div>
        <div class="ro-id">${order.orderId}</div>
        <div class="ro-date">${formatDate(order.createdAt)}</div>
      </div>
      <span class="status-badge ${statusToClass(order.status)}">${order.status}</span>
      <div class="ro-total">${formatVND(order.payment?.amount || 0)}</div>
    </div>
  `).join("");
}

/* ---------- SECURITY: ĐỔI MẬT KHẨU ---------- */
function changePassword() {
  clearSecurityErrors();

  const current = document.getElementById("current-password").value;
  const newPass = document.getElementById("new-password").value;
  const confirm = document.getElementById("confirm-password").value;

  let isValid = true;

  const currentHash = simpleHash(current);
  if (!current) {
    setError("err-current-password", "current-password", "Vui lòng nhập mật khẩu hiện tại.");
    isValid = false;
  } else if (currentHash !== currentUser.passwordHash) {
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

  currentUser.passwordHash = simpleHash(newPass);
  persistCurrentUser();

  document.getElementById("current-password").value = "";
  document.getElementById("new-password").value = "";
  document.getElementById("confirm-password").value = "";

  showToast("Đổi mật khẩu thành công!");
}

function clearSecurityErrors() {
  ["current-password", "new-password", "confirm-password"].forEach(id => {
    document.getElementById(id).classList.remove("field-invalid");
    document.getElementById("err-" + id).textContent = "";
  });
}

function setError(errId, inputId, message) {
  document.getElementById(errId).textContent = message;
  document.getElementById(inputId).classList.add("field-invalid");
}

/* ---------- SECURITY: CÂU HỎI BẢO MẬT ---------- */
function saveSecurityQuestion() {
  const question = document.getElementById("sec-question").value;
  const answer = document.getElementById("sec-answer").value.trim();

  if (!answer) {
    showToast("Vui lòng nhập câu trả lời bảo mật.");
    return;
  }

  currentUser.secQuestion = question;
  currentUser.secAnswer = simpleHash(answer.toLowerCase());
  persistCurrentUser();

  document.getElementById("sec-answer").value = "";
  showToast("Đã lưu câu hỏi bảo mật!");
}

/* ---------- LOGOUT ---------- */
function confirmLogout() {
  document.getElementById("confirm-modal").style.display = "flex";
}

function closeConfirmModal() {
  document.getElementById("confirm-modal").style.display = "none";
}

function doLogout() {
  sessionStorage.removeItem("printify_session");
  window.location.href = "index.html";
}

/* ---------- PERSIST HELPERS ---------- */
function getSession() {
  const raw = sessionStorage.getItem("printify_session");
  return raw ? JSON.parse(raw) : null;
}

function getUsers() {
  return JSON.parse(localStorage.getItem("printify_users") || "[]");
}

function persistCurrentUser() {
  const users = getUsers();
  const index = users.findIndex(u => u.userId === currentUser.userId);
  if (index !== -1) {
    users[index] = currentUser;
    localStorage.setItem("printify_users", JSON.stringify(users));
  }
}

function getProductsCache() {
  const cached = localStorage.getItem("printify_products_cache");
  return cached ? JSON.parse(cached) : [];
}

/* Hàm băm mật khẩu đơn giản (demo, KHÔNG dùng cho production thật) */
function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return "h" + hash.toString(36);
}

/* ---------- FORMAT HELPERS ---------- */
function formatVND(amount) {
  return amount.toLocaleString("vi-VN") + "₫";
}

function formatDate(isoString) {
  const d = new Date(isoString);
  return d.toLocaleDateString("vi-VN");
}

function formatRelativeTime(isoString) {
  const diffMs = Date.now() - new Date(isoString).getTime();
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
  const totalQty = cart.reduce((sum, item) => sum + (item.qty || 0), 0);
  const badge = document.getElementById("cart-badge");
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