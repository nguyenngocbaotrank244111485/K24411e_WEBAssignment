<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PrintiFy — Design Editor Demo</title>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/fabric.js/5.3.1/fabric.min.js"></script>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Segoe UI', system-ui, sans-serif;
      background: #F1F5F9;
      color: #0F172A;
      height: 100vh;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    /* ── Top Bar ── */
    .topbar {
      background: #1E293B;
      color: #fff;
      height: 52px;
      display: flex;
      align-items: center;
      padding: 0 16px;
      gap: 12px;
      flex-shrink: 0;
      z-index: 100;
    }
    .topbar-logo {
      font-size: 15px;
      font-weight: 700;
      color: #fff;
      margin-right: 8px;
    }
    .topbar-logo span { color: #60A5FA; }
    .topbar-product {
      font-size: 13px;
      color: #94A3B8;
      flex: 1;
    }
    .topbar-product strong { color: #fff; }

    .topbar-actions { display: flex; gap: 8px; }
    .tb-btn {
      padding: 6px 14px;
      border-radius: 7px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      border: none;
      transition: all .15s;
    }
    .tb-btn-ghost {
      background: rgba(255,255,255,0.08);
      color: #CBD5E1;
    }
    .tb-btn-ghost:hover { background: rgba(255,255,255,0.15); color: #fff; }
    .tb-btn-primary { background: #2563EB; color: #fff; }
    .tb-btn-primary:hover { background: #1D4ED8; }
    .tb-btn-success { background: #059669; color: #fff; }
    .tb-btn-success:hover { background: #047857; }

    /* ── Undo/Redo ── */
    .undo-redo {
      display: flex;
      gap: 2px;
      background: rgba(255,255,255,0.08);
      border-radius: 7px;
      padding: 3px;
    }
    .ur-btn {
      background: none;
      border: none;
      color: #94A3B8;
      width: 28px;
      height: 28px;
      border-radius: 5px;
      cursor: pointer;
      font-size: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all .15s;
    }
    .ur-btn:hover:not(:disabled) { background: rgba(255,255,255,0.12); color: #fff; }
    .ur-btn:disabled { opacity: 0.3; cursor: not-allowed; }

    /* ── Main Layout ── */
    .editor-body {
      display: grid;
      grid-template-columns: 64px 1fr 260px;
      flex: 1;
      overflow: hidden;
    }

    /* ── Left Toolbar ── */
    .left-toolbar {
      background: #1E293B;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 12px 0;
      gap: 4px;
      border-right: 1px solid #0F172A;
    }
    .tool-btn {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      border: none;
      background: none;
      color: #94A3B8;
      font-size: 18px;
      gap: 3px;
      transition: all .15s;
      position: relative;
    }
    .tool-btn span {
      font-size: 9px;
      font-weight: 500;
      line-height: 1;
    }
    .tool-btn:hover { background: rgba(255,255,255,0.08); color: #fff; }
    .tool-btn.active { background: #2563EB; color: #fff; }
    .tool-divider {
      width: 32px;
      height: 1px;
      background: #334155;
      margin: 4px 0;
    }

    /* Tooltip */
    .tool-btn::after {
      content: attr(data-tip);
      position: absolute;
      left: 54px;
      background: #0F172A;
      color: #fff;
      font-size: 11px;
      padding: 4px 8px;
      border-radius: 5px;
      white-space: nowrap;
      pointer-events: none;
      opacity: 0;
      transition: opacity .15s;
      z-index: 200;
    }
    .tool-btn:hover::after { opacity: 1; }

    /* ── Canvas Area ── */
    .canvas-area {
      background: #CBD5E1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;
      overflow: hidden;
      position: relative;
    }

    .canvas-wrap {
      position: relative;
      box-shadow: 0 8px 32px rgba(0,0,0,0.25);
    }

    #design-canvas { display: block; }

    /* Out-of-bounds warning */
    .oob-warning {
      position: absolute;
      top: 8px;
      left: 50%;
      transform: translateX(-50%);
      background: #DC2626;
      color: #fff;
      font-size: 12px;
      font-weight: 600;
      padding: 6px 14px;
      border-radius: 20px;
      display: none;
      align-items: center;
      gap: 6px;
      white-space: nowrap;
      box-shadow: 0 2px 8px rgba(220,38,38,0.4);
      animation: fadeInDown .2s;
      z-index: 50;
    }
    @keyframes fadeInDown {
      from { opacity:0; transform: translateX(-50%) translateY(-8px); }
      to   { opacity:1; transform: translateX(-50%) translateY(0); }
    }

    /* Zoom controls */
    .zoom-controls {
      display: flex;
      align-items: center;
      gap: 8px;
      background: #1E293B;
      border-radius: 8px;
      padding: 5px 10px;
    }
    .zoom-btn {
      background: none;
      border: none;
      color: #94A3B8;
      font-size: 16px;
      cursor: pointer;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
    }
    .zoom-btn:hover { color: #fff; background: rgba(255,255,255,0.1); }
    .zoom-label { font-size: 12px; color: #CBD5E1; min-width: 40px; text-align: center; }

    /* ── Right Panel ── */
    .right-panel {
      background: #fff;
      border-left: 1px solid #E2E8F0;
      display: flex;
      flex-direction: column;
      overflow-y: auto;
    }
    .right-panel::-webkit-scrollbar { width: 4px; }
    .right-panel::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 2px; }

    .rp-section {
      border-bottom: 1px solid #F1F5F9;
      padding: 14px;
    }
    .rp-title {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: .6px;
      color: #94A3B8;
      margin-bottom: 10px;
    }

    /* Product color in right panel */
    .product-colors {
      display: flex;
      gap: 7px;
      flex-wrap: wrap;
    }
    .pc-btn {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      cursor: pointer;
      border: 2.5px solid transparent;
      transition: all .15s;
    }
    .pc-btn.active {
      border-color: #2563EB;
      box-shadow: 0 0 0 2px #fff, 0 0 0 4px #2563EB;
    }
    .pc-btn[data-color="white"] { border-color: #CBD5E1; }
    .pc-btn[data-color="white"].active { border-color: #2563EB; }

    /* Size selector */
    .size-btns { display: flex; gap: 6px; flex-wrap: wrap; }
    .s-btn {
      padding: 5px 11px;
      border: 1.5px solid #E2E8F0;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      background: #fff;
      color: #475569;
      transition: all .15s;
    }
    .s-btn.active { background: #2563EB; border-color: #2563EB; color: #fff; }
    .s-btn:hover:not(.active) { border-color: #2563EB; color: #2563EB; }

    /* Text controls */
    .text-controls { display: flex; flex-direction: column; gap: 8px; }
    .tc-row { display: flex; gap: 6px; align-items: center; }
    .tc-label { font-size: 11px; color: #64748B; width: 50px; flex-shrink: 0; }
    .tc-input {
      flex: 1;
      border: 1px solid #E2E8F0;
      border-radius: 6px;
      padding: 5px 8px;
      font-size: 12px;
      color: #0F172A;
      outline: none;
    }
    .tc-input:focus { border-color: #2563EB; }
    select.tc-input { cursor: pointer; }

    .style-btns { display: flex; gap: 4px; }
    .style-btn {
      width: 28px;
      height: 28px;
      border: 1px solid #E2E8F0;
      border-radius: 5px;
      background: #fff;
      cursor: pointer;
      font-size: 13px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #475569;
      transition: all .15s;
    }
    .style-btn.active { background: #EFF6FF; border-color: #2563EB; color: #2563EB; }
    .style-btn:hover:not(.active) { border-color: #94A3B8; }

    /* Object controls */
    .obj-controls { display: flex; flex-direction: column; gap: 8px; }
    .obj-prop-row { display: flex; gap: 6px; align-items: center; }
    .obj-label { font-size: 11px; color: #64748B; width: 50px; }
    .obj-input {
      flex: 1;
      border: 1px solid #E2E8F0;
      border-radius: 5px;
      padding: 4px 6px;
      font-size: 12px;
      text-align: right;
      outline: none;
    }
    .obj-input:focus { border-color: #2563EB; }
    .obj-unit { font-size: 11px; color: #94A3B8; }

    .opacity-row { display: flex; gap: 8px; align-items: center; }
    .opacity-slider {
      flex: 1;
      accent-color: #2563EB;
    }
    .opacity-val { font-size: 12px; color: #475569; min-width: 32px; text-align: right; }

    .delete-btn {
      width: 100%;
      padding: 8px;
      background: #FEF2F2;
      color: #DC2626;
      border: 1px solid #FECACA;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all .15s;
      margin-top: 4px;
    }
    .delete-btn:hover { background: #DC2626; color: #fff; }

    /* Qty row */
    .qty-row {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .qty-btn {
      width: 30px;
      height: 30px;
      border-radius: 7px;
      border: 1.5px solid #E2E8F0;
      background: #fff;
      font-size: 16px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #475569;
    }
    .qty-btn:hover { border-color: #2563EB; color: #2563EB; }
    .qty-val {
      font-size: 16px;
      font-weight: 600;
      min-width: 32px;
      text-align: center;
    }

    /* Confirm button */
    .confirm-btn {
      width: 100%;
      padding: 12px;
      background: #2563EB;
      color: #fff;
      border: none;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 700;
      cursor: pointer;
      transition: all .15s;
    }
    .confirm-btn:hover { background: #1D4ED8; }
    .confirm-btn:active { transform: scale(0.98); }

    /* No selection placeholder */
    .no-selection {
      text-align: center;
      padding: 20px;
      color: #94A3B8;
      font-size: 12px;
      line-height: 1.6;
    }
    .no-selection .ns-icon { font-size: 28px; margin-bottom: 8px; }

    /* Layer list */
    .layer-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 8px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 12px;
      color: #475569;
      transition: background .1s;
    }
    .layer-item:hover { background: #F8FAFC; }
    .layer-item.active { background: #EFF6FF; color: #1D4ED8; font-weight: 500; }
    .layer-icon { font-size: 14px; }

    /* Toast */
    .toast {
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%) translateY(16px);
      background: #0F172A;
      color: #fff;
      padding: 10px 20px;
      border-radius: 10px;
      font-size: 13px;
      font-weight: 500;
      opacity: 0;
      transition: all .25s;
      z-index: 9999;
      pointer-events: none;
      white-space: nowrap;
    }
    .toast.show {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }

    /* Hidden file input */
    #file-input { display: none; }

    /* Tabs in right panel */
    .rp-tabs {
      display: flex;
      border-bottom: 1px solid #F1F5F9;
    }
    .rp-tab {
      flex: 1;
      padding: 10px;
      text-align: center;
      font-size: 11px;
      font-weight: 600;
      cursor: pointer;
      color: #94A3B8;
      border-bottom: 2px solid transparent;
      transition: all .15s;
    }
    .rp-tab.active { color: #2563EB; border-bottom-color: #2563EB; }
  </style>
</head>
<body>

<!-- Hidden file input -->
<input type="file" id="file-input" accept=".jpg,.jpeg,.png,.webp">

<!-- Toast notification -->
<div class="toast" id="toast"></div>

<!-- ── Top Bar ── -->
<div class="topbar">
  <div class="topbar-logo">Printi<span>Fy</span></div>
  <div class="topbar-product">
    Đang thiết kế: <strong id="tb-product-name">Áo Thun Unisex Basic</strong>
    &nbsp;·&nbsp;
    Màu: <strong id="tb-color-name">Trắng</strong>
    &nbsp;·&nbsp;
    Size: <strong id="tb-size-name">M</strong>
  </div>

  <div class="undo-redo">
    <button class="ur-btn" id="btn-undo" onclick="undo()" title="Hoàn tác (Ctrl+Z)" disabled>↩</button>
    <button class="ur-btn" id="btn-redo" onclick="redo()" title="Làm lại (Ctrl+Y)" disabled>↪</button>
  </div>

  <div class="topbar-actions">
    <button class="tb-btn tb-btn-ghost" onclick="clearCanvas()">🗑 Xóa tất cả</button>
    <button class="tb-btn tb-btn-ghost" onclick="previewDesign()">👁 Preview</button>
    <button class="tb-btn tb-btn-success" onclick="saveDesign()">💾 Lưu thiết kế</button>
    <button class="tb-btn tb-btn-primary" onclick="confirmDesign()">✅ Xác nhận &amp; Thêm giỏ</button>
  </div>
</div>

<!-- ── Editor Body ── -->
<div class="editor-body">

  <!-- ── Left Toolbar ── -->
  <div class="left-toolbar">
    <button class="tool-btn active" id="tool-select" data-tip="Chọn / Di chuyển (V)"
            onclick="setTool('select')">
      ↖ <span>Chọn</span>
    </button>

    <div class="tool-divider"></div>

    <button class="tool-btn" id="tool-image" data-tip="Upload hình ảnh"
            onclick="document.getElementById('file-input').click()">
      🖼 <span>Ảnh</span>
    </button>

    <button class="tool-btn" id="tool-text" data-tip="Thêm chữ (T)"
            onclick="addText()">
      T <span>Chữ</span>
    </button>

    <div class="tool-divider"></div>

    <button class="tool-btn" data-tip="Thêm hình chữ nhật"
            onclick="addShape('rect')">
      ▭ <span>Rect</span>
    </button>

    <button class="tool-btn" data-tip="Thêm hình tròn"
            onclick="addShape('circle')">
      ○ <span>Tròn</span>
    </button>

    <div class="tool-divider"></div>

    <button class="tool-btn" data-tip="Xóa đối tượng đang chọn (Del)"
            onclick="deleteSelected()" style="color:#EF4444">
      ✕ <span>Xóa</span>
    </button>
  </div>

  <!-- ── Canvas Area ── -->
  <div class="canvas-area">
    <div class="oob-warning" id="oob-warning">
      ⚠️ Thiết kế vượt ra ngoài vùng in!
    </div>

    <div class="canvas-wrap" id="canvas-wrap">
      <canvas id="design-canvas"></canvas>
    </div>

    <!-- Zoom controls -->
    <div class="zoom-controls">
      <button class="zoom-btn" onclick="zoomOut()">－</button>
      <span class="zoom-label" id="zoom-label">100%</span>
      <button class="zoom-btn" onclick="zoomIn()">＋</button>
      <button class="zoom-btn" onclick="zoomReset()" style="font-size:11px; width:auto; padding:0 6px">Reset</button>
    </div>
  </div>

  <!-- ── Right Panel ── -->
  <div class="right-panel">

    <!-- Tabs -->
    <div class="rp-tabs">
      <div class="rp-tab active" onclick="switchTab('design')" id="tab-design">Thiết kế</div>
      <div class="rp-tab" onclick="switchTab('product')" id="tab-product">Sản phẩm</div>
      <div class="rp-tab" onclick="switchTab('layers')" id="tab-layers">Layers</div>
    </div>

    <!-- Tab: Thiết kế -->
    <div id="panel-design">

      <!-- Object properties (hiện khi có object được chọn) -->
      <div class="rp-section" id="section-object" style="display:none">
        <div class="rp-title">Thuộc tính đối tượng</div>
        <div class="obj-controls">
          <div class="obj-prop-row">
            <span class="obj-label">X</span>
            <input class="obj-input" id="obj-x" type="number" onchange="updateObjProp('x', this.value)">
            <span class="obj-unit">px</span>
          </div>
          <div class="obj-prop-row">
            <span class="obj-label">Y</span>
            <input class="obj-input" id="obj-y" type="number" onchange="updateObjProp('y', this.value)">
            <span class="obj-unit">px</span>
          </div>
          <div class="obj-prop-row">
            <span class="obj-label">Xoay</span>
            <input class="obj-input" id="obj-angle" type="number" onchange="updateObjProp('angle', this.value)">
            <span class="obj-unit">°</span>
          </div>
          <div class="opacity-row">
            <span class="obj-label" style="font-size:11px;color:#64748B">Độ mờ</span>
            <input type="range" class="opacity-slider" id="obj-opacity"
                   min="0" max="100" value="100"
                   oninput="updateOpacity(this.value)">
            <span class="opacity-val" id="opacity-val">100%</span>
          </div>
        </div>
        <button class="delete-btn" onclick="deleteSelected()">🗑 Xóa đối tượng này</button>
      </div>

      <!-- Text properties (chỉ hiện khi chọn text) -->
      <div class="rp-section" id="section-text" style="display:none">
        <div class="rp-title">Định dạng chữ</div>
        <div class="text-controls">
          <div class="tc-row">
            <span class="tc-label">Font</span>
            <select class="tc-input" id="txt-font" onchange="updateTextProp('fontFamily', this.value)">
              <option value="Arial">Arial</option>
              <option value="Times New Roman">Times New Roman</option>
              <option value="Courier New">Courier New</option>
              <option value="Georgia">Georgia</option>
              <option value="Verdana">Verdana</option>
              <option value="Impact">Impact</option>
              <option value="Comic Sans MS">Comic Sans MS</option>
            </select>
          </div>
          <div class="tc-row">
            <span class="tc-label">Cỡ chữ</span>
            <input class="tc-input" id="txt-size" type="number" min="8" max="200" value="24"
                   onchange="updateTextProp('fontSize', parseInt(this.value))">
          </div>
          <div class="tc-row">
            <span class="tc-label">Màu chữ</span>
            <input class="tc-input" id="txt-color" type="color" value="#000000"
                   style="height:30px; padding:2px 4px; cursor:pointer"
                   oninput="updateTextProp('fill', this.value)">
          </div>
          <div class="tc-row">
            <span class="tc-label">Kiểu</span>
            <div class="style-btns">
              <button class="style-btn" id="btn-bold" onclick="toggleBold()"><b>B</b></button>
              <button class="style-btn" id="btn-italic" onclick="toggleItalic()"><i>I</i></button>
              <button class="style-btn" id="btn-underline" onclick="toggleUnderline()"><u>U</u></button>
            </div>
          </div>
          <div class="tc-row">
            <span class="tc-label">Canh</span>
            <div class="style-btns">
              <button class="style-btn" onclick="updateTextProp('textAlign','left')">⬛⬜⬜</button>
              <button class="style-btn" onclick="updateTextProp('textAlign','center')">⬜⬛⬜</button>
              <button class="style-btn" onclick="updateTextProp('textAlign','right')">⬜⬜⬛</button>
            </div>
          </div>
        </div>
      </div>

      <!-- No selection -->
      <div class="rp-section" id="section-nosel">
        <div class="no-selection">
          <div class="ns-icon">👆</div>
          <div>Click vào đối tượng trên canvas để chỉnh sửa</div>
          <div style="margin-top:8px; color:#CBD5E1">hoặc dùng toolbar bên trái để thêm ảnh / chữ</div>
        </div>
      </div>

    </div>

    <!-- Tab: Sản phẩm -->
    <div id="panel-product" style="display:none">
      <div class="rp-section">
        <div class="rp-title">Màu sản phẩm</div>
        <div class="product-colors" id="rp-colors"></div>
      </div>
      <div class="rp-section">
        <div class="rp-title">Kích thước</div>
        <div class="size-btns" id="rp-sizes"></div>
      </div>
      <div class="rp-section">
        <div class="rp-title">Số lượng</div>
        <div class="qty-row">
          <button class="qty-btn" onclick="changeQty(-1)">−</button>
          <span class="qty-val" id="qty-val">1</span>
          <button class="qty-btn" onclick="changeQty(1)">+</button>
        </div>
      </div>
      <div class="rp-section">
        <div class="rp-title">Tóm tắt</div>
        <div style="font-size:12px; color:#475569; line-height:2">
          Sản phẩm: <strong id="sum-product">—</strong><br>
          Màu: <strong id="sum-color">—</strong><br>
          Size: <strong id="sum-size">—</strong><br>
          Số lượng: <strong id="sum-qty">1</strong><br>
          <div style="height:1px;background:#F1F5F9;margin:8px 0"></div>
          Đơn giá: <strong id="sum-price">—</strong><br>
          Thành tiền: <strong id="sum-total" style="color:#DC2626; font-size:14px">—</strong>
        </div>
      </div>
      <div class="rp-section">
        <button class="confirm-btn" onclick="confirmDesign()">
          ✅ Xác nhận & Thêm vào giỏ
        </button>
      </div>
    </div>

    <!-- Tab: Layers -->
    <div id="panel-layers" style="display:none">
      <div class="rp-section">
        <div class="rp-title">Danh sách Layer</div>
        <div id="layer-list">
          <div class="no-selection">
            <div class="ns-icon">📑</div>
            <div>Chưa có layer nào</div>
          </div>
        </div>
      </div>
    </div>

  </div>
</div>

<script>
// ════════════════════════════════════════════════════════
// DATA — Sản phẩm đang thiết kế (đọc từ products.json khi tích hợp vào bài)
// ════════════════════════════════════════════════════════
const product = {
  id: 'p001',
  name: 'Áo Thun Unisex Basic',
  price: 150000,
  colors: ['white','black','navy','red','yellow','green','gray'],
  colorHex: {
    white:'#FFFFFF', black:'#1A1A1A', navy:'#1B3A6B',
    red:'#C0392B', yellow:'#F4C430', green:'#1E7A4A', gray:'#94A3B8'
  },
  colorNames: {
    white:'Trắng', black:'Đen', navy:'Xanh Navy',
    red:'Đỏ', yellow:'Vàng', green:'Xanh Lá', gray:'Xám'
  },
  colorFilters: {
    white:  'brightness(1)',
    black:  'brightness(0.12) saturate(0)',
    navy:   'brightness(0.35) sepia(1) hue-rotate(185deg) saturate(4)',
    red:    'brightness(0.75) sepia(1) hue-rotate(310deg) saturate(6)',
    yellow: 'brightness(1.1) sepia(1) hue-rotate(5deg) saturate(5)',
    green:  'brightness(0.6) sepia(1) hue-rotate(95deg) saturate(5)',
    gray:   'brightness(0.65) saturate(0.1)'
  },
  sizes: ['S','M','L','XL','XXL'],
  // Print area tọa độ trên canvas 500×600
  printArea: { x: 100, y: 80, width: 300, height: 360 },
  canvasWidth: 500,
  canvasHeight: 600
};

// ════════════════════════════════════════════════════════
// STATE
// ════════════════════════════════════════════════════════
let selectedColor = 'white';
let selectedSize  = 'M';
let qty = 1;
let currentTool = 'select';
let zoomLevel = 1;
let historyStack = [];   // Undo stack — mỗi phần tử là canvas.toJSON()
let redoStack = [];      // Redo stack

// ════════════════════════════════════════════════════════
// KHỞI TẠO FABRIC.JS CANVAS
// ════════════════════════════════════════════════════════
const canvas = new fabric.Canvas('design-canvas', {
  width:  product.canvasWidth,
  height: product.canvasHeight,
  backgroundColor: '#F8F8F8',
  preserveObjectStacking: true
});

// ── Vẽ ảnh nền sản phẩm (SVG placeholder — thay bằng Image khi có ảnh thật) ──
function drawProductBackground() {
  // Tạo SVG áo thun và convert thành fabric.Image
  const svgStr = `
    <svg viewBox="0 0 500 600" xmlns="http://www.w3.org/2000/svg" width="500" height="600">
      <rect width="500" height="600" fill="#F8F8F8"/>
      <!-- Thân áo -->
      <path d="M125 150 L50 225 L113 250 L113 475 L388 475 L388 250 L450 225 L375 150 L300 113 C290 175 213 175 200 113 Z"
            fill="${product.colorHex[selectedColor]}"
            stroke="${selectedColor==='white'?'#CBD5E1':'rgba(0,0,0,0.15)'}"
            stroke-width="2" stroke-linejoin="round"/>
      <!-- Cổ áo -->
      <path d="M200 113 C213 175 290 175 300 113"
            fill="none" stroke="${selectedColor==='white'?'#CBD5E1':'rgba(0,0,0,0.2)'}" stroke-width="2.5"/>
      <!-- Đường may -->
      <line x1="113" y1="250" x2="125" y2="150" stroke="rgba(0,0,0,0.08)" stroke-width="1.5" stroke-dasharray="5,3"/>
      <line x1="388" y1="250" x2="375" y2="150" stroke="rgba(0,0,0,0.08)" stroke-width="1.5" stroke-dasharray="5,3"/>
    </svg>`;

  fabric.loadSVGFromString(svgStr, function(objects, options) {
    const bg = fabric.util.groupSVGElements(objects, options);
    bg.set({
      left: 0, top: 0,
      selectable: false,
      evented: false,
      name: '__background__',
      excludeFromExport: true
    });
    // Xóa background cũ nếu có
    const old = canvas.getObjects().find(o => o.name === '__background__');
    if (old) canvas.remove(old);
    canvas.insertAt(bg, 0);
    canvas.renderAll();
  });
}

// ── Vẽ Print Area boundary ──
function drawPrintArea() {
  const old = canvas.getObjects().find(o => o.name === '__printArea__');
  if (old) canvas.remove(old);

  const pa = product.printArea;
  const rect = new fabric.Rect({
    left:   pa.x,
    top:    pa.y,
    width:  pa.width,
    height: pa.height,
    fill:   'rgba(37, 99, 235, 0.03)',
    stroke: '#2563EB',
    strokeWidth: 1.5,
    strokeDashArray: [6, 4],
    selectable: false,
    evented: false,
    name: '__printArea__',
    excludeFromExport: true
  });
  canvas.add(rect);

  // Label "Vùng in"
  const oldLabel = canvas.getObjects().find(o => o.name === '__printLabel__');
  if (oldLabel) canvas.remove(oldLabel);

  const label = new fabric.Text('Vùng in', {
    left: pa.x + 4,
    top:  pa.y + 4,
    fontSize: 11,
    fill: '#2563EB',
    opacity: 0.7,
    selectable: false,
    evented: false,
    name: '__printLabel__',
    excludeFromExport: true
  });
  canvas.add(label);
  canvas.renderAll();
}

// ════════════════════════════════════════════════════════
// UNDO / REDO
// ════════════════════════════════════════════════════════
function saveHistory() {
  // Chỉ lưu các object thật (không lưu background và printArea)
  const state = JSON.stringify(getExportableObjects());
  historyStack.push(state);
  redoStack = [];
  if (historyStack.length > 30) historyStack.shift();
  updateUndoRedoBtns();
}

function undo() {
  if (historyStack.length === 0) return;
  const current = JSON.stringify(getExportableObjects());
  redoStack.push(current);
  const prev = historyStack.pop();
  restoreObjects(JSON.parse(prev));
  updateUndoRedoBtns();
  updateLayerPanel();
}

function redo() {
  if (redoStack.length === 0) return;
  const state = redoStack.pop();
  historyStack.push(JSON.stringify(getExportableObjects()));
  restoreObjects(JSON.parse(state));
  updateUndoRedoBtns();
  updateLayerPanel();
}

function getExportableObjects() {
  return canvas.getObjects()
    .filter(o => !o.name?.startsWith('__'))
    .map(o => o.toObject(['name']));
}

function restoreObjects(objects) {
  // Xóa tất cả object thật
  canvas.getObjects()
    .filter(o => !o.name?.startsWith('__'))
    .forEach(o => canvas.remove(o));

  if (!objects.length) { canvas.renderAll(); return; }

  fabric.util.enlivenObjects(objects, function(enlivenedObjects) {
    enlivenedObjects.forEach(o => canvas.add(o));
    canvas.renderAll();
  });
}

function updateUndoRedoBtns() {
  document.getElementById('btn-undo').disabled = historyStack.length === 0;
  document.getElementById('btn-redo').disabled = redoStack.length === 0;
}

// ════════════════════════════════════════════════════════
// TOOLS
// ════════════════════════════════════════════════════════
function setTool(tool) {
  currentTool = tool;
  document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
  const btn = document.getElementById('tool-' + tool);
  if (btn) btn.classList.add('active');

  canvas.isDrawingMode = false;
  canvas.selection = (tool === 'select');
}

// ── Thêm Text ──
function addText() {
  saveHistory();
  const text = new fabric.IText('Nhập nội dung...', {
    left:       product.printArea.x + 20,
    top:        product.printArea.y + 20,
    fontSize:   28,
    fontFamily: 'Arial',
    fill:       '#000000',
    name:       'text_' + Date.now()
  });
  canvas.add(text);
  canvas.setActiveObject(text);
  text.enterEditing();
  text.selectAll();
  canvas.renderAll();
  setTool('select');
  updateLayerPanel();
  showToast('✏️ Đã thêm chữ — double click để chỉnh nội dung');
}

// ── Thêm Shape ──
function addShape(type) {
  saveHistory();
  const pa = product.printArea;
  let shape;

  if (type === 'rect') {
    shape = new fabric.Rect({
      left: pa.x + 50, top: pa.y + 50,
      width: 120, height: 80,
      fill: 'rgba(37,99,235,0.2)',
      stroke: '#2563EB', strokeWidth: 2,
      name: 'rect_' + Date.now()
    });
  } else {
    shape = new fabric.Circle({
      left: pa.x + 50, top: pa.y + 50,
      radius: 50,
      fill: 'rgba(220,38,38,0.2)',
      stroke: '#DC2626', strokeWidth: 2,
      name: 'circle_' + Date.now()
    });
  }
  canvas.add(shape);
  canvas.setActiveObject(shape);
  canvas.renderAll();
  updateLayerPanel();
  saveHistory();
}

// ── Upload ảnh ──
document.getElementById('file-input').addEventListener('change', function(e) {
  const file = e.target.files[0];
  if (!file) return;

  // Kiểm tra kích thước file
  if (file.size > product.maxFileSizeMB * 1024 * 1024) {
    showToast(`❌ File quá lớn! Tối đa ${product.maxFileSizeMB}MB`);
    return;
  }

  const reader = new FileReader();
  reader.onload = function(evt) {
    fabric.Image.fromURL(evt.target.result, function(img) {
      saveHistory();

      // Scale ảnh vừa với print area nếu to quá
      const pa = product.printArea;
      const maxW = pa.width * 0.8;
      const maxH = pa.height * 0.8;
      const scale = Math.min(maxW / img.width, maxH / img.height, 1);

      img.set({
        left:  pa.x + pa.width/2,
        top:   pa.y + pa.height/2,
        originX: 'center',
        originY: 'center',
        scaleX: scale,
        scaleY: scale,
        name:  'img_' + Date.now()
      });

      canvas.add(img);
      canvas.setActiveObject(img);
      canvas.renderAll();
      updateLayerPanel();
      saveHistory();
      showToast('🖼️ Đã thêm ảnh vào canvas');
    });
  };
  reader.readAsDataURL(file);
  this.value = ''; // reset để có thể upload cùng file lại
});

// ════════════════════════════════════════════════════════
// UPDATE OBJECT PROPERTIES (Right panel)
// ════════════════════════════════════════════════════════
function updateObjProp(prop, val) {
  const obj = canvas.getActiveObject();
  if (!obj) return;
  const update = {};
  update[prop] = parseFloat(val);
  obj.set(update);
  canvas.renderAll();
  saveHistory();
}

function updateOpacity(val) {
  const obj = canvas.getActiveObject();
  if (!obj) return;
  obj.set('opacity', val / 100);
  document.getElementById('opacity-val').textContent = val + '%';
  canvas.renderAll();
}

function updateTextProp(prop, val) {
  const obj = canvas.getActiveObject();
  if (!obj || obj.type !== 'i-text') return;
  obj.set(prop, val);
  canvas.renderAll();
  // Sync bold/italic buttons
  syncTextButtons(obj);
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
  document.getElementById('btn-underline').classList.toggle('active', obj.underline);
  canvas.renderAll();
}

function syncTextButtons(obj) {
  document.getElementById('btn-bold').classList.toggle('active', obj.fontWeight === 'bold');
  document.getElementById('btn-italic').classList.toggle('active', obj.fontStyle === 'italic');
  document.getElementById('btn-underline').classList.toggle('active', !!obj.underline);
  document.getElementById('txt-font').value  = obj.fontFamily || 'Arial';
  document.getElementById('txt-size').value  = obj.fontSize || 24;
  document.getElementById('txt-color').value = obj.fill || '#000000';
}

// ════════════════════════════════════════════════════════
// DELETE
// ════════════════════════════════════════════════════════
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
  canvas.getObjects()
    .filter(o => !o.name?.startsWith('__'))
    .forEach(o => canvas.remove(o));
  canvas.discardActiveObject();
  canvas.renderAll();
  updateLayerPanel();
  showRightPanel(null);
  showToast('🗑 Đã xóa tất cả');
}

// ════════════════════════════════════════════════════════
// OUT-OF-BOUNDS CHECK
// ════════════════════════════════════════════════════════
function checkOutOfBounds(obj) {
  if (!obj || obj.name?.startsWith('__')) return;

  const pa = product.printArea;
  const bound = obj.getBoundingRect();

  const isOut = (
    bound.left < pa.x ||
    bound.top  < pa.y ||
    bound.left + bound.width  > pa.x + pa.width ||
    bound.top  + bound.height > pa.y + pa.height
  );

  const warning = document.getElementById('oob-warning');
  warning.style.display = isOut ? 'flex' : 'none';
  if (isOut) {
    obj.set({ borderColor: '#DC2626', cornerColor: '#DC2626' });
  } else {
    obj.set({ borderColor: '#2563EB', cornerColor: '#2563EB' });
  }
  canvas.renderAll();
}

// ════════════════════════════════════════════════════════
// ZOOM
// ════════════════════════════════════════════════════════
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

// ════════════════════════════════════════════════════════
// COLOR & SIZE (Right panel)
// ════════════════════════════════════════════════════════
function renderRightPanelProduct() {
  // Colors
  const colorCont = document.getElementById('rp-colors');
  colorCont.innerHTML = product.colors.map(c => `
    <button class="pc-btn ${c===selectedColor?'active':''}"
            data-color="${c}"
            title="${product.colorNames[c]}"
            style="background:${product.colorHex[c]}"
            onclick="selectColor('${c}')"></button>
  `).join('');

  // Sizes
  const sizeCont = document.getElementById('rp-sizes');
  sizeCont.innerHTML = product.sizes.map(s => `
    <button class="s-btn ${s===selectedSize?'active':''}"
            onclick="selectSize('${s}')">${s}</button>
  `).join('');

  updateSummary();
}

function selectColor(color) {
  selectedColor = color;
  drawProductBackground();
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

// ════════════════════════════════════════════════════════
// LAYER PANEL
// ════════════════════════════════════════════════════════
function updateLayerPanel() {
  const objects = canvas.getObjects()
    .filter(o => !o.name?.startsWith('__'))
    .reverse(); // hiện layer trên cùng trước

  const container = document.getElementById('layer-list');

  if (objects.length === 0) {
    container.innerHTML = `<div class="no-selection"><div class="ns-icon">📑</div><div>Chưa có layer nào</div></div>`;
    return;
  }

  const icons = { 'i-text': '✏️', 'image': '🖼️', 'rect': '▭', 'circle': '○', 'group': '📦' };
  const active = canvas.getActiveObject();

  container.innerHTML = objects.map((obj, i) => `
    <div class="layer-item ${obj === active ? 'active' : ''}"
         onclick="selectLayerObject(${canvas.getObjects().filter(o=>!o.name?.startsWith('__')).length - 1 - i})">
      <span class="layer-icon">${icons[obj.type] || '◻'}</span>
      <span>${obj.name || (obj.type + '_' + i)}</span>
    </div>
  `).join('');
}

function selectLayerObject(index) {
  const objs = canvas.getObjects().filter(o => !o.name?.startsWith('__'));
  if (objs[index]) {
    canvas.setActiveObject(objs[index]);
    canvas.renderAll();
    updateLayerPanel();
  }
}

// ════════════════════════════════════════════════════════
// RIGHT PANEL — hiện/ẩn sections theo object được chọn
// ════════════════════════════════════════════════════════
function showRightPanel(obj) {
  const secObj   = document.getElementById('section-object');
  const secText  = document.getElementById('section-text');
  const secNoSel = document.getElementById('section-nosel');

  if (!obj) {
    secObj.style.display   = 'none';
    secText.style.display  = 'none';
    secNoSel.style.display = 'block';
    return;
  }

  secNoSel.style.display = 'none';
  secObj.style.display   = 'block';

  // Sync tọa độ
  document.getElementById('obj-x').value     = Math.round(obj.left);
  document.getElementById('obj-y').value     = Math.round(obj.top);
  document.getElementById('obj-angle').value = Math.round(obj.angle || 0);
  const opacityPct = Math.round((obj.opacity ?? 1) * 100);
  document.getElementById('obj-opacity').value = opacityPct;
  document.getElementById('opacity-val').textContent = opacityPct + '%';

  // Text panel
  if (obj.type === 'i-text') {
    secText.style.display = 'block';
    syncTextButtons(obj);
  } else {
    secText.style.display = 'none';
  }
}

// ════════════════════════════════════════════════════════
// TABS
// ════════════════════════════════════════════════════════
function switchTab(tab) {
  ['design','product','layers'].forEach(t => {
    document.getElementById('panel-' + t).style.display = t === tab ? 'block' : 'none';
    document.getElementById('tab-' + t).classList.toggle('active', t === tab);
  });
  if (tab === 'layers') updateLayerPanel();
}

// ════════════════════════════════════════════════════════
// SAVE / PREVIEW / CONFIRM
// ════════════════════════════════════════════════════════
function saveDesign() {
  const designId = 'design_' + Date.now();
  const canvasJSON = canvas.toJSON(['name']);
  const thumbnail  = canvas.toDataURL({ format: 'png', quality: 0.4,
                                         multiplier: 0.3 });

  const design = {
    designId,
    userId:    'current_user',
    productId: product.id,
    canvasJSON: JSON.stringify(canvasJSON),
    thumbnailBase64: thumbnail,
    savedAt: new Date().toISOString()
  };

  const designs = JSON.parse(localStorage.getItem('printify_designs') || '[]');
  designs.push(design);
  localStorage.setItem('printify_designs', JSON.stringify(designs));

  showToast('💾 Đã lưu thiết kế! ID: ' + designId);
  console.log('[Design saved]', design);
}

function previewDesign() {
  const dataURL = canvas.toDataURL({ format: 'png', quality: 0.9 });
  const win = window.open('', '_blank');
  if (!win) {
    alert('Trình duyệt đang chặn popup preview.');
    return;
  }
  win.document.write(`
    <html>
      <body style="margin:0;background:#1E293B;display:flex;align-items:center;justify-content:center;min-height:100vh">
        <img src="${dataURL}" style="max-width:90vw;max-height:90vh;border-radius:12px;box-shadow:0 8px 32px rgba(0,0,0,0.5)">
      </body>
    </html>
  `);
  win.document.close();
}

function confirmDesign() {
  const exportableObjs = canvas.getObjects().filter(o => !o.name?.startsWith('__'));
  if (exportableObjs.length === 0) {
    showToast('⚠️ Chưa có thiết kế! Vui lòng thêm ảnh hoặc chữ.'); return;
  }

  // Kiểm tra out of bounds trước khi confirm
  const warning = document.getElementById('oob-warning');
  if (warning.style.display !== 'none') {
    if (!confirm('Thiết kế đang vượt ra ngoài vùng in. Vẫn xác nhận?')) return;
  }

  const designId = 'design_' + Date.now();
  const thumbnail = canvas.toDataURL({ format: 'png', quality: 0.5, multiplier: 0.3 });

  // Lưu design
  const design = {
    designId, userId: 'current_user', productId: product.id,
    canvasJSON: JSON.stringify(canvas.toJSON(['name'])),
    thumbnailBase64: thumbnail, savedAt: new Date().toISOString()
  };
  const designs = JSON.parse(localStorage.getItem('printify_designs') || '[]');
  designs.push(design);
  localStorage.setItem('printify_designs', JSON.stringify(designs));

  // Thêm vào giỏ hàng
  const cartItem = {
    cartItemId: 'CI_' + Date.now(),
    userId:     'current_user',
    productId:  product.id,
    designId,
    productName: product.name,
    color:       selectedColor,
    colorName:   product.colorNames[selectedColor],
    size:        selectedSize,
    quantity:    qty,
    unitPrice:   product.price,
    thumbnailBase64: thumbnail
  };
  const cart = JSON.parse(localStorage.getItem('printify_cart') || '[]');
  cart.push(cartItem);
  localStorage.setItem('printify_cart', JSON.stringify(cart));

  showToast('✅ Đã thêm vào giỏ hàng! Kiểm tra Console để xem data.');
  console.log('[Cart item added]', cartItem);
  console.log('[localStorage printify_cart]', JSON.parse(localStorage.getItem('printify_cart')));
}

// ════════════════════════════════════════════════════════
// TOAST
// ════════════════════════════════════════════════════════
let toastTimer;
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 3000);
}

// ════════════════════════════════════════════════════════
// FABRIC EVENT LISTENERS
// ════════════════════════════════════════════════════════
canvas.on('selection:created', e => {
  showRightPanel(e.selected[0]);
  updateLayerPanel();
});
canvas.on('selection:updated', e => {
  showRightPanel(e.selected[0]);
  updateLayerPanel();
});
canvas.on('selection:cleared', () => {
  showRightPanel(null);
  document.getElementById('oob-warning').style.display = 'none';
  updateLayerPanel();
});
canvas.on('object:modified', e => {
  checkOutOfBounds(e.target);
  showRightPanel(e.target);
  saveHistory();
  updateLayerPanel();
});
canvas.on('object:moving',  e => checkOutOfBounds(e.target));
canvas.on('object:scaling', e => checkOutOfBounds(e.target));
canvas.on('object:rotating',e => checkOutOfBounds(e.target));

// ════════════════════════════════════════════════════════
// KEYBOARD SHORTCUTS
// ════════════════════════════════════════════════════════
document.addEventListener('keydown', e => {
  // Không bắt phím khi đang nhập liệu trong IText
  if (canvas.getActiveObject()?.isEditing) return;

  if (e.key === 'Delete' || e.key === 'Backspace') {
    if (document.activeElement === document.body) { e.preventDefault(); deleteSelected(); }
  }
  if (e.ctrlKey && e.key === 'z') { e.preventDefault(); undo(); }
  if (e.ctrlKey && e.key === 'y') { e.preventDefault(); redo(); }
  if (e.key === 't' || e.key === 'T') addText();
  if (e.key === 'v' || e.key === 'V') setTool('select');
});

// ════════════════════════════════════════════════════════
// KHỞI TẠO
// ════════════════════════════════════════════════════════
drawProductBackground();
drawPrintArea();
renderRightPanelProduct();
updateSummary();
updateUndoRedoBtns();
showRightPanel(null);
</script>
</body>
</html>
