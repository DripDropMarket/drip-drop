import { NextRequest, NextResponse } from "next/server";
import { getDB } from "../../../helpers";
import { ListingData } from "@/app/lib/types";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const db = getDB();
    const listingsRef = db.collection("listings");
    const q = listingsRef.where("userId", "==", userId);
    const querySnapshot = await q.get();
    
    const listings: ListingData[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      listings.push({
        id: doc.id,
        title: data.title,
        description: data.description,
        type: data.type as ListingData["type"],
        userId: data.userId,
        createdAt: data.createdAt as ListingData["createdAt"],
      });
    });
    
    // Sort in memory instead of requiring a Firestore index
    listings.sort((a, b) => b.createdAt.seconds - a.createdAt.seconds);
    
    return NextResponse.json(listings);
  } catch (error) {
    console.error("Error fetching user listings:", error);
    return NextResponse.json({ error: "Failed to fetch user listings" }, { status: 500 });
  }
}
