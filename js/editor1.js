// ════════════════════════════════════════════════════════
// editor-part1.js
// Include: DATA, STATE, CANVAS INIT, BACKGROUND,
//        PRINT AREA, UNDO/REDO, TOOLS, addText, addShape, UPLOAD
// ════════════════════════════════════════════════════════

// ── DATA ──────────────────────────────────────────────
const COLOR_HEX = {
  white:'#FFFFFF',  black:'#1A1A1A',  navy:'#1B3A6B',
  red:'#C0392B',    yellow:'#F4C430', green:'#1E7A4A',
  gray:'#94A3B8',   beige:'#D4B896',  natural:'#C8B89A',
  kraft:'#A67C52',  transparent:'transparent',
  gold:'#FFD700'
};
const COLOR_NAMES = {
  white:'Trắng',   black:'Đen',      navy:'Xanh Navy',
  red:'Đỏ',        yellow:'Vàng',    green:'Xanh Lá',
  gray:'Xám',      beige:'Be',       natural:'Tự nhiên',
  kraft:'Kraft',   transparent:'Trong suốt',
  gold:'Vàng Gold'
};

let product = null; // gán sau khi fetch xong

// ── STATE ──────────────────────────────────────────────
let selectedColor = 'white';
let selectedSize  = 'M';
let qty           = 1;
let currentTool   = 'select';
let zoomLevel     = 1;
let historyStack  = [];
let redoStack     = [];

// ── CANVAS INIT ────────────────────────────────────────
// Canvas được tạo với kích thước tạm — resize đúng sau khi có product
const canvas = new fabric.Canvas('design-canvas', {
  width:  500,
  height: 600,
  backgroundColor: '#F8F8F8',
  preserveObjectStacking: true
});

// ── LOAD PRODUCT TỪ URL + FETCH products.json ──────────
async function loadProductFromURL() {
  const params    = new URLSearchParams(window.location.search);
  const productId = params.get('productId') || 'p001';

  try {
    const res  = await fetch('../dataset/products.json');
    const data = await res.json();

    // Tìm product trong cấu trúc categories > products
    for (const cat of data.categories) {
      const found = cat.products.find(p => p.productId === productId);
      if (found) { product = found; break; }
    }

    // Fallback nếu không tìm thấy productId trong URL
    if (!product) {
      console.warn(`Không tìm thấy productId="${productId}", dùng sản phẩm đầu tiên`);
      product = data.categories[0].products[0];
    }
  } catch (err) {
    console.error('Không fetch được products.json:', err);
    // Fallback về hardcode để editor không crash khi chạy standalone
    product = {
      productId: 'p001', name: 'Áo Thun Unisex Basic', price: 150000,
      image: '../images/products/Tshirt.png',
      colors: ['white','black','navy','red'],
      sizes: ['S','M','L','XL','XXL'],
      variants: [],
      printArea: { x:100, y:80, width:300, height:360 },
      canvasWidth: 500, canvasHeight: 600, maxFileSizeMB: 5
    };
  }

  // Gắn colorHex + colorNames từ bảng chung vào product
  // (products.json không lưu 2 field này để tránh lặp)
  product.colorHex   = Object.fromEntries(
    product.colors.map(c => [c, COLOR_HEX[c]   || '#888888'])
  );
  product.colorNames = Object.fromEntries(
    product.colors.map(c => [c, COLOR_NAMES[c] || c])
  );

  // Đọc color/size từ URL — fallback lấy phần tử đầu của chính sản phẩm đó
  selectedColor = params.get('color') || product.colors[0];
  selectedSize  = params.get('size')  || product.sizes[0];

  // Validate: nếu color/size từ URL không có trong sản phẩm → reset về mặc định
  if (!product.colors.includes(selectedColor)) selectedColor = product.colors[0];
  if (!product.sizes.includes(selectedSize))   selectedSize  = product.sizes[0];

  initEditor();
}

// ── INIT EDITOR (gọi sau khi product đã sẵn sàng) ──────
function initEditor() {
  // Resize canvas đúng theo sản phẩm
  canvas.setWidth(product.canvasWidth);
  canvas.setHeight(product.canvasHeight);

  // Cập nhật header toolbar
  document.getElementById('tb-product-name').textContent = product.name;
  document.getElementById('tb-color-name').textContent   = product.colorNames[selectedColor];
  document.getElementById('tb-size-name').textContent    = selectedSize;

  // Vẽ ảnh nền + khung vùng in
  drawProductBackground();
  drawPrintArea();

  // Các init từ editor-part2.js
  registerFabricEvents();
  registerKeyboard();
  renderRightPanelProduct();
  updateSummary();
  updateUndoRedoBtns();
  showRightPanel(null);
}

// ── BACKGROUND: load ảnh thật + áp CSS filter đổi màu ─
// excludeFromExport: false → ảnh sản phẩm XUẤT ra cùng với thiết kế (thumbnail, preview)
// Khi bấm Preview → ảnh sản phẩm hiện đúng màu đang chọn, không còn khung vùng in
function drawProductBackground() {
  fabric.Image.fromURL(
    product.image,
    function(img) {
      // Scale vừa khít canvas, căn giữa
      const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
      img.set({
        left:   (canvas.width  - img.width  * scale) / 2,
        top:    (canvas.height - img.height * scale) / 2,
        scaleX: scale,
        scaleY: scale,
        selectable:       false,
        evented:          false,
        name:             '__background__',
        excludeFromExport: false, // xuất ra khi preview/thumbnail
        // Áp CSS filter đổi màu — đây chính là cách đổi màu sản phẩm
        filters: buildColorFilter(selectedColor)
      });
      img.applyFilters(); // PHẢI gọi sau khi set filters

      const old = canvas.getObjects().find(o => o.name === '__background__');
      if (old) canvas.remove(old);
      canvas.insertAt(img, 0); // luôn đặt ở lớp dưới cùng
      canvas.renderAll();
    },
    { crossOrigin: 'anonymous' } // tránh lỗi "Tainted canvas" khi export
  );
}

// Chuyển CSS filter string → Fabric.js filter array
// Fabric.js dùng filter objects, không dùng CSS string trực tiếp
function buildColorFilter(color) {
  const filterMap = {
    white:  [],  // không cần filter
    black:  [ new fabric.Image.filters.Brightness({ brightness: -0.85 }),
               new fabric.Image.filters.Saturation({ saturation: -1 }) ],
    navy:   [ new fabric.Image.filters.Brightness({ brightness: -0.6 }),
               new fabric.Image.filters.Saturation({ saturation: 2 }),
               new fabric.Image.filters.HueRotation({ rotation: 0.55 }) ],
    red:    [ new fabric.Image.filters.Brightness({ brightness: -0.2 }),
               new fabric.Image.filters.Saturation({ saturation: 3 }),
               new fabric.Image.filters.HueRotation({ rotation: -0.15 }) ],
    yellow: [ new fabric.Image.filters.Brightness({ brightness: 0.1 }),
               new fabric.Image.filters.Saturation({ saturation: 2.5 }),
               new fabric.Image.filters.HueRotation({ rotation: 0.08 }) ],
    green:  [ new fabric.Image.filters.Brightness({ brightness: -0.35 }),
               new fabric.Image.filters.Saturation({ saturation: 3 }),
               new fabric.Image.filters.HueRotation({ rotation: 0.28 }) ],
    gray:   [ new fabric.Image.filters.Brightness({ brightness: -0.3 }),
               new fabric.Image.filters.Saturation({ saturation: -0.9 }) ]
  };
  return filterMap[color] || [];
}

// ── PRINT AREA (viền xanh đứt nét) ────────────────────
// excludeFromExport: true → KHÔNG xuất ra khi preview/thumbnail
// Đây là lý do preview không còn thấy khung vùng in
function drawPrintArea() {
  ['__printArea__','__printLabel__'].forEach(n => {
    const old = canvas.getObjects().find(o => o.name === n);
    if (old) canvas.remove(old);
  });
  const pa = product.printArea;
  canvas.add(new fabric.Rect({
    left: pa.x, top: pa.y, width: pa.width, height: pa.height,
    fill: 'rgba(37,99,235,0.03)',
    stroke: '#2563EB', strokeWidth: 1.5, strokeDashArray: [6,4],
    selectable: false, evented: false,
    name: '__printArea__',
    excludeFromExport: true  // ← KHÔNG xuất ra preview
  }));
  canvas.add(new fabric.Text('Vùng in', {
    left: pa.x + 4, top: pa.y + 4,
    fontSize: 11, fill: '#2563EB', opacity: 0.7,
    selectable: false, evented: false,
    name: '__printLabel__',
    excludeFromExport: true  // ← KHÔNG xuất ra preview
  }));
  canvas.renderAll();
}

// ── UNDO / REDO ────────────────────────────────────────
function saveHistory() {
  historyStack.push(JSON.stringify(getExportableObjects()));
  redoStack = [];
  if (historyStack.length > 30) historyStack.shift();
  updateUndoRedoBtns();
}
function undo() {
  if (!historyStack.length) return;
  redoStack.push(JSON.stringify(getExportableObjects()));
  restoreObjects(JSON.parse(historyStack.pop()));
  updateUndoRedoBtns(); updateLayerPanel();
}
function redo() {
  if (!redoStack.length) return;
  historyStack.push(JSON.stringify(getExportableObjects()));
  restoreObjects(JSON.parse(redoStack.pop()));
  updateUndoRedoBtns(); updateLayerPanel();
}
function getExportableObjects() {
  return canvas.getObjects()
    .filter(o => !o.name?.startsWith('__'))
    .map(o => o.toObject(['name']));
}
function restoreObjects(objects) {
  canvas.getObjects().filter(o => !o.name?.startsWith('__')).forEach(o => canvas.remove(o));
  if (!objects.length) { canvas.renderAll(); return; }
  fabric.util.enlivenObjects(objects, arr => {
    arr.forEach(o => canvas.add(o));
    canvas.renderAll();
  });
}
function updateUndoRedoBtns() {
  document.getElementById('btn-undo').disabled = historyStack.length === 0;
  document.getElementById('btn-redo').disabled = redoStack.length === 0;
}

// ── TOOLS ──────────────────────────────────────────────
function setTool(tool) {
  currentTool = tool;
  document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
  const btn = document.getElementById('tool-' + tool);
  if (btn) btn.classList.add('active');
  canvas.isDrawingMode = false;
  canvas.selection = (tool === 'select');
}

// ── ADD TEXT ───────────────────────────────────────────
function addText() {
  saveHistory();
  const text = new fabric.IText('Nhập nội dung...', {
    left: product.printArea.x + 20,
    top:  product.printArea.y + 20,
    fontSize: 28, fontFamily: 'Arial', fill: '#000000',
    name: 'text_' + Date.now()
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

// ── SHAPE FLYOUT toggle ────────────────────────────────
function toggleShapeFlyout(e) {
  e.stopPropagation();
  document.getElementById('shape-flyout').classList.toggle('open');
}
function closeShapeFlyout() {
  document.getElementById('shape-flyout').classList.remove('open');
}
document.addEventListener('click', e => {
  const wrap = document.getElementById('shape-wrap');
  if (wrap && !wrap.contains(e.target)) closeShapeFlyout();
});

// ── ADD SHAPE (9 loại) ─────────────────────────────────
function addShape(type) {
  saveHistory();
  const pa = product.printArea;
  const cx = pa.x + pa.width  / 2;
  const cy = pa.y + pa.height / 2;

  // Màu mặc định theo từng loại shape
  const FILLS = {
    rect:    'rgba(37,99,235,0.20)',  square: 'rgba(37,99,235,0.20)',
    circle:  'rgba(220,38,38,0.20)', ellipse:'rgba(220,38,38,0.20)',
    triangle:'rgba(5,150,105,0.20)', star:   'rgba(245,158,11,0.20)',
    diamond: 'rgba(236,72,153,0.20)',line:   'rgba(148,163,184,1)',
    arrow:   'rgba(99,102,241,0.20)'
  };
  const STROKES = {
    rect:    '#2563EB', square: '#2563EB',
    circle:  '#DC2626', ellipse:'#DC2626',
    triangle:'#059669', star:   '#F59E0B',
    diamond: '#EC4899', line:   '#94A3B8',
    arrow:   '#6366F1'
  };

  const fill   = FILLS[type]   || 'rgba(100,116,139,0.2)';
  const stroke = STROKES[type] || '#64748B';
  const sw = 2;
  let shape;

  switch (type) {
    case 'rect':
      shape = new fabric.Rect({
        left: cx-60, top: cy-40, width: 120, height: 80,
        fill, stroke, strokeWidth: sw
      }); break;

    case 'square':
      shape = new fabric.Rect({
        left: cx-50, top: cy-50, width: 100, height: 100,
        fill, stroke, strokeWidth: sw
      }); break;

    case 'circle':
      shape = new fabric.Circle({
        left: cx-50, top: cy-50, radius: 50,
        fill, stroke, strokeWidth: sw
      }); break;

    case 'ellipse':
      shape = new fabric.Ellipse({
        left: cx-70, top: cy-40, rx: 70, ry: 40,
        fill, stroke, strokeWidth: sw
      }); break;

    case 'triangle':
      shape = new fabric.Triangle({
        left: cx-55, top: cy-50, width: 110, height: 100,
        fill, stroke, strokeWidth: sw
      }); break;

    case 'star': {
      const outerR = 55, innerR = 22, pts = [];
      for (let i = 0; i < 10; i++) {
        const angle = (i * Math.PI) / 5 - Math.PI / 2;
        const r = i % 2 === 0 ? outerR : innerR;
        pts.push({ x: Math.cos(angle) * r, y: Math.sin(angle) * r });
      }
      shape = new fabric.Polygon(pts, {
        left: cx - outerR, top: cy - outerR,
        fill, stroke, strokeWidth: sw
      }); break;
    }

    case 'line':
      shape = new fabric.Line([0, 0, 130, 0], {
        left: cx - 65, top: cy,
        stroke, strokeWidth: 3, strokeLineCap: 'round', fill: 'transparent'
      }); break;

    case 'diamond': {
      const pts = [{ x:0,y:-55 },{ x:45,y:0 },{ x:0,y:55 },{ x:-45,y:0 }];
      shape = new fabric.Polygon(pts, {
        left: cx - 45, top: cy - 55,
        fill, stroke, strokeWidth: sw
      }); break;
    }

    case 'arrow': {
      const pts = [
        {x:0,y:-15},{x:70,y:-15},{x:70,y:-30},{x:110,y:0},
        {x:70,y:30},{x:70,y:15},{x:0,y:15}
      ];
      shape = new fabric.Polygon(pts, {
        left: cx - 55, top: cy - 30,
        fill, stroke, strokeWidth: sw
      }); break;
    }

    default: return;
  }

  shape.set('name', type + '_' + Date.now());
  canvas.add(shape);
  canvas.setActiveObject(shape);
  canvas.renderAll();
  updateLayerPanel();
  saveHistory();
}

// ── UPLOAD ẢNH VÀO CANVAS ─────────────────────────────
document.getElementById('file-input').addEventListener('change', function(e) {
  const file = e.target.files[0];
  if (!file) return;
  if (file.size > product.maxFileSizeMB * 1024 * 1024) {
    showToast(`❌ File quá lớn! Tối đa ${product.maxFileSizeMB}MB`); return;
  }
  const reader = new FileReader();
  reader.onload = function(evt) {
    fabric.Image.fromURL(evt.target.result, function(img) {
      saveHistory();
      const pa = product.printArea;
      const scale = Math.min((pa.width * 0.8) / img.width, (pa.height * 0.8) / img.height, 1);
      img.set({
        left: pa.x + pa.width / 2, top: pa.y + pa.height / 2,
        originX: 'center', originY: 'center',
        scaleX: scale, scaleY: scale,
        name: 'img_' + Date.now()
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
  this.value = '';
});
