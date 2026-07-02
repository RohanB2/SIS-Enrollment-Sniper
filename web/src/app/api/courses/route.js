import { NextResponse } from 'next/server';
import { db } from '../../../lib/firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

// We'll store all courses in a single document `data/tracker` to match the previous structure
// so it's a 1-to-1 replacement for the data.json object.
const TRACKER_DOC_REF = doc(db, 'data', 'tracker');

async function getTrackerData() {
  try {
    const docSnap = await getDoc(TRACKER_DOC_REF);
    if (docSnap.exists()) {
      return docSnap.data();
    } else {
      // Default state if document doesn't exist yet
      const defaultState = { term: "1268", courses: [] };
      await setDoc(TRACKER_DOC_REF, defaultState);
      return defaultState;
    }
  } catch (error) {
    console.error("Error fetching from Firestore:", error);
    return { term: "1268", courses: [] };
  }
}

export async function GET() {
  const data = await getTrackerData();
  return NextResponse.json(data);
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { classNumber, title, notes, time, notifyType, notifyTarget } = body;

    if (!classNumber || !notifyType || !notifyTarget) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const data = await getTrackerData();
    
    // Check if course already exists
    const existingIndex = data.courses.findIndex(c => c.classNumber === classNumber);
    if (existingIndex >= 0) {
      return NextResponse.json({ error: 'Course already tracked' }, { status: 409 });
    }

    const newCourse = { classNumber, title: title || '', notes: notes || '', time: time || '', notifyType, notifyTarget };
    data.courses.push(newCourse);
    
    try {
      await updateDoc(TRACKER_DOC_REF, { courses: data.courses });
      return NextResponse.json({ success: true, courses: data.courses });
    } catch (error) {
      console.error("Error writing to Firestore:", error);
      return NextResponse.json({ error: 'Failed to write data' }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const classNumber = searchParams.get('classNumber');
    
    if (!classNumber) {
      return NextResponse.json({ error: 'Missing classNumber parameter' }, { status: 400 });
    }

    const data = await getTrackerData();
    const initialLength = data.courses.length;
    data.courses = data.courses.filter(c => c.classNumber !== classNumber);

    if (data.courses.length === initialLength) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    try {
      await updateDoc(TRACKER_DOC_REF, { courses: data.courses });
      return NextResponse.json({ success: true, courses: data.courses });
    } catch (error) {
      console.error("Error writing to Firestore:", error);
      return NextResponse.json({ error: 'Failed to write data' }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
