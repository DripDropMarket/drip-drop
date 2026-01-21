"use client";

import { useEffect, useState } from "react";
import { captureAffiliateFromUrl, getAffiliateData, AffiliateData } from "@/app/lib/affiliate-tracker";

export function useAffiliateCapture() {
  useEffect(() => {
    if (typeof window !== "undefined") {
      const url = window.location.href;
      captureAffiliateFromUrl(url);
    }
  }, []);
}

export function useHasAffiliateData(): AffiliateData | null {
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
