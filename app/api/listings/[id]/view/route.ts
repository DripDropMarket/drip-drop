import { NextRequest, NextResponse } from "next/server";
import { getDB } from "@/app/api/helpers";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDB();
    
    const listingRef = db.collection("listings").doc(id);
    const listingSnap = await listingRef.get();
    
    if (!listingSnap.exists) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    const currentData = listingSnap.data()!;
    const currentViewCount = currentData.viewCount || 0;

    await listingRef.update({
      viewCount: currentViewCount + 1
    });

    return NextResponse.json({ 
      success: true,
      viewCount: currentViewCount + 1 
    });
  } catch (error) {
    console.error("Error incrementing view count:", error);
    return NextResponse.json({ error: "Failed to increment view count" }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDB();
    
    const listingRef = db.collection("listings").doc(id);
    const listingSnap = await listingRef.get();
    
    if (!listingSnap.exists) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    const data = listingSnap.data()!;
    return NextResponse.json({ 
      viewCount: data.viewCount || 0,
      saveCount: data.saveCount || 0
    });
  } catch (error) {
    console.error("Error fetching listing stats:", error);
    return NextResponse.json({ error: "Failed to fetch listing stats" }, { status: 500 });
  }
}
