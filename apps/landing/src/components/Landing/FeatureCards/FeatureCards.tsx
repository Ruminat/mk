import type { TLandingMessages } from "@/I18n/Catalogs/En";
import { FEATURES } from "../Definitions";
import styles from "./FeatureCards.module.css";

interface FeatureCardsProps {
  messages: TLandingMessages;
}

export function FeatureCards({ messages }: FeatureCardsProps) {
  return (
    <section id="features" className={styles.grid}>
      {FEATURES.map((feature) => {
        const copy = messages.features[feature.id];
        return (
          <article key={feature.id} className={styles.card}>
            <span className={styles.iconCircle} data-tone={feature.tone}>
              <feature.Icon className={styles.icon} />
            </span>
            <h3 className={styles.title}>{copy.title}</h3>
            <p className={styles.body}>{copy.body}</p>
          </article>
        );
      })}
    </section>
  );
}
