"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/app/lib/auth-context";
import { getConversations } from "@/app/views/messaging";
import { ConversationData } from "@/app/lib/types";

export default function MessagesPage() {
  const { user, loading } = useAuth();
  const [conversations, setConversations] = useState<ConversationData[]>([]);
  const [conversationsLoading, setConversationsLoading] = useState(true);

  useEffect(() => {
    async function fetchConversations() {
      if (user) {
        try {
          const data = await getConversations();
          setConversations(data);
        } catch (err) {
          console.error("Error fetching conversations:", err);
        } finally {
          setConversationsLoading(false);
        }
      } else {
        setConversationsLoading(false);
      }
    }
    fetchConversations();
  }, [user]);

  if (loading || conversationsLoading) {
    return (
      <div className="flex items-center justify-center bg-background pb-20">
        <p className="text-muted-foreground">Loading messages...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <main className="container mx-auto max-w-2xl px-4 py-8">
          <h1 className="mb-6 text-2xl font-bold">Messages</h1>
          <div className="rounded-xl border border-border bg-card p-8 text-center">
            <p className="mb-4 text-lg text-muted-foreground">
              Sign in to view your messages
            </p>
            <Link
              href="/login?redirect=/messages"
              className="inline-flex h-10 items-center justify-center rounded-full bg-primary px-6 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
            >
              Sign In
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <main className="container mx-auto max-w-2xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold">Messages</h1>

        {conversations.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">No messages yet.</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Start a conversation by messaging a seller from a listing.
            </p>
            <Link
              href="/listings"
              className="mt-6 inline-flex h-10 items-center justify-center rounded-full bg-primary px-6 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
            >
              Browse Listings
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {conversations.map((conversation) => (
              <Link
                key={conversation.id}
                href={`/messages/${conversation.id}`}
                className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/50 hover:shadow-sm"
              >
                {conversation.otherUser?.profilePicture ? (
                  <img
                    src={conversation.otherUser.profilePicture}
                    alt={`${conversation.otherUser.firstName} ${conversation.otherUser.lastName}`}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                    <svg className="h-6 w-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold truncate">
                      {conversation.otherUser
                        ? `${conversation.otherUser.firstName} ${conversation.otherUser.lastName}`
                        : "Unknown User"}
                    </p>
                    <span className="text-xs text-muted-foreground">
                      {new Date(conversation.lastMessageAt.seconds * 1000).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    re: {conversation.listingTitle}
                  </p>
                  <p className="text-sm text-muted-foreground truncate">
                    {conversation.lastMessage}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
