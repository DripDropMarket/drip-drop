import { NextRequest, NextResponse } from "next/server";
import { getDB, verifyAuthToken } from "../../../helpers";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const decodedToken = await verifyAuthToken(request);
    const userId = decodedToken.uid;
    const { conversationId } = await params;

    const body = await request.json();
    const { messageId, emoji, action } = body;

    if (!messageId || !emoji || !action) {
      return NextResponse.json({ error: "Missing required fields: messageId, emoji, action" }, { status: 400 });
    }

    if (action !== "add" && action !== "remove") {
      return NextResponse.json({ error: "Invalid action. Must be 'add' or 'remove'" }, { status: 400 });
    }

    const db = getDB();
    const messageRef = db.doc(`messages/${messageId}`);
    const messageSnap = await messageRef.get();

    if (!messageSnap.exists) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    const messageData = messageSnap.data()!;

    if (messageData.conversationId !== conversationId) {
      return NextResponse.json({ error: "Message does not belong to this conversation" }, { status: 400 });
    }

    const reactions = messageData.reactions || {};
    const emojiReactions = reactions[emoji] || [];

    if (action === "add") {
      if (emojiReactions.includes(userId)) {
        return NextResponse.json({ error: "Already reacted with this emoji" }, { status: 400 });
      }
      await messageRef.update({
        [`reactions.${emoji}`]: [...emojiReactions, userId],
      });
    } else {
      if (!emojiReactions.includes(userId)) {
        return NextResponse.json({ error: "Reaction not found" }, { status: 400 });
      }
      await messageRef.update({
        [`reactions.${emoji}`]: emojiReactions.filter((id: string) => id !== userId),
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error handling reaction:", error);
    if (error instanceof Error && error.message.includes("authorization")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to handle reaction" }, { status: 500 });
  }
}
