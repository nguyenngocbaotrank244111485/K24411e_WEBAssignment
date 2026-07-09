// auth.js — dùng chung cho toàn website

const AUTH_KEYS = {
  session: 'printify_current_customer',
  returnTo: 'printify_return_to'
};

function getCurrentUser() {
  try {
    const session =
      sessionStorage.getItem(AUTH_KEYS.session) ||
      localStorage.getItem(AUTH_KEYS.session);
    return session ? JSON.parse(session) : null;
  } catch {
    return null;
  }
}

function isLoggedIn() {
  return !!getCurrentUser();
}

function setCurrentUser(user, remember = false) {
  const payload = JSON.stringify(user);

  sessionStorage.removeItem(AUTH_KEYS.session);
  localStorage.removeItem(AUTH_KEYS.session);

  if (remember) {
    localStorage.setItem(AUTH_KEYS.session, payload);
  } else {
    sessionStorage.setItem(AUTH_KEYS.session, payload);
  }

  window.dispatchEvent(new Event('printify-auth-changed'));
}

function clearCurrentUser() {
  sessionStorage.removeItem(AUTH_KEYS.session);
  localStorage.removeItem(AUTH_KEYS.session);
  window.dispatchEvent(new Event('printify-auth-changed'));
}

function setReturnTo(url = window.location.href) {
  sessionStorage.setItem(AUTH_KEYS.returnTo, url);
}

function getReturnTo(defaultUrl = 'index.html') {
  const url = sessionStorage.getItem(AUTH_KEYS.returnTo);
  sessionStorage.removeItem(AUTH_KEYS.returnTo);
  return url || defaultUrl;
}

function redirectToLogin(returnTo = window.location.href) {
  setReturnTo(returnTo);
  window.location.href = 'login.html';
}

function redirectToRegister(returnTo = window.location.href) {
  setReturnTo(returnTo);
  window.location.href = 'register.html';
}

function requireAuth(returnTo = window.location.href) {
  const user = getCurrentUser();
  if (user) return true;
  redirectToLogin(returnTo);
  return false;
}

function syncAuthUI() {
  const user = getCurrentUser();

  document.querySelectorAll('[data-auth-guest]').forEach(el => {
    el.style.display = user ? 'none' : '';
  });

  document.querySelectorAll('[data-auth-user]').forEach(el => {
    el.style.display = user ? '' : 'none';
  });

  document.querySelectorAll('[data-auth-name]').forEach(el => {
    el.textContent = user ? (user.name || user.adName || '') : '';
  });
}

function bindAuthLinks() {
  document.querySelectorAll('[data-go-login]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      redirectToLogin();
    });
  });

  document.querySelectorAll('[data-go-register]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      redirectToRegister();
    });
  });
}
function initAuthUI() {
  syncAuthUI();
  bindAuthLinks();
}
document.addEventListener('DOMContentLoaded', initAuthUI);
window.addEventListener('printify-auth-changed', syncAuthUI);