// Simple login using your Supabase REST table 'admins'
// WARNING: This is a minimal client-side approach. For production use Supabase Auth or a backend auth endpoint.

const SUPABASE_URL = "https://muciyuapxwklchdvkimt.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11Y2l5dWFweHdrbGNoZHZraW10Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5NDcxNTEsImV4cCI6MjA4MTUyMzE1MX0.uh0UWRzpfqzUAB_xKnny-Zp_ncHevH10w4vLDNDEEDU";

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('loginForm');
  const msg = document.getElementById('msg');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    msg.textContent = '';
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    if (!email || !password) {
      msg.textContent = 'Enter email and password';
      return;
    }

    try {
      // Query the 'admin_accounts' table as provided in your schema
      const res = await fetch(`${SUPABASE_URL}/rest/v1/admin_accounts?select=*&email=eq.${encodeURIComponent(email)}`, {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        }
      });

      if (!res.ok) {
        msg.textContent = 'Login request failed';
        return;
      }

      const data = await res.json();
      if (!data || data.length === 0) {
        msg.textContent = 'No user found';
        return;
      }

      const user = data[0];

      // NOTE: This compares plaintext passwords. If your DB stores hashed passwords you must verify on server.
      if (user.password === password) {
        // Mark session (short-lived in sessionStorage)
        sessionStorage.setItem('isAdmin', '1');
        sessionStorage.setItem('adminEmail', email);
        sessionStorage.setItem('loginTimestamp', Date.now().toString());

        // Redirect to original destination if provided (relative path to work in any folder)
        const params = new URLSearchParams(location.search);
        // everything is relative – avoid leading slash so it works from file:// or any folder
        const next = params.get('next') || 'admin.html';
        location.href = next;
      } else {
        msg.textContent = 'Incorrect password';
      }

    } catch (err) {
      console.error(err);
      msg.textContent = 'An error occurred';
    }
  });
});
