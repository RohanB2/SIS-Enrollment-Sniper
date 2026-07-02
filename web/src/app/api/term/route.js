import { NextResponse } from 'next/server';
import { db } from '../../../firebase/config';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

const TRACKER_DOC_REF = doc(db, 'data', 'tracker');

export async function POST(request) {
  try {
    const { term } = await request.json();
    
    if (!term || typeof term !== 'string') {
      return NextResponse.json({ error: 'Invalid term' }, { status: 400 });
    }

    try {
      await updateDoc(TRACKER_DOC_REF, { term });
      return NextResponse.json({ success: true, term });
    } catch (error) {
      console.error("Error writing to Firestore:", error);
      return NextResponse.json({ error: 'Failed to update term' }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
