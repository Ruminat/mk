import { randomFrom } from "@mooduck/core";
import { Sticker } from ".";

export function getErrorSticker() {
  return randomFrom([
    Sticker.YellowBoi.dead,
    Sticker.YellowBoi.ohNo,
    Sticker.YellowBoi.oops,
    Sticker.YellowBoi.noEmotions,
    Sticker.YellowBoi.pressF,
    Sticker.YellowBoi.OMG,
    Sticker.YellowBoi.heheIDontKnow,
    Sticker.YellowBoi.sad,
    Sticker.YellowBoi.reallySad,
    Sticker.YellowBoi.crying,
    Sticker.YellowBoi.iDunno,
  ]);
}

export function getUnknownSticker() {
  return randomFrom([
    Sticker.YellowBoi.dead,
    Sticker.YellowBoi.ohNo,
    Sticker.YellowBoi.oops,
    Sticker.YellowBoi.heheIDontKnow,
    Sticker.YellowBoi.sad,
    Sticker.YellowBoi.iDunno,
  ]);
}
