import { describe, expect, it } from "vitest";
import { createForgetMeConfirmations } from "../forgetMeConfirmations";

/** A hand-advanced clock, so the confirmation window is tested without real timers. */
function makeClock(start = 1_000_000) {
  let current = start;
  return {
    clock: { now: () => current },
    advance: (ms: number) => {
      current += ms;
    },
  };
}

function makeConfirmations(ttlMs = 1000) {
  const { clock, advance } = makeClock();
  return { confirmations: createForgetMeConfirmations({ ttlMs, clock }), advance };
}

describe("forgetMeConfirmations.ts / createForgetMeConfirmations", () => {
  it("should have nothing pending for a user who never asked", () => {
    const { confirmations } = makeConfirmations();

    expect(confirmations.isPending("user-1")).toBe(false);
  });

  it("should mark a user as pending once they ask", () => {
    const { confirmations } = makeConfirmations();

    confirmations.request("user-1");

    expect(confirmations.isPending("user-1")).toBe(true);
  });

  it("should keep each user's request separate", () => {
    const { confirmations } = makeConfirmations();

    confirmations.request("user-1");

    expect(confirmations.isPending("user-2")).toBe(false);
  });

  it("should drop the request once it is cleared", () => {
    const { confirmations } = makeConfirmations();

    confirmations.request("user-1");
    confirmations.clear("user-1");

    expect(confirmations.isPending("user-1")).toBe(false);
  });

  it("should expire the request after the confirmation window", () => {
    const { confirmations, advance } = makeConfirmations(1000);

    confirmations.request("user-1");
    advance(1001);

    expect(confirmations.isPending("user-1")).toBe(false);
  });

  it("should not extend the window just because it was checked", () => {
    const { confirmations, advance } = makeConfirmations(1000);

    confirmations.request("user-1");

    advance(600);
    expect(confirmations.isPending("user-1")).toBe(true);

    advance(600); // 1200ms since the request — expired, however often it was read
    expect(confirmations.isPending("user-1")).toBe(false);
  });

  it("should restart the window when the user asks again", () => {
    const { confirmations, advance } = makeConfirmations(1000);

    confirmations.request("user-1");
    advance(900);
    confirmations.request("user-1");
    advance(900);

    expect(confirmations.isPending("user-1")).toBe(true);
  });

  it("should never track more pending users than the cap", () => {
    const { confirmations } = makeConfirmations();
    const bounded = createForgetMeConfirmations({ maxPendingUsers: 2, clock: makeClock().clock });

    bounded.request("user-1");
    bounded.request("user-2");
    bounded.request("user-3"); // pushes out user-1

    expect(bounded.isPending("user-1")).toBe(false);
    expect(bounded.isPending("user-3")).toBe(true);
    expect(confirmations.isPending("user-1")).toBe(false);
  });
});
