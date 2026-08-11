"use client";

import { createContext, useContext, useEffect, useState } from "react";
import {
  DEFAULT_BRANDING,
  type SiteBranding,
} from "@/lib/site-branding.types";

interface SiteBrandContextType {
  branding: SiteBranding;
  ready: boolean;
}

const SiteBrandContext = createContext<SiteBrandContextType>({
  branding: DEFAULT_BRANDING,
  ready: false,
});

export function SiteBrandProvider({ children }: { children: React.ReactNode }) {
  const [branding, setBranding] = useState<SiteBranding>(DEFAULT_BRANDING);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/site/branding", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: SiteBranding | null) => {
        if (cancelled) return;
        if (data && typeof data.siteName === "string" && data.siteName.trim()) {
          setBranding(data);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <SiteBrandContext.Provider value={{ branding, ready }}>
      {children}
    </SiteBrandContext.Provider>
  );
}

export function useSiteBrand() {
  return useContext(SiteBrandContext);
}
