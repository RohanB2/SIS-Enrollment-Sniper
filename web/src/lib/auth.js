import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

const COOKIE = 'sniper_session';
const MAX_AGE = 60 * 60 * 24 * 7;

function secret() {
  if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) throw new Error('SESSION_SECRET must be at least 32 characters');
  return process.env.SESSION_SECRET;
}

export function passwordMatches(candidate) {
  const expected = process.env.MASTER_PASSWORD;
  if (!expected || typeof candidate !== 'string') return false;
  const a = Buffer.from(candidate);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

function signature(payload) { return createHmac('sha256', secret()).update(payload).digest('base64url'); }

export function createSession() {
  const payload = Buffer.from(JSON.stringify({ exp: Date.now() + MAX_AGE * 1000, nonce: randomBytes(16).toString('hex') })).toString('base64url');
  return `${payload}.${signature(payload)}`;
}

export function isAuthenticated(request) {
  const token = request.cookies.get(COOKIE)?.value;
  if (!token) return false;
  const [payload, supplied, extra] = token.split('.');
  if (!payload || !supplied || extra) return false;
  try {
    const expected = Buffer.from(signature(payload));
    const actual = Buffer.from(supplied);
    return expected.length === actual.length && timingSafeEqual(expected, actual) && JSON.parse(Buffer.from(payload, 'base64url').toString()).exp > Date.now();
  } catch { return false; }
}

export function setSessionCookie(response, value, maxAge = MAX_AGE) {
  response.cookies.set(COOKIE, value, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/', maxAge });
  return response;
}
