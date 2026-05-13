import type { Metadata } from "next";
import { Rajdhani, IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";

const rajdhani = Rajdhani({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-rajdhani",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-ibm-plex-mono",
});

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-ibm-plex-sans",
});

export const metadata: Metadata = {
  title: "BadgerIQ — Scout Intel",
  description: "Wisconsin Badgers Men's Soccer — Opponent Scouting Intelligence",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${rajdhani.variable} ${ibmPlexMono.variable} ${ibmPlexSans.variable} antialiased bg-bg text-text`}
      >
        {children}
      </body>
    </html>
  );
}
