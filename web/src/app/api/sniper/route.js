import { NextResponse } from 'next/server';
import { isAuthenticated } from '../../../lib/auth';
import { trackerRef } from '../../../lib/firestore';
export async function POST(request) {
  if (!isAuthenticated(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { isActive } = await request.json();
    if (typeof isActive !== 'boolean') return NextResponse.json({ error: 'Invalid active state' }, { status: 400 });
    await trackerRef().update({ isActive });
    return NextResponse.json({ success: true, isActive });
  } catch { return NextResponse.json({ error: 'Failed to update status' }, { status: 500 }); }
}
