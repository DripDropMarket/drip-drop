import { NextRequest, NextResponse } from "next/server";
import { getDB, verifyAuthToken } from "../helpers";

export async function GET(request: NextRequest) {
  try {
    const decodedToken = await verifyAuthToken(request);
    const userId = decodedToken.uid;
    
    const db = getDB();
    const savedRef = db.collection("savedListings");
    const q = savedRef.where("userId", "==", userId);
    const querySnapshot = await q.get();
    
    const savedListings: { listingId: string; savedAt: { seconds: number; nanoseconds: number } }[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      savedListings.push({
        listingId: data.listingId,
        savedAt: {
          seconds: data.savedAt?.seconds || 0,
          nanoseconds: data.savedAt?.nanoseconds || 0,
        },
      });
    });
    
    return NextResponse.json(savedListings);
  } catch (error) {
    console.error("Error fetching saved listings:", error);
    if (error instanceof Error && error.message.includes("authorization")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to fetch saved listings" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const decodedToken = await verifyAuthToken(request);
    const userId = decodedToken.uid;
    
    const body = await request.json();
    const { listingId } = body;
    
    if (!listingId) {
      return NextResponse.json({ error: "Missing listingId" }, { status: 400 });
    }
    
    const db = getDB();
    const savedRef = db.collection("savedListings");
    const listingsRef = db.collection("listings");
    
    const savedDocId = `${userId}_${listingId}`;
    const savedDoc = await savedRef.doc(savedDocId).get();
    const listingRef = listingsRef.doc(listingId);
    const listingSnap = await listingRef.get();
    
    if (savedDoc.exists) {
      await savedRef.doc(savedDocId).delete();
      
      const listingData = listingSnap.data();
      if (listingData) {
        const currentSaveCount = listingData.saveCount || 0;
        await listingRef.update({
          saveCount: Math.max(0, currentSaveCount - 1)
        });
      }
      
      return NextResponse.json({ saved: false });
    }
    
    await savedRef.doc(savedDocId).set({
      listingId,
      userId,
      savedAt: new Date(),
    });
    
    const listingData = listingSnap.data();
    if (listingData) {
      const currentSaveCount = listingData.saveCount || 0;
      await listingRef.update({
        saveCount: currentSaveCount + 1
      });
    }
    
    return NextResponse.json({ saved: true });
  } catch (error) {
    console.error("Error toggling saved listing:", error);
    if (error instanceof Error && error.message.includes("authorization")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to toggle saved listing" }, { status: 500 });
  }
}
