let allProducts = [];

/* =========================
   INIT
========================= */
document.addEventListener("DOMContentLoaded", async () => {
    initAuthUI();

    await loadProducts();
    updateCartBadge();
    renderCategories();
    renderFooterCategories();
    renderFeaturedProducts();
});

/* =========================
   Helpers
========================= */
function formatPrice(price) {
    return Number(price || 0).toLocaleString("vi-VN") + "₫";
}

function showToast(message, type = "success") {
    const container = document.getElementById("toast-container");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}

function flattenProducts(data) {
    if (Array.isArray(data)) return data;

    if (data && Array.isArray(data.categories)) {
        return data.categories.flatMap(cat => Array.isArray(cat.products) ? cat.products : []);
    }

    return [];
}

function shuffleArray(arr) {
    return [...arr].sort(() => Math.random() - 0.5);
}

/* =========================
   Load Products
========================= */
async function loadProducts() {
    try {
        const res = await fetch("../dataset/products.json");
        const data = await res.json();

        allProducts = (data.categories || [])
            .flatMap(cat => cat.products || [])
            .filter(p => p && p.isActive !== false);

    } catch (err) {
        console.error(err);
        showToast("Không tải được danh sách sản phẩm.", "error");
        allProducts = [];
    }
}

/* =========================
   Auth / Logout
========================= */
function logout() {
    if (typeof clearCurrentUser === "function") {
        clearCurrentUser();
    }
    showToast("Đã đăng xuất.", "success");
}

/* =========================
   Cart Badge
========================= */
function updateCartBadge() {
    const cart = JSON.parse(localStorage.getItem("printify_cart") || "[]");
    const total = cart.reduce((sum, item) => sum + Number(item.qty || 1), 0);

    const badge = document.getElementById("cart-badge");
    if (!badge) return;

    if (total > 0) {
        badge.style.display = "flex";
        badge.textContent = total > 99 ? "99+" : total;
    } else {
        badge.style.display = "none";
    }
}

/* =========================
   Categories
========================= */
const CAT_META = {
    clothing: {
        icon: "👕",
        name: "Quần áo"
    },
    stationery: {
        icon: "✏️",
        name: "Văn phòng phẩm"
    },
    accessories: {
        icon: "🎀",
        name: "Phụ kiện"
    },
    homeware: {
        icon: "🏠",
        name: "Gia dụng"
    },
    advertisement: {
        icon: "📢",
        name: "Quảng cáo"
    },
    packaging: {
        icon: "📦",
        name: "Bao bì"
    },
    office: {
        icon: "💼",
        name: "Văn phòng"
    }
};

function renderCategories() {
    const grid = document.getElementById("category-grid");
    if (!grid) return;

    const counter = {};
    allProducts.forEach(product => {
        const cat = product.category || "other";
        counter[cat] = (counter[cat] || 0) + 1;
    });

    grid.innerHTML = "";

    Object.entries(counter).forEach(([category, total]) => {
        const meta = CAT_META[category] || {
            icon: "🎁",
            name: category
        };

        grid.innerHTML += `
            <div class="cat-card" onclick="location.href='../interface/products.html?cat=${category}'">
                <div class="cat-icon">${meta.icon}</div>
                <div class="cat-name">${meta.name}</div>
                <div class="cat-count">${total} sản phẩm</div>
            </div>
        `;
    });
}

/* =========================
   Footer Categories
========================= */
function renderFooterCategories() {
    const ul = document.getElementById("footer-category-list");
    if (!ul) return;

    const categories = [...new Set(allProducts.map(p => p.category).filter(Boolean))];

    ul.innerHTML = categories.map(cat => `
        <li>
            <a href="../interface/products.html?cat=${cat}">
                ${CAT_META[cat]?.name || cat}
            </a>
        </li>
    `).join("");
}

/* =========================
   Featured Products
========================= */
function renderFeaturedProducts() {
    const grid = document.getElementById("popular-grid");
    if (!grid) return;
    let featured = allProducts.filter(p => p.popular);
    if (featured.length < 3) {
        featured = [...allProducts];
    }
    featured = shuffleArray(featured).slice(0, 3);
    if (!featured.length) {
        grid.innerHTML = `<div class="loading">Chưa có sản phẩm để hiển thị.</div>`;
        return;
    }
    grid.innerHTML = featured.map(renderCard).join("");
}
/* =========================
   Product Card
========================= */
function renderCard(product) {
    const id = product.productId || product.id || "";
    const image = product.image || "../images/products/placeholder.png";

    return `
        <div class="product-card" onclick="location.href='../interface/productDetail.html?id=${id}'">
            <img
                class="product-card-img"
                src="${image}"
                alt="${product.name || ''}"
                onerror="this.src='../images/products/placeholder.png'">

            <div class="product-card-body">
                <span class="product-card-badge">
                    ${CAT_META[product.category]?.name || product.category || ""}
                </span>

                <h3 class="product-card-name">
                    ${product.name || ""}
                </h3>

                <p class="product-card-price">
                    ${formatPrice(product.price)}
                </p>

                <button
                    class="product-card-btn"
                    onclick="event.stopPropagation(); handleDesignClick('${id}')">
                    🎨 Thiết kế ngay
                </button>
            </div>
        </div>
    `;
}

/* =========================
   Design Button
========================= */
function handleDesignClick(productId) {
    const returnUrl = `../interface/editor.html?productId=${encodeURIComponent(productId)}`;

    if (typeof isLoggedIn === "function" && !isLoggedIn()) {
        if (typeof redirectToLogin === "function") {
            redirectToLogin(returnUrl);
        } else {
            window.location.href = "../interface/login.html";
        }
        return;
    }

    window.location.href = returnUrl;
}