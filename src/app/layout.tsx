import type { Metadata } from "next";
import { Bebas_Neue, DM_Sans } from "next/font/google";
import Navbar from "@/components/Navbar";
import { AuthProvider } from "@/contexts/AuthContext";
import { SiteBrandProvider } from "@/contexts/SiteBrandContext";
import PinnedNotification from "@/components/PinnedNotification";
import { getSiteBranding } from "@/lib/site-branding";
import { BRAND_COLOR_KEYS } from "@/lib/site-branding.types";
import { getSession } from "@/lib/auth";
import { getThemeForUser } from "@/lib/user-themes.config";
import "./globals.css";

const bebas = Bebas_Neue({
  weight: "400",
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const { siteName, siteTagline, metaDescription, metaKeywords } = await getSiteBranding();
  return {
    title: siteName,
    description: metaDescription || siteTagline,
    keywords: metaKeywords,
    openGraph: {
      title: siteName,
      description: metaDescription || siteTagline,
      type: "website",
    },
    icons: { icon: "/api/site/logo" },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const branding = await getSiteBranding();
  const session = await getSession();
  const userTheme = getThemeForUser(session?.userId);

  const colors = userTheme ? { ...branding.colors, ...userTheme.colors } : branding.colors;
  const vars = {
    ...Object.fromEntries(BRAND_COLOR_KEYS.map((key) => [`--color-${key}`, colors[key]])),
    ...(userTheme?.extra ?? {}),
    ...(userTheme?.backgroundImage
      ? {
          "--user-bg-image": `url(${userTheme.backgroundImage})`,
          "--user-bg-overlay": userTheme.backgroundOverlay ?? "rgba(0,0,0,0.65)",
        }
      : {}),
  } as React.CSSProperties;

  return (
    <html lang="en" className={`${bebas.variable} ${dmSans.variable}`} style={vars}>
      <body className="grain bg-atmosphere" style={{ fontFamily: "var(--font-body)" }}>
        <SiteBrandProvider>
          <AuthProvider>
            <Navbar />
            <PinnedNotification />
            {children}
          </AuthProvider>
        </SiteBrandProvider>
      </body>
    </html>
  );
}
