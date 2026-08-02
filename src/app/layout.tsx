import type { Metadata } from "next";
import { Bebas_Neue, DM_Sans } from "next/font/google";
import Navbar from "@/components/Navbar";
import { AuthProvider } from "@/contexts/AuthContext";
import PinnedNotification from "@/components/PinnedNotification";
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

export const metadata: Metadata = {
  title: "Tunisian Phoenix RP",
  description: "A Tunisian FiveM Roleplay Community — Born from fire, built by the community.",
  openGraph: {
    title: "Tunisian Phoenix RP",
    description: "A Tunisian FiveM Roleplay Community — Born from fire, built by the community.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${bebas.variable} ${dmSans.variable}`}>
      <body className="grain bg-atmosphere" style={{ fontFamily: "var(--font-body)" }}>
        <AuthProvider>
          <Navbar />
          <PinnedNotification />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
