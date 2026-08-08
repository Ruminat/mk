import { describe, expect, it } from "vitest";
import { RU_PLURALS, countRu, pluralizeRu } from "./utils";

const day = (n: number): string => pluralizeRu(n, RU_PLURALS.day);

describe("pluralizeRu", () => {
  it("should take the singular for 1 and anything ending in 1", () => {
    expect(day(1)).toBe("день");
    expect(day(21)).toBe("день");
    expect(day(101)).toBe("день");
  });

  it("should take the 2–4 form for counts ending in 2, 3 or 4", () => {
    expect(day(2)).toBe("дня");
    expect(day(4)).toBe("дня");
    expect(day(33)).toBe("дня");
  });

  it("should take the plural for 5–20 and for 0", () => {
    expect(day(0)).toBe("дней");
    expect(day(5)).toBe("дней");
    expect(day(20)).toBe("дней");
  });

  it("should treat the teens as plural even though they end in 1–4", () => {
    // The trap this rule exists for: 11 ends in 1 but is not "день".
    expect(day(11)).toBe("дней");
    expect(day(12)).toBe("дней");
    expect(day(14)).toBe("дней");
    expect(day(111)).toBe("дней");
    expect(day(112)).toBe("дней");
  });

  it("should decline hours and minutes too", () => {
    expect(pluralizeRu(1, RU_PLURALS.hour)).toBe("час");
    expect(pluralizeRu(2, RU_PLURALS.hour)).toBe("часа");
    expect(pluralizeRu(7, RU_PLURALS.hour)).toBe("часов");
    expect(pluralizeRu(1, RU_PLURALS.minute)).toBe("минута");
    expect(pluralizeRu(3, RU_PLURALS.minute)).toBe("минуты");
    expect(pluralizeRu(30, RU_PLURALS.minute)).toBe("минут");
  });
});

describe("countRu", () => {
  it("should put the number in front of the declined noun", () => {
    expect(countRu(1, RU_PLURALS.day)).toBe("1 день");
    expect(countRu(3, RU_PLURALS.day)).toBe("3 дня");
    expect(countRu(9, RU_PLURALS.day)).toBe("9 дней");
  });
});
