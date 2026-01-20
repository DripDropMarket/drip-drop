"use client";

import { useAuth } from "@/app/lib/auth-context";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";

function LoginContent() {
  const { user, signInWithGoogle, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get("redirect");
  const redirect = redirectParam?.startsWith("/") ? redirectParam : "/profile";

  useEffect(() => {
    if (!loading && user) {
      router.replace(redirect);
    }
  }, [user, loading, router, redirect]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-card p-8 shadow-xl ring-1 ring-border/50">
        <div className="text-center space-y-2">
          <span className="text-4xl">💧</span>
          <h1 className="text-2xl font-bold tracking-tight text-card-foreground">Welcome Back</h1>
          <p className="text-sm text-muted-foreground">Sign in to continue to Drip Drop</p>
        </div>
        
        <button
          onClick={signInWithGoogle}
          className="group flex w-full items-center justify-center gap-3 rounded-xl bg-white px-4 py-3.5 text-sm font-medium text-slate-700 shadow-sm ring-1 ring-slate-200 transition-all hover:bg-slate-50 hover:shadow-md active:scale-[0.98] dark:bg-slate-900 dark:text-slate-200 dark:ring-slate-800 dark:hover:bg-slate-800"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Continue with Google
        </button>

        <p className="text-center text-xs text-muted-foreground">
          By signing in, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
