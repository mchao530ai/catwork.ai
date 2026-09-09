import { describe, expect, it } from "vitest";
import { analyticsLanguage, trackEvent } from "../lib/analytics";

describe("analytics helpers", () => {
  it("normalizes supported locale variants to safe language dimensions", () => {
    expect(analyticsLanguage("en-US")).toBe("en");
    expect(analyticsLanguage("ja-JP")).toBe("ja");
    expect(analyticsLanguage("zh-Hant")).toBe("zh");
    expect(analyticsLanguage("fr-FR")).toBe("other");
  });

  it("does not throw when the published tracker is unavailable", () => {
    expect(() => trackEvent("booking_submitted", { party_size: 2 })).not.toThrow();
  });
});