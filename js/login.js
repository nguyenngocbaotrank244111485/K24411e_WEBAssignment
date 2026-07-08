const DATA_URL = '../dataset/customerSample.json';
const SESSION_KEY = 'printify_current_customer';
const OVERRIDE_KEY = 'printify_password_overrides';

let customers = [];
let selectedCustomer = null;
let verifiedForReset = null;

const $ = (id) => document.getElementById(id);

function showMessage(text, type = 'error') {
  const el = $('message');
  el.textContent = text;
  el.className = `message ${type}`;
}

function openModal() {
  $('modalOverlay').classList.remove('hidden');
  $('forgotModal').classList.remove('hidden');
  $('forgotModal').setAttribute('aria-hidden', 'false');
}

function closeModal() {
  $('modalOverlay').classList.add('hidden');
  $('forgotModal').classList.add('hidden');
  $('forgotModal').setAttribute('aria-hidden', 'true');
  $('stepEmail').classList.remove('hidden');
  $('stepQuestion').classList.add('hidden');
  $('stepReset').classList.add('hidden');
  $('forgotEmail').value = '';
  $('securityAnswer').value = '';
  $('newPassword').value = '';
  $('confirmPassword').value = '';
  $('securityQuestion').textContent = '';
  selectedCustomer = null;
  verifiedForReset = null;
}

function getOverrides() {
  try { return JSON.parse(localStorage.getItem(OVERRIDE_KEY) || '{}'); }
  catch { return {}; }
}

function setOverrides(obj) {
  localStorage.setItem(OVERRIDE_KEY, JSON.stringify(obj));
}

function sanitizeCustomer(customer) {
  const { custPassword, custPasswordHash, ...safe } = customer;
  return safe;
}

async function sha256Hex(text) {
  const bytes = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(hashBuffer)].map(b => b.toString(16).padStart(2, '0')).join('');
}

function normalize(v) {
  return String(v ?? '').trim().toLowerCase();
}

async function verifyPassword(customer, inputPassword) {
  const overrides = getOverrides();
  const override = overrides[customer.custId];

  if (override?.custPasswordHash) {
    const h = await sha256Hex(inputPassword);
    return h === override.custPasswordHash;
  }

  if (customer.custPasswordHash) {
    const h = await sha256Hex(inputPassword);
    return h === customer.custPasswordHash;
  }

  return inputPassword === customer.custPassword; // fallback demo only
}

async function loadCustomers() {
  const res = await fetch(DATA_URL);
  if (!res.ok) throw new Error('Không tải được customerSample.json');
  customers = await res.json();
}

function findCustomerByEmail(email) {
  const n = normalize(email);
  return customers.find(c => normalize(c.custEmail) === n) || null;
}

$('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  showMessage('', 'success');

  const email = $('email').value.trim();
  const password = $('password').value;

  if (!email || !password) {
    showMessage('Vui lòng nhập email và mật khẩu.');
    return;
  }

  const customer = findCustomerByEmail(email);
  if (!customer) {
    showMessage('Email này chưa có trong danh sách tài khoản.');
    return;
  }

  const ok = await verifyPassword(customer, password);
  if (!ok) {
    showMessage('Mật khẩu không đúng. Nếu quên mật khẩu, hãy dùng mục khôi phục.');
    return;
  }

  const rememberMe = $('rememberMe').checked;
  const safeCustomer = sanitizeCustomer(customer);

  if (rememberMe) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(safeCustomer));
  } else {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(safeCustomer));
  }

  showMessage('Đăng nhập thành công. Đang chuyển trang...', 'success');
  setTimeout(() => { window.location.href = './homepage.html'; }, 700);
});

$('forgotBtn').addEventListener('click', openModal);
$('modalOverlay').addEventListener('click', closeModal);
$('closeModalBtn').addEventListener('click', closeModal);

$('lookupBtn').addEventListener('click', () => {
  const email = $('forgotEmail').value.trim();
  if (!email) {
    alert('Vui lòng nhập email.');
    return;
  }
  const customer = findCustomerByEmail(email);
  if (!customer) {
    alert('Không tìm thấy tài khoản với email này.');
    return;
  }
  selectedCustomer = customer;
  $('securityQuestion').textContent = customer.secQuestion;
  $('stepEmail').classList.add('hidden');
  $('stepQuestion').classList.remove('hidden');
});

$('verifyAnswerBtn').addEventListener('click', () => {
  if (!selectedCustomer) return;
  const answer = normalize($('securityAnswer').value);
  const correct = normalize(selectedCustomer.secAnswers);

  if (!answer) {
    alert('Vui lòng nhập câu trả lời.');
    return;
  }
  if (answer !== correct) {
    alert('Câu trả lời bảo mật chưa đúng.');
    return;
  }

  verifiedForReset = selectedCustomer;
  $('stepQuestion').classList.add('hidden');
  $('stepReset').classList.remove('hidden');
});

$('resetPasswordBtn').addEventListener('click', async () => {
  if (!verifiedForReset) return;

  const newPw = $('newPassword').value;
  const confirmPw = $('confirmPassword').value;

  if (newPw.length < 6) {
    alert('Mật khẩu mới nên có ít nhất 6 ký tự.');
    return;
  }
  if (newPw !== confirmPw) {
    alert('Mật khẩu xác nhận không khớp.');
    return;
  }

  const hash = await sha256Hex(newPw);
  const overrides = getOverrides();
  overrides[verifiedForReset.custId] = {
    custPasswordHash: hash,
    updatedAt: new Date().toISOString()
  };
  setOverrides(overrides);

  alert('Đổi mật khẩu thành công. Bạn có thể đăng nhập lại bằng mật khẩu mới.');
  closeModal();
});

window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !$('forgotModal').classList.contains('hidden')) closeModal();
});

(async function init() {
  try {
    await loadCustomers();
  } catch (err) {
    console.error(err);
    showMessage('Không tải được dữ liệu khách hàng. Hãy chạy bằng Live Server hoặc localhost.');
  }
})();
