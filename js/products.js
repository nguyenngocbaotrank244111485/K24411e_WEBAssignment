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
  await loadProducts();
  buildCategoryFilters();
  applyFilters();
  updateCartBadge();
});

/* ---------- LOAD DATA (fetch + cache localStorage) ---------- */
async function loadProducts() {
  try {
    const res = await fetch("../dataset/products.json");
    const data = await res.json();
    ALL_PRODUCTS = data.filter(p => p.isActive !== false);
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
    <div class="product-card" onclick="goToDetail('${p.id}')">
      <div class="product-img-wrap">
        <img class="product-img" src="../${p.image}" alt="${p.name}"
             onerror="this.src='../images/placeholder.png'">
        <span class="product-cat-badge">${CATEGORY_LABELS[p.category] || p.category}</span>
        ${!p.inStock ? `<span class="product-outstock-badge">Tạm hết hàng</span>` : ""}
      </div>
      <div class="product-info">
        <div class="product-name">${p.name}</div>
        <div class="product-tags">
          ${(p.tags || []).slice(0, 3).map(t => `<span class="tag">${t}</span>`).join("")}
        </div>
        <div class="product-price">${formatVND(p.price)}</div>
      </div>
    </div>
  `).join("");
}

/* ---------- NAVIGATE TO DETAIL (NV03) ---------- */
function goToDetail(productId) {