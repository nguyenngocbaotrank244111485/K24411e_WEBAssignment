/* CART PAGE LOGIC - CART MANAGEMENT
   READ DS4 (localStorage 'printify_cart') */

let cart = [];
let allProductsCache = [];
let selectedItemIds = new Set();
let appliedPromo = null;

const SHIPPING_FEE = 20000; // Simulated shipping fee (Same price, regardless of distance)
const MAX_QTY = 999;

const PROMO_CODES = {
  "PRINTIFY10": { type: "percent", value: 10, label: "Giảm 10%" },
  "FREESHIP": { type: "shipping", value: 0, label: "Miễn phí vận chuyển" }
};

document.addEventListener("DOMContentLoaded", async () => {
  if (typeof syncAuthUI === "function") syncAuthUI();
  loadCart();
  await loadProductsCache();
  restorePendingCheckoutSelection();
  renderCart();
  updateCartBadge();
});

/* LOAD DATA */
function loadCart() {
  cart = JSON.parse(localStorage.getItem("printify_cart") || "[]");
  // all items are default-selected when entering the page
  selectedItemIds = new Set(cart.map(item => item.cartItemId));
}

function restorePendingCheckoutSelection() {
  const raw = sessionStorage.getItem("printify_pending_cart_selection");
  if (!raw) return;

  try {
    const pending = JSON.parse(raw);
    if (Array.isArray(pending.selectedItemIds) && pending.selectedItemIds.length) {
      selectedItemIds = new Set(pending.selectedItemIds.filter(id => cart.some(item => item.cartItemId === id)));
    }
    if (pending.promo) {
      appliedPromo = pending.promo;
    }
  } catch (err) {
    console.error("Không khôi phục được lựa chọn giỏ hàng:", err);
  }
}

async function loadProductsCache() {
  const cached = localStorage.getItem("printify_products_cache");
  if (cached) {
    allProductsCache = JSON.parse(cached);
    return;
  }
  try {
    const res = await fetch("../dataset/products.json");
    const data = await res.json();
    const flat = (data.categories || []).flatMap(cat => cat.products || []);
    allProductsCache = flat.map(p => ({ ...p, id: p.productId }));
  } catch (err) {
    console.error("Không tải được products.json:", err);
    allProductsCache = [];
  }
}

function saveCart() {
  localStorage.setItem("printify_cart", JSON.stringify(cart));
  updateCartBadge();
}

/* RENDER */
function renderCart() {
  const layout = document.getElementById("cart-layout");
  const emptyState = document.getElementById("empty-cart");

  if (cart.length === 0) {
    layout.style.display = "none";
    emptyState.style.display = "block";
    return;
  }

  layout.style.display = "grid";
  emptyState.style.display = "none";

  const container = document.getElementById("cart-items-container");
  container.innerHTML = cart.map(item => renderCartItem(item)).join("");

  updateSelectAllCheckbox();
  renderSummary();
}

function renderCartItem(item) {
  const product = allProductsCache.find(p => p.id === item.productId);
  const thumbSrc = item.designData?.thumbnailBase64
    ? item.designData.thumbnailBase64
    : `../${product?.image || "images/placeholder.png"}`;

  const isChecked = selectedItemIds.has(item.cartItemId);
  const lineTotal = item.price * item.qty;

  return `
    <div class="cart-item" data-id="${item.cartItemId}">
      <input type="checkbox" class="cart-item-check" ${isChecked ? "checked" : ""}
             onchange="toggleSelectItem('${item.cartItemId}', this)">

      <img class="cart-item-thumb" src="${thumbSrc}" alt="${item.name}"
           onerror="this.src='../images/placeholder.png'">

      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-meta">
          ${item.color ? `<span>${item.color}</span>` : ""}
          ${item.size ? `<span>${item.size}</span>` : ""}
        </div>
        ${item.designData ? `<div class="cart-item-design-tag">🎨 Có thiết kế riêng</div>` : ""}
        <div class="cart-item-unitprice">${formatVND(item.price)} / sản phẩm</div>
      </div>

      <div class="cart-qty-control">
        <button class="qty-btn-cart" onclick="changeQty('${item.cartItemId}', -1)">−</button>
        <input type="number" class="qty-input-cart" value="${item.qty}" min="1" max="${MAX_QTY}"
               onchange="setQty('${item.cartItemId}', this.value)">
        <button class="qty-btn-cart" onclick="changeQty('${item.cartItemId}', 1)">+</button>
      </div>

      <div class="cart-item-right">
        <div class="cart-item-total">${formatVND(lineTotal)}</div>
        <button class="cart-item-remove" onclick="confirmRemoveItem('${item.cartItemId}')">🗑 Xóa</button>
      </div>
    </div>
  `;
}

/*  QUANTITY HANDLERS  */
function changeQty(cartItemId, delta) {
  const item = cart.find(i => i.cartItemId === cartItemId);
  if (!item) return;

  let newQty = item.qty + delta;
  if (newQty < 1) newQty = 1;
  if (newQty > MAX_QTY) {
    newQty = MAX_QTY;
    showToast(`Số lượng tối đa là ${MAX_QTY}`);
  }
  item.qty = newQty;
  saveCart();
  renderCart();
}

function setQty(cartItemId, value) {
  const item = cart.find(i => i.cartItemId === cartItemId);
  if (!item) return;

  let qty = parseInt(value, 10);

  if (isNaN(qty) || qty < 1) {
    qty = 1;
    showToast("Số lượng tối thiểu là 1. Để xóa sản phẩm, dùng nút Xóa.");
  } else if (qty > MAX_QTY) {
    qty = MAX_QTY;
    showToast(`Số lượng tối đa là ${MAX_QTY}`);
  }

  item.qty = qty;
  saveCart();
  renderCart();
}

/*  SELECT ITEMS */
function toggleSelectItem(cartItemId, checkbox) {
  if (checkbox.checked) selectedItemIds.add(cartItemId);
  else selectedItemIds.delete(cartItemId);

  updateSelectAllCheckbox();
  renderSummary();
}

function toggleSelectAll(checkbox) {
  if (checkbox.checked) {
    selectedItemIds = new Set(cart.map(i => i.cartItemId));
  } else {
    selectedItemIds.clear();
  }
  renderCart();
}

function updateSelectAllCheckbox() {
  const selectAll = document.getElementById("select-all");
  if (!selectAll) return;
  selectAll.checked = cart.length > 0 && selectedItemIds.size === cart.length;
}

/*  REMOVE ITEM(S)  */
function confirmRemoveItem(cartItemId) {
  showConfirmModal(
    "Xóa sản phẩm",
    "Bạn có chắc muốn xóa sản phẩm này khỏi giỏ hàng?",
    () => {
      cart = cart.filter(i => i.cartItemId !== cartItemId);
      selectedItemIds.delete(cartItemId);
      saveCart();
      renderCart();
      closeConfirmModal();
      showToast("Đã xóa sản phẩm khỏi giỏ hàng");
    }
  );
}

function confirmClearCart() {
  if (cart.length === 0) return;
  showConfirmModal(
    "Xóa tất cả sản phẩm",
    "Bạn có chắc muốn xóa toàn bộ giỏ hàng? Hành động này không thể hoàn tác.",
    () => {
      cart = [];
      selectedItemIds.clear();
      saveCart();
      renderCart();
      closeConfirmModal();
      showToast("Đã xóa toàn bộ giỏ hàng");
    }
  );
}

/*  CONFIRM MODAL (dùng chung)  */
function showConfirmModal(title, desc, onConfirm) {
  document.getElementById("confirm-title").textContent = title;
  document.getElementById("confirm-desc").textContent = desc;
  const modal = document.getElementById("confirm-modal");
  const okBtn = document.getElementById("confirm-btn-ok");

  // Reattach the handle each time you open it to avoid overlapping the old listener.
  const newOkBtn = okBtn.cloneNode(true);
  okBtn.parentNode.replaceChild(newOkBtn, okBtn);
  newOkBtn.id = "confirm-btn-ok";
  newOkBtn.addEventListener("click", onConfirm);

  modal.style.display = "flex";
}

function closeConfirmModal() {
  document.getElementById("confirm-modal").style.display = "none";
}

/*  PROMO CODE  */
function applyPromoCode() {
  const input = document.getElementById("promo-input");
  const code = input.value.trim().toUpperCase();
  const msgEl = document.getElementById("promo-message");

  if (!code) {
    msgEl.textContent = "Vui lòng nhập mã giảm giá.";
    msgEl.className = "promo-message error";
    return;
  }

  const promo = PROMO_CODES[code];
  if (!promo) {
    msgEl.textContent = "Mã giảm giá không hợp lệ hoặc đã hết hạn.";
    msgEl.className = "promo-message error";
    appliedPromo = null;
  } else {
    appliedPromo = promo;
    msgEl.textContent = `✓ Áp dụng thành công: ${promo.label}`;
    msgEl.className = "promo-message success";
  }

  renderSummary();
}

/* SUMMARY CALCULATION */
function renderSummary() {
  const selectedItems = cart.filter(i => selectedItemIds.has(i.cartItemId));
  const itemCount = selectedItems.reduce((sum, i) => sum + i.qty, 0);
  const subtotal = selectedItems.reduce((sum, i) => sum + i.price * i.qty, 0);

  let shipping = selectedItems.length > 0 ? SHIPPING_FEE : 0;
  let discount = 0;

  if (appliedPromo && selectedItems.length > 0) {
    if (appliedPromo.type === "percent") {
      discount = Math.round(subtotal * (appliedPromo.value / 100));
    } else if (appliedPromo.type === "shipping") {
      shipping = 0;
    }
  }

  const total = subtotal + shipping - discount;

  document.getElementById("summary-item-count").textContent = itemCount;
  document.getElementById("summary-subtotal").textContent = formatVND(subtotal);
  document.getElementById("summary-shipping").textContent = shipping > 0 ? formatVND(shipping) : "Miễn phí";
  document.getElementById("summary-total").textContent = formatVND(Math.max(total, 0));

  const checkoutBtn = document.getElementById("btn-checkout");
  checkoutBtn.disabled = selectedItems.length === 0;
}

/* CHECKOUT */
function proceedToCheckout() {
  const selectedItems = cart.filter(i => selectedItemIds.has(i.cartItemId));
  if (selectedItems.length === 0) {
    showToast("Vui lòng chọn ít nhất 1 sản phẩm để đặt hàng.");
    return;
  }

  const currentUser = typeof getCurrentUser === "function" ? getCurrentUser() : null;
  if (!currentUser) {
    sessionStorage.setItem("printify_pending_cart_selection", JSON.stringify({
      selectedItemIds: [...selectedItemIds],
      promo: appliedPromo
    }));

    showToast("Vui lòng đăng nhập hoặc đăng ký để tiếp tục đặt hàng.");
    if (typeof redirectToLogin === "function") {
      redirectToLogin(window.location.href);
    } else {
      sessionStorage.setItem("printify_return_to", window.location.href);
      window.location.href = "login.html";
    }
    return;
  }

  sessionStorage.setItem("printify_checkout_items", JSON.stringify(selectedItems));
  sessionStorage.setItem("printify_checkout_promo", JSON.stringify(appliedPromo));
  sessionStorage.removeItem("printify_pending_cart_selection");

  window.location.href = "checkout.html";
}

/* HELPERS */
function formatVND(amount) {
  return amount.toLocaleString("vi-VN") + "₫";
}

function updateCartBadge() {
  const c = JSON.parse(localStorage.getItem("printify_cart") || "[]");
  const totalQty = c.reduce((sum, item) => sum + (item.qty || 0), 0);
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