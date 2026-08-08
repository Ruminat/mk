import type { Metadata } from "next";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { Caveat, Lora, Nunito_Sans } from "next/font/google";
import { LOCALES } from "@mooduck/core";
import { isLocale } from "@/I18n/IsLocale";
import { landingMessages } from "@/I18n/Messages";
import { cn } from "@/lib/Cn";
import "../globals.css";

// The root layout lives inside the `[locale]` segment on purpose: it's the only
// way a static export can emit a per-locale `<html lang>`. There is no
// `app/layout.tsx` above this one.

// Lora replaces Newsreader as the brand serif: Newsreader ships no Cyrillic, so
// every headline, the wordmark and the big stat numbers would fall back to
// Georgia on /ru. One serif for both locales keeps the typeface from changing
// mid-product when someone switches language.
const lora = Lora({
  subsets: ["latin", "cyrillic"],
  weight: ["500", "600", "700"],
  variable: "--font-lora",
});

const nunitoSans = Nunito_Sans({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-nunito",
});

const caveat = Caveat({
  subsets: ["latin", "cyrillic"],
  weight: ["500", "600"],
  variable: "--font-caveat",
});

/** Emit `out/en.html` and `out/ru.html`; nothing else. */
export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export const dynamicParams = false;

interface LocaleLayoutProps {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const m = landingMessages(locale);

  return {
    metadataBase: new URL("https://mooduck.shrek-labs.dev"),
    title: m.meta.title,
    description: m.meta.description,
    icons: { icon: "/icon.png" },
    alternates: {
      languages: {
        en: "/en",
        ru: "/ru",
        "x-default": "/en",
      },
    },
  };
}

async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <html lang={locale} className={cn(lora.variable, nunitoSans.variable, caveat.variable)}>
      <body>{children}</body>
    </html>
  );
}

export default LocaleLayout;
