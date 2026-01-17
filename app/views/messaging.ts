import { authenticatedFetch } from "./helpers";
import { ConversationData, MessageData } from "@/app/lib/types";

export async function getConversations(): Promise<ConversationData[]> {
  const response = await authenticatedFetch("/api/conversations", {
    method: "GET",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch conversations: ${response.statusText}`);
  }

  return response.json();
}

export async function getConversation(id: string): Promise<ConversationData> {
  const response = await authenticatedFetch(`/api/conversations/${id}`, {
    method: "GET",
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("Conversation not found");
    }
    throw new Error(`Failed to fetch conversation: ${response.statusText}`);
  }

  return response.json();
}

export async function createConversation(
  listingId: string,
  recipientId: string,
  initialMessage: string
): Promise<{ conversationId: string }> {
  const response = await authenticatedFetch("/api/conversations", {
    method: "POST",
    body: JSON.stringify({ listingId, recipientId, initialMessage }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create conversation");
  }

  return response.json();
}

export async function getMessages(conversationId: string): Promise<MessageData[]> {
  const response = await authenticatedFetch(`/api/messages/${conversationId}`, {
    method: "GET",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch messages: ${response.statusText}`);
  }

  return response.json();
}

export async function sendMessage(
  conversationId: string,
  content: string
): Promise<MessageData> {
  const response = await authenticatedFetch(`/api/messages/${conversationId}`, {
    method: "POST",
    body: JSON.stringify({ content }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to send message");
  }

  return response.json();
}
