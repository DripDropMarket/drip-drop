import { NextRequest, NextResponse } from "next/server";
import { getDB, verifyAuthToken } from "../../helpers";
import { UpdateListingInput, ListingType, Condition, Size } from "@/app/lib/types";

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
      id: listingSnap.id,
      title: data.title,
      description: data.description,
      price: data.price || 0,
      type: data.type as ListingType,
      clothingType: data.clothingType,
      condition: data.condition,
      size: data.size,
      userId: data.userId,
      createdAt: data.createdAt,
      imageUrls: data.imageUrls,
      isSold: data.isSold || false,
    });
  } catch (error) {
    console.error("Error fetching listing:", error);
    return NextResponse.json({ error: "Failed to fetch listing" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const decodedToken = await verifyAuthToken(request);
    const verifiedUserId = decodedToken.uid;
    const { id } = await params;
    const db = getDB();
    
    const listingRef = db.collection("listings").doc(id);
    const listingSnap = await listingRef.get();
    
    if (!listingSnap.exists) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }
    
    const listingData = listingSnap.data()!;
    
    if (listingData.userId !== verifiedUserId) {
      return NextResponse.json(
        { error: "You can only edit your own listings" },
        { status: 403 }
      );
    }
    
    const body: UpdateListingInput = await request.json();
    
    const updateData: Record<string, unknown> = {};
    
    if (body.title !== undefined) {
      if (!body.title.trim()) {
        return NextResponse.json({ error: "Title cannot be empty" }, { status: 400 });
      }
      updateData.title = body.title;
    }
    
    if (body.description !== undefined) {
      updateData.description = body.description;
    }
    
    if (body.price !== undefined) {
      if (body.price < 0) {
        return NextResponse.json({ error: "Price cannot be negative" }, { status: 400 });
      }
      updateData.price = body.price;
    }
    
    if (body.type !== undefined) {
      const validTypes: ListingType[] = ["clothes", "textbooks", "tech", "furniture", "tickets", "services", "other"];
      if (!validTypes.includes(body.type)) {
        return NextResponse.json({ error: "Invalid listing type" }, { status: 400 });
      }
      updateData.type = body.type;
    }
    
    if (body.clothingType !== undefined) {
      updateData.clothingType = body.clothingType;
    }

    if (body.condition !== undefined) {
      updateData.condition = body.condition;
    }

    if (body.size !== undefined) {
      updateData.size = body.size;
    }

    if (body.imageUrls !== undefined) {
      updateData.imageUrls = body.imageUrls;
    }

    if (body.isSold !== undefined) {
      updateData.isSold = body.isSold;
    }

    await listingRef.update(updateData);
    
    return NextResponse.json({
      id,
      ...listingData,
      price: listingData.price || 0,
      isSold: listingData.isSold || false,
      ...updateData,
    });
    
  } catch (error) {
    console.error("Error updating listing:", error);
    
    if (error instanceof Error && error.message.includes("authorization")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    return NextResponse.json({ error: "Failed to update listing" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const decodedToken = await verifyAuthToken(request);
    const verifiedUserId = decodedToken.uid;
    const { id } = await params;
    const db = getDB();
    
    const listingRef = db.collection("listings").doc(id);
    const listingSnap = await listingRef.get();
    
    if (!listingSnap.exists) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }
    
    const listingData = listingSnap.data()!;
    
    if (listingData.userId !== verifiedUserId) {
      return NextResponse.json(
        { error: "You can only delete your own listings" },
        { status: 403 }
      );
    }
    
    await listingRef.delete();
    
    return new NextResponse(null, { status: 204 });
    
  } catch (error) {
    console.error("Error deleting listing:", error);
    
    if (error instanceof Error && error.message.includes("authorization")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    return NextResponse.json({ error: "Failed to delete listing" }, { status: 500 });
  }
}
