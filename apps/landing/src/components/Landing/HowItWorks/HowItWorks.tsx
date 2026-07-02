import { STEPS } from "../Definitions";
import { SparkleIcon } from "../Icons";
import styles from "./HowItWorks.module.css";

export function HowItWorks() {
  return (
    <section className={styles.section}>
      <div className={styles.heading}>
        <SparkleIcon className={styles.sparkle} />
        <h2 className={styles.title}>How it works</h2>
        <SparkleIcon className={styles.sparkle} />
      </div>

      <div className={styles.steps}>
        {STEPS.map((step) => (
          <div key={step.index} className={styles.step}>
            <div className={styles.iconCircle} data-tone={step.tone}>
              <step.Icon className={styles.icon} />
              <span className={styles.number} data-tone={step.tone}>
                {step.index}
              </span>
            </div>
            <h3 className={styles.stepTitle}>{step.title}</h3>
            <p className={styles.stepBody}>{step.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
