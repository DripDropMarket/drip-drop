"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useAuth } from "@/app/lib/auth-context";
import { getConversation, getMessages, sendMessage } from "@/app/views/messaging";
import { ConversationData, MessageData } from "@/app/lib/types";
import { uploadImage } from "@/app/lib/image-upload";

export default function ConversationPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const conversationId = params.id as string;
  const redirect = searchParams.get("redirect") || `/messages/${conversationId}`;

  const [conversation, setConversation] = useState<ConversationData | null>(null);
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [loadingConversation, setLoadingConversation] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push(`/login?redirect=${encodeURIComponent(redirect)}`);
    }
  }, [user, loading, router, redirect]);

  useEffect(() => {
    async function fetchConversation() {
      try {
        const convData = await getConversation(conversationId);
        setConversation(convData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load conversation");
      }
    }
    fetchConversation();
  }, [conversationId]);

  useEffect(() => {
    async function fetchMessages() {
      try {
        const msgs = await getMessages(conversationId);
        setMessages(msgs);
      } catch (err) {
        console.error("Failed to load messages:", err);
      } finally {
        setLoadingConversation(false);
      }
    }
    fetchMessages();

    const interval = setInterval(async () => {
      try {
        const msgs = await getMessages(conversationId);
        setMessages(msgs);
      } catch (err) {
        console.error("Failed to refresh messages:", err);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [conversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() && !selectedImage || sending) return;

    setSending(true);
    try {
      let imageUrl: string | undefined;

      if (selectedImage) {
        setUploadingImage(true);
        const result = await uploadImage(selectedImage, "message", conversationId);
        imageUrl = result.url;
        setUploadingImage(false);
      }

      const sentMessage = await sendMessage(conversationId, newMessage, imageUrl);
      setMessages([...messages, sentMessage]);
      setNewMessage("");
      setSelectedImage(null);
      setImagePreview(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setSending(false);
      setUploadingImage(false);
    }
  }

  if (loading || loadingConversation) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (error || !conversation) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error || "Conversation not found"}</p>
          <Link
            href="/messages"
            className="inline-flex h-9 items-center justify-center rounded-full bg-primary px-4 text-sm font-medium text-white"
          >
            Back to Messages
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      <header className="sticky top-0 z-50 flex-none border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Link href="/messages" className="p-2 -ml-2 text-muted-foreground hover:text-primary">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            {conversation.otherUser?.profilePicture ? (
              <img
                src={conversation.otherUser.profilePicture}
                alt={`${conversation.otherUser.firstName} ${conversation.otherUser.lastName}`}
                className="h-8 w-8 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                <svg className="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            )}
            <div>
              <p className="font-semibold text-sm">
                {conversation.otherUser
                  ? `${conversation.otherUser.firstName} ${conversation.otherUser.lastName}`
                  : "Unknown User"}
              </p>
              <Link
                href={`/listings/${conversation.listingId}`}
                className="text-xs text-primary hover:underline truncate max-w-[200px] block"
              >
                re: {conversation.listingTitle}
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-6 pb-24">
        <div className="container mx-auto max-w-2xl space-y-4">
          {messages.map((message) => {
            const isOwnMessage = message.senderId === user.uid;
            return (
              <div
                key={message.id}
                className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                    isOwnMessage
                      ? "bg-primary text-white"
                      : "bg-muted"
                  }`}
                >
                  {!isOwnMessage && (
                    <p className="mb-1 text-xs font-semibold opacity-70">
                      {message.senderFirstName}
                    </p>
                  )}
                  <p className="text-sm whitespace-pre-wrap break-words">
                    {message.content}
                  </p>
                  {message.imageUrl && (
                    <img
                      src={message.imageUrl}
                      alt="Attached image"
                      className="mt-2 max-w-full rounded-lg border border-white/20"
                    />
                  )}
                  <p className={`mt-1 text-xs ${isOwnMessage ? "text-white/70" : "text-muted-foreground"}`}>
                    {new Date(message.createdAt.seconds * 1000).toLocaleTimeString([], {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </main>

      <footer className="flex-none border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pb-24 lg:pb-4">
        <div className="container mx-auto max-w-2xl px-4 py-4">
          {(imagePreview || selectedImage) && (
            <div className="mb-3 flex items-center gap-2 rounded-lg bg-muted p-2">
              <div className="relative h-16 w-16 overflow-hidden rounded-md">
                <img
                  src={imagePreview || ""}
                  alt="Selected"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex-1">
                <p className="text-sm truncate">{selectedImage?.name}</p>
                {uploadingImage && (
                  <p className="text-xs text-primary">Uploading...</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedImage(null);
                  setImagePreview(null);
                }}
                className="p-1 text-muted-foreground hover:text-red-500"
                disabled={uploadingImage}
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          <form onSubmit={handleSendMessage} className="flex gap-3">
            <label className="cursor-pointer inline-flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-muted/80 hover:text-primary">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setSelectedImage(file);
                    setImagePreview(URL.createObjectURL(file));
                  }
                }}
                className="hidden"
                disabled={uploadingImage}
              />
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </label>
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              disabled={sending || uploadingImage}
              className="flex-1 rounded-full border border-input bg-background px-4 py-2.5 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              type="submit"
              disabled={(!newMessage.trim() && !selectedImage) || sending || uploadingImage}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </form>
        </div>
      </footer>
    </div>
  );
}
