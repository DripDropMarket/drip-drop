import { NextRequest, NextResponse } from "next/server";
import { getDB, verifyAuthToken } from "../../helpers";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const decodedToken = await verifyAuthToken(request);
    const userId = decodedToken.uid;
    const { conversationId } = await params;
    
    const db = getDB();
    const conversationRef = db.collection("conversations").doc(conversationId);
    const conversationSnap = await conversationRef.get();
    
    if (!conversationSnap.exists) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }
    
    const conversationData = conversationSnap.data()!;
    
    if (!conversationData.participants.includes(userId)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    
    const messagesRef = db.collection("messages");
    const q = messagesRef.where("conversationId", "==", conversationId);
    const querySnapshot = await q.get();
    
    const messages: any[] = [];
    for (const doc of querySnapshot.docs) {
      const data = doc.data();
      
      let senderFirstName = "";
      const userSnap = await db.collection("users").doc(data.senderId).get();
      if (userSnap.exists) {
        senderFirstName = userSnap.data()!.firstName;
      }
      
      messages.push({
        id: doc.id,
        conversationId: data.conversationId,
        senderId: data.senderId,
        content: data.content,
        imageUrl: data.imageUrl,
        createdAt: {
          seconds: data.createdAt?.seconds || 0,
          nanoseconds: data.createdAt?.nanoseconds || 0,
        },
        read: data.read || false,
        senderFirstName,
        reactions: data.reactions || {},
        replyTo: data.replyTo || undefined,
      });
    }
    
    messages.sort((a, b) => a.createdAt.seconds - b.createdAt.seconds);
    
    const batch = db.batch();
    querySnapshot.docs.forEach((doc) => {
      if (doc.data().senderId !== userId && !doc.data().read) {
        batch.update(doc.ref, { read: true });
      }
    });
    await batch.commit();
    
    return NextResponse.json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    if (error instanceof Error && error.message.includes("authorization")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const decodedToken = await verifyAuthToken(request);
    const senderId = decodedToken.uid;
    const { conversationId } = await params;
    
    const body = await request.json();
    const { content, imageUrl } = body;

    if (!content || !content.trim()) {
      return NextResponse.json({ error: "Message content is required" }, { status: 400 });
    }

    const db = getDB();
    const conversationRef = db.collection("conversations").doc(conversationId);
    const conversationSnap = await conversationRef.get();

    if (!conversationSnap.exists) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    const conversationData = conversationSnap.data()!;

    if (!conversationData.participants.includes(senderId)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const messagesRef = db.collection("messages");
    const docData: any = {
      conversationId,
      senderId,
      content: content.trim(),
      createdAt: new Date(),
      read: false,
    };

    if (imageUrl) {
      docData.imageUrl = imageUrl;
    }

    const docRef = await messagesRef.add(docData);

    const lastMessagePreview = imageUrl ? "[Image]" : content.trim();
    await conversationRef.update({
      lastMessage: lastMessagePreview,
      lastMessageAt: new Date(),
    });

    return NextResponse.json({
      id: docRef.id,
      conversationId,
      senderId,
      content: content.trim(),
      imageUrl,
      createdAt: {
        seconds: Date.now() / 1000,
        nanoseconds: 0,
      },
      read: false,
    }, { status: 201 });
  } catch (error) {
    console.error("Error sending message:", error);
    if (error instanceof Error && error.message.includes("authorization")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
