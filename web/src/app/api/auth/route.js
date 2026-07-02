import { NextResponse } from 'next/server';

// In a real app, use environment variables, but for simplicity here we hardcode or use env.
const MASTER_PASSWORD = process.env.MASTER_PASSWORD || 'sniper123';

export async function POST(request) {
  try {
    const { password } = await request.json();
    if (password === MASTER_PASSWORD) {
      // In a real app, issue a JWT or session cookie. Here we'll just return a success signal.
      return NextResponse.json({ success: true, token: 'authenticated' }, { status: 200 });
    } else {
      return NextResponse.json({ success: false, message: 'Invalid password' }, { status: 401 });
    }
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Bad request' }, { status: 400 });
  }
}
