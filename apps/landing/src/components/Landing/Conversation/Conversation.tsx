import Image from "next/image";
import { CHAT_MESSAGES, type ChatMessage } from "../Definitions";
import { BackArrowIcon, DotsVerticalIcon, TelegramIcon } from "../Icons";
import styles from "./Conversation.module.css";

export function Conversation() {
  return (
    <section className={styles.section}>
      <div className={styles.intro}>
        <span className={styles.badge}>
          <TelegramIcon className={styles.badgeIcon} />
        </span>
        <h2 className={styles.title}>A conversation that cares</h2>
        <p className={styles.body}>
          MooDuck lives in Telegram. A simple chat to help you check in, one step at a time.
        </p>
      </div>

      <div className={styles.chat}>
        <header className={styles.chatHeader}>
          <BackArrowIcon className={styles.backIcon} />
          <span className={styles.avatar}>
            <Image src="/chatAvatar.webp" alt="MooDuck" fill sizes="38px" className={styles.cover} />
          </span>
          <div className={styles.chatMeta}>
            <span className={styles.chatName}>MooDuck</span>
            <span className={styles.chatStatus}>bot</span>
          </div>
          <DotsVerticalIcon className={styles.menuIcon} />
        </header>

        <div className={styles.messages}>
          {CHAT_MESSAGES.map((message, index) => (
            <ChatBubble key={index} message={message} />
          ))}
        </div>
      </div>
    </section>
  );
}

interface ChatBubbleProps {
  message: ChatMessage;
}

function ChatBubble({ message }: ChatBubbleProps) {
  return (
    <div className={styles.bubble} data-side={message.side}>
      <span className={styles.bubbleText}>{message.text}</span>
      <span className={styles.bubbleTime}>
        {message.time}
        {message.side === "user" ? <span className={styles.checks}> ✓✓</span> : null}
      </span>
    </div>
  );
}
