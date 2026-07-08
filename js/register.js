const USER_KEY = 'UserInfo';
const SESSION_KEY = 'printify_session';
const OTP_KEY = 'pending_register_otp';
const OTP_EMAIL_KEY = 'pending_register_email';
const OTP_EXPIRE_KEY = 'pending_register_expire';
const OTP_TRY_KEY = 'pending_register_try';
const OTP_POOL = ['184726', '305918', '642731', '908154', '517390','726184', '918305', '731642', '154908', '390517'];

const $ = (id) => document.getElementById(id);

function setMessage(text, type = 'error') {
  const el = $('message');
  el.textContent = text;
  el.style.color = type === 'success' ? '#047857' : '#b91c1c';
}

function clearErrors() {
  document.querySelectorAll('.auth-error').forEach(el => el.classList.remove('auth-error'));
}

function markError(el) {
  if (el) el.classList.add('auth-error');
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePassword(password) {
  // >= 8 ký tự, có chữ và số
  return /^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(password);
}

function getUsers() {
  return JSON.parse(localStorage.getItem(USER_KEY) || '[]');
}

function saveUsers(users) {
  localStorage.setItem(USER_KEY, JSON.stringify(users));
}

function genUserId() {
  return 'u' + Date.now();
}

function genOtp() {
  return OTP_POOL[Math.floor(Math.random() * OTP_POOL.length)];
}

function startOtpFlow(email) {
  const otp = genOtp();
  const expireAt = Date.now() + 5 * 60 * 1000;

  localStorage.setItem(OTP_KEY, otp);
  localStorage.setItem(OTP_EMAIL_KEY, email);
  localStorage.setItem(OTP_EXPIRE_KEY, String(expireAt));
  localStorage.setItem(OTP_TRY_KEY, '0');

  $('otpBox').classList.remove('hidden');
  $('otpInfo').textContent = `OTP đã được tạo và có hiệu lực trong 5 phút.`;

  const popup = $('otpPopup');
  const popupText = $('otpPopupText');
  const popupClose = $('otpPopupClose');

  popupText.textContent = `Mã OTP của bạn là: ${otp}`;
  popup.classList.remove('hidden');

  popupClose.onclick = () => popup.classList.add('hidden');

  setMessage(`OTP đã được gửi đến email của bạn.`, 'success');
  console.log('OTP đăng ký:', otp);
}

function createUserAndLogin() {
  const fullName = $('fullName').value.trim();
  const email = $('email').value.trim().toLowerCase();
  const password = $('password').value;
  const secQuestion = $('secQuestion').value;
  const secAnswer = $('secAnswer').value.trim();

  const users = getUsers();
  const user = {
    userId: genUserId(),
    name: fullName,
    email,
    passwordHash: password, // nếu có backend thì thay bằng hash thật
    avatar: '',
    secQuestion,
    secAnswer
  };

  users.push(user);
  saveUsers(users);

  sessionStorage.setItem(SESSION_KEY, JSON.stringify({
    userId: user.userId,
    name: user.name,
    email: user.email
  }));

  setMessage('Đăng ký thành công!', 'success');
  setTimeout(() => {
    window.location.href = '../interface/index.html';
  }, 800);
}

function validateRequiredFields() {
  clearErrors();

  const fullName = $('fullName');
  const email = $('email');
  const password = $('password');
  const confirmPassword = $('confirmPassword');
  const secQuestion = $('secQuestion');
  const secAnswer = $('secAnswer');
  const terms = $('terms');

  let ok = true;

  if (!fullName.value.trim()) { markError(fullName); ok = false; }
  if (!email.value.trim()) { markError(email); ok = false; }
  if (!password.value) { markError(password); ok = false; }
  if (!confirmPassword.value) { markError(confirmPassword); ok = false; }
  if (!secQuestion.value) { markError(secQuestion); ok = false; }
  if (!secAnswer.value.trim()) { markError(secAnswer); ok = false; }
  if (!terms.checked) { markError(terms); ok = false; }

  return ok;
}

document.addEventListener('DOMContentLoaded', () => {
  const registerForm = $('registerForm');
  const sendOtpBtn = $('sendOtpBtn');
  const verifyOtpBtn = $('verifyOtpBtn');

  sendOtpBtn.addEventListener('click', () => {
    clearErrors();
    setMessage('');

    if (!validateRequiredFields()) {
      setMessage('Vui lòng điền đầy đủ thông tin bắt buộc.', 'error');
      return;
    }

    const fullName = $('fullName').value.trim();
    const email = $('email').value.trim().toLowerCase();
    const password = $('password').value;
    const confirmPassword = $('confirmPassword').value;
    const secQuestion = $('secQuestion').value;
    const secAnswer = $('secAnswer').value.trim();
    const terms = $('terms').checked;

    if (!validateEmail(email)) {
      markError($('email'));
      setMessage('Email sai định dạng.', 'error');
      return;
    }

    if (!validatePassword(password)) {
      markError($('password'));
      setMessage('Mật khẩu phải có ít nhất 8 ký tự, gồm chữ và số.', 'error');
      return;
    }

    if (password !== confirmPassword) {
      markError($('confirmPassword'));
      setMessage('Mật khẩu xác nhận không khớp.', 'error');
      return;
    }

    if (!terms) {
      markError($('terms'));
      setMessage('Bạn phải đồng ý với Điều khoản & Chính sách bảo mật.', 'error');
      return;
    }

    const users = getUsers();
    if (users.some(u => u.email.toLowerCase() === email)) {
      markError($('email'));
      setMessage('Email này đã được đăng ký. Vui lòng đăng nhập hoặc dùng email khác.', 'error');
      return;
    }

    // Lưu tạm data để xác minh OTP
    sessionStorage.setItem('pending_register_data', JSON.stringify({
      fullName,
      email,
      password,
      secQuestion,
      secAnswer
    }));

    startOtpFlow(email);
  });

  verifyOtpBtn.addEventListener('click', () => {
    clearErrors();

    const otpInput = $('otpInput').value.trim();
    const savedOtp = localStorage.getItem(OTP_KEY);
    const expireAt = parseInt(localStorage.getItem(OTP_EXPIRE_KEY) || '0', 10);
    const currentEmail = $('email').value.trim().toLowerCase();

    if (!savedOtp) {
      setMessage('Chưa có OTP hợp lệ. Hãy bấm Gửi OTP trước.', 'error');
      return;
    }

    if (Date.now() > expireAt) {
      setMessage('OTP đã hết hạn. Vui lòng gửi lại OTP.', 'error');
      return;
    }

    const tries = parseInt(localStorage.getItem(OTP_TRY_KEY) || '0', 10);
    if (tries >= 3) {
      setMessage('Bạn đã nhập sai OTP quá 3 lần. Hãy gửi lại OTP.', 'error');
      return;
    }

    if (otpInput !== savedOtp) {
      localStorage.setItem(OTP_TRY_KEY, String(tries + 1));
      setMessage(`OTP không đúng. Bạn còn ${2 - tries} lượt thử.`, 'error');
      return;
    }

    const pending = JSON.parse(sessionStorage.getItem('pending_register_data') || 'null');
    if (!pending || pending.email.toLowerCase() !== currentEmail) {
      setMessage('Dữ liệu đăng ký không hợp lệ. Hãy tạo lại form.', 'error');
      return;
    }

    const users = getUsers();
    if (users.some(u => u.email.toLowerCase() === pending.email.toLowerCase())) {
      setMessage('Email này đã được đăng ký. Vui lòng đăng nhập hoặc dùng email khác.', 'error');
      return;
    }

    createUserAndLogin();
  });

  registerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    clearErrors();

    // Sau khi đã gửi OTP thì submit form chỉ nhắc người dùng verify
    const pending = sessionStorage.getItem('pending_register_data');
    if (!pending) {
      setMessage('Hãy nhập thông tin và bấm Gửi OTP trước.', 'error');
      return;
    }

    setMessage('Hãy xác minh OTP để hoàn tất đăng ký.', 'error');
  });
});