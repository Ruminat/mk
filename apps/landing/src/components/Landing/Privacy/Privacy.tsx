import Image from "next/image";
import { PRIVACY_POINTS } from "../Definitions";
import styles from "./Privacy.module.css";

export function Privacy() {
  return (
    <section id="privacy" className={styles.section}>
      <div className={styles.shield}>
        <Image
          src="/shieldHeart.png"
          alt="Shield with a heart"
          width={118}
          height={118}
          className={styles.shieldImage}
        />
      </div>

      <div className={styles.content}>
        <h2 className={styles.title}>Your check-ins are private and yours.</h2>
        <p className={styles.intro}>Built for honesty, not pressure.</p>

        <div className={styles.points}>
          {PRIVACY_POINTS.map((point) => (
            <div key={point.title} className={styles.point}>
              <span className={styles.pointIconWrap}>
                <point.Icon className={styles.pointIcon} />
              </span>
              <h4 className={styles.pointTitle}>{point.title}</h4>
              <p className={styles.pointBody}>{point.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
