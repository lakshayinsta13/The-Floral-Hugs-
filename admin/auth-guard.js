// Simple guard for admin pages. If not logged in or session expired, redirect to login page.
// The login is stored in sessionStorage which clears on browser/tab close. We also keep
// a timestamp to enforce a timeout while the page is open.

const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

function clearSession() {
  sessionStorage.removeItem('isAdmin');
  sessionStorage.removeItem('adminEmail');
  sessionStorage.removeItem('loginTimestamp');
}

function checkSession() {
  const isAdmin = sessionStorage.getItem('isAdmin');
  if (isAdmin !== '1') return false;

  const ts = parseInt(sessionStorage.getItem('loginTimestamp') || '0', 10);
  if (!ts) return false;
  if (Date.now() - ts > SESSION_TIMEOUT_MS) {
    // expired
    clearSession();
    return false;
  }
  // still valid - update timestamp to extend session
  sessionStorage.setItem('loginTimestamp', Date.now().toString());
  return true;
}

document.addEventListener('DOMContentLoaded', () => {
  try {
    if (!checkSession()) {
      const next = location.pathname.split('/').pop() || 'admin.html';
      location.href = `login.html?next=${encodeURIComponent(next)}`;
    }
  } catch (err) {
    console.error('Auth guard error', err);
    location.href = 'login.html';
  }
});

// expose logout for pages to call
window.adminLogout = () => {
  clearSession();
  // use relative redirect so it works when opening files directly
  location.href = 'login.html';
};
