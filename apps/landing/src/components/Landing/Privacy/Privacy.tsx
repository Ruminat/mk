import Image from "next/image";
import { PRIVACY_POINTS } from "../Definitions";
import styles from "./Privacy.module.css";

export function Privacy() {
  return (
    <section className={styles.section}>
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
        <h2 className={styles.title}>Your space. Your story. Your privacy.</h2>
        <p className={styles.intro}>
          MooDuck is built to protect your privacy and support your well-being.
        </p>

        <div className={styles.points}>
          {PRIVACY_POINTS.map((point) => (
            <div key={point.title} className={styles.point}>
              <div className={styles.pointHeader}>
                <span className={styles.pointIconWrap} data-tone={point.tone}>
                  <point.Icon className={styles.pointIcon} />
                </span>
                <h4 className={styles.pointTitle}>{point.title}</h4>
              </div>
              <p className={styles.pointBody}>{point.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
