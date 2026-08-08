import { notFound } from "next/navigation";
import { isLocale } from "@/I18n/IsLocale";
import { LandingPage } from "@/components/Landing/LandingPage";

interface PageProps {
  params: Promise<{ locale: string }>;
}

async function Page({ params }: PageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <LandingPage locale={locale} />;
}

export default Page;
