"use client";

import { useEffect, useState } from "react";
import { captureAffiliateFromUrl, AffiliateData } from "@/app/lib/affiliate-tracker";

interface AffiliateCaptureProps {
  children: React.ReactNode;
}

async function trackAffiliateClick(affiliateId: string): Promise<void> {
  try {
    await fetch("/api/affiliates/click", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ affiliateId }),
    });
  } catch (e) {
    console.error("Error tracking affiliate click:", e);
  }
}

export function AffiliateCapture({ children }: AffiliateCaptureProps) {
  useEffect(() => {
    if (typeof window !== "undefined") {
      captureAffiliateFromUrl(window.location.href);
      
      const url = window.location.href;
      try {
        const urlObj = new URL(url);
        const affiliateId = urlObj.searchParams.get("utm_affiliate");
        const source = urlObj.searchParams.get("utm_source");
        
        if (affiliateId && source === "affiliate") {
          trackAffiliateClick(affiliateId);
        }
      } catch (e) {
        console.error("Error parsing affiliate URL:", e);
      }
    }
  }, []);

  return <>{children}</>;
}

export function useGetAffiliateData(): AffiliateData | null {
  const [data, setData] = useState<AffiliateData | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("thryft_affiliate_data");
    if (stored) {
      try {
        setData(JSON.parse(stored));
      } catch (e) {
        console.error("Error parsing affiliate data:", e);
      }
    }
  }, []);

  return data;
}
