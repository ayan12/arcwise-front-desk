// Password check shared by the inbox and the dashboard (env INBOX_PASSWORD).
function same(a, b) {
  a = String(a || ''); b = String(b || '');
  let d = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) d |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return d === 0;
}

// Returns null when allowed, or an error name.
export async function checkKey(req, env) {
  if (!env.INBOX_PASSWORD) return 'no_password_set';
  if (!same(req.headers.get('x-inbox-key'), env.INBOX_PASSWORD)) {
    await new Promise(r => setTimeout(r, 600));
    return 'wrong_password';
  }
  return null;
}
