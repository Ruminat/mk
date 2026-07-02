import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Caveat, Newsreader, Nunito_Sans } from "next/font/google";
import { cn } from "@/lib/Cn";
import "./globals.css";

const newsreader = Newsreader({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-newsreader",
});

const nunitoSans = Nunito_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-nunito",
});

const caveat = Caveat({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-caveat",
});

export const metadata: Metadata = {
  title: "MooDuck — A calm place to listen to yourself",
  description:
    "MooDuck is your private Telegram mood journal. Check in, add short notes, and reflect gently — all in a safe, judgment-free space.",
  icons: { icon: "/icon.png" },
};

interface RootLayoutProps {
  children: ReactNode;
}

function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" className={cn(newsreader.variable, nunitoSans.variable, caveat.variable)}>
      <body>{children}</body>
    </html>
  );
}

export default RootLayout;
