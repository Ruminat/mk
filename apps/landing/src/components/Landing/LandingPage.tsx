import type { TLocale } from "@mooduck/core";
import { landingMessages } from "@/I18n/Messages";
import { FeatureCards } from "./FeatureCards/FeatureCards";
import { FinalCta } from "./FinalCta/FinalCta";
import { Footer } from "./Footer/Footer";
import { Header } from "./Header/Header";
import { Hero } from "./Hero/Hero";
import { HowItWorks } from "./HowItWorks/HowItWorks";
import { Privacy } from "./Privacy/Privacy";
import { ProductPreview } from "./ProductPreview/ProductPreview";
import styles from "./LandingPage.module.css";

interface LandingPageProps {
  locale: TLocale;
}

export function LandingPage({ locale }: LandingPageProps) {
  const messages = landingMessages(locale);

  return (
    <div id="top" className={styles.page}>
      <Header locale={locale} messages={messages} />

      <main className={styles.card}>
        <svg
          className={styles.waves}
          viewBox="0 0 400 120"
          width="360"
          height="110"
          preserveAspectRatio="none"
          aria-hidden
        >
          <path
            d="M0 20 Q40 4 80 20 T160 20 T240 20 T320 20 T400 20"
            fill="none"
            stroke="#bbcfe6"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d="M0 45 Q40 29 80 45 T160 45 T240 45 T320 45 T400 45"
            fill="none"
            stroke="#ebd9ae"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>

        <Hero messages={messages} />
        <FeatureCards messages={messages} />
        <ProductPreview messages={messages} />
        <HowItWorks messages={messages} />
        <Privacy messages={messages} />
        <FinalCta messages={messages} />
        <Footer messages={messages} />
      </main>
    </div>
  );
}
