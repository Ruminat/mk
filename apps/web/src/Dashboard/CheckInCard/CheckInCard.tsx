import { MOOD_COMMENT_MAX_LENGTH } from "@mooduck/contracts";
import type { TWebMessages } from "@/I18n/Catalogs/En";
import { MoodScorePicker } from "../MoodScorePicker/MoodScorePicker";
import { useCheckInForm } from "./UseCheckInForm";
import styles from "./CheckInCard.module.css";

interface CheckInCardProps {
  messages: TWebMessages;
  saving: boolean;
  saveError: boolean;
  onSubmit: (value: number, comment: string) => Promise<boolean>;
}

export function CheckInCard({ messages, saving, saveError, onSubmit }: CheckInCardProps) {
  const form = useCheckInForm(onSubmit);
  const m = messages.checkIn;

  return (
    <section className={styles.card} aria-label={m.question}>
      <div className={styles.head}>
        <h2 className={styles.question}>{m.question}</h2>
        <span className={styles.accent}>{m.accent}</span>
      </div>

      <MoodScorePicker
        value={form.value}
        onChange={form.setValue}
        groupLabel={m.question}
        scoreLabel={m.scoreLabel}
      />

      <div className={styles.composer}>
        <label className={styles.srOnly} htmlFor="checkin-note">
          {m.noteLabel}
        </label>
        <input
          id="checkin-note"
          className={styles.note}
          type="text"
          value={form.note}
          onChange={(event) => form.setNote(event.target.value)}
          placeholder={m.notePlaceholder}
          maxLength={MOOD_COMMENT_MAX_LENGTH}
          disabled={saving}
        />
        <button type="button" className={styles.save} onClick={() => void form.save()} disabled={saving}>
          {saving ? (
            <>
              <span className={styles.spinner} aria-hidden />
              {m.saving}
            </>
          ) : (
            m.save
          )}
        </button>
      </div>

      {form.showHint ? (
        <p className={styles.hint} role="alert">
          {m.pickScoreFirst}
        </p>
      ) : null}
      {saveError ? (
        <p className={styles.error} role="alert">
          {m.saveError}
        </p>
      ) : null}
    </section>
  );
}
