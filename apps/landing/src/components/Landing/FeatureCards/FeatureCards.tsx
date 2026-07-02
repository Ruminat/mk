import { FEATURES } from "../Definitions";
import styles from "./FeatureCards.module.css";

export function FeatureCards() {
  return (
    <section className={styles.grid}>
      {FEATURES.map((feature) => (
        <article key={feature.title} className={styles.card}>
          <div className={styles.header}>
            <span className={styles.iconCircle} data-tone={feature.tone}>
              <feature.Icon className={styles.icon} />
            </span>
            <h3 className={styles.title}>{feature.title}</h3>
          </div>
          <p className={styles.body}>{feature.body}</p>
        </article>
      ))}
    </section>
  );
}
