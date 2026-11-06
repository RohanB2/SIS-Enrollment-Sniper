import { getApps, initializeApp, cert, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

export function trackerRef() {
  if (!getApps().length) {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    initializeApp({ credential: raw ? cert(JSON.parse(raw)) : applicationDefault(), projectId: 'sis-course-sniper-bot' });
  }
  return getFirestore().doc('data/tracker');
}

export async function trackerData() {
  const snap = await trackerRef().get();
  return snap.exists ? snap.data() : { term: '1268', courses: [], isActive: false };
}
