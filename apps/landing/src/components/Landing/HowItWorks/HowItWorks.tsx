import { STEPS } from "../Definitions";
import styles from "./HowItWorks.module.css";

export function HowItWorks() {
  return (
    <section id="how-it-works" className={styles.section}>
      <h2 className={styles.title}>How it works</h2>

      <div className={styles.card}>
        {STEPS.map((step) => (
          <div key={step.index} className={styles.step}>
            <span className={styles.number} data-tone={step.tone}>
              {step.index}
            </span>
            <div className={styles.iconCircle} data-tone={step.tone}>
              <step.Icon className={styles.icon} />
            </div>
            <div className={styles.text}>
              <h3 className={styles.stepTitle}>{step.title}</h3>
              <p className={styles.stepBody}>{step.body}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
