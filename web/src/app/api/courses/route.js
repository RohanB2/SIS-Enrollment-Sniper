import { NextResponse } from 'next/server';
import { isAuthenticated } from '../../../lib/auth';
import { trackerRef, trackerData } from '../../../lib/firestore';
const unauthorized = () => NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
function validDestination(type, target) {
  if (typeof target !== 'string' || target.length > 2048) return false;
  if (type === 'email') return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(target);
  if (type !== 'discord') return false;
  try {
    const url = new URL(target);
    return url.protocol === 'https:' && ['discord.com', 'discordapp.com'].includes(url.hostname) && url.pathname.startsWith('/api/webhooks/');
  } catch { return false; }
}
export async function GET(request) {
  if (!isAuthenticated(request)) return unauthorized();
  try { return NextResponse.json(await trackerData()); }
  catch { return NextResponse.json({ error: 'Failed to load tracker' }, { status: 500 }); }
}
export async function POST(request) {
  if (!isAuthenticated(request)) return unauthorized();
  try {
    const { classNumber, title, notes, time, notifyType, notifyTarget } = await request.json();
    if (typeof classNumber !== 'string' || !/^\d{5}$/.test(classNumber) || !validDestination(notifyType, notifyTarget?.trim()))
      return NextResponse.json({ error: 'Enter a five-digit class number and notification destination' }, { status: 400 });
    const course = { classNumber, title: String(title || ''), notes: String(notes || ''), time: String(time || ''), notifyType, notifyTarget: notifyTarget.trim() };
    const ref = trackerRef();
    const courses = await ref.firestore.runTransaction(async tx => {
      const snap = await tx.get(ref);
      const data = snap.exists ? snap.data() : { term: '1268', courses: [], isActive: false };
      if (data.courses.some(c => c.classNumber === classNumber)) return null;
      const updated = [...data.courses, course];
      tx.set(ref, { ...data, courses: updated });
      return updated;
    });
    if (!courses) return NextResponse.json({ error: 'Course already tracked' }, { status: 409 });
    return NextResponse.json({ success: true, courses });
  } catch { return NextResponse.json({ error: 'Failed to add course' }, { status: 500 }); }
}
export async function DELETE(request) {
  if (!isAuthenticated(request)) return unauthorized();
  const classNumber = new URL(request.url).searchParams.get('classNumber');
  if (!classNumber) return NextResponse.json({ error: 'Missing class number' }, { status: 400 });
  try {
    const ref = trackerRef();
    const courses = await ref.firestore.runTransaction(async tx => {
      const snap = await tx.get(ref);
      const data = snap.data();
      if (!data?.courses?.some(c => c.classNumber === classNumber)) return null;
      const updated = data.courses.filter(c => c.classNumber !== classNumber);
      tx.update(ref, { courses: updated });
      return updated;
    });
    if (!courses) return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    return NextResponse.json({ success: true, courses });
  } catch { return NextResponse.json({ error: 'Failed to remove course' }, { status: 500 }); }
}
