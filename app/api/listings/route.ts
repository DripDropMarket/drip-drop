import { NextRequest, NextResponse } from "next/server";
import { getDB, verifyAuthToken } from "../../../api/helpers";
import { ListingType, CreateListingInput, ListingData } from "@/lib/types";

export async function GET() {
  try {
    const db = getDB();
    const listingsRef = db.collection("listings");
    const q = listingsRef.orderBy("createdAt", "desc");
    const querySnapshot = await q.get();
    
    const listings: ListingData[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      listings.push({
        id: doc.id,
        title: data.title,
        description: data.description,
        type: data.type,
        userId: data.userId,
        createdAt: {
          seconds: data.createdAt?.seconds || 0,
          nanoseconds: data.createdAt?.nanoseconds || 0,
        },
      });
    });
    
    return NextResponse.json(listings);
  } catch (error) {
    console.error("Error fetching listings:", error);
    return NextResponse.json({ error: "Failed to fetch listings" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const decodedToken = await verifyAuthToken(request);
    const userId = decodedToken.uid;
    
    const body: CreateListingInput = await request.json();
    
    if (!body.title || !body.description || !body.type) {
      return NextResponse.json(
        { error: "Missing required fields: title, description, type" },
        { status: 400 }
      );
    }
    
    const validTypes: ListingType[] = ["clothes", "textbooks", "tech", "furniture", "tickets", "services", "other"];
    if (!validTypes.includes(body.type)) {
      return NextResponse.json(
        { error: "Invalid listing type" },
        { status: 400 }
      );
    }
    
    const db = getDB();
    const listingsRef = db.collection("listings");
    const docRef = await listingsRef.add({
      title: body.title,
      description: body.description,
      type: body.type,
      userId: userId,
      createdAt: new Date(),
    });
    
    return NextResponse.json({
      id: docRef.id,
      title: body.title,
      description: body.description,
      type: body.type,
      userId: userId,
      createdAt: {
        seconds: Date.now() / 1000,
        nanoseconds: 0,
      },
    }, { status: 201 });
    
  } catch (error) {
    console.error("Error creating listing:", error);
    
    if (error instanceof Error && error.message.includes("authorization")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    return NextResponse.json({ error: "Failed to create listing" }, { status: 500 });
  }
}
