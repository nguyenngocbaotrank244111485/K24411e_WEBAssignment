/* =========================
   PRODUCT DETAIL PAGE LOGIC (NV03 phần chi tiết)
   Đọc DS3 (products.json/cache), ghi DS7 (viewHistory),
   gọi module recommendation (NV12) để lấy 4 SP tương tự
   ========================= */

<<<<<<< HEAD
=======
let currentProduct = null;
let selectedColor = null;
let selectedSize = null;

>>>>>>> main
const CATEGORY_LABELS = {
  clothing: "Quần áo",
  stationery: "Văn phòng phẩm",
  homeware: "Đồ gia dụng",
  accessories: "Phụ kiện",
  advertisement: "Quảng cáo",
  packaging: "Bao bì",
  office: "Văn phòng"
};

<<<<<<< HEAD
let currentProduct = null;
let selectedColor = null;
let selectedSize = null;

document.addEventListener("DOMContentLoaded", async () => {
  updateCartBadge();
  bindLoginModalLinks();
=======
document.addEventListener("DOMContentLoaded", async () => {
  updateCartBadge();
>>>>>>> main

  const productId = getProductIdFromURL();
  if (!productId) {
    renderNotFound();
    return;
  }

  const products = await loadAllProducts();
  const product = products.find(p => p.id === productId);

  if (!product) {
    renderNotFound();
    return;
  }

  currentProduct = product;
<<<<<<< HEAD
  renderDetail(product);          // ✅ luôn hiển thị, không cần đăng nhập
  recordViewHistory(product.id);  // chỉ ghi nếu đã đăng nhập, không chặn hiển thị
  renderSimilarProducts(product, products);
});

/* ---------- LOGIN MODAL: chỉ dùng khi user bấm hành động cần auth ---------- */
function bindLoginModalLinks() {
  const modal = document.getElementById('login-required-modal');
  if (!modal) return; // tránh crash nếu thiếu phần tử

  modal.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => setReturnTo(window.location.href));
  });
}

function openLoginModal() {
  const modal = document.getElementById('login-required-modal');
  if (modal) modal.classList.add('show');
}

function closeLoginModalDetail() {
  const modal = document.getElementById('login-required-modal');
  if (modal) modal.classList.remove('show');
}

// Dùng chung getCurrentUser() từ auth.js, KHÔNG định nghĩa lại ở đây
function getUserId(user) {
  return user?.userId || user?.custId || user?.adId || null;
}

function ensureAuthForAction() {
  if (getCurrentUser()) return true;   // hàm này lấy từ auth.js
  setReturnTo(window.location.href);   // hàm này cũng lấy từ auth.js
  openLoginModal();
  return false;
}

=======
  renderDetail(product);
  recordViewHistory(product.id);
  renderSimilarProducts(product, products);
});

>>>>>>> main
/* ---------- LOAD DATA (fetch + flatten categories + cache) ---------- */
async function loadAllProducts() {
  try {
    const res = await fetch("../dataset/products.json");
    const data = await res.json();

    const flat = (data.categories || []).flatMap(cat => cat.products || []);

    const active = flat
      .filter(p => p.isActive !== false)
<<<<<<< HEAD
      .map(p => ({ ...p, id: p.productId }));
=======
      .map(p => ({ ...p, id: p.productId })); // chuẩn hóa productId -> id
>>>>>>> main

    localStorage.setItem("printify_products_cache", JSON.stringify(active));
    return active;
  } catch (err) {
    console.error("Lỗi tải products.json, dùng cache:", err);
    const cached = localStorage.getItem("printify_products_cache");
    return cached ? JSON.parse(cached) : [];
  }
}

function getProductIdFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}

/* ---------- RENDER NOT FOUND ---------- */
function renderNotFound() {
  document.getElementById("detail-main").innerHTML = `
    <div class="empty-state">
      😕 Sản phẩm không tồn tại hoặc đã ngừng kinh doanh.<br>
      <a href="products.html">← Quay lại danh sách sản phẩm</a>
    </div>`;
}

/* ---------- RENDER DETAIL ---------- */
function renderDetail(p) {
  const template = document.getElementById("detail-template");
  const clone = template.content.cloneNode(true);
  const mainEl = document.getElementById("detail-main");
  mainEl.innerHTML = "";
  mainEl.appendChild(clone);

  document.getElementById("breadcrumb-name").textContent = p.name;
  document.title = `PrintiFy — ${p.name}`;

<<<<<<< HEAD
  const images = p.images?.length
    ? [p.image, ...p.images]
    : [p.image];
=======
 // Gallery — chỉ dùng p.image (local, đáng tin cậy).
  // Bỏ p.images vì hiện là link trang Unsplash (không phải file ảnh trực tiếp) → luôn lỗi.
  const images = [p.image];
>>>>>>> main
  document.getElementById("gallery-main-img").src = `../${images[0]}`;
  document.getElementById("gallery-main-img").onerror = function () {
    this.src = "../images/placeholder.png";
  };
  if (!p.inStock) {
    document.getElementById("gallery-outstock-badge").style.display = "block";
  }

  const thumbsWrap = document.getElementById("gallery-thumbs");
<<<<<<< HEAD
=======
  // Chỉ 1 ảnh -> ẩn khu vực thumbnail luôn cho gọn (thay vì hiện 1 thumb trùng ảnh chính)
>>>>>>> main
  if (images.length <= 1) {
    thumbsWrap.style.display = "none";
  } else {
    thumbsWrap.style.display = "flex";
    thumbsWrap.innerHTML = images.map((img, i) => `
      <div class="gallery-thumb ${i === 0 ? "active" : ""}" onclick="switchGalleryImage('${img}', this)">
        <img src="../${img}" onerror="this.src='../images/placeholder.png'">
      </div>
    `).join("");
  }

<<<<<<< HEAD
=======
  // Info
>>>>>>> main
  document.getElementById("detail-cat-badge").textContent = CATEGORY_LABELS[p.category] || p.category;
  document.getElementById("detail-name").textContent = p.name;
  document.getElementById("detail-price").textContent = formatVND(p.price);
  document.getElementById("detail-desc").textContent = p.description || "";
  document.getElementById("detail-tags").innerHTML =
    (p.tags || []).map(t => `<span class="tag">${t}</span>`).join("");

<<<<<<< HEAD
=======
  // Colors
>>>>>>> main
  if (p.colors && p.colors.length) {
    selectedColor = p.colors[0];
    document.getElementById("option-colors").innerHTML = p.colors.map((c, i) => `
      <div class="color-swatch ${i === 0 ? "active" : ""}"
           style="background:${colorToCSS(c)}"
           title="${c}"
           onclick="selectColor('${c}', this)"></div>
    `).join("");
    document.getElementById("selected-color-label").textContent = `— ${selectedColor}`;
  } else {
    document.getElementById("color-block").style.display = "none";
  }

<<<<<<< HEAD
=======
  // Sizes
>>>>>>> main
  if (p.sizes && p.sizes.length) {
    selectedSize = p.sizes[0];
    document.getElementById("option-sizes").innerHTML = p.sizes.map((s, i) => `
      <div class="size-chip ${i === 0 ? "active" : ""}" onclick="selectSize('${s}', this)">${s}</div>
    `).join("");
  } else {
    document.getElementById("size-block").style.display = "none";
  }

<<<<<<< HEAD
=======
  // Out of stock: disable "bắt đầu thiết kế" nhưng vẫn cho xem/thiết kế theo mô tả NV03
  // (mô tả gốc: "vẫn cho phép xem và thiết kế" -> giữ nút bật, chỉ cảnh báo)
>>>>>>> main
  if (!p.inStock) {
    const btn = document.getElementById("btn-start-design");
    btn.innerHTML = "🎨 Bắt đầu thiết kế (Tạm hết hàng)";
  }
}
<<<<<<< HEAD
function getImagePath(path) {
    if (!path) return "../images/placeholder.png";
    if (path.startsWith("http")) {
        return path;
    }
    return path;
}
=======

>>>>>>> main
/* ---------- GALLERY SWITCH ---------- */
function switchGalleryImage(img, thumbEl) {
  document.getElementById("gallery-main-img").src = `../${img}`;
  document.querySelectorAll(".gallery-thumb").forEach(t => t.classList.remove("active"));
  thumbEl.classList.add("active");
}

/* ---------- SELECT COLOR / SIZE ---------- */
function selectColor(color, el) {
  selectedColor = color;
  document.querySelectorAll(".color-swatch").forEach(c => c.classList.remove("active"));
  el.classList.add("active");
  document.getElementById("selected-color-label").textContent = `— ${color}`;
}

function selectSize(size, el) {
  selectedSize = size;
  document.querySelectorAll(".size-chip").forEach(s => s.classList.remove("active"));
  el.classList.add("active");
}

<<<<<<< HEAD
/* ---------- ACTIONS: bắt đầu thiết kế / dùng mặc định (CẦN đăng nhập) ---------- */
function handleStartDesign() {
  if (!ensureAuthForAction()) return;

=======
/* ---------- ACTIONS: bắt đầu thiết kế / dùng mặc định ---------- */
function handleStartDesign() {
  const session = getSession();
  if (!session) {
    document.getElementById("login-required-modal").classList.add("show");
    return;
  }
>>>>>>> main
  const params = new URLSearchParams({
    productId: currentProduct.id,
    color: selectedColor || "",
    size: selectedSize || ""
  });
<<<<<<< HEAD
  window.location.href = `../interface/editor.html?${params.toString()}`;
}

function handleUseDefault() {
    addDefaultToCart();
}

function addDefaultToCart() {
    if (!ensureAuthForAction()) return;
    const cart =
        JSON.parse(localStorage.getItem("printify_cart") || "[]");
    const existing = cart.find(item =>
        item.productId === currentProduct.id &&
        item.color === selectedColor &&
        item.size === selectedSize &&
        !item.designData
    );
    if (existing) {
        existing.qty++;
    } else {
        cart.push({
            cartItemId: "CI" + Date.now(),
            productId: currentProduct.id,
            name: currentProduct.name,
            image: currentProduct.image,
            price: currentProduct.price,
            color: selectedColor,
            size: selectedSize,
            qty: 1,
            designData: null
        });
    }
    localStorage.setItem(
        "printify_cart",
        JSON.stringify(cart)
    );
    updateCartBadge();
    showToast("Đã thêm vào giỏ hàng!");
}
/* ---------- VIEW HISTORY (DS7) — không đăng nhập thì bỏ qua, không chặn trang ---------- */
function recordViewHistory(productId) {
  const session = getCurrentUser();
  const userId = getUserId(session);
  if (!userId) return;

  const key = `printify_viewhistory_${userId}`;
=======
  window.location.href = `editor.html?${params.toString()}`;
}

function handleUseDefault() {
  const session = getSession();
  if (!session) {
    document.getElementById("login-required-modal").classList.add("show");
    return;
  }
  // Bỏ qua thiết kế, thêm thẳng vào giỏ với designData = null
  addDefaultToCart();
}

function addDefaultToCart() {
  const cart = JSON.parse(localStorage.getItem("printify_cart") || "[]");

  const existing = cart.find(item =>
    item.productId === currentProduct.id &&
    item.color === selectedColor &&
    item.size === selectedSize &&
    !item.designData
  );

  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({
      cartItemId: "CI" + Date.now(),
      productId: currentProduct.id,
      name: currentProduct.name,
      price: currentProduct.price,
      color: selectedColor,
      size: selectedSize,
      qty: 1,
      designData: null
    });
  }

  localStorage.setItem("printify_cart", JSON.stringify(cart));
  updateCartBadge();
  showToast("Đã thêm vào giỏ hàng!");
}

function closeLoginModal() {
  document.getElementById("login-required-modal").classList.remove("show");
}

/* ---------- VIEW HISTORY (DS7) ---------- */
function recordViewHistory(productId) {
  const session = getSession();
  if (!session) return; // chỉ ghi khi đã đăng nhập

  const key = `printify_viewhistory_${session.userId}`;
>>>>>>> main
  let history = JSON.parse(localStorage.getItem(key) || "[]");

  history = history.filter(h => h.productId !== productId);
  history.unshift({ productId, viewedAt: new Date().toISOString() });
<<<<<<< HEAD
  history = history.slice(0, 20);
=======
  history = history.slice(0, 20); // tối đa 20
>>>>>>> main

  localStorage.setItem(key, JSON.stringify(history));
}

<<<<<<< HEAD
/* ---------- SIMILAR PRODUCTS (NV12) ---------- */
=======
/* ---------- SIMILAR PRODUCTS (NV12) ----------
   Gọi module recommendation.js (getSimilarProducts) */
>>>>>>> main
function renderSimilarProducts(product, allProducts) {
  const similar = getSimilarProducts(product, allProducts, 4);
  const grid = document.getElementById("similar-grid");

  if (!similar.length) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">Chưa có sản phẩm tương tự</div>`;
    return;
  }

  grid.innerHTML = similar.map(p => `
    <div class="similar-card" onclick="window.location.href='productDetail.html?id=${p.id}'">
      <div class="similar-img-wrap">
        <img src="../${p.image}" onerror="this.src='../images/placeholder.png'">
      </div>
      <div class="similar-info">
        <div class="similar-name">${p.name}</div>
        <div class="similar-price">${formatVND(p.price)}</div>
      </div>
    </div>
  `).join("");
}

/* ---------- HELPERS ---------- */
<<<<<<< HEAD
=======
function getSession() {
  const raw = sessionStorage.getItem("printify_session");
  return raw ? JSON.parse(raw) : null;
}

>>>>>>> main
function formatVND(amount) {
  return amount.toLocaleString("vi-VN") + "₫";
}

function colorToCSS(name) {
  const map = {
    white: "#ffffff", black: "#000000", navy: "#1e2a52", red: "#dc2626",
    gray: "#9ca3af", beige: "#e8dcc8", natural: "#e8dcc8", kraft: "#c39b6a",
    transparent: "repeating-linear-gradient(45deg,#eee,#eee 4px,#fff 4px,#fff 8px)",
    gold: "#d4af37"
  };
  return map[name] || "#cccccc";
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