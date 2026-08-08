import type { TLandingMessages } from "@/I18n/Catalogs/En";
import styles from "./Footer.module.css";

interface FooterProps {
  messages: TLandingMessages;
}

export function Footer({ messages }: FooterProps) {
  return <footer className={styles.footer}>{messages.footer.text}</footer>;
}
