import type { TLandingMessages } from "@/I18n/Catalogs/En";
import { STEPS } from "../Definitions";
import styles from "./HowItWorks.module.css";

interface HowItWorksProps {
  messages: TLandingMessages;
}

export function HowItWorks({ messages }: HowItWorksProps) {
  return (
    <section id="how-it-works" className={styles.section}>
      <h2 className={styles.title}>{messages.howItWorks.title}</h2>

      <div className={styles.card}>
        {STEPS.map((step) => {
          const copy = messages.howItWorks.steps[step.id];
          return (
            <div key={step.id} className={styles.step}>
              <span className={styles.number} data-tone={step.tone}>
                {step.index}
              </span>
              <div className={styles.iconCircle} data-tone={step.tone}>
                <step.Icon className={styles.icon} />
              </div>
              <div className={styles.text}>
                <h3 className={styles.stepTitle}>{copy.title}</h3>
                <p className={styles.stepBody}>{copy.body}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
