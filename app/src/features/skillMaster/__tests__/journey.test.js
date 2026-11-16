import { describe, expect, it } from "vitest";
import { journeyState } from "../domain/journey";

const entry = (status, match) => ({ status, result: { match } });

describe("journeyState", () => {
  it("starts with the profile", () => {
    const j = journeyState({ hasRole: false, planned: [entry("selected", 90)], waiting: 0 });
    expect(j.current).toBe("profile");
    expect(j.done).toEqual({ profile: false, courses: false, bidding: false });
  });

  it("asks for courses with a good match, not just any course", () => {
    const weakOnly = journeyState({ hasRole: true, planned: [entry("planned", 30), entry("enrolled", 90)], waiting: 1 });
    expect(weakOnly.current).toBe("courses");
  });

  it("asks to hand planned courses over to bidding", () => {
    const j = journeyState({ hasRole: true, planned: [entry("planned", 70)], waiting: 1 });
    expect(j.done.courses).toBe(true);
    expect(j.current).toBe("bidding");
    expect(j.waiting).toBe(1);
  });

  it("is complete when a good course is in bidding and nothing waits", () => {
    const j = journeyState({ hasRole: true, planned: [entry("selected", 70), entry("enrolled", 40)], waiting: 0 });
    expect(j.current).toBeNull();
    expect(j.strongInBidding).toBe(1);
    // A newly planned course reopens the last step.
    expect(
      journeyState({ hasRole: true, planned: [entry("selected", 70), entry("planned", 60)], waiting: 1 }).current
    ).toBe("bidding");
  });
});
