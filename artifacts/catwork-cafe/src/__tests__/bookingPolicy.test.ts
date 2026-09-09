import { describe, expect, it } from "vitest";
import { addDaysToDateString, getJstDateString } from "../lib/bookingPolicy";

describe("booking policy", () => {
  it("formats the JST calendar date", () => {
    expect(getJstDateString(new Date("2026-09-09T14:00:00.000Z"))).toBe("2026-09-09");
    expect(getJstDateString(new Date("2026-09-09T15:00:00.000Z"))).toBe("2026-09-10");
  });

  it("calculates the earliest booking date across month and year boundaries", () => {
    expect(addDaysToDateString("2026-09-30", 1)).toBe("2026-10-01");
    expect(addDaysToDateString("2026-12-31", 1)).toBe("2027-01-01");
  });
});