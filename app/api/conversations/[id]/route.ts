import { NextRequest, NextResponse } from "next/server";
import { getDB, verifyAuthToken } from "../../helpers";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const decodedToken = await verifyAuthToken(request);
    const userId = decodedToken.uid;
    const { id } = await params;
    
    const db = getDB();
    const conversationRef = db.collection("conversations").doc(id);
    const conversationSnap = await conversationRef.get();
    
    if (!conversationSnap.exists) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }
    
    const data = conversationSnap.data()!;
    
    if (!data.participants.includes(userId)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    
    const otherUserId = data.participants.find((id: string) => id !== userId);
    let otherUser = null;
    
    if (otherUserId) {
      const userSnap = await db.collection("users").doc(otherUserId).get();
      if (userSnap.exists) {
        const userData = userSnap.data()!;
        otherUser = {
          uid: otherUserId,
          firstName: userData.firstName,
          lastName: userData.lastName,
          profilePicture: userData.profilePicture,
        };
      }
    }
    
    let listingTitle = "Unknown Listing";
    const listingSnap = await db.collection("listings").doc(data.listingId).get();
    if (listingSnap.exists) {
      listingTitle = listingSnap.data()!.title;
    }
    
    return NextResponse.json({
      id: conversationSnap.id,
      participants: data.participants,
      listingId: data.listingId,
      listingTitle,
      otherUser,
      lastMessage: data.lastMessage || "",
      lastMessageAt: {
        seconds: data.lastMessageAt?.seconds || 0,
        nanoseconds: data.lastMessageAt?.nanoseconds || 0,
      },
    });
  } catch (error) {
    console.error("Error fetching conversation:", error);
    if (error instanceof Error && error.message.includes("authorization")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to fetch conversation" }, { status: 500 });
  }
}
