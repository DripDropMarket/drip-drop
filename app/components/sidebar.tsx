"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/app/lib/auth-context";
import { useMessaging } from "@/app/lib/messaging-context";

export default function Sidebar() {
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

  return (
    <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-64 border-r border-border/60 bg-background/95 backdrop-blur-xl flex-col p-6 z-40">
      <div className="mb-10 px-2 flex items-center gap-2">
        <span className="text-3xl">🏷️</span>
        <span className="text-xl font-bold tracking-tight">Thryft</span>
      </div>

      <nav className="flex-1 space-y-1">
        <Link
          href="/listings"
          className={`group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
            isActive("/listings")
              ? "bg-primary text-white shadow-md shadow-primary/20"
              : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
          }`}
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
            />
          </svg>
          <span>Browse</span>
        </Link>
        <Link
          href="/create"
          className={`group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
            pathname === "/create"
              ? "bg-primary text-white shadow-md shadow-primary/20"
              : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
          }`}
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Sell</span>
        </Link>
        <Link
          href="/messages"
          className={`group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 relative ${
            pathname.startsWith("/messages")
              ? "bg-primary text-white shadow-md shadow-primary/20"
              : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
          }`}
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          <span>Messages</span>
          {totalUnreadCount > 0 && (
            <span className="absolute right-2 top-1/2 -translate-y-1/2 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-bold text-white">
              {totalUnreadCount > 99 ? "99+" : totalUnreadCount}
            </span>
          )}
        </Link>
        {user ? (
          <Link
            href="/profile"
            className={`group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
              pathname === "/profile"
                ? "bg-primary text-white shadow-md shadow-primary/20"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            }`}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            <span>Profile</span>
          </Link>
        ) : (
          <Link
            href={`/login?redirect=${encodeURIComponent(pathname)}`}
            className={`group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
              pathname === "/login"
                ? "bg-primary text-white shadow-md shadow-primary/20"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            }`}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
              />
            </svg>
            <span>Sign In</span>
          </Link>
        )}
      </nav>
      
      <div className="mt-auto px-4 py-4 border-t border-border/50">
        <p className="text-xs text-muted-foreground text-center">
          © 2025 Thryft
        </p>
      </div>
    </aside>
  );
}
