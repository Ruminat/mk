import { messages } from "../../../common/i18n/messages";
import { TTelegramCommandMethods, TTelegramCommandProps } from "../definitions";
import { FORGET_ME_CONFIRMATION_PHRASE, forgetMeConfirmations } from "../forgetMeConfirmations";
import { forgetUser } from "../sagas/forgetUser";

/**
 * Camel case rather than `/forget-me`: Telegram only highlights a command up to
 * the first dash, so the hyphenated form shows up as a half-linked `/forget`.
 */
const FORGET_ME_COMMAND = "/forgetMe";
/** How the command reaches us — `messageParsed` is lowercased before any command sees it. */
const FORGET_ME_COMMAND_PARSED = FORGET_ME_COMMAND.toLowerCase();

function isCommand(props: TTelegramCommandProps): boolean {
  return props.messageParsed === FORGET_ME_COMMAND_PARSED;
}

/**
 * `/forgetMe` — wipes everything MooDuck knows about the sender.
 *
 * Two steps, because there is no undo and no backup: the command only arms the
 * request, and the deletion happens when the user sends the confirmation phrase
 * back. Sending `/forgetMe` again just re-arms it.
 */
export const telegramForgetMeCommand = {
  // The confirmation phrase is claimed whether or not anything is armed. Letting
  // it fall through would mean the one thing a person types to erase themselves
  // gets stored in the message table and answered by the AI.
  test: (props) => isCommand(props) || props.messageParsed === FORGET_ME_CONFIRMATION_PHRASE,

  getReply: async (props) => {
    const strings = messages(props.locale).forgetMe;

    if (isCommand(props)) {
      forgetMeConfirmations.request(props.telegramUserIdHash);

      return { text: strings.confirm(FORGET_ME_CONFIRMATION_PHRASE) };
    }

    if (!forgetMeConfirmations.isPending(props.telegramUserIdHash)) {
      return { text: strings.nothingToConfirm(FORGET_ME_COMMAND) };
    }

    // Disarm first: whatever happens next, this confirmation is spent.
    forgetMeConfirmations.clear(props.telegramUserIdHash);

    const deleted = await forgetUser({ telegramUserIdHash: props.telegramUserIdHash });

    return { text: strings.done(deleted) };
  },
} satisfies TTelegramCommandMethods;
