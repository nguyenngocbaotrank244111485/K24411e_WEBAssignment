// ============================================================
// storage.js — Quản lý toàn bộ dữ liệu phía client
// Nhúng vào TẤT CẢ trang HTML, TRƯỚC mọi script khác:
//   <script src="js/storage.js"></script>
// ============================================================


// ── KEYS ────────────────────────────────────────────────────
// Tất cả key localStorage/sessionStorage tập trung ở đây
// Không viết key string trực tiếp trong code các trang
const KEYS = {
  PRODUCTS  : "pfy_products",   // cache sản phẩm từ JSON
  CART      : "pfy_cart",       // giỏ hàng
  ORDERS    : "pfy_orders",     // lịch sử đơn hàng
  USERS     : "pfy_users",      // tài khoản (nếu không dùng Firebase)
  SESSION   : "pfy_session",    // phiên đăng nhập (sessionStorage)
  HISTORY   : "pfy_history",    // lịch sử xem sản phẩm (cho recommendation)
  DESIGNS   : "pfy_designs",    // thiết kế đã lưu
  RETURNS   : "pfy_returns",    // yêu cầu hoàn hàng
  CHAT      : "pfy_chat",       // lịch sử chat (sessionStorage)
  REMEMBER  : "pfy_remember",   // Remember Me token
};


// ============================================================
// PHẦN 1 — HÀM TIỆN ÍCH NỘI BỘ
// ============================================================

// Đọc từ localStorage, tự parse JSON
function _lsGet(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.warn("[storage] lsGet lỗi:", key, e);
    return null;
  }
}

// Ghi vào localStorage, tự stringify JSON
function _lsSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    // Lỗi thường gặp: localStorage đầy (quota exceeded)
    console.warn("[storage] lsSet lỗi (có thể đầy bộ nhớ):", key, e);
    return false;
  }
}

// Đọc / ghi sessionStorage
function _ssGet(key) {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (e) { return null; }
}
function _ssSet(key, value) {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch (e) {}
}

// Tạo ID ngẫu nhiên từ prefix + timestamp
function _genId(prefix = "id") {
  return prefix + Date.now() + Math.floor(Math.random() * 9000 + 1000);
}


// ============================================================
// PHẦN 2 — QUẢN LÝ SẢN PHẨM
// ============================================================
const ProductDB = {

  // Gọi 1 lần khi trang chủ / danh sách SP load
  // Lưu kết quả vào localStorage để các trang khác dùng lại
  async load(path = "./data/products.json") {
    try {
      const res = await fetch(path);
      if (!res.ok) throw new Error("HTTP " + res.status);
      const json = await res.json();
      _lsSet(KEYS.PRODUCTS, json.products);
      console.log(`[storage] Đã tải ${json.products.length} sản phẩm`);
      return json.products;
    } catch (e) {
      console.error("[storage] Không tải được products.json:", e);
      return [];
    }
  },

  // Lấy tất cả SP từ cache
  getAll() {
    return _lsGet(KEYS.PRODUCTS) || [];
  },

  // Tìm 1 SP theo id
  getById(id) {
    return this.getAll().find(p => p.id === id) || null;
  },

  // Lọc theo category ("all" → trả hết)
  getByCategory(cat) {
    if (!cat || cat === "all") return this.getAll();
    return this.getAll().filter(p => p.category === cat);
  },

  // Tìm kiếm realtime (tên + tags)
  search(keyword) {
    const kw = keyword.toLowerCase().trim();
    if (!kw) return this.getAll();
    return this.getAll().filter(p =>
      p.name.toLowerCase().includes(kw) ||
      (p.tags || []).some(t => t.toLowerCase().includes(kw)) ||
      (p.description || "").toLowerCase().includes(kw)
    );
  },

  // Lấy sản phẩm popular (popular: true trong JSON)
  getPopular() {
    return this.getAll().filter(p => p.popular);
  },

  // Lọc theo khoảng giá
  getByPriceRange(min, max) {
    return this.getAll().filter(p => p.price >= min && p.price <= max);
  },
};


// ============================================================
// PHẦN 3 — GIỎ HÀNG
// ============================================================
const CartDB = {

  getAll() {
    return _lsGet(KEYS.CART) || [];
  },

  // Tổng số lượng item
  count() {
    return this.getAll().reduce((s, i) => s + i.quantity, 0);
  },

  // Tổng tiền (chưa tính ship)
  total() {
    return this.getAll().reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  },

  // Thêm 1 item vào giỏ
  // designData: base64 string hoặc null nếu không có thiết kế custom
  add(product, color, size, quantity = 1, designData = null) {
    const cart = this.getAll();

    // Nếu không có design custom → tìm item giống hệt để merge
    if (!designData) {
      const existing = cart.find(i =>
        i.productId === product.id &&
        i.color === color &&
        i.size === size &&
        !i.hasCustomDesign
      );
      if (existing) {
        existing.quantity += quantity;
        _lsSet(KEYS.CART, cart);
        return { merged: true, item: existing };
      }
    }

    // Tạo item mới
    const newItem = {
      cartItemId     : _genId("ci"),
      productId      : product.id,
      productName    : product.name,
      productImage   : product.image,
      color,
      size,
      quantity,
      unitPrice      : product.price,
      hasCustomDesign: !!designData,
      designData,               // base64 PNG hoặc null
      addedAt        : new Date().toISOString(),
    };
    cart.push(newItem);
    _lsSet(KEYS.CART, cart);
    return { merged: false, item: newItem };
  },

  // Cập nhật số lượng
  updateQty(cartItemId, newQty) {
    if (newQty < 1 || newQty > 999) return false;
    const cart = this.getAll();
    const item = cart.find(i => i.cartItemId === cartItemId);
    if (!item) return false;
    item.quantity = newQty;
    _lsSet(KEYS.CART, cart);
    return true;
  },

  // Xóa 1 item
  remove(cartItemId) {
    _lsSet(KEYS.CART, this.getAll().filter(i => i.cartItemId !== cartItemId));
  },

  // Xóa toàn bộ
  clear() {
    _lsSet(KEYS.CART, []);
  },
};


// ============================================================
// PHẦN 4 — ĐƠN HÀNG
// ============================================================
const OrderDB = {

  getAll() {
    return _lsGet(KEYS.ORDERS) || [];
  },

  // Lấy đơn của 1 user (mới nhất trước)
  getByUser(userId) {
    return this.getAll()
      .filter(o => o.userId === userId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  getById(orderId) {
    return this.getAll().find(o => o.orderId === orderId) || null;
  },

  // Tạo đơn từ giỏ hàng hiện tại
  create(cartItems, shippingInfo, paymentMethod, userId) {
    const subtotal    = cartItems.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
    const shippingFee = subtotal >= 300000 ? 0 : 30000;

    const order = {
      orderId       : "PF" + Date.now(),
      userId,
      createdAt     : new Date().toISOString(),
      status        : "Chờ xác nhận",
      items         : cartItems.map(i => ({ ...i })),
      shippingInfo,
      paymentMethod,
      subtotal,
      shippingFee,
      totalAmount   : subtotal + shippingFee,
      timeline      : [{ status: "Chờ xác nhận", time: new Date().toISOString() }],
    };

    const orders = this.getAll();
    orders.push(order);
    _lsSet(KEYS.ORDERS, orders);
    return order;
  },

  // Cập nhật trạng thái đơn
  updateStatus(orderId, newStatus) {
    const orders = this.getAll();
    const order  = orders.find(o => o.orderId === orderId);
    if (!order) return false;
    order.status = newStatus;
    order.timeline.push({ status: newStatus, time: new Date().toISOString() });
    _lsSet(KEYS.ORDERS, orders);
    return true;
  },

  // Hủy đơn (chỉ khi đang "Chờ xác nhận")
  cancel(orderId) {
    const order = this.getById(orderId);
    if (!order) return { ok: false, msg: "Không tìm thấy đơn hàng" };
    if (order.status !== "Chờ xác nhận")
      return { ok: false, msg: "Chỉ hủy được đơn đang chờ xác nhận" };
    this.updateStatus(orderId, "Đã hủy");
    return { ok: true };
  },
};


// ============================================================
// PHẦN 5 — TÀI KHOẢN (dùng khi không tích hợp Firebase)
// ============================================================
const UserDB = {

  getAll() {
    return _lsGet(KEYS.USERS) || [];
  },

  findByEmail(email) {
    return this.getAll().find(u => u.email === email.toLowerCase()) || null;
  },

  // Hash đơn giản (chỉ để demo — thực tế dùng Firebase Auth)
  _hash(pw) {
    return btoa(unescape(encodeURIComponent(pw + "_pfy_salt")));
  },

  register(name, email, password) {
    const emailLower = email.toLowerCase();
    if (this.findByEmail(emailLower))
      return { ok: false, msg: "Email này đã được đăng ký" };

    const user = {
      userId  : _genId("u"),
      name,
      email   : emailLower,
      pwHash  : this._hash(password),
      avatar  : null,
      provider: "email",
      createdAt: new Date().toISOString(),
    };
    const users = this.getAll();
    users.push(user);
    _lsSet(KEYS.USERS, users);
    return { ok: true, user };
  },

  login(email, password) {
    const user = this.findByEmail(email.toLowerCase());
    if (!user || user.pwHash !== this._hash(password))
      return { ok: false, msg: "Email hoặc mật khẩu không đúng" };

    // Tạo session
    const session = {
      userId   : user.userId,
      name     : user.name,
      email    : user.email,
      avatar   : user.avatar,
      loginTime: new Date().toISOString(),
    };
    _ssSet(KEYS.SESSION, session);
    return { ok: true, user, session };
  },

  logout() {
    sessionStorage.removeItem(KEYS.SESSION);
    localStorage.removeItem(KEYS.REMEMBER);
  },

  getSession() {
    return _ssGet(KEYS.SESSION);
  },

  isLoggedIn() {
    return !!this.getSession();
  },

  // Lưu Remember Me (30 ngày)
  rememberMe(userId) {
    _lsSet(KEYS.REMEMBER, { userId, expiry: Date.now() + 30 * 864e5 });
  },

  // Kiểm tra Remember Me khi load trang
  checkRemember() {
    const rm = _lsGet(KEYS.REMEMBER);
    if (!rm || Date.now() > rm.expiry) return null;
    const users = this.getAll();
    const user  = users.find(u => u.userId === rm.userId);
    if (!user) return null;
    const session = { userId: user.userId, name: user.name, email: user.email, avatar: user.avatar, loginTime: new Date().toISOString() };
    _ssSet(KEYS.SESSION, session);
    return session;
  },
};


// ============================================================
// PHẦN 6 — LỊCH SỬ XEM (cho Recommendation)
// ============================================================
const HistoryDB = {

  get() {
    return _lsGet(KEYS.HISTORY) || [];
  },

  // Thêm sản phẩm đã xem (max 20, không trùng, mới nhất đầu)
  add(productId) {
    let hist = this.get().filter(id => id !== productId);
    hist.unshift(productId);
    if (hist.length > 20) hist = hist.slice(0, 20);
    _lsSet(KEYS.HISTORY, hist);
  },

  clear() {
    _lsSet(KEYS.HISTORY, []);
  },
};


// ============================================================
// PHẦN 7 — THIẾT KẾ ĐÃ LƯU
// ============================================================
const DesignDB = {

  getAll() {
    return _lsGet(KEYS.DESIGNS) || [];
  },

  save(productId, productName, canvasJSON, thumbnail) {
    const designs = this.getAll();
    const design = {
      designId   : _genId("d"),
      productId,
      productName,
      canvasJSON,   // canvas.toJSON() từ Fabric.js → dùng để load lại
      thumbnail,    // base64 ảnh nhỏ để hiển thị preview
      savedAt    : new Date().toISOString(),
    };
    designs.unshift(design);
    // Giới hạn 10 thiết kế để tránh đầy localStorage
    if (designs.length > 10) designs.pop();
    _lsSet(KEYS.DESIGNS, designs);
    return design;
  },

  delete(designId) {
    _lsSet(KEYS.DESIGNS, this.getAll().filter(d => d.designId !== designId));
  },
};


// ============================================================
// PHẦN 8 — YÊU CẦU HOÀN HÀNG
// ============================================================
const ReturnDB = {

  getAll() {
    return _lsGet(KEYS.RETURNS) || [];
  },

  // Kiểm tra đơn có còn trong 7 ngày không
  isEligible(order) {
    const orderTime = new Date(order.createdAt).getTime();
    const now       = Date.now();
    return (now - orderTime) <= 7 * 864e5; // 7 ngày tính bằng ms
  },

  create(orderId, reason, description, images) {
    const req = {
      requestId  : _genId("r"),
      orderId,
      reason,
      description,
      images,    // mảng base64 ảnh
      status     : "Đang xét duyệt",
      createdAt  : new Date().toISOString(),
    };
    const all = this.getAll();
    all.push(req);
    _lsSet(KEYS.RETURNS, all);

    // Cập nhật trạng thái đơn hàng
    OrderDB.updateStatus(orderId, "Yêu cầu hoàn hàng");
    return req;
  },
};


// ============================================================
// PHẦN 9 — LỊCH SỬ CHAT
// ============================================================
const ChatDB = {

  get() {
    return _ssGet(KEYS.CHAT) || [];
  },

  add(role, text) {
    // role = "user" hoặc "model"
    const hist = this.get();
    hist.push({ role, parts: [{ text }] });
    // Xóa tin cũ nếu vượt 20 tin để tránh token limit Gemini
    if (hist.length > 20) hist.splice(0, hist.length - 20);
    _ssSet(KEYS.CHAT, hist);
  },

  clear() {
    sessionStorage.removeItem(KEYS.CHAT);
  },
};


// ============================================================
// PHẦN 10 — TIỆN ÍCH GIAO DIỆN
// ============================================================

// Format tiền VNĐ
function formatPrice(price) {
  return price.toLocaleString("vi-VN") + "đ";
}

// Format ngày giờ
function formatDate(iso) {
  return new Date(iso).toLocaleString("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

// Hiển thị Toast notification
function showToast(msg, type = "success") {
  const container = document.getElementById("toast-container");
  if (!container) return;
  const icons = { success: "✓", error: "✕", warn: "⚠" };
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${icons[type] || "✓"}</span><span>${msg}</span>`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3200);
}

// Cập nhật badge số lượng giỏ hàng trên navbar
function updateCartBadge() {
  const badge = document.getElementById("cart-badge");
  if (!badge) return;
  const count = CartDB.count();
  badge.textContent = count;
  badge.style.display = count > 0 ? "flex" : "none";
}

// Cập nhật navbar theo trạng thái đăng nhập
function updateNavbar() {
  const session  = UserDB.getSession();
  const navLogin = document.getElementById("nav-login");
  const navUser  = document.getElementById("nav-user");
  const navName  = document.getElementById("nav-username");

  if (session) {
    if (navLogin) navLogin.style.display = "none";
    if (navUser)  navUser.style.display  = "flex";
    if (navName)  navName.textContent    = session.name;
  } else {
    if (navLogin) navLogin.style.display = "flex";
    if (navUser)  navUser.style.display  = "none";
  }
  updateCartBadge();
}

// Bảo vệ trang cần đăng nhập
// Đặt ở đầu script của trang cần bảo vệ: requireLogin();
function requireLogin(redirectBack = true) {
  if (!UserDB.isLoggedIn()) {
    if (redirectBack) {
      sessionStorage.setItem("pfy_returnUrl", window.location.href);
    }
    window.location.href = "login.html";
    return false;
  }
  return true;
}

// Chạy tự động khi mỗi trang load
document.addEventListener("DOMContentLoaded", () => {
  // Kiểm tra Remember Me nếu chưa có session
  if (!UserDB.isLoggedIn()) {
    UserDB.checkRemember();
  }
  updateNavbar();
});