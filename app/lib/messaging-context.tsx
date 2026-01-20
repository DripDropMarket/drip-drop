"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode, useRef } from "react";
import { useAuth } from "@/app/lib/auth-context";
import { getFirebaseDb } from "@/app/lib/firebase-runtime";
import { doc, onSnapshot, collection, query, where, orderBy, updateDoc, getDoc } from "firebase/firestore";
import { ConversationData } from "@/app/lib/types";
import { requestNotificationPermission, showNotification } from "@/app/lib/notifications";

interface MessagingContextType {
  conversations: ConversationData[];
  totalUnreadCount: number;
  markAsRead: (conversationId: string) => Promise<void>;
  addReaction: (messageId: string, emoji: string) => Promise<void>;
  removeReaction: (messageId: string, emoji: string) => Promise<void>;
}

const MessagingContext = createContext<MessagingContextType | null>(null);

export function MessagingProvider({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const [conversations, setConversations] = useState<ConversationData[]>([]);
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const previousCountRef = useRef<number>(0);

  const calculateUnreadCount = useCallback((convs: ConversationData[]) => {
    return convs.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);
  }, []);

  const setupConversationListener = useCallback(() => {
    if (!user) return;

    const db = getFirebaseDb();
    const conversationsRef = collection(db, "conversations");
    const q = query(
      conversationsRef,
      where("participants", "array-contains", user.uid),
      orderBy("lastMessageAt", "desc")
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const convs: ConversationData[] = [];

      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        const otherUserId = data.participants.find((id: string) => id !== user.uid);

        let otherUser: {
          uid: string;
          firstName: string;
          lastName: string;
          profilePicture: string;
        } | null = null;
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

        const unreadCount = data.unreadCount?.[user.uid] || 0;

        convs.push({
          id: docSnap.id,
          participants: data.participants,
          listingId: data.listingId,
          listingTitle,
          otherUser: otherUser || undefined,
          lastMessage: data.lastMessage || "",
          lastMessageAt: {
            seconds: data.lastMessageAt?.seconds || 0,
            nanoseconds: data.lastMessageAt?.nanoseconds || 0,
          },
          unreadCount,
        });
      }

      const newTotalUnread = calculateUnreadCount(convs);
      const prevTotalUnread = previousCountRef.current;

      if (newTotalUnread > prevTotalUnread && prevTotalUnread > 0) {
        const newMessages = newTotalUnread - prevTotalUnread;
        const senderName = convs.find(c => c.unreadCount && c.unreadCount > 0)?.otherUser?.firstName || "Someone";
        showNotification(`New message from ${senderName}`, {
          body: newMessages > 1 ? `You have ${newMessages} new messages` : "You have a new message",
          tag: "new-message",
        });
      }

      previousCountRef.current = newTotalUnread;
      setConversations(convs);
      setTotalUnreadCount(newTotalUnread);
    });

    return unsubscribe;
  }, [user, calculateUnreadCount]);

  useEffect(() => {
    if (loading) return;

    requestNotificationPermission();

    if (!user) {
      setConversations([]);
      setTotalUnreadCount(0);
      previousCountRef.current = 0;
      return;
    }

    if (unsubscribeRef.current) {
      unsubscribeRef.current();
    }

    const unsubscribe = setupConversationListener();
    if (unsubscribe) {
      unsubscribeRef.current = unsubscribe;
    }

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [user, loading, setupConversationListener]);

  const markAsRead = useCallback(async (conversationId: string) => {
    if (!user) return;

    const db = getFirebaseDb();
    const conversationRef = doc(db, "conversations", conversationId);
    const conversationSnap = await getDoc(conversationRef);

    if (!conversationSnap.exists()) return;

    const data = conversationSnap.data();
    const currentUnread = data.unreadCount?.[user.uid] || 0;

    if (currentUnread > 0) {
      await updateDoc(conversationRef, {
        [`unreadCount.${user.uid}`]: 0,
      });
    }
  }, [user]);

  const addReaction = useCallback(async (messageId: string, emoji: string) => {
    if (!user) return;

    const db = getFirebaseDb();
    const messageRef = doc(db, "messages", messageId);
    const messageSnap = await getDoc(messageRef);

    if (!messageSnap.exists()) return;

    const data = messageSnap.data();
    const reactions = data.reactions || {};
    const emojiReactions = reactions[emoji] || [];

    if (!emojiReactions.includes(user.uid)) {
      await updateDoc(messageRef, {
        [`reactions.${emoji}`]: [...emojiReactions, user.uid],
      });
    }
  }, [user]);

  const removeReaction = useCallback(async (messageId: string, emoji: string) => {
    if (!user) return;

    const db = getFirebaseDb();
    const messageRef = doc(db, "messages", messageId);
    const messageSnap = await getDoc(messageRef);

    if (!messageSnap.exists()) return;

    const data = messageSnap.data();
    const reactions = data.reactions || {};
    const emojiReactions = reactions[emoji] || [];

    if (emojiReactions.includes(user.uid)) {
      await updateDoc(messageRef, {
        [`reactions.${emoji}`]: emojiReactions.filter((id: string) => id !== user.uid),
      });
    }
  }, [user]);

  return (
    <MessagingContext.Provider
      value={{
        conversations,
        totalUnreadCount,
        markAsRead,
        addReaction,
        removeReaction,
      }}
    >
      {children}
    </MessagingContext.Provider>
  );
}

export function useMessaging() {
  const context = useContext(MessagingContext);
  if (!context) {
    throw new Error("useMessaging must be used within a MessagingProvider");
  }
  return context;
}
