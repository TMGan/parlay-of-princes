import type { Metadata } from "next";
import { Cinzel, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const display = Cinzel({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "600", "700"]
});

const sans = Space_Grotesk({
  variable: "--font-sans-fallback",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"]
});

const mono = JetBrains_Mono({
  variable: "--font-code",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"]
});

export const metadata: Metadata = {
  title: "Parlay of Princes",
  description:
    "Craft royal parlays, track odds, and climb the leaderboard in the Parlay of Princes arena.",
  keywords: ["sports betting", "parlay", "leaderboard", "odds", "next.js"],
  metadataBase: new URL("https://parlay-of-princes.example.com"),
  openGraph: {
    title: "Parlay of Princes",
    description:
      "Craft royal parlays, track odds, and climb the leaderboard in the Parlay of Princes arena.",
    url: "https://parlay-of-princes.example.com",
    siteName: "Parlay of Princes",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "Parlay of Princes",
    description:
      "Craft royal parlays, track odds, and climb the leaderboard in the Parlay of Princes arena."
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${display.variable} ${sans.variable} ${mono.variable} antialiased min-h-screen bg-background text-foreground`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
