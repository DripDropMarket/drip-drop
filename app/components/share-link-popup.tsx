"use client";

import { useState, useEffect, useRef } from "react";
import { AffiliateInfo } from "@/app/lib/types";

interface ShareLinkPopupProps {
  userId: string;
  userName: string;
  onClose: () => void;
}

export default function ShareLinkPopup({ userId, userName, onClose }: ShareLinkPopupProps) {
  const [affiliate, setAffiliate] = useState<AffiliateInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const creatingRef = useRef(false);

  useEffect(() => {
    let mounted = true;

    async function fetchOrCreateAffiliate() {
      if (creatingRef.current) return;
      creatingRef.current = true;

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/affiliates?userId=${userId}`);
        if (response.ok && mounted) {
          const data = await response.json();
          if (data.affiliates && data.affiliates.length > 0) {
            const aff = data.affiliates[0];
            setAffiliate({
              id: aff.id,
              code: aff.code,
              linkUrl: aff.linkUrl,
              clickCount: aff.clickCount || 0,
              signUpCount: aff.signUpCount || 0,
            });
            setLoading(false);
            creatingRef.current = false;
            return;
          }
        }

        if (!mounted) return;

        const createResponse = await fetch("/api/affiliates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            name: `${userName}'s Referral Link`,
            commissionRate: 0,
          }),
        });

        if (!createResponse.ok) {
          const error = await createResponse.json();
          throw new Error(error.error || "Failed to create affiliate link");
        }

        const data = await createResponse.json();
        if (mounted) {
          setAffiliate({
            id: data.id,
            code: data.code,
            linkUrl: data.linkUrl,
            clickCount: 0,
            signUpCount: 0,
          });
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : "Failed to load link");
        }
      } finally {
        if (mounted) {
          setLoading(false);
          creatingRef.current = false;
        }
      }
    }

    fetchOrCreateAffiliate();

    return () => {
      mounted = false;
    };
  }, [userId, userName]);

  async function copyToClipboard() {
    if (!affiliate) return;
    try {
      await navigator.clipboard.writeText(affiliate.linkUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="m-4 w-full max-w-md rounded-2xl bg-card p-8 text-center shadow-2xl">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mb-4"></div>
          <p className="text-muted-foreground font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-card shadow-2xl ring-1 ring-border/50 animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-border bg-card">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight">Share Link</h2>
            <button
              onClick={onClose}
              className="h-8 w-8 flex items-center justify-center rounded-full bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 rounded-xl bg-red-50 p-3 text-sm font-medium text-red-600 ring-1 ring-red-100">
              {error}
            </div>
          )}

          {affiliate && (
            <div className="space-y-4">
              <div className="rounded-xl bg-muted/50 p-4">
                <input
                  type="text"
                  readOnly
                  value={affiliate.linkUrl}
                  className="w-full rounded-lg bg-background px-3 py-2 text-sm font-mono border border-input truncate focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl bg-muted/50 p-4 text-center">
                  <p className="text-2xl font-bold text-foreground">{affiliate.clickCount}</p>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Clicks</p>
                </div>
                <div className="rounded-xl bg-muted/50 p-4 text-center">
                  <p className="text-2xl font-bold text-foreground">{affiliate.signUpCount}</p>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Signups</p>
                </div>
              </div>

              <button
                onClick={copyToClipboard}
                className="w-full h-11 flex items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary-hover hover:-translate-y-0.5 active:scale-95"
              >
                {copied ? (
                  <>
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                    </svg>
                    Copy Link
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
