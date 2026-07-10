/* =========================
   PRODUCT DETAIL PAGE LOGIC
   - Public xem sản phẩm
   - Chỉ yêu cầu login khi:
     + Bắt đầu thiết kế
     + Thêm vào giỏ hàng
   - Không phụ thuộc storage.js / recommendation.js
   ========================= */

const CATEGORY_LABELS = {
  clothing: "Quần áo",
  stationery: "Văn phòng phẩm",
  homeware: "Đồ gia dụng",
  accessories: "Phụ kiện",
  advertisement: "Quảng cáo",
  packaging: "Bao bì",
  office: "Văn phòng"
};

let currentProduct = null;
let selectedColor = null;
let selectedSize = null;

document.addEventListener("DOMContentLoaded", async () => {
  if (typeof initAuthUI === "function") initAuthUI();

  updateCartBadge();

  const productId = getProductIdFromURL();
  if (!productId) {
    renderNotFound();
    return;
  }

  const products = await loadAllProducts();
  const product = products.find(p => (p.id || p.productId) === productId);

  if (!product) {
    renderNotFound();
    return;
  }

  currentProduct = {
    ...product,
    id: product.id || product.productId
  };

  renderDetail(currentProduct);
  recordViewHistory(currentProduct.id);
  renderSimilarProducts(currentProduct, products);
});

/* ---------- AUTH MODAL ---------- */
function openLoginModal() {
  const modal = document.getElementById("login-required-modal");
  if (!modal) return;
  modal.classList.remove("hidden");
  modal.classList.add("show");
}

function closeLoginModal() {
  const modal = document.getElementById("login-required-modal");
  if (!modal) return;
  modal.classList.remove("show");
  modal.classList.add("hidden");
}

function ensureAuthForAction() {
  if (typeof getCurrentUser === "function" && getCurrentUser()) return true;

  if (typeof setReturnTo === "function") {
    setReturnTo(window.location.href);
  }

  openLoginModal();
  return false;
}

/* ---------- DATA ---------- */
async function loadAllProducts() {
  try {
    const res = await fetch("../dataset/products.json");
    const data = await res.json();

    const flat = (data.categories || []).flatMap(cat => cat.products || []);
    const active = flat
      .filter(p => p.isActive !== false)
      .map(p => ({
        ...p,
        id: p.productId || p.id
      }));

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

/* ---------- IMAGE HELPERS ---------- */
function resolveImageUrl(path) {
  if (!path) return "../images/placeholder.png";
  if (
    path.startsWith("http://") ||
    path.startsWith("https://") ||
    path.startsWith("data:") ||
    path.startsWith("../") ||
    path.startsWith("./") ||
    path.startsWith("/")
  ) {
    return path;
  }
  return `../${path}`;
}

function getAllImages(product) {
  const images = [];
  if (product.image) images.push(product.image);
  if (Array.isArray(product.images)) {
    product.images.forEach(img => images.push(img));
  }

  const unique = [];
  const seen = new Set();
  images.forEach(img => {
    if (!img || seen.has(img)) return;
    seen.add(img);
    unique.push(img);
  });

  return unique.length ? unique : ["../images/placeholder.png"];
}

/* ---------- RENDER DETAIL ---------- */
function renderDetail(p) {
  const template = document.getElementById("detail-template");
  const clone = template.content.cloneNode(true);
  const mainEl = document.getElementById("detail-main");
  mainEl.innerHTML = "";
  mainEl.appendChild(clone);

  document.getElementById("breadcrumb-name").textContent = p.name || "Chi tiết sản phẩm";
  document.title = `PrintiFy — ${p.name || "Chi tiết sản phẩm"}`;

  const images = getAllImages(p);

  const mainImg = document.getElementById("gallery-main-img");
  mainImg.src = resolveImageUrl(images[0]);
  mainImg.onerror = function () {
    this.src = "../images/placeholder.png";
  };

  if (!p.inStock) {
    document.getElementById("gallery-outstock-badge").style.display = "block";
    document.getElementById("btn-start-design").innerHTML = "🎨 Bắt đầu thiết kế (Tạm hết hàng)";
    document.getElementById("btn-add-cart").innerHTML = "🛒 Thêm vào giỏ hàng (Tạm hết hàng)";
  }

  const thumbsWrap = document.getElementById("gallery-thumbs");
  if (images.length <= 1) {
    thumbsWrap.style.display = "none";
  } else {
    thumbsWrap.style.display = "flex";
    thumbsWrap.innerHTML = images.map((img, i) => `
      <div class="gallery-thumb ${i === 0 ? "active" : ""}" onclick="switchGalleryImage('${escapeForAttr(img)}', this)">
        <img src="${resolveImageUrl(img)}" onerror="this.src='../images/placeholder.png'">
      </div>
    `).join("");
  }

  document.getElementById("detail-cat-badge").textContent = CATEGORY_LABELS[p.category] || p.category || "";
  document.getElementById("detail-name").textContent = p.name || "";
  document.getElementById("detail-price").textContent = formatVND(p.price || 0);
  document.getElementById("detail-desc").textContent = p.description || "";

  document.getElementById("detail-tags").innerHTML =
    (p.tags || []).map(t => `<span class="tag">${t}</span>`).join("");

  if (p.colors && p.colors.length) {
    selectedColor = p.colors[0];
    document.getElementById("option-colors").innerHTML = p.colors.map((c, i) => `
      <div class="color-swatch ${i === 0 ? "active" : ""}"
           style="background:${colorToCSS(c)}"
           title="${c}"
           onclick="selectColor('${escapeForAttr(c)}', this)"></div>
    `).join("");
    document.getElementById("selected-color-label").textContent = `— ${selectedColor}`;
  } else {
    document.getElementById("color-block").style.display = "none";
  }

  if (p.sizes && p.sizes.length) {
    selectedSize = p.sizes[0];
    document.getElementById("option-sizes").innerHTML = p.sizes.map((s, i) => `
      <div class="size-chip ${i === 0 ? "active" : ""}" onclick="selectSize('${escapeForAttr(s)}', this)">${s}</div>
    `).join("");
  } else {
    document.getElementById("size-block").style.display = "none";
  }
}

/* ---------- GALLERY / OPTIONS ---------- */
function switchGalleryImage(img, thumbEl) {
  document.getElementById("gallery-main-img").src = resolveImageUrl(img);
  document.querySelectorAll(".gallery-thumb").forEach(t => t.classList.remove("active"));
  thumbEl.classList.add("active");
}

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

/* ---------- ACTIONS ---------- */
function handleStartDesign() {
  if (!ensureAuthForAction()) return;

  const productId = currentProduct.id;
  const params = new URLSearchParams({
    productId,
    color: selectedColor || "",
    size: selectedSize || ""
  });

  window.location.href = `../interface/editor.html?${params.toString()}`;
}

function handleAddToCart() {
  if (!ensureAuthForAction()) return;

  const user = typeof getCurrentUser === "function" ? getCurrentUser() : null;
  if (!user) return;

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
      image: currentProduct.image,
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

/* alias để nếu HTML cũ còn gọi hàm này */
function handleUseDefault() {
  handleAddToCart();
}

/* ---------- VIEW HISTORY ---------- */
function recordViewHistory(productId) {
  const user = typeof getCurrentUser === "function" ? getCurrentUser() : null;
  const userId = user?.userId || user?.custId || user?.adId || null;
  if (!userId) return;

  const key = `printify_viewhistory_${userId}`;
  let history = JSON.parse(localStorage.getItem(key) || "[]");

  history = history.filter(h => h.productId !== productId);
  history.unshift({ productId, viewedAt: new Date().toISOString() });
  history = history.slice(0, 20);

  localStorage.setItem(key, JSON.stringify(history));
}

/* ---------- SIMILAR PRODUCTS ---------- */
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
        <img src="${resolveImageUrl(p.image)}" onerror="this.src='../images/placeholder.png'">
      </div>
      <div class="similar-info">
        <div class="similar-name">${p.name}</div>
        <div class="similar-price">${formatVND(p.price)}</div>
      </div>
    </div>
  `).join("");
}

function getSimilarProducts(product, allProducts, limit = 4) {
  const sameCategory = allProducts.filter(p =>
    p.id !== product.id &&
    p.category === product.category
  );

  const sameTags = allProducts.filter(p => {
    if (p.id === product.id) return false;
    const tagsA = new Set((product.tags || []).map(t => String(t).toLowerCase()));
    return (p.tags || []).some(t => tagsA.has(String(t).toLowerCase()));
  });

  const merged = [];
  const seen = new Set();

  [...sameCategory, ...sameTags, ...allProducts]
    .forEach(p => {
      if (!p || seen.has(p.id)) return;
      seen.add(p.id);
      if (p.id !== product.id) merged.push(p);
    });

  return merged.slice(0, limit);
}

/* ---------- HELPERS ---------- */
function formatVND(amount) {
  return Number(amount || 0).toLocaleString("vi-VN") + "₫";
}

function colorToCSS(name) {
  const map = {
    white: "#ffffff",
    black: "#000000",
    navy: "#1e2a52",
    red: "#dc2626",
    gray: "#9ca3af",
    beige: "#e8dcc8",
    natural: "#e8dcc8",
    kraft: "#c39b6a",
    transparent: "repeating-linear-gradient(45deg,#eee,#eee 4px,#fff 4px,#fff 8px)",
    gold: "#d4af37"
  };
  return map[name] || "#cccccc";
}

function escapeForAttr(text) {
  return String(text)
    .replaceAll("\\", "\\\\")
    .replaceAll("'", "\\'")
    .replaceAll('"', '\\"');
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