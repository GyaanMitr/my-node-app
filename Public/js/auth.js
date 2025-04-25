// Register a new user
async function register(username, password, isHost) {
  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, isHost }),
  });
  return await res.json();
}

// Login user
async function login(username, password) {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  return await res.json();
}

// Check if user is logged in (on page load)
async function checkAuth() {
  const res = await fetch('/api/auth/me', { credentials: 'include' });
  return await res.json();
}

// Logout
function logout() {
  document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  window.location.href = '/';
}