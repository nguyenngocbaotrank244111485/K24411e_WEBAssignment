/* =========================
   CHECKOUT PAGE LOGIC (NV08 — Đặt hàng và xác nhận đơn)
   Đọc items từ sessionStorage (do cart.js truyền qua),
   tạo Order -> lưu DS6 'printify_orders', xóa item khỏi DS4 'printify_cart'
   ========================= */

let checkoutItems = [];
let appliedPromo = null;

const SHIPPING_FEE = 20000;

document.addEventListener("DOMContentLoaded", () => {
  if (typeof syncAuthUI === "function") syncAuthUI();

  // Nếu người dùng mở thẳng checkout mà chưa đăng nhập thì chuyển về login,
  // sau đăng nhập sẽ quay lại cart.
  const currentUser = getCurrentUser();
  if (!currentUser) {
    if (typeof redirectToLogin === "function") {
      redirectToLogin("../interface/cart.html");
    } else {
      sessionStorage.setItem("printify_return_to", "../interface/cart.html");
      window.location.href = "login.html";
    }
    return;
  }

  updateCartBadge();
  loadCheckoutData();
  prefillSavedInfo();
  renderCheckoutItems();
  renderSummary();
});

/* ---------- LOAD DATA FROM CART ---------- */
function loadCheckoutData() {
  const itemsRaw = sessionStorage.getItem("printify_checkout_items");
  const promoRaw = sessionStorage.getItem("printify_checkout_promo");

  checkoutItems = itemsRaw ? JSON.parse(itemsRaw) : [];
  appliedPromo = promoRaw ? JSON.parse(promoRaw) : null;

  if (checkoutItems.length === 0) {
    document.getElementById("checkout-layout").style.display = "none";
    document.getElementById("empty-checkout").style.display = "block";
  }
}

/* ---------- PREFILL THÔNG TIN ĐÃ LƯU ---------- */
function prefillSavedInfo() {
  const session = getCurrentUser();
  if (!session) return;

  const users = JSON.parse(localStorage.getItem("printify_users") || "[]");
  const user = users.find(u => u.userId === session.userId);

  if (user && user.savedShippingInfo) {
    document.getElementById("saved-info-toggle").style.display = "block";
  }
}

function toggleUseSavedInfo(checkbox) {
  if (!checkbox.checked) return;

  const session = getCurrentUser();
  const users = JSON.parse(localStorage.getItem("printify_users") || "[]");
  const user = users.find(u => u.userId === session.userId);
  const info = user?.savedShippingInfo;
  if (!info) return;

  document.getElementById("ship-name").value = info.name || "";
  document.getElementById("ship-phone").value = info.phone || "";
  document.getElementById("ship-address").value = info.address || "";
  document.getElementById("ship-province").value = info.province || "";
  document.getElementById("ship-district").value = info.district || "";
  document.getElementById("ship-ward").value = info.ward || "";
}

/* ---------- RENDER ITEMS TÓM TẮT ---------- */
function renderCheckoutItems() {
  const container = document.getElementById("checkout-items-list");
  const products = getProductsCache();

  container.innerHTML = checkoutItems.map(item => {
    const product = products.find(p => p.id === item.productId);
    const thumbSrc = item.designData?.thumbnailBase64
      ? item.designData.thumbnailBase64
      : `../${product?.image || "images/placeholder.png"}`;

    return `
      <div class="checkout-item-row">
        <img class="checkout-item-thumb" src="${thumbSrc}" alt="${item.name}"
             onerror="this.src='../images/placeholder.png'">
        <div>
          <div class="checkout-item-name">${item.name}</div>
          <div class="checkout-item-meta">
            ${item.color ? item.color + " · " : ""}${item.size ? item.size + " · " : ""}x${item.qty}
          </div>
        </div>
        <div class="checkout-item-linetotal">${formatVND(item.price * item.qty)}</div>
      </div>
    `;
  }).join("");
}

function getProductsCache() {
  const cached = localStorage.getItem("printify_products_cache");
  return cached ? JSON.parse(cached) : [];
}

/* ---------- SUMMARY ---------- */
function renderSummary() {
  const subtotal = checkoutItems.reduce((sum, i) => sum + i.price * i.qty, 0);
  let shipping = checkoutItems.length > 0 ? SHIPPING_FEE : 0;
  let discount = 0;

  if (appliedPromo) {
    if (appliedPromo.type === "percent") {
      discount = Math.round(subtotal * (appliedPromo.value / 100));
    } else if (appliedPromo.type === "shipping") {
      shipping = 0;
    }
  }

  const total = subtotal + shipping - discount;

  document.getElementById("summary-subtotal").textContent = formatVND(subtotal);
  document.getElementById("summary-shipping").textContent = shipping > 0 ? formatVND(shipping) : "Miễn phí";

  if (discount > 0) {
    document.getElementById("summary-discount-row").style.display = "flex";
    document.getElementById("summary-discount").textContent = "-" + formatVND(discount);
  }

  document.getElementById("summary-total").textContent = formatVND(Math.max(total, 0));
}

/* ---------- VALIDATE FORM ---------- */
function validateShippingForm() {
  let isValid = true;
  clearFieldErrors();

  const name = document.getElementById("ship-name").value.trim();
  const phone = document.getElementById("ship-phone").value.trim();
  const address = document.getElementById("ship-address").value.trim();
  const province = document.getElementById("ship-province").value.trim();
  const district = document.getElementById("ship-district").value.trim();
  const ward = document.getElementById("ship-ward").value.trim();

  if (!name) {
    setFieldError("ship-name", "Vui lòng nhập họ và tên.");
    isValid = false;
  }

  const phoneRegex = /^0[0-9]{9}$/;
  if (!phone) {
    setFieldError("ship-phone", "Vui lòng nhập số điện thoại.");
    isValid = false;
  } else if (!phoneRegex.test(phone)) {
    setFieldError("ship-phone", "Số điện thoại không hợp lệ. Vui lòng nhập 10 chữ số bắt đầu bằng 0.");
    isValid = false;
  }

  if (!address) {
    setFieldError("ship-address", "Vui lòng nhập số nhà, tên đường.");
    isValid = false;
  }
  if (!province) {
    setFieldError("ship-province", "Vui lòng nhập tỉnh/thành phố.");
    isValid = false;
  }
  if (!district) {
    setFieldError("ship-district", "Vui lòng nhập quận/huyện.");
    isValid = false;
  }
  if (!ward) {
    setFieldError("ship-ward", "Vui lòng nhập phường/xã.");
    isValid = false;
  }

  return isValid;
}

function setFieldError(inputId, message) {
  document.getElementById(inputId).classList.add("field-invalid");
  document.getElementById("err-" + inputId).textContent = message;
}

function clearFieldErrors() {
  document.querySelectorAll(".form-input").forEach(el => el.classList.remove("field-invalid"));
  document.querySelectorAll(".field-error").forEach(el => el.textContent = "");
}

/* ---------- CONFIRM ORDER (NV08 chính) ---------- */
function handleConfirmOrder() {
  if (checkoutItems.length === 0) {
    showToast("Không có sản phẩm để đặt hàng.");
    return;
  }

  if (!validateShippingForm()) {
    showToast("Vui lòng kiểm tra lại thông tin giao hàng.");
    return;
  }

  const session = getCurrentUser();
  if (!session) {
    showToast("Vui lòng đăng nhập để đặt hàng.");
    if (typeof redirectToLogin === "function") {
      redirectToLogin("../interface/cart.html");
    } else {
      sessionStorage.setItem("printify_return_to", "../interface/cart.html");
      window.location.href = "login.html";
    }
    return;
  }

  const btn = document.getElementById("btn-confirm-order");
  btn.disabled = true;
  btn.textContent = "Đang xử lý...";

  const shippingInfo = {
    name: document.getElementById("ship-name").value.trim(),
    phone: document.getElementById("ship-phone").value.trim(),
    address: document.getElementById("ship-address").value.trim(),
    province: document.getElementById("ship-province").value.trim(),
    district: document.getElementById("ship-district").value.trim(),
    ward: document.getElementById("ship-ward").value.trim(),
    note: document.getElementById("ship-note").value.trim()
  };

  const subtotal = checkoutItems.reduce((sum, i) => sum + i.price * i.qty, 0);
  let shipping = SHIPPING_FEE;
  let discount = 0;
  if (appliedPromo) {
    if (appliedPromo.type === "percent") discount = Math.round(subtotal * (appliedPromo.value / 100));
    else if (appliedPromo.type === "shipping") shipping = 0;
  }
  const totalAmount = subtotal + shipping - discount;

  const orderId = "PF" + Date.now();
  const now = new Date().toISOString();

  const order = {
    orderId,
    userId: session.userId,
    items: checkoutItems,
    shippingInfo,
    payment: { method: "transfer", amount: totalAmount },
    status: "Chờ xác nhận",
    createdAt: now,
    timeline: [
      { status: "Chờ xác nhận", time: now, note: "Đơn hàng đã được tạo, chờ xác nhận thanh toán." }
    ]
  };

  const orders = JSON.parse(localStorage.getItem("printify_orders") || "[]");
  orders.push(order);
  localStorage.setItem("printify_orders", JSON.stringify(orders));

  removeCheckedOutItemsFromCart();
  saveShippingInfoToProfile(session.userId, shippingInfo);

  sessionStorage.removeItem("printify_checkout_items");
  sessionStorage.removeItem("printify_checkout_promo");
  sessionStorage.setItem("printify_last_order_id", orderId);

  showToast("Đặt hàng thành công!");
  setTimeout(() => {
    window.location.href = "order-success.html";
  }, 600);
}

function removeCheckedOutItemsFromCart() {
  const cart = JSON.parse(localStorage.getItem("printify_cart") || "[]");
  const checkedOutIds = new Set(checkoutItems.map(i => i.cartItemId));
  const remaining = cart.filter(i => !checkedOutIds.has(i.cartItemId));
  localStorage.setItem("printify_cart", JSON.stringify(remaining));
}

function saveShippingInfoToProfile(userId, shippingInfo) {
  const users = JSON.parse(localStorage.getItem("printify_users") || "[]");
  const user = users.find(u => u.userId === userId);
  if (user) {
    user.savedShippingInfo = shippingInfo;
    localStorage.setItem("printify_users", JSON.stringify(users));
  }
}

/* ---------- HELPERS ---------- */
function getCurrentUser() {
  if (typeof window.getCurrentUser === "function" && window.getCurrentUser !== getCurrentUser) {
    return window.getCurrentUser();
  }

  try {
    const raw =
      sessionStorage.getItem("printify_current_customer") ||
      localStorage.getItem("printify_current_customer") ||
      sessionStorage.getItem("printify_session");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function formatVND(amount) {
  return amount.toLocaleString("vi-VN") + "₫";
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