/* =========================
   PRODUCTS PAGE LOGIC (NV03)
   Đọc DS3 từ dataset/products.json (+ cache localStorage)
   ========================= */

let ALL_PRODUCTS = [];
let filteredProducts = [];

let state = {
  search: "",
  categories: ["all"],
  priceRange: "all",
  sort: "default"
};

const CATEGORY_LABELS = {
  clothing: "Quần áo",
  stationery: "Văn phòng phẩm",
  homeware: "Đồ gia dụng",
  accessories: "Phụ kiện",
  advertisement: "Quảng cáo",
  packaging: "Bao bì",
  office: "Văn phòng"
};

document.addEventListener("DOMContentLoaded", async () => {
<<<<<<< HEAD
    syncAuthUI();
    await loadProducts();
    buildCategoryFilters();
    applyFilters();
    updateCartBadge();
=======
  await loadProducts();
  buildCategoryFilters();
  applyFilters();
  updateCartBadge();
>>>>>>> main
});

/* ---------- LOAD DATA (fetch + flatten categories + cache) ---------- */
async function loadProducts() {
  try {
    const res = await fetch("../dataset/products.json");
    const data = await res.json();

    // Cấu trúc mới: { categories: [ { products: [...] }, ... ] }
    // → gộp hết products từ mọi category thành 1 mảng phẳng
    const flat = (data.categories || []).flatMap(cat => cat.products || []);

    ALL_PRODUCTS = flat
      .filter(p => p.isActive !== false)
      .map(p => ({ ...p, id: p.productId })); // chuẩn hóa productId -> id để code cũ dùng lại được

    localStorage.setItem("printify_products_cache", JSON.stringify(ALL_PRODUCTS));
  } catch (err) {
    console.error("Lỗi tải products.json, dùng cache:", err);
    const cached = localStorage.getItem("printify_products_cache");
    ALL_PRODUCTS = cached ? JSON.parse(cached) : [];
  }
}

/* ---------- BUILD CATEGORY CHECKBOXES ---------- */
function buildCategoryFilters() {
  const container = document.getElementById("category-filters");
  const cats = [...new Set(ALL_PRODUCTS.map(p => p.category))];

  cats.forEach(cat => {
    const label = document.createElement("label");
    label.className = "filter-checkbox";
    label.innerHTML = `
      <input type="checkbox" value="${cat}" onchange="handleCategoryFilter(this)">
      <span>${CATEGORY_LABELS[cat] || cat}</span>
    `;
    container.appendChild(label);
  });
}

/* ---------- FILTER HANDLERS ---------- */
function handleSearch(value) {
  state.search = value.trim().toLowerCase();
  applyFilters();
}

function handleCategoryFilter(checkbox) {
  const allCheckbox = document.querySelector('#category-filters input[value="all"]');

  if (checkbox.value === "all") {
    document.querySelectorAll('#category-filters input').forEach(cb => {
      cb.checked = cb.value === "all";
    });
    state.categories = ["all"];
  } else {
    allCheckbox.checked = false;
    const checked = [...document.querySelectorAll('#category-filters input:checked')]
      .map(cb => cb.value);
    state.categories = checked.length ? checked : ["all"];
    if (state.categories.length === 0) {
      allCheckbox.checked = true;
      state.categories = ["all"];
    }
  }
  applyFilters();
}

function handlePriceFilter(radio) {
  state.priceRange = radio.value;
  applyFilters();
}

function handleSort(value) {
  state.sort = value;
  applyFilters();
}

function clearAllFilters() {
  state = { search: "", categories: ["all"], priceRange: "all", sort: "default" };
  document.getElementById("search-input").value = "";
  document.getElementById("sort-select").value = "default";
  document.querySelectorAll('#category-filters input').forEach(cb => {
    cb.checked = cb.value === "all";
  });
  document.querySelector('input[name="price-range"][value="all"]').checked = true;
  applyFilters();
}

/* ---------- APPLY FILTERS + SORT ---------- */
function applyFilters() {
  let result = [...ALL_PRODUCTS];

  // Search theo tên + tags (real-time, NV03)
  if (state.search) {
    result = result.filter(p =>
      p.name.toLowerCase().includes(state.search) ||
      (p.tags || []).some(t => t.toLowerCase().includes(state.search))
    );
  }

  // Category filter
  if (!state.categories.includes("all")) {
    result = result.filter(p => state.categories.includes(p.category));
  }

  // Price filter
  if (state.priceRange !== "all") {
    const [min, max] = state.priceRange.split("-").map(Number);
    result = result.filter(p => p.price >= min && p.price <= max);
  }

  // Sort
  if (state.sort === "price-asc") result.sort((a, b) => a.price - b.price);
  else if (state.sort === "price-desc") result.sort((a, b) => b.price - a.price);
  else if (state.sort === "name-asc") result.sort((a, b) => a.name.localeCompare(b.name));

  filteredProducts = result;
  renderProducts();
}

/* ---------- RENDER GRID ---------- */
function renderProducts() {
  const grid = document.getElementById("products-grid");
  const resultsCount = document.getElementById("results-count");

  resultsCount.innerHTML = `Tìm thấy <strong>${filteredProducts.length}</strong> sản phẩm`;

  if (filteredProducts.length === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        😕 Không tìm thấy sản phẩm phù hợp.<br>Thử thay đổi bộ lọc?
        <br><button class="btn-clear-filter" onclick="clearAllFilters()">Xóa bộ lọc</button>
      </div>`;
    return;
  }

  grid.innerHTML = filteredProducts.map(p => `
    <div class="product-card">
      <div class="product-img-wrap" onclick="goToDetail('${p.id}')">
        <img class="product-img" src="../${p.image}" alt="${p.name}"
             onerror="this.src='../images/placeholder.png'">
        <span class="product-cat-badge">${CATEGORY_LABELS[p.category] || p.category}</span>
        ${!p.inStock ? `<span class="product-outstock-badge">Tạm hết hàng</span>` : ""}

        <!-- HOVER OVERLAY: hiện khi rê chuột -->
        <div class="hover-overlay">
<<<<<<< HEAD
        <button class="hover-btn hover-btn-cart"
                  onclick="event.stopPropagation(); quickAddToCart('${p.id}')"
                  ${!p.inStock ? "disabled" : ""}>
            🛒 Thêm giỏ hàng
        </button>
        <button class="hover-btn hover-btn-design"
            onclick="event.stopPropagation(); startDesign('${p.id}')">
            🎨 Bắt đầu thiết kế
        </button>
=======
          <button class="hover-btn hover-btn-cart"
                  onclick="event.stopPropagation(); quickAddToCart('${p.id}')"
                  ${!p.inStock ? "disabled" : ""}>
            🛒 Thêm giỏ hàng
          </button>
          <button class="hover-btn hover-btn-design"
                  onclick="event.stopPropagation(); goToDetail('${p.id}')">
            🎨 Bắt đầu thiết kế
          </button>
>>>>>>> main
        </div>
      </div>
      <div class="product-info" onclick="goToDetail('${p.id}')">
        <div class="product-name">${p.name}</div>
        <div class="product-tags">
          ${(p.tags || []).slice(0, 3).map(t => `<span class="tag">${t}</span>`).join("")}
        </div>
        <div class="product-price">${formatVND(p.price)}</div>
      </div>
    </div>
  `).join("");
}

<<<<<<< HEAD
function startDesign(productId) {

    const product = ALL_PRODUCTS.find(p => p.id === productId);
    if (!product) {
        showToast("Không tìm thấy sản phẩm.");
        return;
    }
    const color =
        product.colors?.[0] || "white";
    const size =
        product.sizes?.[0] || "M";
    sessionStorage.setItem(
        "printify_design_context",
        JSON.stringify({
            productId,
            productName: product.name,
            color,
            size
        })
    );
    if (!getCurrentUser()) {
        redirectToLogin(
            window.location.origin +
            window.location.pathname.replace(
                "products.html",
                `editor.html?productId=${productId}&color=${color}&size=${size}`
            )
        );
        return;
    }
    location.href =
        `editor.html?productId=${productId}&color=${color}&size=${size}`;
}

=======
>>>>>>> main
/* ---------- QUICK ADD TO CART (từ hover trên grid) ---------- */
function quickAddToCart(productId) {
  const product = ALL_PRODUCTS.find(p => p.id === productId);
  if (!product) return;

  if (!product.inStock) {
    showToast("Sản phẩm tạm hết hàng, không thể thêm vào giỏ.");
    return;
  }

<<<<<<< HEAD
  const defaultColor = (product.colors && product.colors[0]) || null;
  const defaultSize = (product.sizes && product.sizes[0]) || null;
  const user=getCurrentUser();

  const key=`printify_cart_${user.userId}`;

  const cart=
  JSON.parse(
  localStorage.getItem(key)||"[]"
  );
  localStorage.setItem(
    key,
    JSON.stringify(cart)
  );
=======
  const session = sessionStorage.getItem("printify_session");
  if (!session) {
    showToast("Vui lòng đăng nhập để thêm vào giỏ hàng.");
    return;
  }

  const defaultColor = (product.colors && product.colors[0]) || null;
  const defaultSize = (product.sizes && product.sizes[0]) || null;

  const cart = JSON.parse(localStorage.getItem("printify_cart") || "[]");
>>>>>>> main

  const existing = cart.find(item =>
    item.productId === product.id &&
    item.color === defaultColor &&
    item.size === defaultSize &&
    !item.designData
  );

  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({
      cartItemId: "CI" + Date.now(),
      productId: product.id,
      name: product.name,
      price: product.price,
      color: defaultColor,
      size: defaultSize,
      qty: 1,
      designData: null
    });
  }

  localStorage.setItem("printify_cart", JSON.stringify(cart));
  updateCartBadge();
  showToast("Đã thêm vào giỏ hàng!");
}

/* ---------- TOAST (bổ sung, dùng chung style .toast có sẵn) ---------- */
function showToast(msg) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2500);
}

/* ---------- NAVIGATE TO DETAIL (NV03) ---------- */
function goToDetail(productId) {
  window.location.href = `productDetail.html?id=${productId}`;
}

/* ---------- HELPERS ---------- */
function formatVND(amount) {
  return amount.toLocaleString("vi-VN") + "₫";
}

<<<<<<< HEAD
function updateCartBadge(){
    const user=getCurrentUser();
    if(!user){
        document.getElementById("cart-badge").style.display="none";
        return;
    }
    const key=`printify_cart_${user.userId}`;
    const cart=JSON.parse(
        localStorage.getItem(key)||"[]"
    );
    const qty=cart.reduce(
        (s,i)=>s+(i.qty||1),
        0
    );
    const badge=document.getElementById("cart-badge");
    if(qty){
        badge.style.display="flex";
        badge.textContent=qty;
    }else{
        badge.style.display="none";
    }
=======
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
>>>>>>> main
}