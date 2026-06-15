const API_BASE = '';
const AUTH_TOKEN_KEY = 'cowa_token';
const AUTH_USER_KEY = 'cowa_user';

const API_ROUTES = {
  users: '/users',
  corredores: '/corredores',
  voltas: '/voltas',
  ranking: '/corredores/ranking',
};

function sanitizeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getAuthToken() {
  return sessionStorage.getItem(AUTH_TOKEN_KEY);
}

function getAuthUser() {
  const raw = sessionStorage.getItem(AUTH_USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    sessionStorage.removeItem(AUTH_USER_KEY);
    return null;
  }
}

function setAuthSession(token, user) {
  if (!token || !user) return;
  sessionStorage.setItem(AUTH_TOKEN_KEY, token);
  sessionStorage.setItem(AUTH_USER_KEY, JSON.stringify({ id: user.id, nome: user.nome, email: user.email }));
}

function clearAuthSession() {
  sessionStorage.removeItem(AUTH_TOKEN_KEY);
  sessionStorage.removeItem(AUTH_USER_KEY);
}

async function apiFetch(url, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (options.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const token = getAuthToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url.startsWith('/') ? url : API_BASE + url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    clearAuthSession();
  }

  return response;
}

function requireAuth(redirect = 'login.html') {
  if (!getAuthToken()) {
    window.location.href = redirect;
    return false;
  }
  return true;
}

function initHamburger() {
  const hamb = document.getElementById('hamburger');
  const menu = document.getElementById('menu');
  if (!hamb || !menu) return;
  hamb.addEventListener('click', () => {
    const open = hamb.classList.toggle('is-open');
    hamb.setAttribute('aria-expanded', String(open));
    menu.style.display = open ? 'block' : 'none';
  });
}

document.addEventListener('DOMContentLoaded', initHamburger);
