"use client";

import Link from "next/link";
import { useAuth } from "@/app/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const categories = [
  { name: "Clothes", icon: "👕", description: "Fashion & Apparel" },
  { name: "Textbooks", icon: "📚", description: "Books & Study Materials" },
  { name: "Tech", icon: "💻", description: "Electronics & Gadgets" },
];

const features = [
  {
    title: "Student Safe",
    description: "Verified student-only marketplace for safe transactions",
    icon: "🎓",
  },
  {
    title: "Easy Meetups",
    description: "Schedule safe meetups on campus or nearby",
    icon: "📍",
  },
  {
    title: "Save Money",
    description: "Buy and sell within your student community",
    icon: "💰",
  },
];

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push("/listings");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl">💧</span>
            <span className="text-xl font-bold">Drip Drop</span>
          </Link>
          <Link
            href="/login?redirect=/listings"
            className="inline-flex h-9 items-center justify-center rounded-full bg-primary px-4 text-sm font-medium text-white transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
          >
            Sign In
          </Link>
        </div>
      </header>

      <main>
        <section className="space-y-6 py-12 md:py-24 lg:py-32">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
              Buy & Sell on Campus
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
              The marketplace for students. Trade clothes, textbooks, and tech
              safely with other students at your school.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/login?redirect=/listings"
                className="inline-flex h-12 items-center justify-center rounded-full bg-primary px-8 text-base font-medium text-white transition-colors hover:bg-primary-hover"
              >
                Get Started
              </Link>
              <Link
                href="/listings"
                className="inline-flex h-12 items-center justify-center rounded-full border border-border bg-background px-8 text-base font-medium transition-colors hover:bg-muted"
              >
                Browse Items
              </Link>
            </div>
          </div>
        </section>

        <section className="py-12 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map((category) => (
                <Link
                  key={category.name}
                  href="/listings"
                  className="group flex flex-col items-center rounded-xl border border-border bg-card p-6 text-center transition-all hover:border-primary/50 hover:shadow-lg"
                >
                  <span className="text-5xl mb-4">{category.icon}</span>
                  <h3 className="text-xl font-semibold">{category.name}</h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    {category.description}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="py-12 md:py-24">
          <div className="container mx-auto px-4">
            <h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl mb-12">
              Why Students Love Drip Drop
            </h2>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="flex flex-col items-center text-center"
                >
                  <span className="text-4xl mb-4">{feature.icon}</span>
                  <h3 className="text-lg font-semibold">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-12 md:py-24 bg-muted/30">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Ready to Start Trading?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              Join thousands of students buying and selling on campus. Safe,
              easy, and built for students.
            </p>
            <div className="mt-8">
            <Link
              href="/login?redirect=/listings"
              className="inline-flex h-12 items-center justify-center rounded-full bg-primary px-8 text-base font-medium text-white transition-colors hover:bg-primary-hover"
            >
              Sign Up with Google
            </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2025 Drip Drop. Made for students, by students.</p>
        </div>
      </footer>
    </div>
  );
}
