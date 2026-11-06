import { NextResponse } from 'next/server';
import { isAuthenticated } from '../../../lib/auth';
import { trackerRef } from '../../../lib/firestore';
export async function POST(request) {
  if (!isAuthenticated(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { term } = await request.json();
    if (typeof term !== 'string' || !/^1\d{2}[28]$/.test(term)) return NextResponse.json({ error: 'Invalid term' }, { status: 400 });
    await trackerRef().update({ term });
    return NextResponse.json({ success: true, term });
  } catch { return NextResponse.json({ error: 'Failed to update term' }, { status: 500 }); }
}
