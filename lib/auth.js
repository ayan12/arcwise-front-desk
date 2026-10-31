// Workstation sign-in: the password (env INBOX_PASSWORD) is exchanged for a signed session cookie.
// The cookie is HttpOnly (scripts can't read it), Secure, SameSite=Strict, and lasts 14 days.
// Changing INBOX_PASSWORD (or SESSION_SECRET) signs every device out.

import { rx } from './workspace.js';

const COOKIE = 'ws_session';
const DAYS = 14;
const MAX_FAILS = 10;         // wrong passwords per connection...
const LOCK_SECONDS = 15 * 60; // ...per 15 minutes

const enc = new TextEncoder();
const b64u = buf => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64u = s => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));

async function key(env) {
  const secret = (env.SESSION_SECRET || '') + '|ws-session|' + (env.INBOX_PASSWORD || '');
  return crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

function same(a, b) {
  a = String(a || ''); b = String(b || '');
  let d = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) d |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return d === 0;
}

export function clientIp(req) {
  return req.headers.get('x-real-ip') || req.headers.get('cf-connecting-ip') ||
    (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'anon';
}

function readCookie(req, name) {
  const m = (req.headers.get('cookie') || '').match(new RegExp('(?:^|;\\s*)' + name + '=([^;]+)'));
  return m ? m[1] : null;
}

export async function makeSession(env) {
  const body = b64u(enc.encode(JSON.stringify({ v: 1, exp: Date.now() + DAYS * 86400000 })));
  const sig = b64u(await crypto.subtle.sign('HMAC', await key(env), enc.encode(body)));
  return `${COOKIE}=${body}.${sig}; Path=/; Max-Age=${DAYS * 86400}; HttpOnly; Secure; SameSite=Strict`;
}
export const clearSession = () => `${COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict`;

async function validSession(req, env) {
  const raw = readCookie(req, COOKIE);
  if (!raw || !raw.includes('.')) return false;
  const [body, sig] = raw.split('.');
  try {
    const ok = await crypto.subtle.verify('HMAC', await key(env), unb64u(sig), enc.encode(body));
    if (!ok) return false;
    const data = JSON.parse(new TextDecoder().decode(unb64u(body)));
    return data.v === 1 && data.exp > Date.now();
  } catch { return false; }
}

// Blocks requests that a different website tries to make on your behalf.
export function sameOrigin(req) {
  const origin = req.headers.get('origin');
  if (!origin) return req.method === 'GET';
  try { return new URL(origin).host === (req.headers.get('host') || new URL(req.url).host); } catch { return false; }
}

// Returns null when allowed, or an error name.
export async function checkKey(req, env) {
  if (!env.INBOX_PASSWORD) return 'no_password_set';
  if (!sameOrigin(req)) return 'bad_origin';
  if (await validSession(req, env)) return null;
  return 'signed_out';
}

// Password check with lockout after repeated failures. Returns { ok, error, retryAfter }.
export async function tryPassword(req, env, password) {
  if (!env.INBOX_PASSWORD) return { ok: false, error: 'no_password_set' };
  const failKey = `fd:fail:${clientIp(req)}`;
  let fails = 0;
  try { [fails] = await rx(env, [['GET', failKey]]); fails = Number(fails) || 0; } catch {}
  if (fails >= MAX_FAILS) return { ok: false, error: 'locked', retryAfter: LOCK_SECONDS };
  if (same(password, env.INBOX_PASSWORD)) {
    try { await rx(env, [['DEL', failKey]]); } catch {}
    return { ok: true };
  }
  try { await rx(env, [['INCR', failKey], ['EXPIRE', failKey, String(LOCK_SECONDS)]]); } catch {}
  await new Promise(r => setTimeout(r, 700));
  return { ok: false, error: fails + 1 >= MAX_FAILS ? 'locked' : 'wrong_password' };
}
