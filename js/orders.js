/* =========================
   ORDERS PAGE LOGIC (NV10 — Theo dõi đơn hàng, NV11 — Yêu cầu hoàn hàng)
   Đọc/ghi DS6 'printify_orders', ghi DS11 'printify_returns'
   ========================= */

let allOrders = [];
let currentFilterStatus = "all";
let currentOrder = null;
let returnImagesBase64 = [];

const RETURN_WINDOW_DAYS = 7;

document.addEventListener("DOMContentLoaded", () => {
  updateCartBadge();

  const session = getSession();
  if (!session) {
    showGuestState();
    return;
  }

  showOrdersState();
  loadOrders(session.userId);
  renderOrders();
});

/* ---------- STATE SWITCH ---------- */
function showGuestState() {
  document.getElementById("guest-block").style.display = "block";
  document.getElementById("orders-content").style.display = "none";
}

function showOrdersState() {
  document.getElementById("guest-block").style.display = "none";
  document.getElementById("orders-content").style.display = "block";
}

/* ---------- LOAD DATA ---------- */
function loadOrders(userId) {
  const orders = JSON.parse(localStorage.getItem("printify_orders") || "[]");
  allOrders = orders
    .filter(o => o.userId === userId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

/* ---------- FILTER BY STATUS ---------- */
function filterByStatus(status) {
  currentFilterStatus = status;
  document.querySelectorAll(".status-tab").forEach(tab => {
    tab.classList.toggle("active", tab.dataset.status === status);
  });
  renderOrders();
}

/* ---------- RENDER ORDER LIST ---------- */
function renderOrders() {
  const listEl = document.getElementById("orders-list");
  const emptyEl = document.getElementById("empty-orders");

  const filtered = currentFilterStatus === "all"
    ? allOrders
    : allOrders.filter(o => o.status === currentFilterStatus);

  if (allOrders.length === 0) {
    listEl.style.display = "none";
    emptyEl.style.display = "block";
    document.getElementById("empty-orders-title").textContent = "Bạn chưa có đơn hàng nào";
    document.getElementById("empty-orders-desc").textContent = "Hãy khám phá sản phẩm và bắt đầu mua sắm!";
    return;
  }

  if (filtered.length === 0) {
    listEl.style.display = "none";
    emptyEl.style.display = "block";
    document.getElementById("empty-orders-title").textContent = "Không có đơn hàng nào ở trạng thái này";
    document.getElementById("empty-orders-desc").textContent = "Thử chọn bộ lọc khác để xem đơn hàng.";
    return;
  }

  listEl.style.display = "flex";
  emptyEl.style.display = "none";

  const products = getProductsCache();

  listEl.innerHTML = filtered.map(order => {
    const thumbs = order.items.slice(0, 4).map(item => {
      const product = products.find(p => p.id === item.productId);
      const src = item.designData?.thumbnailBase64
        ? item.designData.thumbnailBase64
        : `../${product?.image || "images/placeholder.png"}`;
      return `<img class="order-thumb" src="${src}" onerror="this.src='../images/placeholder.png'">`;
    }).join("");

    const moreCount = order.items.length - 4;
    const moreThumb = moreCount > 0 ? `<div class="order-thumb-more">+${moreCount}</div>` : "";

    return `
      <div class="order-card" onclick="openOrderDetail('${order.orderId}')">
        <div class="order-card-header">
          <div>
            <div class="order-card-id">${order.orderId}</div>
            <div class="order-card-date">${formatDate(order.createdAt)}</div>
          </div>
          <span class="status-badge ${statusToClass(order.status)}">${order.status}</span>
        </div>
        <div class="order-card-body">
          ${thumbs}${moreThumb}
        </div>
        <div class="order-card-footer">
          <div class="order-card-total">Tổng cộng<strong>${formatVND(order.payment?.amount || 0)}</strong></div>
          <div class="order-card-arrow">Xem chi tiết →</div>
        </div>
      </div>
    `;
  }).join("");
}

/* ---------- OPEN ORDER DETAIL MODAL ---------- */
function openOrderDetail(orderId) {
  currentOrder = allOrders.find(o => o.orderId === orderId);
  if (!currentOrder) return;

  document.getElementById("modal-order-id").textContent = currentOrder.orderId;
  document.getElementById("modal-order-date").textContent = formatDate(currentOrder.createdAt);

  const statusBadge = document.getElementById("modal-status-badge");
  statusBadge.textContent = currentOrder.status;
  statusBadge.className = `status-badge ${statusToClass(currentOrder.status)}`;

  renderTimeline(currentOrder);
  renderModalItems(currentOrder);
  renderModalShipping(currentOrder);

  document.getElementById("modal-total").textContent = formatVND(currentOrder.payment?.amount || 0);

  renderModalActions(currentOrder);

  document.getElementById("order-detail-modal").classList.add("show");
}

function closeOrderDetailModal() {
  document.getElementById("order-detail-modal").classList.remove("show");
}

/* ---------- RENDER TIMELINE ---------- */
function renderTimeline(order) {
  const timeline = order.timeline || [];
  const container = document.getElementById("order-timeline");

  if (timeline.length === 0) {
    container.innerHTML = `<div class="timeline-step"><div class="timeline-dot"></div><div class="timeline-content"><div class="timeline-status">${order.status}</div></div></div>`;
    return;
  }

  container.innerHTML = timeline.map(t => `
    <div class="timeline-step">
      <div class="timeline-dot"></div>
      <div class="timeline-content">
        <div class="timeline-status">${t.status}</div>
        ${t.note ? `<div class="timeline-note">${t.note}</div>` : ""}
        <div class="timeline-time">${formatDateTime(t.time)}</div>
      </div>
    </div>
  `).join("");
}

/* ---------- RENDER ITEMS ---------- */
function renderModalItems(order) {
  const products = getProductsCache();
  const container = document.getElementById("modal-items-list");

  container.innerHTML = order.items.map(item => {
    const product = products.find(p => p.id === item.productId);
    const thumbSrc = item.designData?.thumbnailBase64
      ? item.designData.thumbnailBase64
      : `../${product?.image || "images/placeholder.png"}`;

    return `
      <div class="modal-item-row">
        <img class="modal-item-thumb" src="${thumbSrc}" onerror="this.src='../images/placeholder.png'">
        <div>
          <div class="modal-item-name">${item.name}</div>
          <div class="modal-item-meta">
            ${item.color ? item.color + " · " : ""}${item.size ? item.size + " · " : ""}x${item.qty}
          </div>
        </div>
        <div class="modal-item-total">${formatVND(item.price * item.qty)}</div>
      </div>
    `;
  }).join("");
}

/* ---------- RENDER SHIPPING INFO ---------- */
function renderModalShipping(order) {
  const si = order.shippingInfo || {};
  document.getElementById("modal-shipping-grid").innerHTML = `
    <div><strong>${si.name || "—"}</strong> · ${si.phone || "—"}</div>
    <div>${[si.address, si.ward, si.district, si.province].filter(Boolean).join(", ")}</div>
    ${si.note ? `<div>Ghi chú: ${si.note}</div>` : ""}
  `;
}

/* ---------- RENDER ACTION BUTTONS THEO TRẠNG THÁI ---------- */
function renderModalActions(order) {
  const container = document.getElementById("modal-actions");
  let buttons = "";

  if (order.status === "Chờ xác nhận") {
    buttons += `<button class="btn-danger-outline" onclick="confirmCancelOrder('${order.orderId}')">❌ Hủy đơn hàng</button>`;
  }

  if (order.status === "Hoàn tất") {
    const canReturn = isWithinReturnWindow(order);
    if (canReturn) {
      buttons += `<button class="btn-secondary" onclick="openReturnModal('${order.orderId}')">🔄 Yêu cầu hoàn hàng</button>`;
    } else {
      buttons += `<div class="modal-hint" style="width:100%">⏰ Đã quá thời hạn hoàn hàng 7 ngày kể từ ngày nhận.</div>`;
    }
    buttons += `<a class="btn-primary" href="products.html">🔁 Đặt lại</a>`;
  }

  if (order.status === "Yêu cầu hoàn hàng") {
    buttons += `<div class="modal-hint" style="width:100%">📨 Yêu cầu hoàn hàng của bạn đang được xét duyệt. Chúng tôi sẽ phản hồi trong 24-48 giờ.</div>`;
  }

  container.innerHTML = buttons;
}

function isWithinReturnWindow(order) {
  const createdAt = new Date(order.createdAt).getTime();
  const now = Date.now();
  const diffDays = (now - createdAt) / (1000 * 60 * 60 * 24);
  return diffDays <= RETURN_WINDOW_DAYS;
}

/* ---------- CANCEL ORDER ---------- */
function confirmCancelOrder(orderId) {
  document.getElementById("confirm-title").textContent = "Hủy đơn hàng";
  document.getElementById("confirm-desc").textContent = `Bạn có chắc muốn hủy đơn hàng ${orderId}?`;

  const modal = document.getElementById("confirm-modal");
  const okBtn = document.getElementById("confirm-btn-ok");
  const newOkBtn = okBtn.cloneNode(true);
  okBtn.parentNode.replaceChild(newOkBtn, okBtn);
  newOkBtn.id = "confirm-btn-ok";
  newOkBtn.addEventListener("click", () => doCancelOrder(orderId));

  modal.style.display = "flex";
}

function doCancelOrder(orderId) {
  const orders = JSON.parse(localStorage.getItem("printify_orders") || "[]");
  const order = orders.find(o => o.orderId === orderId);
  if (!order) return;

  order.status = "Đã hủy";
  order.timeline = order.timeline || [];
  order.timeline.push({
    status: "Đã hủy",
    time: new Date().toISOString(),
    note: "Đơn hàng đã được hủy bởi khách hàng."
  });

  localStorage.setItem("printify_orders", JSON.stringify(orders));

  closeConfirmModal();
  closeOrderDetailModal();

  const session = getSession();
  loadOrders(session.userId);
  renderOrders();
  showToast("Đã hủy đơn hàng.");
}

function closeConfirmModal() {
  document.getElementById("confirm-modal").style.display = "none";
}

/* ---------- RETURN REQUEST MODAL (NV11) ---------- */
function openReturnModal(orderId) {
  const order = allOrders.find(o => o.orderId === orderId);
  if (!order) return;

  currentOrder = order;
  returnImagesBase64 = [];

  document.getElementById("return-order-id").textContent = orderId;
  document.getElementById("return-reason").value = "";
  document.getElementById("return-description").value = "";
  document.getElementById("return-images").value = "";
  document.getElementById("return-image-preview").innerHTML = "";
  clearReturnErrors();

  closeOrderDetailModal();
  document.getElementById("return-request-modal").classList.add("show");
}

function closeReturnModal() {
  document.getElementById("return-request-modal").classList.remove("show");
}

function handleReturnImages(event) {
  const files = Array.from(event.target.files);

  if (files.length > 3) {
    showToast("Chỉ được tải lên tối đa 3 ảnh.");
    event.target.value = "";
    return;
  }

  const allowedTypes = ["image/jpeg", "image/png"];
  const invalidFile = files.find(f => !allowedTypes.includes(f.type));
  if (invalidFile) {
    showToast("Chỉ chấp nhận ảnh định dạng JPG hoặc PNG.");
    event.target.value = "";
    return;
  }

  returnImagesBase64 = [];
  const previewContainer = document.getElementById("return-image-preview");
  previewContainer.innerHTML = "";

  files.forEach(file => {
    const reader = new FileReader();
    reader.onload = (e) => {
      returnImagesBase64.push(e.target.result);
      const img = document.createElement("img");
      img.src = e.target.result;
      previewContainer.appendChild(img);
    };
    reader.readAsDataURL(file);
  });
}

function clearReturnErrors() {
  ["return-reason", "return-description", "return-images"].forEach(id => {
    document.getElementById("err-" + id).textContent = "";
  });
}

function submitReturnRequest() {
  clearReturnErrors();
  let isValid = true;

  const reason = document.getElementById("return-reason").value;
  const description = document.getElementById("return-description").value.trim();

  if (!reason) {
    document.getElementById("err-return-reason").textContent = "Vui lòng chọn lý do.";
    isValid = false;
  }

  if (!description) {
    document.getElementById("err-return-description").textContent = "Vui lòng nhập mô tả.";
    isValid = false;
  } else if (description.length < 20) {
    document.getElementById("err-return-description").textContent = "Mô tả cần tối thiểu 20 ký tự.";
    isValid = false;
  }

  if (returnImagesBase64.length === 0) {
    document.getElementById("err-return-images").textContent = "Vui lòng tải lên ít nhất 1 ảnh minh chứng.";
    isValid = false;
  }

  if (!isValid) return;

  const requestId = "RR" + Date.now();
  const now = new Date().toISOString();

  const returnRequest = {
    requestId,
    orderId: currentOrder.orderId,
    reason,
    description,
    images: returnImagesBase64,
    status: "Đang xét duyệt",
    createdAt: now,
    adminNote: ""
  };

  // Lưu vào DS11 'printify_returns'
  const returns = JSON.parse(localStorage.getItem("printify_returns") || "[]");
  returns.push(returnRequest);
  localStorage.setItem("printify_returns", JSON.stringify(returns));

  // Cập nhật trạng thái đơn hàng
  const orders = JSON.parse(localStorage.getItem("printify_orders") || "[]");
  const order = orders.find(o => o.orderId === currentOrder.orderId);
  if (order) {
    order.status = "Yêu cầu hoàn hàng";
    order.timeline = order.timeline || [];
    order.timeline.push({
      status: "Yêu cầu hoàn hàng",
      time: now,
      note: `Lý do: ${reason}`
    });
    localStorage.setItem("printify_orders", JSON.stringify(orders));
  }

  closeReturnModal();

  const session = getSession();
  loadOrders(session.userId);
  renderOrders();

  showToast("Yêu cầu hoàn hàng đã được ghi nhận. Chúng tôi sẽ phản hồi trong vòng 24-48 giờ.");
}

/* ---------- HELPERS ---------- */
function getSession() {
  const raw = sessionStorage.getItem("printify_session");
  return raw ? JSON.parse(raw) : null;
}

function getProductsCache() {
  const cached = localStorage.getItem("printify_products_cache");
  return cached ? JSON.parse(cached) : [];
}

function formatVND(amount) {
  return amount.toLocaleString("vi-VN") + "₫";
}

function formatDate(isoString) {
  return new Date(isoString).toLocaleDateString("vi-VN");
}

function formatDateTime(isoString) {
  return new Date(isoString).toLocaleString("vi-VN");
}

function statusToClass(status) {
  const map = {
    "Chờ xác nhận": "status-cho-xac-nhan",
    "Đang xử lý": "status-dang-xu-ly",
    "Đang giao": "status-dang-giao",
    "Hoàn tất": "status-hoan-tat",
    "Đã hủy": "status-da-huy",
    "Yêu cầu hoàn hàng": "status-yeu-cau-hoan-hang"
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