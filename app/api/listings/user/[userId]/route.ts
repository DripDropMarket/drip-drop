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
        price: data.price || 0,
        type: data.type,
        clothingType: data.clothingType,
        userId: data.userId,
        createdAt: {
          seconds: data.createdAt?.seconds || 0,
          nanoseconds: data.createdAt?.nanoseconds || 0,
        },
        imageUrls: data.imageUrls,
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
