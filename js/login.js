const DATA_URL = '../dataset/customerSample.json';
const SESSION_KEY = 'printify_current_customer';
const OVERRIDE_KEY = 'printify_password_overrides';

let customers = [];
let selectedCustomer = null;
let verifiedForReset = null;

const $ = (id) => document.getElementById(id);

function showMessage(text, type = 'error') {
  const el = $('message');
  if (!el) return;
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
  try {
    return JSON.parse(localStorage.getItem(OVERRIDE_KEY) || '{}');
  } catch {
    return {};
  }
}

function setOverrides(obj) {
  localStorage.setItem(OVERRIDE_KEY, JSON.stringify(obj));
}

function sanitizeCustomer(customer) {
  const {
    custPassword,
    custPasswordHash,
    password,
    passwordHash,
    ...safe
  } = customer;
  return safe;
}

async function sha256Hex(text) {
  const bytes = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(hashBuffer)]
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function normalize(v) {
  return String(v ?? '').trim().toLowerCase();
}

function pickName(customer) {
  return customer.custName || customer.name || customer.adName || '';
}

function pickEmail(customer) {
  return customer.custEmail || customer.email || customer.adEmail || '';
}

function pickId(customer) {
  return customer.custId || customer.userId || customer.adId || '';
}

function pickAvatar(customer) {
  return customer.custAvatar || customer.avatar || customer.adAvatar || '';
}

function pickSecurityQuestion(customer) {
  return customer.secQuestion || customer.securityQuestion || '';
}

function pickSecurityAnswer(customer) {
  return customer.secAnswer || customer.secAnswers || customer.securityAnswer || '';
}

function pickPasswordHash(customer) {
  return customer.custPasswordHash || customer.passwordHash || customer.password || '';
}

async function verifyPassword(customer, inputPassword) {
  const overrides = getOverrides();
  const id = pickId(customer);
  const override = overrides[id];

  if (override?.passwordHash) {
    const h = await sha256Hex(inputPassword);
    return h === override.passwordHash;
  }

  const rawPw = customer.custPassword || customer.password;
  if (rawPw && inputPassword === rawPw) return true;

  const storedHash = pickPasswordHash(customer);
  if (storedHash && storedHash !== rawPw) {
    const h = await sha256Hex(inputPassword);
    return h === storedHash;
  }

  return false;
}

async function loadCustomers() {
  const list = [];

  // 1) dữ liệu mẫu từ JSON
  try {
    const res = await fetch(DATA_URL);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) list.push(...data);
    }
  } catch (err) {
    console.warn('Không tải được customerSample.json:', err);
  }

  // 2) user đã đăng ký từ localStorage
  try {
    const reg = JSON.parse(localStorage.getItem('printify_users') || '[]');
    if (Array.isArray(reg)) list.push(...reg);
  } catch {}

  // 3) loại trùng theo email (localStorage ưu tiên hơn JSON mẫu)
  const map = new Map();
  for (const c of list) {
    const email = normalize(pickEmail(c));
    if (!email) continue;
    map.set(email, c);
  }

  customers = [...map.values()];
}

function findCustomerByEmail(email) {
  const n = normalize(email);
  return customers.find(c => normalize(pickEmail(c)) === n) || null;
}

function updateRegisteredUserPassword(userIdOrEmail, newPasswordHash) {
  try {
    const users = JSON.parse(localStorage.getItem('printify_users') || '[]');
    const idx = users.findIndex(u =>
      pickId(u) === userIdOrEmail ||
      normalize(pickEmail(u)) === normalize(userIdOrEmail)
    );

    if (idx >= 0) {
      users[idx].passwordHash = newPasswordHash;
      localStorage.setItem('printify_users', JSON.stringify(users));
      return true;
    }
  } catch {}
  return false;
}

function getLoginPayload(customer) {
  return {
    userId: pickId(customer),
    name: pickName(customer),
    email: pickEmail(customer),
    avatar: pickAvatar(customer)
  };
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
  const safeCustomer = sanitizeCustomer(getLoginPayload(customer));

  setCurrentUser(safeCustomer, rememberMe);

  showMessage('Đăng nhập thành công. Đang chuyển trang...', 'success');
  setTimeout(() => {
    window.location.href = getReturnTo('../interface/index.html');
  }, 700);
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
  $('securityQuestion').textContent = pickSecurityQuestion(customer) || 'Không có câu hỏi bảo mật.';
  $('stepEmail').classList.add('hidden');
  $('stepQuestion').classList.remove('hidden');
});

$('verifyAnswerBtn').addEventListener('click', () => {
  if (!selectedCustomer) return;

  const answer = normalize($('securityAnswer').value);
  const correct = normalize(pickSecurityAnswer(selectedCustomer));

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
  const id = pickId(verifiedForReset);

  // ưu tiên cập nhật user đã đăng ký trong localStorage
  const updatedInUsers = updateRegisteredUserPassword(id, hash);

  // nếu không phải user localStorage thì lưu override cho dữ liệu mẫu
  if (!updatedInUsers) {
    const overrides = getOverrides();
    overrides[id] = {
      passwordHash: hash,
      updatedAt: new Date().toISOString()
    };
    setOverrides(overrides);
  }

  alert('Đổi mật khẩu thành công. Bạn có thể đăng nhập lại bằng mật khẩu mới.');
  closeModal();
});

window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !$('forgotModal').classList.contains('hidden')) {
    closeModal();
  }
});

(async function init() {
  try {
    await loadCustomers();
  } catch (err) {
    console.error(err);
    showMessage('Không tải được dữ liệu khách hàng. Hãy chạy bằng Live Server hoặc localhost.');
  }
})();