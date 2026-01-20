"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/app/lib/auth-context";
import { useMessaging } from "@/app/lib/messaging-context";

export default function BottomNav() {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const { totalUnreadCount } = useMessaging();

  const isActive = (path: string) => {
    if (path === "/listings") {
      return pathname === "/listings" || pathname.startsWith("/listings/");
    }
    return pathname.startsWith(path);
  };

  if (pathname === "/" || pathname.startsWith("/api/")) {
    return null;
  }

  if (loading) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/60 bg-background/80 backdrop-blur-xl lg:hidden pb-safe">
      <div className="grid grid-cols-4 gap-1 px-2 py-3">
        <Link
          href="/listings"
          className={`group flex flex-col items-center gap-1.5 rounded-xl px-1 py-2 transition-all duration-200 ${
            isActive("/listings")
              ? "text-primary bg-primary/10"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
        >
          <svg className="h-6 w-6 transition-transform group-active:scale-95" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
            />
          </svg>
          <span className="text-[10px] font-semibold tracking-wide">Browse</span>
        </Link>
        <Link
          href="/create"
          className={`group flex flex-col items-center gap-1.5 rounded-xl px-1 py-2 transition-all duration-200 ${
            pathname === "/create"
              ? "text-primary bg-primary/10"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
        >
          <svg className="h-6 w-6 transition-transform group-active:scale-95" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span className="text-[10px] font-semibold tracking-wide">Sell</span>
        </Link>
        <Link
          href="/messages"
          className={`group flex flex-col items-center gap-1.5 rounded-xl px-1 py-2 transition-all duration-200 relative ${
            pathname.startsWith("/messages")
              ? "text-primary bg-primary/10"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
        >
          <svg className="h-6 w-6 transition-transform group-active:scale-95" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          <span className="text-[10px] font-semibold tracking-wide">Messages</span>
          {totalUnreadCount > 0 && (
            <span className="absolute -top-0 right-1/2 translate-x-3 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
              {totalUnreadCount > 99 ? "99+" : totalUnreadCount}
            </span>
          )}
        </Link>
        {user ? (
          <Link
            href="/profile"
            className={`group flex flex-col items-center gap-1.5 rounded-xl px-1 py-2 transition-all duration-200 ${
              pathname === "/profile"
                ? "text-primary bg-primary/10"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            <svg className="h-6 w-6 transition-transform group-active:scale-95" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            <span className="text-[10px] font-semibold tracking-wide">Profile</span>
          </Link>
        ) : (
          <Link
            href={`/login?redirect=${encodeURIComponent(pathname)}`}
            className={`group flex flex-col items-center gap-1.5 rounded-xl px-1 py-2 transition-all duration-200 ${
              pathname === "/login"
                ? "text-primary bg-primary/10"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            <svg className="h-6 w-6 transition-transform group-active:scale-95" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
              />
            </svg>
            <span className="text-[10px] font-semibold tracking-wide">Sign In</span>
          </Link>
        )}
      </div>
    </nav>
  );
}
