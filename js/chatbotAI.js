// chatbot.js — Floating chatbot widget, does not switch tabs.

const GEMINI_MODEL = 'gemini-2.5-flash';
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent';

const CHAT_KEY = 'printify_chat';
const CHAT_KEY_API = 'printify_gemini_key';
const PRODUCTS_KEY = 'printify_products_cache';
const MAX_MESSAGES = 20;

const QUICK_PROMPTS = [
  'Bạn cần tư vấn gì?',
  'Chất liệu áo thun, tote bag',
  'Màu nào hợp in áo nhất?',
  'Gợi ý giúp mình một món quà in ấn',
  'Nên thiết kế theo phong cách tối giản cho loại sản phẩm nào?'
];

function isEditorPage() {
  const path = location.pathname.toLowerCase();
  return path.includes('editor.html');
}

function getApiKey() {
  let key = localStorage.getItem(CHAT_KEY_API);

  if (!key) {
    key = prompt('Nhập Gemini API Key để dùng chatbot:');
    if (key && key.trim()) {
      key = key.trim();
      localStorage.setItem(CHAT_KEY_API, key);
    } else {
      key = '';
    }
  }

  return key;
}

function loadHistory() {
  try {
    const raw = sessionStorage.getItem(CHAT_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function saveHistory(history) {
  const trimmed = history.slice(-MAX_MESSAGES);
  sessionStorage.setItem(CHAT_KEY, JSON.stringify(trimmed));
  return trimmed;
}

function flattenProductsData(data) {
  if (Array.isArray(data)) return data;

  if (data && Array.isArray(data.categories)) {
    return data.categories.flatMap(cat =>
      Array.isArray(cat.products) ? cat.products : []
    );
  }

  return [];
}

function getProductsFromStorage() {
  try {
    const raw = localStorage.getItem(PRODUCTS_KEY);
    const data = raw ? JSON.parse(raw) : [];
    return flattenProductsData(data);
  } catch {
    return [];
  }
}

async function fetchProductsFallback() {
  const candidates = [
    '../dataset/products.json',
    '../data/products.json'
  ];

  for (const url of candidates) {
    try {
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) continue;

      const data = await res.json();
      const flat = flattenProductsData(data);

      if (flat.length) {
        localStorage.setItem(PRODUCTS_KEY, JSON.stringify(flat));
        return flat;
      }
    } catch {
      // thử nguồn tiếp theo
    }
  }

  return [];
}

async function getProducts() {
  const cached = getProductsFromStorage();
  if (cached.length) return cached;
  return await fetchProductsFallback();
}

function escapeHTML(str) {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

async function buildSystemPrompt() {
  const products = await getProducts();

  const list = products.slice(0, 40).map(p => {
    const name = p.name || p.productName || 'Sản phẩm';
    const category = p.category || 'Khác';
    const price = Number(p.price || p.basePrice || 0).toLocaleString('vi-VN');
    return `- ${name} (${category}) - ${price}đ`;
  }).join('\n');

  return `Bạn là trợ lý tư vấn của PrintiFy.
Chỉ tư vấn về sản phẩm in ấn, thiết kế, chất liệu, giá và ý tưởng in.
Nếu câu hỏi ngoài phạm vi, hãy trả lời lịch sự và kéo người dùng về chủ đề PrintiFy.
Luôn trả lời ngắn gọn, dễ hiểu, thân thiện.
Nếu có thể, đưa ra gợi ý cụ thể theo nhu cầu của người dùng.

Danh sách sản phẩm hiện có:
${list || '- Chưa có dữ liệu sản phẩm'}`;
}

async function sendMessage(userText, historyBeforeCurrentUser) {
  const key = getApiKey();
  if (!key) return 'Bạn chưa nhập Gemini API Key.';

  const systemPrompt = await buildSystemPrompt();

  const body = {
    system_instruction: {
      parts: [{ text: systemPrompt }]
    },
    contents: [
      ...historyBeforeCurrentUser,
      { role: 'user', parts: [{ text: userText }] }
    ],
    generationConfig: {
      temperature: 0.7,
      topP: 0.95,
      maxOutputTokens: 512
    }
  };

  try {
    const res = await fetch(`${GEMINI_URL}?key=${encodeURIComponent(key)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = await res.json();

    if (!res.ok || data.error) {
      const msg = data?.error?.message || `HTTP ${res.status}`;
      throw new Error(msg);
    }

    const text = data?.candidates?.[0]?.content?.parts
      ?.map(p => p.text || '')
      .join('')
      .trim();

    return text || 'Mình chưa nhận được phản hồi từ Gemini.';
  } catch (err) {
    return `Lỗi kết nối: ${err.message}. Vui lòng thử lại.`;
  }
}

function addMessage(role, text, container) {
  const div = document.createElement('div');
  div.className = `pf-msg ${role}`;
  div.innerHTML = escapeHTML(text);
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
  return div;
}

function addTyping(container) {
  const div = document.createElement('div');
  div.className = 'pf-msg bot';
  div.innerHTML = `
    <span class="pf-typing" aria-label="Đang nhập">
      <span class="pf-dot"></span>
      <span class="pf-dot"></span>
      <span class="pf-dot"></span>
    </span>
  `;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
  return div;
}

function renderQuickPrompts(quickBox, onPick) {
  quickBox.innerHTML = QUICK_PROMPTS.map(q => (
    `<button type="button" class="pf-quick-btn" data-q="${escapeHTML(q)}">${escapeHTML(q)}</button>`
  )).join('');

  quickBox.querySelectorAll('button[data-q]').forEach(btn => {
    btn.addEventListener('click', () => onPick(btn.dataset.q));
  });
}

function initChatbotWidget() {
  if (isEditorPage()) return;
  if (document.getElementById('pf-chat-launcher')) return;

  const launcher = document.createElement('button');
  launcher.id = 'pf-chat-launcher';
  launcher.className = 'pf-chat-launcher';
  launcher.type = 'button';
  launcher.title = 'Chat tư vấn';
  launcher.innerHTML = '💬';

  const panel = document.createElement('section');
  panel.id = 'pf-chat-panel';
  panel.className = 'pf-chat-panel';
  panel.innerHTML = `
    <div class="pf-chat-header">
      <div>
        <div class="pf-chat-title">PrintiFy Assistant</div>
        <div class="pf-chat-subtitle">Bạn cần tư vấn gì?</div>
      </div>
      <button type="button" class="pf-chat-close" id="pf-chat-close" aria-label="Đóng">×</button>
    </div>

    <div id="pf-chat-messages" class="pf-chat-messages"></div>
    <div id="pf-chat-quick" class="pf-chat-quick"></div>

    <div class="pf-chat-inputbar">
      <input id="pf-chat-input" class="pf-chat-input" type="text" placeholder="Nhập câu hỏi..." />
      <button id="pf-chat-send" class="pf-chat-send" type="button">Gửi</button>
    </div>
  `;

  document.body.appendChild(launcher);
  document.body.appendChild(panel);

  const messages = panel.querySelector('#pf-chat-messages');
  const quickBox = panel.querySelector('#pf-chat-quick');
  const input = panel.querySelector('#pf-chat-input');
  const sendBtn = panel.querySelector('#pf-chat-send');
  const closeBtn = panel.querySelector('#pf-chat-close');

  function openChat() {
    panel.classList.add('open');
    input.focus();

    if (messages.childElementCount === 0) {
      addMessage(
        'bot',
        'Xin chào! Tôi là trợ lý PrintiFy. Tôi có thể giúp bạn chọn sản phẩm, kiểu in hoặc ý tưởng thiết kế. Bạn cần tư vấn gì?',
        messages
      );
      renderQuickPrompts(quickBox, ask);
    }
  }

  function closeChat() {
    panel.classList.remove('open');
  }

  async function ask(text) {
    const userText = String(text || '').trim();
    if (!userText) return;

    addMessage('user', userText, messages);
    input.value = '';

    const priorHistory = loadHistory();

    const typing = addTyping(messages);
    const botText = await sendMessage(userText, priorHistory);
    typing.remove();

    addMessage('bot', botText, messages);

    const nextHistory = saveHistory([
      ...priorHistory,
      { role: 'user', parts: [{ text: userText }] },
      { role: 'model', parts: [{ text: botText }] }
    ]);

    sessionStorage.setItem(CHAT_KEY, JSON.stringify(nextHistory));
    renderQuickPrompts(quickBox, ask);
  }

  launcher.addEventListener('click', () => {
    if (panel.classList.contains('open')) closeChat();
    else openChat();
  });

  closeBtn.addEventListener('click', closeChat);
  sendBtn.addEventListener('click', () => ask(input.value));

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') ask(input.value);
  });

  renderQuickPrompts(quickBox, ask);

  const history = loadHistory();
  if (history.length) {
    history.forEach(item => {
      addMessage(
        item.role === 'user' ? 'user' : 'bot',
        item.parts?.[0]?.text || '',
        messages
      );
    });
  }
}

document.addEventListener('DOMContentLoaded', initChatbotWidget);