import { NextResponse } from 'next/server';
import { db } from '../../../firebase/config';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

const TRACKER_DOC_REF = doc(db, 'data', 'tracker');

export async function POST(request) {
  try {
    const { isActive } = await request.json();
    
    if (typeof isActive !== 'boolean') {
      return NextResponse.json({ error: 'Invalid active state' }, { status: 400 });
    }

    try {
      await updateDoc(TRACKER_DOC_REF, { isActive });
      return NextResponse.json({ success: true, isActive });
    } catch (error) {
      console.error("Error writing to Firestore:", error);
      return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
