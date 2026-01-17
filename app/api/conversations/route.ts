import { NextRequest, NextResponse } from "next/server";
import { getDB, verifyAuthToken } from "../helpers";

export async function GET(request: NextRequest) {
  try {
    const decodedToken = await verifyAuthToken(request);
    const userId = decodedToken.uid;
    
    const db = getDB();
    const conversationsRef = db.collection("conversations");
    const q = conversationsRef.where("participants", "array-contains", userId);
    const querySnapshot = await q.get();
    
    const conversations: any[] = [];
    for (const doc of querySnapshot.docs) {
      const data = doc.data();
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
      
      conversations.push({
        id: doc.id,
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
    }
    
    conversations.sort((a, b) => b.lastMessageAt.seconds - a.lastMessageAt.seconds);
    
    return NextResponse.json(conversations);
  } catch (error) {
    console.error("Error fetching conversations:", error);
    if (error instanceof Error && error.message.includes("authorization")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to fetch conversations" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const decodedToken = await verifyAuthToken(request);
    const senderId = decodedToken.uid;
    
    const body = await request.json();
    const { listingId, recipientId, initialMessage } = body;
    
    if (!listingId || !recipientId || !initialMessage) {
      return NextResponse.json(
        { error: "Missing required fields: listingId, recipientId, initialMessage" },
        { status: 400 }
      );
    }
    
    if (senderId === recipientId) {
      return NextResponse.json(
        { error: "Cannot message yourself" },
        { status: 400 }
      );
    }
    
    const db = getDB();
    
    let conversationId: string | null = null;
    const conversationsRef = db.collection("conversations");
    
    const q = conversationsRef.where("participants", "array-contains", senderId);
    const querySnapshot = await q.get();
    
    for (const doc of querySnapshot.docs) {
      const data = doc.data();
      if (data.listingId === listingId && data.participants.includes(recipientId)) {
        conversationId = doc.id;
        break;
      }
    }
    
    if (!conversationId) {
      const newDocRef = await conversationsRef.add({
        participants: [senderId, recipientId],
        listingId,
        lastMessage: initialMessage,
        lastMessageAt: new Date(),
        createdAt: new Date(),
      });
      conversationId = newDocRef.id;
    }
    
    const messagesRef = db.collection("messages");
    await messagesRef.add({
      conversationId,
      senderId,
      content: initialMessage,
      createdAt: new Date(),
      read: false,
    });
    
    return NextResponse.json({ conversationId }, { status: 201 });
  } catch (error) {
    console.error("Error creating conversation:", error);
    if (error instanceof Error && error.message.includes("authorization")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to create conversation" }, { status: 500 });
  }
}
