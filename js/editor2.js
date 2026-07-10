// ════════════════════════════════════════════════════════
// editor-part2.js
// Include: OBJECT PROPS, TEXT FORMAT, SHAPE COLOR,
//        DELETE, OOB CHECK, ZOOM, COLOR/SIZE PANEL,
//        LAYERS, RIGHT PANEL, TABS,
//        SAVE / PREVIEW/ CONFIRM,
//        TOAST, EVENTS, KEYBOARD, INIT
// ════════════════════════════════════════════════════════

// ── UPDATE OBJECT (x, y, góc, opacity) ──
function updateObjProp(prop, val) {
  const obj = canvas.getActiveObject();
  if (!obj) return;
  obj.set(prop, parseFloat(val));
  canvas.renderAll();
}
function updateOpacity(val) {
  const obj = canvas.getActiveObject();
  if (!obj) return;
  obj.set('opacity', val / 100);
  document.getElementById('opacity-val').textContent = val + '%';
  canvas.renderAll();
}

// ── TEXT FORMAT ────────────────────────────────────────
function updateTextProp(prop, val) {
  const obj = canvas.getActiveObject();
  if (!obj || obj.type !== 'i-text') return;
  obj.set(prop, val);
  canvas.renderAll();
}
function toggleBold() {
  const obj = canvas.getActiveObject();
  if (!obj || obj.type !== 'i-text') return;
  const isB = obj.fontWeight === 'bold';
  obj.set('fontWeight', isB ? 'normal' : 'bold');
  document.getElementById('btn-bold').classList.toggle('active', !isB);
  canvas.renderAll();
}
function toggleItalic() {
  const obj = canvas.getActiveObject();
  if (!obj || obj.type !== 'i-text') return;
  const isI = obj.fontStyle === 'italic';
  obj.set('fontStyle', isI ? 'normal' : 'italic');
  document.getElementById('btn-italic').classList.toggle('active', !isI);
  canvas.renderAll();
}
function toggleUnderline() {
  const obj = canvas.getActiveObject();
  if (!obj || obj.type !== 'i-text') return;
  obj.set('underline', !obj.underline);
  document.getElementById('btn-underline').classList.toggle('active', !!obj.underline);
  canvas.renderAll();
}
function syncTextButtons(obj) {
  document.getElementById('btn-bold').classList.toggle('active', obj.fontWeight === 'bold');
  document.getElementById('btn-italic').classList.toggle('active', obj.fontStyle === 'italic');
  document.getElementById('btn-underline').classList.toggle('active', !!obj.underline);
  document.getElementById('txt-font').value  = obj.fontFamily || 'Arial';
  document.getElementById('txt-size').value  = obj.fontSize   || 24;
  document.getElementById('txt-color').value = toHex(obj.fill || '#000000');
}

// ── SHAPE COLOR CONTROLS ───────────────────────────────
function syncShapeControls(obj) {
  document.getElementById('shape-fill').value   = toHex(obj.fill   || '#ffffff');
  document.getElementById('shape-stroke').value = toHex(obj.stroke || '#000000');
  document.getElementById('shape-stroke-width').value       = obj.strokeWidth ?? 2;
  document.getElementById('shape-stroke-width-range').value = obj.strokeWidth ?? 2;
  const fillOp = extractOpacity(obj.fill);
  document.getElementById('shape-fill-opacity').value = Math.round(fillOp * 100);
  document.getElementById('shape-fill-opacity-val').textContent = Math.round(fillOp * 100) + '%';
}
function updateShapeFill() {
  const obj = canvas.getActiveObject();
  if (!obj) return;
  const hex     = document.getElementById('shape-fill').value;
  const opacity = document.getElementById('shape-fill-opacity').value / 100;
  obj.set('fill', hexToRgba(hex, opacity));
  canvas.renderAll();
}
function updateShapeFillOpacity(val) {
  document.getElementById('shape-fill-opacity-val').textContent = val + '%';
  updateShapeFill();
}
function updateShapeStroke() {
  const obj = canvas.getActiveObject();
  if (!obj) return;
  obj.set('stroke', document.getElementById('shape-stroke').value);
  canvas.renderAll();
}
function updateShapeStrokeWidth(val) {
  const obj = canvas.getActiveObject();
  if (!obj) return;
  obj.set('strokeWidth', parseFloat(val));
  canvas.renderAll();
}
function clearShapeFill() {
  const obj = canvas.getActiveObject();
  if (!obj) return;
  obj.set('fill', 'transparent');
  document.getElementById('shape-fill-opacity').value = 0;
  document.getElementById('shape-fill-opacity-val').textContent = '0%';
  canvas.renderAll();
}
function clearShapeStroke() {
  const obj = canvas.getActiveObject();
  if (!obj) return;
  obj.set({ stroke: null, strokeWidth: 0 });
  canvas.renderAll();
}
function applyPresetColor(fill, stroke) {
  const obj = canvas.getActiveObject();
  if (!obj) return;
  if (fill === 'transparent') {
    obj.set('fill', 'transparent');
    document.getElementById('shape-fill-opacity').value = 0;
    document.getElementById('shape-fill-opacity-val').textContent = '0%';
  } else {
    obj.set('fill', fill);
    document.getElementById('shape-fill').value = toHex(fill);
    document.getElementById('shape-fill-opacity').value = 100;
    document.getElementById('shape-fill-opacity-val').textContent = '100%';
  }
  if (!stroke || stroke === 'transparent') {
    obj.set({ stroke: null, strokeWidth: 0 });
  } else {
    obj.set({ stroke, strokeWidth: 2 });
    document.getElementById('shape-stroke').value = toHex(stroke);
    document.getElementById('shape-stroke-width').value = 2;
    document.getElementById('shape-stroke-width-range').value = 2;
  }
  canvas.renderAll();
}

// ── HEX / RGBA HELPERS ────────────────────────────────
function hexToRgba(hex, opacity) {
  const r = parseInt(hex.slice(1,3), 16);
  const g = parseInt(hex.slice(3,5), 16);
  const b = parseInt(hex.slice(5,7), 16);
  return opacity >= 1 ? hex : `rgba(${r},${g},${b},${opacity.toFixed(2)})`;
}
function toHex(color) {
  if (!color || color === 'transparent') return '#ffffff';
  if (color.startsWith('#')) return color.slice(0, 7);
  const m = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (m) return '#' + [m[1],m[2],m[3]].map(n => parseInt(n).toString(16).padStart(2,'0')).join('');
  return '#ffffff';
}
function extractOpacity(color) {
  if (!color || color === 'transparent') return 0;
  const m = color.match(/rgba\(\d+,\s*\d+,\s*\d+,\s*([\d.]+)\)/);
  return m ? parseFloat(m[1]) : 1;
}

// ── DELETE ─────────────────────────────────────────────
function deleteSelected() {
  const obj = canvas.getActiveObject();
  if (!obj || obj.name?.startsWith('__')) return;
  saveHistory();
  canvas.remove(obj);
  canvas.discardActiveObject();
  canvas.renderAll();
  updateLayerPanel();
  showRightPanel(null);
  showToast('🗑 Đã xóa đối tượng');
}
function clearCanvas() {
  if (!canvas.getObjects().filter(o => !o.name?.startsWith('__')).length) return;
  if (!confirm('Xóa toàn bộ thiết kế?')) return;
  saveHistory();
  canvas.getObjects().filter(o => !o.name?.startsWith('__')).forEach(o => canvas.remove(o));
  canvas.discardActiveObject();
  canvas.renderAll();
  updateLayerPanel();
  showRightPanel(null);
  showToast('🗑 Đã xóa tất cả');
}

// ── OUT-OF-BOUNDS CHECK ────────────────────────────────
function checkOutOfBounds(obj) {
  if (!obj || obj.name?.startsWith('__')) return;
  const pa = product.printArea;
  const b  = obj.getBoundingRect();
  const isOut = b.left < pa.x || b.top < pa.y ||
                b.left + b.width  > pa.x + pa.width ||
                b.top  + b.height > pa.y + pa.height;
  document.getElementById('oob-warning').style.display = isOut ? 'flex' : 'none';
  obj.set({
    borderColor: isOut ? '#DC2626' : '#2563EB',
    cornerColor: isOut ? '#DC2626' : '#2563EB'
  });
  canvas.renderAll();
}

// ── ZOOM ───────────────────────────────────────────────
function zoomIn()    { setZoom(Math.min(zoomLevel + 0.1, 2)); }
function zoomOut()   { setZoom(Math.max(zoomLevel - 0.1, 0.4)); }
function zoomReset() { setZoom(1); }
function setZoom(z) {
  zoomLevel = z;
  canvas.setZoom(z);
  canvas.setWidth(product.canvasWidth * z);
  canvas.setHeight(product.canvasHeight * z);
  document.getElementById('zoom-label').textContent = Math.round(z * 100) + '%';
  canvas.renderAll();
}

// ── COLOR & SIZE (Right panel) ─────────────────────────
function renderRightPanelProduct() {
  document.getElementById('rp-colors').innerHTML = product.colors.map(c => `
    <button class="pc-btn ${c===selectedColor?'active':''}" data-color="${c}"
            title="${product.colorNames[c]}" style="background:${product.colorHex[c]}"
            onclick="selectColor('${c}')"></button>
  `).join('');
  document.getElementById('rp-sizes').innerHTML = product.sizes.map(s => `
    <button class="s-btn ${s===selectedSize?'active':''}"
            onclick="selectSize('${s}')">${s}</button>
  `).join('');
  updateSummary();
}

function selectColor(color) {
  selectedColor = color;
  // Lấy background object và áp filter mới
  const bg = canvas.getObjects().find(o => o.name === '__background__');
  if (bg) {
    bg.filters = buildColorFilter(color);
    bg.applyFilters();
    canvas.renderAll();
  } else {
    // Nếu chưa có background thì load lại
    drawProductBackground();
  }
  document.querySelectorAll('.pc-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.color === color)
  );
  document.getElementById('tb-color-name').textContent = product.colorNames[color];
  updateSummary();
}

function selectSize(size) {
  selectedSize = size;
  document.querySelectorAll('.s-btn').forEach(b =>
    b.classList.toggle('active', b.textContent === size)
  );
  document.getElementById('tb-size-name').textContent = size;
  updateSummary();
}
function changeQty(delta) {
  qty = Math.max(1, qty + delta);
  document.getElementById('qty-val').textContent = qty;
  updateSummary();
}
function updateSummary() {
  document.getElementById('sum-product').textContent = product.name;
  document.getElementById('sum-color').textContent   = product.colorNames[selectedColor];
  document.getElementById('sum-size').textContent    = selectedSize;
  document.getElementById('sum-qty').textContent     = qty;
  document.getElementById('sum-price').textContent   = product.price.toLocaleString('vi-VN') + '₫';
  document.getElementById('sum-total').textContent   = (product.price * qty).toLocaleString('vi-VN') + '₫';
}

// ── LAYERS ─────────────────────────────────────────────
function updateLayerPanel() {
  const objects = canvas.getObjects().filter(o => !o.name?.startsWith('__')).reverse();
  const container = document.getElementById('layer-list');
  if (!objects.length) {
    container.innerHTML = '<div class="no-selection"><div class="ns-icon">📑</div><div>Chưa có layer nào</div></div>';
    return;
  }
  const icons = { 'i-text':'✏️', image:'🖼️', rect:'▭', circle:'○', triangle:'△',
                   ellipse:'⬭', polygon:'⬡', line:'╱', group:'📦' };
  const active  = canvas.getActiveObject();
  const realObj = canvas.getObjects().filter(o => !o.name?.startsWith('__'));
  container.innerHTML = objects.map((obj, i) =>
    `<div class="layer-item ${obj===active?'active':''}"
          onclick="selectLayerObject(${realObj.length - 1 - i})">
       <span class="layer-icon">${icons[obj.type] || '◻'}</span>
       <span>${obj.name || (obj.type + '_' + i)}</span>
     </div>`
  ).join('');
}
function selectLayerObject(index) {
  const objs = canvas.getObjects().filter(o => !o.name?.startsWith('__'));
  if (objs[index]) { canvas.setActiveObject(objs[index]); canvas.renderAll(); updateLayerPanel(); }
}

// ── RIGHT PANEL: hiện/ẩn sections theo loại object ────
function showRightPanel(obj) {
  const secObj   = document.getElementById('section-object');
  const secText  = document.getElementById('section-text');
  const secShape = document.getElementById('section-shape');
  const secNoSel = document.getElementById('section-nosel');

  if (!obj) {
    [secObj, secText, secShape].forEach(s => s.style.display = 'none');
    secNoSel.style.display = 'block'; return;
  }

  secNoSel.style.display = 'none';
  secObj.style.display   = 'block';

  // Đồng bộ x, y, góc, opacity
  document.getElementById('obj-x').value     = Math.round(obj.left);
  document.getElementById('obj-y').value     = Math.round(obj.top);
  document.getElementById('obj-angle').value = Math.round(obj.angle || 0);
  const pct = Math.round((obj.opacity ?? 1) * 100);
  document.getElementById('obj-opacity').value = pct;
  document.getElementById('opacity-val').textContent = pct + '%';

  if (obj.type === 'i-text') {
    // Text: hiện panel chữ, ẩn panel shape
    secText.style.display  = 'block';
    secShape.style.display = 'none';
    syncTextButtons(obj);

  } else if (['rect','circle','triangle','ellipse','polygon','path','line'].includes(obj.type)) {
    // Shape: hiện panel màu shape, ẩn panel chữ
    secText.style.display  = 'none';
    secShape.style.display = 'block';
    syncShapeControls(obj);

  } else {
    // Image hoặc loại khác: ẩn cả 2
    secText.style.display  = 'none';
    secShape.style.display = 'none';
  }
}

// ── TABS ───────────────────────────────────────────────
function switchTab(tab) {
  ['design','product','layers'].forEach(t => {
    document.getElementById('panel-' + t).style.display = t === tab ? 'block' : 'none';
    document.getElementById('tab-' + t).classList.toggle('active', t === tab);
  });
  if (tab === 'layers') updateLayerPanel();
}

// ── PREVIEW — KHÔNG có khung vùng in ──────────────────
// excludeFromExport:true trên __printArea__ và __printLabel__ đã loại chúng ra
// canvas.toDataURL() chỉ xuất các object có excludeFromExport != true
function previewDesign() {
  // Tạm ẩn printArea và printLabel trước khi export
  const hiddenObjects = canvas.getObjects().filter(o =>
    o.name === '__printArea__' || o.name === '__printLabel__'
  );
  hiddenObjects.forEach(o => o.set('visible', false));
  canvas.renderAll();

  const dataURL = canvas.toDataURL({ format: 'png', quality: 0.95 });

  // Hiện lại sau khi export xong
  hiddenObjects.forEach(o => o.set('visible', true));
  canvas.renderAll();

  // Mở tab mới hiển thị preview
  const win = window.open();
  win.document.write(
    '<html><head><title>Preview thiết kế</title></head>' +
    '<body style="margin:0;background:#44004d;display:flex;' +
    'align-items:center;justify-content:center;min-height:100vh">' +
    '<img src="' + dataURL + '" style="max-width:90vw;max-height:90vh;' +
    'border-radius:12px;box-shadow:0 8px 32px #8a00bc80">' +
    '</body></html>'
  );
}

// ── SAVE DESIGN ────────────────────────────────────────
function saveDesign() {
  const designId = 'design_' + Date.now();

  // Thumbnail cũng không có khung vùng in
  const hiddenObjects = canvas.getObjects().filter(o =>
    o.name === '__printArea__' || o.name === '__printLabel__'
  );
  hiddenObjects.forEach(o => o.set('visible', false));
  canvas.renderAll();
  const thumbnail = canvas.toDataURL({ format: 'png', quality: 0.4, multiplier: 0.3 });
  hiddenObjects.forEach(o => o.set('visible', true));
  canvas.renderAll();

  const design = {
    designId, userId: 'current_user', productId: product.productId,
    canvasJSON: JSON.stringify(canvas.toJSON(['name'])),
    thumbnailBase64: thumbnail, savedAt: new Date().toISOString()
  };
  const designs = JSON.parse(localStorage.getItem('printify_designs') || '[]');
  designs.push(design);
  localStorage.setItem('printify_designs', JSON.stringify(designs));
  showToast('💾 Đã lưu thiết kế! ID: ' + designId);
  console.log('[Design saved]', design);
}

// ── CONFIRM & ADD TO CART ──────────────────────────────
let pendingDesignPayload = null;

function confirmDesign() {
  const exportableObjs = canvas.getObjects().filter(o => !o.name?.startsWith('__'));
  if (!exportableObjs.length) {
    showToast('⚠️ Chưa có thiết kế! Vui lòng thêm ảnh hoặc chữ.');
    return;
  }

  const warning = document.getElementById('oob-warning');
  if (warning.style.display !== 'none') {
    if (!confirm('Thiết kế đang vượt ra ngoài vùng in. Vẫn xác nhận?')) return;
  }

  const hiddenObjects = canvas.getObjects().filter(o =>
    o.name === '__printArea__' || o.name === '__printLabel__'
  );
  hiddenObjects.forEach(o => o.set('visible', false));
  canvas.renderAll();

  const thumbnail = canvas.toDataURL({ format: 'png', quality: 0.5, multiplier: 0.3 });

  hiddenObjects.forEach(o => o.set('visible', true));
  canvas.renderAll();

  pendingDesignPayload = {
    designId: 'design_' + Date.now(),
    thumbnailBase64: thumbnail
  };

  const modal = document.getElementById('confirm-modal');
  if (modal) modal.style.display = 'flex';
}

function closeConfirmModal() {
  const modal = document.getElementById('confirm-modal');
  if (modal) modal.style.display = 'none';
  pendingDesignPayload = null;
}

function finalizeConfirmDesign() {
  if (!pendingDesignPayload) return;

  const designId = pendingDesignPayload.designId;
  const thumbnail = pendingDesignPayload.thumbnailBase64;

  const design = {
    designId,
    userId: 'current_user',
    productId: product.productId,
    canvasJSON: JSON.stringify(canvas.toJSON(['name'])),
    thumbnailBase64: thumbnail,
    savedAt: new Date().toISOString()
  };

  const designs = JSON.parse(localStorage.getItem('printify_designs') || '[]');
  designs.push(design);
  localStorage.setItem('printify_designs', JSON.stringify(designs));

  const cartItem = {
    cartItemId: 'CI_' + Date.now(),
    userId: 'current_user',
    productId: product.productId,
    designId,
    productName: product.name,
    color: selectedColor,
    colorName: product.colorNames[selectedColor],
    size: selectedSize,
    quantity: qty,
    unitPrice: product.price,
    thumbnailBase64: thumbnail
  };

  const cart = JSON.parse(localStorage.getItem('printify_cart') || '[]');
  cart.push(cartItem);
  localStorage.setItem('printify_cart', JSON.stringify(cart));

  closeConfirmModal();
  showToast('✅ Đã thêm vào giỏ hàng!');
  console.log('[Cart item added]', cartItem);
}

// ── TOAST ──────────────────────────────────────────────
let toastTimer;
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 3000);
}

// ── FABRIC EVENTS — đăng ký sau khi canvas đã được tạo ─
// Hàm này được gọi từ initEditor() trong part1
function registerFabricEvents() {
  canvas.on('selection:created', e => { showRightPanel(e.selected[0]); updateLayerPanel(); });
  canvas.on('selection:updated', e => { showRightPanel(e.selected[0]); updateLayerPanel(); });
  canvas.on('selection:cleared', () => {
    showRightPanel(null);
    document.getElementById('oob-warning').style.display = 'none';
    updateLayerPanel();
  });
  canvas.on('object:modified',  e => { checkOutOfBounds(e.target); showRightPanel(e.target); saveHistory(); updateLayerPanel(); });
  canvas.on('object:moving',    e => checkOutOfBounds(e.target));
  canvas.on('object:scaling',   e => checkOutOfBounds(e.target));
  canvas.on('object:rotating',  e => checkOutOfBounds(e.target));
}

// ── KEYBOARD SHORTCUTS ─────────────────────────────────
function registerKeyboard() {
  document.addEventListener('keydown', e => {
    if (canvas.getActiveObject()?.isEditing) return;
    if ((e.key === 'Delete' || e.key === 'Backspace') && document.activeElement === document.body) {
      e.preventDefault(); deleteSelected();
    }
    if (e.ctrlKey && e.key === 'z') { e.preventDefault(); undo(); }
    if (e.ctrlKey && e.key === 'y') { e.preventDefault(); redo(); }
    if (e.key === 't' || e.key === 'T') addText();
    if (e.key === 'v' || e.key === 'V') setTool('select');
  });
}

// ── INIT ───────────────────────────────────────────────
// Toàn bộ khởi tạo đi qua loadProductFromURL() ở editor-part1.js
// Hàm đó fetch products.json → tìm product theo URL → gọi initEditor()
// initEditor() gọi: drawProductBackground, drawPrintArea,
//                   registerFabricEvents, registerKeyboard,
//                   renderRightPanelProduct, updateSummary,
//                   updateUndoRedoBtns, showRightPanel
loadProductFromURL();