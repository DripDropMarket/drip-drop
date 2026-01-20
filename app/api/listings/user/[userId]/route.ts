import { NextRequest, NextResponse } from "next/server";
import { getDB } from "../../../helpers";
import { ListingData, TimestampData } from "@/app/lib/types";

function extractTimestamp(createdAt: any): TimestampData {
  if (!createdAt) {
    return { seconds: 0, nanoseconds: 0 };
  }
  
  if (typeof createdAt === 'object') {
    if ('seconds' in createdAt && 'nanoseconds' in createdAt) {
      return {
        seconds: createdAt.seconds,
        nanoseconds: createdAt.nanoseconds,
      };
    }
    if ('_seconds' in createdAt && '_nanoseconds' in createdAt) {
      return {
        seconds: createdAt._seconds,
        nanoseconds: createdAt._nanoseconds,
      };
    }
    if (createdAt instanceof Date || typeof createdAt.getTime === 'function') {
      const time = createdAt.getTime();
      return {
        seconds: Math.floor(time / 1000),
        nanoseconds: 0,
      };
    }
  }
  
  if (typeof createdAt === 'number') {
    return {
      seconds: createdAt,
      nanoseconds: 0,
    };
  }
  
  return { seconds: 0, nanoseconds: 0 };
}

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
        schoolId: data.schoolId,
        isPrivate: data.isPrivate || false,
        createdAt: extractTimestamp(data.createdAt),
        imageUrls: data.imageUrls,
      });
    });
    
    listings.sort((a, b) => b.createdAt.seconds - a.createdAt.seconds);
    
    return NextResponse.json(listings);
  } catch (error) {
    console.error("Error fetching user listings:", error);
    return NextResponse.json({ error: "Failed to fetch user listings" }, { status: 500 });
  }
}
