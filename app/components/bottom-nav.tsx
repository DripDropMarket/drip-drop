"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/app/lib/auth-context";

export default function BottomNav() {
  const pathname = usePathname();
  const { user, loading } = useAuth();

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
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 lg:hidden">
      <div className="grid grid-cols-4 gap-1 p-2">
        <Link
          href="/listings"
          className={`flex flex-col items-center gap-1 rounded-lg p-2 text-sm font-medium transition-colors ${
            isActive("/listings")
              ? "text-primary"
              : "text-muted-foreground hover:text-primary"
          }`}
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          className={`flex flex-col items-center gap-1 rounded-lg p-2 text-sm font-medium transition-colors ${
            pathname === "/create"
              ? "text-primary"
              : "text-muted-foreground hover:text-primary"
          }`}
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Sell</span>
        </Link>
        <Link
          href="/messages"
          className={`flex flex-col items-center gap-1 rounded-lg p-2 text-sm font-medium transition-colors ${
            pathname.startsWith("/messages")
              ? "text-primary"
              : "text-muted-foreground hover:text-primary"
          }`}
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          <span>Messages</span>
        </Link>
        {user ? (
          <Link
            href="/profile"
            className={`flex flex-col items-center gap-1 rounded-lg p-2 text-sm font-medium transition-colors ${
              pathname === "/profile"
                ? "text-primary"
                : "text-muted-foreground hover:text-primary"
            }`}
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            className={`flex flex-col items-center gap-1 rounded-lg p-2 text-sm font-medium transition-colors ${
              pathname === "/login"
                ? "text-primary"
                : "text-muted-foreground hover:text-primary"
            }`}
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
      </div>
    </nav>
  );
}
