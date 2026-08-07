import { messages } from "../../../common/i18n/messages";
import { TTelegramCommandMethods, TTelegramCommandProps } from "../definitions";
import { FORGET_ME_CONFIRMATION_PHRASE, forgetMeConfirmations } from "../forgetMeConfirmations";
import { forgetUser } from "../sagas/forgetUser";

const FORGET_ME_COMMAND = "/forget-me";

/** True only when this exact message is the confirmation of a request we're waiting on. */
function isConfirmation(props: TTelegramCommandProps): boolean {
  return (
    props.messageParsed === FORGET_ME_CONFIRMATION_PHRASE &&
    forgetMeConfirmations.isPending(props.telegramUserIdHash)
  );
}

/**
 * `/forget-me` — wipes everything MooDuck knows about the sender.
 *
 * Two steps, because there is no undo and no backup: the command only arms the
 * request, and the deletion happens when the user sends the confirmation phrase
 * back. Sending `/forget-me` again just re-arms it.
 */
export const telegramForgetMeCommand = {
  test: (props) => props.messageParsed === FORGET_ME_COMMAND || isConfirmation(props),

  getReply: async (props) => {
    const strings = messages(props.locale).forgetMe;

    if (!isConfirmation(props)) {
      forgetMeConfirmations.request(props.telegramUserIdHash);

      return { text: strings.confirm(FORGET_ME_CONFIRMATION_PHRASE) };
    }

    // Disarm first: whatever happens next, this confirmation is spent.
    forgetMeConfirmations.clear(props.telegramUserIdHash);

    const deleted = await forgetUser({ telegramUserIdHash: props.telegramUserIdHash });

    return { text: strings.done(deleted) };
  },
} satisfies TTelegramCommandMethods;
