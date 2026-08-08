import Image from "next/image";
import type { TLandingMessages } from "@/I18n/Catalogs/En";
import { PRIVACY_POINTS } from "../Definitions";
import styles from "./Privacy.module.css";

interface PrivacyProps {
  messages: TLandingMessages;
}

export function Privacy({ messages }: PrivacyProps) {
  const { privacy } = messages;

  return (
    <section id="privacy" className={styles.section}>
      <div className={styles.shield}>
        <Image
          src="/shieldHeart.png"
          alt=""
          width={118}
          height={118}
          className={styles.shieldImage}
        />
      </div>

      <div className={styles.content}>
        <h2 className={styles.title}>{privacy.title}</h2>
        <p className={styles.intro}>{privacy.intro}</p>

        <div className={styles.points}>
          {PRIVACY_POINTS.map((point) => {
            const copy = privacy.points[point.id];
            return (
              <div key={point.id} className={styles.point}>
                <span className={styles.pointIconWrap}>
                  <point.Icon className={styles.pointIcon} />
                </span>
                <h4 className={styles.pointTitle}>{copy.title}</h4>
                <p className={styles.pointBody}>{copy.body}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
