"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useAuth } from "@/app/lib/auth-context";
import { useMessaging } from "@/app/lib/messaging-context";
import { getFirebaseDb } from "@/app/lib/firebase-runtime";
import { doc, onSnapshot, collection, query, where, orderBy, getDoc, updateDoc, serverTimestamp, addDoc, limit, startAfter, getDocs } from "firebase/firestore";
import { ConversationData, MessageData, formatTime } from "@/app/lib/types";
import { uploadImage } from "@/app/lib/image-upload";

const COMMON_EMOJIS = ["👍", "❤️", "😂", "😮", "😢"];

export default function ConversationPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { markAsRead, addReaction, removeReaction } = useMessaging();
  const conversationId = params.id as string;
  const redirect = searchParams.get("redirect") || `/messages/${conversationId}`;

  const [conversation, setConversation] = useState<ConversationData | null>(null);
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [allMessages, setAllMessages] = useState<MessageData[]>([]);
  const [loadingConversation, setLoadingConversation] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<MessageData | null>(null);
  const [sendingMessageIds, setSendingMessageIds] = useState<Set<string>>(new Set());
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasOlderMessages, setHasOlderMessages] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const MESSAGE_LIMIT = 50;

  useEffect(() => {
    if (!loading && !user) {
      router.replace(`/login?redirect=${encodeURIComponent(redirect)}`);
    }
  }, [user, loading, router, redirect]);

  useEffect(() => {
    if (!conversationId || !user) return;

    const db = getFirebaseDb();
    const conversationRef = doc(db, "conversations", conversationId);

    const unsubConversation = onSnapshot(conversationRef, async (snap) => {
      if (!snap.exists()) {
        setError("Conversation not found");
        setLoadingConversation(false);
        return;
      }

      const data = snap.data();
      const otherUserId = data.participants.find((id: string) => id !== user.uid);

      let otherUser = null;
      if (otherUserId) {
        const userSnap = await getDoc(doc(db, "users", otherUserId));
        if (userSnap.exists()) {
          const userData = userSnap.data();
          otherUser = {
            uid: otherUserId,
            firstName: userData.firstName,
            lastName: userData.lastName,
            profilePicture: userData.profilePicture,
          };
        }
      }

      let listingTitle = "Unknown Listing";
      const listingSnap = await getDoc(doc(db, "listings", data.listingId));
      if (listingSnap.exists()) {
        listingTitle = listingSnap.data()!.title;
      }

      setConversation({
        id: snap.id,
        participants: data.participants,
        listingId: data.listingId,
        listingTitle,
        otherUser: otherUser || undefined,
        lastMessage: data.lastMessage || "",
        lastMessageAt: {
          seconds: data.lastMessageAt?.seconds || 0,
          nanoseconds: data.lastMessageAt?.nanoseconds || 0,
        },
        unreadCount: data.unreadCount?.[user.uid] || 0,
      });

      if (data.unreadCount?.[user.uid] > 0) {
        markAsRead(conversationId);
      }
    });

    async function loadMessages(initial = true) {
      const db = getFirebaseDb();
      const messagesRef = collection(db, "messages");
      
      let q;
      if (initial) {
        q = query(
          messagesRef,
          where("conversationId", "==", conversationId),
          orderBy("createdAt", "desc"),
          limit(MESSAGE_LIMIT)
        );
      } else {
        const lastMessage = allMessages[0];
        const lastTimestamp = lastMessage?.createdAt?.seconds;
        if (!lastTimestamp) return;
        
        q = query(
          messagesRef,
          where("conversationId", "==", conversationId),
          orderBy("createdAt", "desc"),
          startAfter(lastTimestamp),
          limit(MESSAGE_LIMIT)
        );
      }

      const snapshot = await getDocs(q);
      const msgs: MessageData[] = [];

      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();

        let senderFirstName = "";
        const userSnap = await getDoc(doc(db, "users", data.senderId));
        if (userSnap.exists()) {
          senderFirstName = userSnap.data()!.firstName;
        }

        msgs.push({
          id: docSnap.id,
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

      const sortedMsgs = msgs.reverse();
      
      if (initial) {
        setMessages(sortedMsgs);
        setAllMessages(sortedMsgs);
        setHasOlderMessages(msgs.length === MESSAGE_LIMIT);
        setLoadingConversation(false);
      } else {
        setAllMessages((prev) => [...sortedMsgs, ...prev]);
      }
    }

    loadMessages(true);

    const messagesRef = collection(db, "messages");
    const liveQ = query(
      messagesRef,
      where("conversationId", "==", conversationId),
      orderBy("createdAt", "asc")
    );

    const unsubMessages = onSnapshot(liveQ, async (snapshot) => {
      const liveMsgs: MessageData[] = [];

      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();

        let senderFirstName = "";
        const userSnap = await getDoc(doc(db, "users", data.senderId));
        if (userSnap.exists()) {
          senderFirstName = userSnap.data()!.firstName;
        }

        liveMsgs.push({
          id: docSnap.id,
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

      setMessages(liveMsgs);
    });

    return () => {
      unsubConversation();
      unsubMessages();
    };
  }, [conversationId, user, markAsRead]);

  const loadOlderMessages = useCallback(async () => {
    if (loadingOlder || !hasOlderMessages) return;

    setLoadingOlder(true);
    const db = getFirebaseDb();
    const messagesRef = collection(db, "messages");

    const lastMessage = allMessages[0];
    if (!lastMessage) {
      setLoadingOlder(false);
      return;
    }

    const lastTimestamp = lastMessage.createdAt.seconds;
    if (!lastTimestamp) {
      setLoadingOlder(false);
      return;
    }

    const q = query(
      messagesRef,
      where("conversationId", "==", conversationId),
      orderBy("createdAt", "desc"),
      startAfter(lastTimestamp),
      limit(MESSAGE_LIMIT)
    );

    try {
      const snapshot = await getDocs(q);
      const msgs: MessageData[] = [];

      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        let senderFirstName = "";
        const userSnap = await getDoc(doc(db, "users", data.senderId));
        if (userSnap.exists()) {
          senderFirstName = userSnap.data()!.firstName;
        }

        msgs.push({
          id: docSnap.id,
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

      const sortedMsgs = msgs.reverse();
      setAllMessages((prev: MessageData[]) => [...sortedMsgs, ...prev]);
      setHasOlderMessages(msgs.length === MESSAGE_LIMIT);
    } catch (err) {
      console.error("Failed to load older messages:", err);
    } finally {
      setLoadingOlder(false);
    }
  }, [loadingOlder, hasOlderMessages, allMessages, conversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!sending && inputRef.current) {
      inputRef.current.focus();
    }
  }, [sending, messages]);

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() && !selectedImage || sending) return;

    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const content = newMessage.trim();
    const replyData = replyingTo;

    const optimisticMessage: MessageData & { _sending?: boolean } = {
      id: tempId,
      conversationId,
      senderId: user!.uid,
      content,
      imageUrl: undefined,
      createdAt: {
        seconds: Math.floor(Date.now() / 1000),
        nanoseconds: 0,
      },
      read: true,
      senderFirstName: user!.displayName?.split(" ")[0] || "You",
      reactions: {},
      replyTo: replyData ? {
        messageId: replyData.id,
        senderId: replyData.senderId,
        content: replyData.content,
        senderFirstName: replyData.senderFirstName,
      } : undefined,
      _sending: true,
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setSendingMessageIds((prev) => new Set(prev).add(tempId));
    setNewMessage("");
    setSelectedImage(null);
    setImagePreview(null);
    setReplyingTo(null);

    try {
      let imageUrl: string | undefined;

      if (selectedImage) {
        setUploadingImage(true);
        const result = await uploadImage(selectedImage, "message", conversationId);
        imageUrl = result.url;
        setUploadingImage(false);
      }

      const db = getFirebaseDb();
      const messagesRef = collection(db, "messages");
      const conversationRef = doc(db, "conversations", conversationId);
      const conversationSnap = await getDoc(conversationRef);
      const conversationData = conversationSnap.data()!;

      const otherUserId = conversationData.participants.find((id: string) => id !== user!.uid);

      const messageData: any = {
        conversationId,
        senderId: user!.uid,
        content,
        createdAt: serverTimestamp(),
        read: false,
        reactions: {},
      };

      if (replyData) {
        messageData.replyTo = {
          messageId: replyData.id,
          senderId: replyData.senderId,
          content: replyData.content,
          senderFirstName: replyData.senderFirstName,
        };
      }

      if (imageUrl) {
        messageData.imageUrl = imageUrl;
      }

      await addDoc(messagesRef, messageData);

      const lastMessagePreview = imageUrl ? "[Image]" : content;
      await updateDoc(conversationRef, {
        lastMessage: lastMessagePreview,
        lastMessageAt: serverTimestamp(),
        [`unreadCount.${otherUserId}`]: (conversationData.unreadCount?.[otherUserId] || 0) + 1,
      });

      setSendingMessageIds((prev) => {
        const next = new Set(prev);
        next.delete(tempId);
        return next;
      });
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setError(err instanceof Error ? err.message : "Failed to send message");
      setSendingMessageIds((prev) => {
        const next = new Set(prev);
        next.delete(tempId);
        return next;
      });
    } finally {
      setSending(false);
      setUploadingImage(false);
    }
  }

  const handleEmojiClick = async (messageId: string, emoji: string, reactions: Record<string, string[]>) => {
    const userReactions = reactions[emoji] || [];
    const isAdding = !userReactions.includes(user!.uid);

    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id !== messageId) return msg;
        const currentReactions = msg.reactions || {};
        const emojiUsers = currentReactions[emoji] || [];
        let newEmojiUsers;
        if (isAdding) {
          newEmojiUsers = [...emojiUsers, user!.uid];
        } else {
          newEmojiUsers = emojiUsers.filter((id) => id !== user!.uid);
        }
        return {
          ...msg,
          reactions: {
            ...currentReactions,
            [emoji]: newEmojiUsers,
          },
        };
      })
    );

    if (isAdding) {
      addReaction(messageId, emoji);
    } else {
      removeReaction(messageId, emoji);
    }
    setShowEmojiPicker(null);
  };

  const openLightbox = (imageUrl: string) => {
    setLightboxImage(imageUrl);
    setShowLightbox(true);
  };

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

  const groupedMessages = messages.reduce((groups, message, index) => {
    const prevMessage = messages[index - 1];
    const isSameSender = prevMessage && prevMessage.senderId === message.senderId;
    const isWithinMinute = prevMessage && 
      (message.createdAt.seconds - prevMessage.createdAt.seconds) < 60;

    if (isSameSender && isWithinMinute) {
      groups[groups.length - 1].messages.push(message);
    } else {
      groups.push({
        senderId: message.senderId,
        senderFirstName: message.senderFirstName,
        messages: [message],
        showTimestamp: true,
      });
    }
    return groups;
  }, [] as Array<{
    senderId: string;
    senderFirstName: string;
    messages: MessageData[];
    showTimestamp: boolean;
  }>);

  return (
    <div className="flex h-screen flex-col bg-background">
      {showLightbox && lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={() => setShowLightbox(false)}
        >
          <button
            onClick={() => setShowLightbox(false)}
            className="absolute top-4 right-4 p-2 text-white/70 hover:text-white transition-colors"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <img
            src={lightboxImage}
            alt="Full size"
            className="max-w-4xl max-h-[80vh] w-full mx-4 object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      <header className="sticky top-0 z-50 flex-none border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Link href="/messages" className="p-1.5 -ml-1.5 text-muted-foreground hover:text-primary rounded-md">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            {conversation.otherUser?.profilePicture ? (
              <img
                src={conversation.otherUser.profilePicture}
                alt={`${conversation.otherUser.firstName} ${conversation.otherUser.lastName}`}
                className="h-7 w-7 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted">
                <svg className="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            )}
            <div className="flex flex-col">
              <p className="font-medium text-sm">
                {conversation.otherUser
                  ? `${conversation.otherUser.firstName} ${conversation.otherUser.lastName}`
                  : "Unknown User"}
              </p>
              <Link
                href={`/listings/${conversation.listingId}`}
                className="text-xs text-primary hover:underline truncate max-w-[180px]"
              >
                {conversation.listingTitle}
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-2">
        <div className="container mx-auto max-w-2xl">
          {loadingConversation ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              {hasOlderMessages && (
                <div className="flex justify-center py-3">
                  <button
                    onClick={loadOlderMessages}
                    disabled={loadingOlder}
                    className="text-sm text-primary hover:text-primary/80 disabled:opacity-50"
                  >
                    {loadingOlder ? "Loading..." : "Load more messages"}
                  </button>
                </div>
              )}
              <div className="space-y-1">
                {groupedMessages.map((group, groupIndex) => {
                  const isOwnMessage = group.senderId === user.uid;
                  const lastMessage = group.messages[group.messages.length - 1];
                  const reactions = lastMessage.reactions || {};
                  const reactionCount = Object.values(reactions).flat().length;

                  return (
              <div
                key={groupIndex}
                className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
              >
                <div className="flex flex-col max-w-[75%]">
                  <div className={`relative rounded-2xl px-3 py-2 ${
                    isOwnMessage
                      ? `bg-primary text-white rounded-br-md pr-20 ${sendingMessageIds.has(lastMessage.id) ? "opacity-50" : ""}`
                      : `bg-muted rounded-bl-md pr-20 ${sendingMessageIds.has(lastMessage.id) ? "opacity-50" : ""}`
                  }`}>
                    <div className="absolute top-1 right-1 flex gap-1">
                      {!sendingMessageIds.has(lastMessage.id) && (
                        <>
                          <button
                            className={`p-1 rounded ${isOwnMessage ? "text-white/40 hover:text-white" : "text-muted-foreground hover:text-foreground"} opacity-30 hover:opacity-100 transition-all`}
                            onClick={() => setShowEmojiPicker(showEmojiPicker === lastMessage.id ? null : lastMessage.id)}
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </button>
                          <button
                            className={`p-1 rounded ${isOwnMessage ? "text-white/40 hover:text-white" : "text-muted-foreground hover:text-foreground"} opacity-30 hover:opacity-100 transition-all`}
                            onClick={() => setReplyingTo(lastMessage)}
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                            </svg>
                          </button>
                        </>
                      )}
                    </div>
                    {showEmojiPicker === lastMessage.id && (
                      <div className="absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full bg-popover border border-border rounded-lg shadow-lg p-1.5 z-50 flex gap-0.5">
                        {COMMON_EMOJIS.map((emoji) => {
                          const emojiUsers = reactions[emoji] || [];
                          const hasReacted = emojiUsers.includes(user.uid);
                          return (
                            <button
                              key={emoji}
                              className={`w-6 h-6 text-sm rounded hover:bg-muted transition-colors ${
                                hasReacted ? "bg-primary/20" : ""
                              }`}
                              onClick={() => {
                                handleEmojiClick(lastMessage.id, emoji, reactions);
                              }}
                            >
                              {emoji}
                            </button>
                          );
                        })}
                      </div>
                    )}
                    {lastMessage.replyTo && (
                      <div className={`mb-1.5 pl-2 border-l ${
                        isOwnMessage ? "border-white/30" : "border-border"
                      }`}>
                        <div className="flex items-center gap-1">
                          <svg className={`w-3 h-3 ${isOwnMessage ? "text-white/40" : "text-muted-foreground"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                          </svg>
                          <span className={`text-[10px] ${isOwnMessage ? "text-white/50" : "text-muted-foreground"}`}>
                            {lastMessage.replyTo.senderFirstName}
                          </span>
                        </div>
                        <p className={`text-xs line-clamp-1 ${isOwnMessage ? "text-white/60" : "text-muted-foreground"}`}>
                          {lastMessage.replyTo.content}
                        </p>
                      </div>
                    )}
                    {group.messages.map((message) => (
                      <div key={message.id}>
                        <p className="text-sm whitespace-pre-wrap break-words">
                          {message.content}
                        </p>
                        {message.imageUrl && (
                          <img
                            src={message.imageUrl}
                            alt="Attached image"
                            className="mt-1.5 max-w-full rounded-lg border border-white/20 cursor-pointer"
                            onClick={() => openLightbox(message.imageUrl!)}
                          />
                        )}
                      </div>
                    ))}
                    {group.showTimestamp && (
                      <p className={`text-[10px] mt-1 ${isOwnMessage ? "text-white/60" : "text-muted-foreground"}`}>
                        {formatTime(lastMessage.createdAt)}
                      </p>
                    )}
                  </div>
                  {reactionCount > 0 && (
                    <div className={`flex items-center gap-1 mt-0.5 ${isOwnMessage ? "justify-end" : "justify-start"}`}>
                      {Object.entries(reactions).map(([emoji, users]) => {
                        if (!users.length) return null;
                        return (
                          <span
                            key={emoji}
                            className={`text-xs px-1.5 py-0.5 rounded-full cursor-pointer ${
                              users.includes(user.uid)
                                ? isOwnMessage
                                  ? "bg-white/20"
                                  : "bg-primary/20"
                                : isOwnMessage
                                  ? "bg-white/10"
                                  : "bg-muted"
                            }`}
                            onClick={() => handleEmojiClick(lastMessage.id, emoji, reactions)}
                          >
                            {emoji} {users.length}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
          </div>
          </>
          )}
        </div>
      </main>

      <footer className="flex-none border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pb-20 lg:pb-2">
        <div className="container mx-auto max-w-2xl px-3 py-2">
          {replyingTo && (
            <div className="mb-2 flex items-center gap-2 rounded-lg bg-muted p-2">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-muted-foreground">
                  Replying to {replyingTo.senderFirstName}
                </p>
                <p className="text-xs truncate">{replyingTo.content}</p>
              </div>
              <button
                type="button"
                onClick={() => setReplyingTo(null)}
                className="p-1 text-muted-foreground hover:text-red-500"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
          {(imagePreview || selectedImage) && (
            <div className="mb-2 flex items-center gap-2 rounded-lg bg-muted p-2">
              <div className="relative h-12 w-12 overflow-hidden rounded-md">
                <img
                  src={imagePreview || ""}
                  alt="Selected"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex-1">
                <p className="text-xs truncate">{selectedImage?.name}</p>
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
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          <form onSubmit={handleSendMessage} className="flex gap-2">
            <label className="cursor-pointer inline-flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-muted/80 hover:text-primary">
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
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </label>
            <input
              ref={inputRef}
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Message..."
              disabled={sending || uploadingImage}
              className="flex-1 rounded-full border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <button
              type="submit"
              disabled={(!newMessage.trim() && !selectedImage) || sending || uploadingImage}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </form>
        </div>
      </footer>
    </div>
  );
}
