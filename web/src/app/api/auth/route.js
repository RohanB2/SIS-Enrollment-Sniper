import { NextResponse } from 'next/server';
import { createSession, isAuthenticated, passwordMatches, setSessionCookie } from '../../../lib/auth';
export async function GET(request) { return NextResponse.json({ authenticated: isAuthenticated(request) }); }
export async function POST(request) {
  try {
    const { password } = await request.json();
    if (!passwordMatches(password)) return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    return setSessionCookie(NextResponse.json({ success: true }), createSession());
  } catch { return NextResponse.json({ error: 'Invalid request or server configuration' }, { status: 400 }); }
}
export async function DELETE() { return setSessionCookie(NextResponse.json({ success: true }), '', 0); }
