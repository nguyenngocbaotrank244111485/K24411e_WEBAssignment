/* =========================
   ORDER SUCCESS PAGE LOGIC
   Đọc orderId từ sessionStorage 'printify_last_order_id'
   (do checkout.js lưu), tra cứu chi tiết trong DS6 'printify_orders'
   ========================= */

document.addEventListener("DOMContentLoaded", () => {
  updateCartBadge();

  const orderId = sessionStorage.getItem("printify_last_order_id");
  if (!orderId) {
    showEmptyState();
    return;
  }

  const order = findOrderById(orderId);
  if (!order) {
    showEmptyState();
    return;
  }

  renderOrderDetail(order);

  // Dọn key tạm sau khi đã hiển thị, tránh hiển thị lại nếu reload nhầm nhiều lần
  // (giữ lại orderId trong sessionStorage để F5 vẫn xem lại được trong cùng phiên,
  //  chỉ xóa khi rời trang qua các nút điều hướng)
});

/* ---------- FIND ORDER (DS6) ---------- */
function findOrderById(orderId) {
  const orders = JSON.parse(localStorage.getItem("printify_orders") || "[]");
  return orders.find(o => o.orderId === orderId) || null;
}

/* ---------- SHOW EMPTY STATE ---------- */
function showEmptyState() {
  document.getElementById("success-block").style.display = "none";
  document.getElementById("empty-block").style.display = "block";
}

/* ---------- RENDER ORDER DETAIL ---------- */
function renderOrderDetail(order) {
  document.getElementById("order-id-display").textContent = order.orderId;

  // Sản phẩm đã đặt
  const products = getProductsCache();
  const itemsList = document.getElementById("order-items-list");
  itemsList.innerHTML = order.items.map(item => {
    const product = products.find(p => p.id === item.productId);
    const thumbSrc = item.designData?.thumbnailBase64
      ? item.designData.thumbnailBase64
      : `../${product?.image || "images/placeholder.png"}`;

    return `
      <div class="order-item-row">
        <img class="order-item-thumb" src="${thumbSrc}" alt="${item.name}"
             onerror="this.src='../images/placeholder.png'">
        <div>
          <div class="order-item-name">${item.name}</div>
          <div class="order-item-meta">
            ${item.color ? item.color + " · " : ""}${item.size ? item.size + " · " : ""}x${item.qty}
          </div>
        </div>
        <div class="order-item-linetotal">${formatVND(item.price * item.qty)}</div>
      </div>
    `;
  }).join("");

  // Thông tin giao hàng
  const si = order.shippingInfo || {};
  const shippingGrid = document.getElementById("shipping-info-grid");
  shippingGrid.innerHTML = `
    <div class="info-item">
      <span class="info-label">Người nhận</span>
      <span class="info-value">${si.name || "—"}</span>
    </div>
    <div class="info-item">
      <span class="info-label">Số điện thoại</span>
      <span class="info-value">${si.phone || "—"}</span>
    </div>
    <div class="info-item full">
      <span class="info-label">Địa chỉ</span>
      <span class="info-value">
        ${[si.address, si.ward, si.district, si.province].filter(Boolean).join(", ") || "—"}
      </span>
    </div>
    ${si.note ? `
    <div class="info-item full">
      <span class="info-label">Ghi chú</span>
      <span class="info-value">${si.note}</span>
    </div>` : ""}
  `;

  // Tổng tiền
  const subtotal = order.items.reduce((sum, i) => sum + i.price * i.qty, 0);
  const totalAmount = order.payment?.amount ?? subtotal;
  const shippingFee = totalAmount - subtotal >= 0 ? totalAmount - subtotal : 0;

  document.getElementById("detail-subtotal").textContent = formatVND(subtotal);
  document.getElementById("detail-shipping").textContent = shippingFee > 0 ? formatVND(shippingFee) : "Miễn phí";
  document.getElementById("detail-total").textContent = formatVND(totalAmount);
}

/* ---------- HELPERS ---------- */
function getProductsCache() {
  const cached = localStorage.getItem("printify_products_cache");
  return cached ? JSON.parse(cached) : [];
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