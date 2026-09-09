import { describe, it, expect, beforeAll } from "vitest";
import i18next from "i18next";
import en from "../i18n/locales/en";
import ja from "../i18n/locales/ja";
import zh from "../i18n/locales/zh";
import { BUSINESS_CONFIG } from "../data/businessConfig";

const { hours, pricing, catCount } = BUSINESS_CONFIG;

beforeAll(async () => {
  await i18next.init({
    resources: {
      en: { translation: en as unknown as Record<string, unknown> },
      ja: { translation: ja as unknown as Record<string, unknown> },
      zh: { translation: zh as unknown as Record<string, unknown> },
    },
    lng: "en",
    fallbackLng: "en",
    interpolation: { escapeValue: false },
  });
});

function tAs(lng: string, key: string, vars?: Record<string, unknown>): string {
  return i18next.t(key, { lng, ...vars }) as string;
}

// ─── BusinessConfig structure ────────────────────────────────────────────────

describe("businessConfig — structural integrity", () => {
  it("catCount is a positive integer", () => {
    expect(catCount).toBeTypeOf("number");
    expect(catCount).toBeGreaterThan(0);
  });

  it("open/close times match HH:MM format", () => {
    expect(hours.open).toMatch(/^\d{1,2}:\d{2}$/);
    expect(hours.close).toMatch(/^\d{1,2}:\d{2}$/);
  });

  it("display string contains open and close times", () => {
    expect(hours.display).toContain(hours.open);
    expect(hours.display).toContain(hours.close);
  });

  it("hours.compact has non-empty values for en, ja, zh", () => {
    expect(hours.compact.en).toBeTruthy();
    expect(hours.compact.ja).toBeTruthy();
    expect(hours.compact.zh).toBeTruthy();
  });

  it("pricing tier values start with ¥", () => {
    expect(pricing.weekday.firstHour).toMatch(/^¥/);
    expect(pricing.weekday.threeHours).toMatch(/^¥/);
    expect(pricing.weekend.firstHour).toMatch(/^¥/);
    expect(pricing.weekend.threeHours).toMatch(/^¥/);
    expect(pricing.residentDiscount).toMatch(/^¥/);
  });

  it("weekend prices are higher than weekday prices (numeric)", () => {
    const parse = (s: string) => parseInt(s.replace(/[^0-9]/g, ""), 10);
    expect(parse(pricing.weekend.firstHour)).toBeGreaterThan(parse(pricing.weekday.firstHour));
    expect(parse(pricing.weekend.threeHours)).toBeGreaterThan(parse(pricing.weekday.threeHours));
  });

  it("email contains @", () => {
    expect(BUSINESS_CONFIG.contact.email).toContain("@");
  });

  it("phoneHref starts with tel:", () => {
    expect(BUSINESS_CONFIG.contact.phoneHref).toMatch(/^tel:/);
  });

  it("instagramUrl matches between contact and urls", () => {
    expect(BUSINESS_CONFIG.contact.instagramUrl).toBe(BUSINESS_CONFIG.urls.instagramUrl);
  });
});

// ─── Locale template variables — raw strings contain {{}} placeholders ───────

describe("locale raw strings — template variables present", () => {
  it("en/ja/zh pricing.note all contain {{days}}, {{open}}, {{close}}, {{residentDiscount}}", () => {
    for (const locale of [en, ja, zh]) {
      expect(locale.pricing.note).toContain("{{days}}");
      expect(locale.pricing.note).toContain("{{open}}");
      expect(locale.pricing.note).toContain("{{close}}");
      expect(locale.pricing.note).toContain("{{residentDiscount}}");
    }
  });

  it("en/ja/zh faq hours answer uses {{days}}, {{open}}, {{close}}", () => {
    const enItem = en.faq.items[14];
    const jaItem = ja.faq.items[14];
    const zhItem = zh.faq.items[14];
    for (const item of [enItem, jaItem, zhItem]) {
      expect(item.answer).toContain("{{days}}");
      expect(item.answer).toContain("{{open}}");
      expect(item.answer).toContain("{{close}}");
    }
  });

  it("en/ja/zh faq entry fee answer uses {{weekdayPrice1h}} and {{residentDiscount}}", () => {
    const enItem = en.faq.items[15];
    const jaItem = ja.faq.items[15];
    const zhItem = zh.faq.items[15];
    for (const item of [enItem, jaItem, zhItem]) {
      expect(item.answer).toContain("{{weekdayPrice1h}}");
      expect(item.answer).toContain("{{residentDiscount}}");
    }
  });

  it("en/ja/zh footer.tagline contains {{days}}", () => {
    expect(en.footer.tagline).toContain("{{days}}");
    expect(ja.footer.tagline).toContain("{{days}}");
    expect(zh.footer.tagline).toContain("{{days}}");
  });

  it("en/ja/zh cats.cta.hours contains {{open}} and {{close}}", () => {
    expect(en.cats.cta.hours).toContain("{{open}}");
    expect(en.cats.cta.hours).toContain("{{close}}");
    expect(ja.cats.cta.hours).toContain("{{open}}");
    expect(ja.cats.cta.hours).toContain("{{close}}");
    expect(zh.cats.cta.hours).toContain("{{open}}");
    expect(zh.cats.cta.hours).toContain("{{close}}");
  });

  it("en/ja/zh home.cta.openHours contains {{open}} and {{close}}", () => {
    expect(en.home.cta.openHours).toContain("{{open}}");
    expect(en.home.cta.openHours).toContain("{{close}}");
    expect(ja.home.cta.openHours).toContain("{{open}}");
    expect(zh.home.cta.openHours).toContain("{{open}}");
  });

  it("en/ja/zh home.hero.desc contains {{catCount}}", () => {
    expect(en.home.hero.desc).toContain("{{catCount}}");
    expect(ja.home.hero.desc).toContain("{{catCount}}");
    expect(zh.home.hero.desc).toContain("{{catCount}}");
  });

  it("en/ja/zh facilities.detail.p1 contains {{catCount}}", () => {
    expect(en.facilities.detail.p1).toContain("{{catCount}}");
    expect(ja.facilities.detail.p1).toContain("{{catCount}}");
    expect(zh.facilities.detail.p1).toContain("{{catCount}}");
  });
});

// ─── i18n interpolation — rendered output contains actual config values ──────

describe("i18n interpolation — pricing.note rendered output", () => {
  const vars = {
    days: hours.compact.en,
    open: hours.open,
    close: hours.close,
    residentDiscount: pricing.residentDiscount,
  };

  for (const lng of ["en", "ja", "zh"] as const) {
    it(`[${lng}] rendered pricing.note contains actual open time "${hours.open}"`, () => {
      expect(tAs(lng, "pricing.note", vars)).toContain(hours.open);
    });

    it(`[${lng}] rendered pricing.note contains actual close time "${hours.close}"`, () => {
      expect(tAs(lng, "pricing.note", vars)).toContain(hours.close);
    });

    it(`[${lng}] rendered pricing.note contains actual residentDiscount "${pricing.residentDiscount}"`, () => {
      expect(tAs(lng, "pricing.note", vars)).toContain(pricing.residentDiscount);
    });
  }

  it("open time is identical in rendered output across en/ja/zh", () => {
    const results = ["en", "ja", "zh"].map((lng) => tAs(lng, "pricing.note", vars));
    for (const r of results) expect(r).toContain(hours.open);
  });

  it("residentDiscount is identical in rendered output across en/ja/zh", () => {
    const results = ["en", "ja", "zh"].map((lng) => tAs(lng, "pricing.note", vars));
    for (const r of results) expect(r).toContain(pricing.residentDiscount);
  });
});

describe("i18n interpolation — faq entry fee answer rendered output", () => {
  const pricingVars = {
    weekdayPrice1h: pricing.weekday.firstHour,
    weekdayPrice3h: pricing.weekday.threeHours,
    weekendPrice1h: pricing.weekend.firstHour,
    weekendPrice3h: pricing.weekend.threeHours,
    residentDiscount: pricing.residentDiscount,
    days: hours.days,
    open: hours.open,
    close: hours.close,
    closedDays: hours.closedDays,
  };

  function getFaqItems(lng: string) {
    return i18next.t("faq.items", {
      lng,
      returnObjects: true,
      ...pricingVars,
    }) as Array<{ category: string; question: string; answer: string }>;
  }

  function getEntryFeeItem(lng: string) {
    const items = getFaqItems(lng);
    const item = items.find((i) => i.category === "policies" && i.answer.includes(pricing.weekday.firstHour));
    expect(item).toBeDefined();
    return item!;
  }

  for (const lng of ["en", "ja", "zh"] as const) {
    it(`[${lng}] entry fee answer contains weekday first-hour price "${pricing.weekday.firstHour}"`, () => {
      expect(getEntryFeeItem(lng).answer).toContain(pricing.weekday.firstHour);
    });

    it(`[${lng}] entry fee answer contains weekday 3-hour price "${pricing.weekday.threeHours}"`, () => {
      expect(getEntryFeeItem(lng).answer).toContain(pricing.weekday.threeHours);
    });

    it(`[${lng}] entry fee answer contains weekend first-hour price "${pricing.weekend.firstHour}"`, () => {
      expect(getEntryFeeItem(lng).answer).toContain(pricing.weekend.firstHour);
    });

    it(`[${lng}] entry fee answer contains residentDiscount "${pricing.residentDiscount}"`, () => {
      expect(getEntryFeeItem(lng).answer).toContain(pricing.residentDiscount);
    });
  }

  it("all four price values are identical across en/ja/zh rendered outputs", () => {
    for (const price of [
      pricing.weekday.firstHour,
      pricing.weekday.threeHours,
      pricing.weekend.firstHour,
      pricing.weekend.threeHours,
    ]) {
      for (const lng of ["en", "ja", "zh"]) {
        expect(getEntryFeeItem(lng).answer).toContain(price);
      }
    }
  });
});

describe("i18n interpolation — cats.cta.hours rendered output", () => {
  const vars = { days: hours.compact.en, open: hours.open, close: hours.close };

  for (const lng of ["en", "ja", "zh"] as const) {
    it(`[${lng}] contains open time "${hours.open}"`, () => {
      expect(tAs(lng, "cats.cta.hours", vars)).toContain(hours.open);
    });

    it(`[${lng}] contains close time "${hours.close}"`, () => {
      expect(tAs(lng, "cats.cta.hours", vars)).toContain(hours.close);
    });
  }

  it("close time is identical across en/ja/zh rendered outputs", () => {
    const results = ["en", "ja", "zh"].map((lng) => tAs(lng, "cats.cta.hours", vars));
    for (const r of results) expect(r).toContain(hours.close);
  });
});

describe("i18n interpolation — home.cta.openHours rendered output", () => {
  const vars = { days: hours.compact.en, open: hours.open, close: hours.close };

  for (const lng of ["en", "ja", "zh"] as const) {
    it(`[${lng}] contains open time "${hours.open}"`, () => {
      expect(tAs(lng, "home.cta.openHours", vars)).toContain(hours.open);
    });

    it(`[${lng}] contains close time "${hours.close}"`, () => {
      expect(tAs(lng, "home.cta.openHours", vars)).toContain(hours.close);
    });
  }
});

describe("i18n interpolation — contact.options.phone.desc rendered output", () => {
  const vars = { days: hours.compact.en, open: hours.open, close: hours.close };

  for (const lng of ["en", "ja", "zh"] as const) {
    it(`[${lng}] contains open time "${hours.open}"`, () => {
      expect(tAs(lng, "contact.options.phone.desc", vars)).toContain(hours.open);
    });

    it(`[${lng}] contains close time "${hours.close}"`, () => {
      expect(tAs(lng, "contact.options.phone.desc", vars)).toContain(hours.close);
    });
  }
});

describe("i18n interpolation — catCount strings rendered output", () => {
  const vars = { catCount };

  for (const lng of ["en", "ja", "zh"] as const) {
    it(`[${lng}] home.hero.desc contains catCount (${catCount})`, () => {
      expect(tAs(lng, "home.hero.desc", vars)).toContain(String(catCount));
    });

    it(`[${lng}] home.whyWork.cats.heading contains catCount (${catCount})`, () => {
      expect(tAs(lng, "home.whyWork.cats.heading", vars)).toContain(String(catCount));
    });

    it(`[${lng}] facilities.detail.p1 contains catCount (${catCount})`, () => {
      expect(tAs(lng, "facilities.detail.p1", vars)).toContain(String(catCount));
    });

    it(`[${lng}] facilities.items.cats.desc contains catCount (${catCount})`, () => {
      expect(tAs(lng, "facilities.items.cats.desc", vars)).toContain(String(catCount));
    });
  }
});

describe("i18n interpolation — footer.tagline uses {{days}}", () => {
  for (const [lng, days] of [
    ["en", hours.compact.en],
    ["ja", hours.compact.ja],
    ["zh", hours.compact.zh],
  ] as const) {
    it(`[${lng}] footer.tagline contains locale-appropriate compact days`, () => {
      const result = tAs(lng, "footer.tagline", { days });
      expect(result).toContain(days);
    });
  }
});

describe("lang keys are consistent", () => {
  it("all three locale lang objects define exactly en, ja, zh", () => {
    expect(Object.keys(en.lang)).toEqual(["en", "ja", "zh"]);
    expect(Object.keys(ja.lang)).toEqual(["en", "ja", "zh"]);
    expect(Object.keys(zh.lang)).toEqual(["en", "ja", "zh"]);
  });
});

describe("businessConfig — contact/address/URL invariants", () => {
  it("phone is non-empty and reachable via phoneHref", () => {
    expect(BUSINESS_CONFIG.contact.phone.length).toBeGreaterThan(0);
    expect(BUSINESS_CONFIG.contact.phoneHref).toMatch(/^tel:\+?[\d]/);
    expect(BUSINESS_CONFIG.contact.phoneHref).toContain(
      BUSINESS_CONFIG.contact.phone.replace(/\D/g, "").slice(-8),
    );
  });

  it("email is valid and consistent across contact and locale nav.emailUs text", () => {
    const email = BUSINESS_CONFIG.contact.email;
    expect(email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    expect(en.nav.emailUs.length).toBeGreaterThan(0);
    expect(ja.nav.emailUs.length).toBeGreaterThan(0);
    expect(zh.nav.emailUs.length).toBeGreaterThan(0);
  });

  it("instagramUrl is identical between contact and urls sub-configs", () => {
    expect(BUSINESS_CONFIG.contact.instagramUrl).toBe(BUSINESS_CONFIG.urls.instagramUrl);
    expect(BUSINESS_CONFIG.contact.instagramUrl).toMatch(/^https?:\/\//);
  });

  it("siteUrl is a valid https URL", () => {
    expect(BUSINESS_CONFIG.urls.siteUrl).toMatch(/^https:\/\//);
  });

  it("mapUrl and mapEmbedUrl are valid https URLs", () => {
    expect(BUSINESS_CONFIG.urls.mapUrl).toMatch(/^https?:\/\//);
    expect(BUSINESS_CONFIG.urls.mapEmbedUrl).toMatch(/^https?:\/\//);
  });

  it("address.full contains street and postalCode", () => {
    expect(BUSINESS_CONFIG.address.full).toContain(BUSINESS_CONFIG.address.street);
    expect(BUSINESS_CONFIG.address.full).toContain(BUSINESS_CONFIG.address.postalCode);
  });
});

describe("i18n cross-locale rendering — phone number via t() path", () => {
  const phoneVars = {
    phone: BUSINESS_CONFIG.contact.phone,
    days: hours.compact.en,
    open: hours.open,
    close: hours.close,
  };

  for (const lng of ["en", "ja", "zh"] as const) {
    it(`[${lng}] contact.options.phone.desc rendered output contains actual phone "${BUSINESS_CONFIG.contact.phone}"`, () => {
      const result = tAs(lng, "contact.options.phone.desc", phoneVars);
      expect(result).toContain(BUSINESS_CONFIG.contact.phone);
    });

    it(`[${lng}] contact.options.phone.desc rendered output contains open time "${hours.open}"`, () => {
      const result = tAs(lng, "contact.options.phone.desc", phoneVars);
      expect(result).toContain(hours.open);
    });
  }

  it("phone number is identical in rendered output across en/ja/zh", () => {
    const results = ["en", "ja", "zh"].map((lng) =>
      tAs(lng, "contact.options.phone.desc", phoneVars),
    );
    for (const r of results) expect(r).toContain(BUSINESS_CONFIG.contact.phone);
  });
});

describe("businessConfig — transport and landmarks centralization", () => {
  it("transport array has 3 items (Shinkansen, Walk, Car)", () => {
    expect(BUSINESS_CONFIG.transport).toHaveLength(3);
    expect(BUSINESS_CONFIG.transport.map((t) => t.type)).toEqual(["Shinkansen", "Walk", "Car"]);
  });

  it("all transport items have ja and zh translations", () => {
    for (const item of BUSINESS_CONFIG.transport) {
      expect(item.titleJa.length).toBeGreaterThan(0);
      expect(item.titleZh.length).toBeGreaterThan(0);
      expect(item.descriptionJa.length).toBeGreaterThan(0);
      expect(item.descriptionZh.length).toBeGreaterThan(0);
      expect(item.noteJa.length).toBeGreaterThan(0);
      expect(item.noteZh.length).toBeGreaterThan(0);
    }
  });

  it("landmarks array has 4 items", () => {
    expect(BUSINESS_CONFIG.landmarks).toHaveLength(4);
  });

  it("all landmark items have ja and zh names", () => {
    for (const lm of BUSINESS_CONFIG.landmarks) {
      expect(lm.nameJa.length).toBeGreaterThan(0);
      expect(lm.nameZh.length).toBeGreaterThan(0);
      expect(lm.distance.length).toBeGreaterThan(0);
    }
  });
});

describe("businessConfig — policy schema contract", () => {
  it("policy object is defined with ageLimit, reservationUrl, lastAdmission keys", () => {
    expect(BUSINESS_CONFIG.policy).toBeDefined();
    expect("ageLimit" in BUSINESS_CONFIG.policy).toBe(true);
    expect("reservationUrl" in BUSINESS_CONFIG.policy).toBe(true);
    expect("lastAdmission" in BUSINESS_CONFIG.policy).toBe(true);
  });

  it("policy fields are null (unresolved) or non-empty strings if set", () => {
    for (const val of Object.values(BUSINESS_CONFIG.policy)) {
      if (val !== null) {
        expect(typeof val).toBe("string");
        expect((val as string).trim().length).toBeGreaterThan(0);
      }
    }
  });
});

describe("i18n interpolation — pricing chip labels with catCount", () => {
  const catCountVars = { catCount };

  for (const lng of ["en", "ja", "zh"] as const) {
    it(`[${lng}] catFood chip 'residents' renders catCount (${catCount})`, () => {
      const result = tAs(lng, "pricing.included.items.catFood.chips.residents", catCountVars);
      expect(result).toContain(String(catCount));
    });

    it(`[${lng}] catFood chip 'days' is non-empty`, () => {
      const result = tAs(lng, "pricing.included.items.catFood.chips.days");
      expect(result.length).toBeGreaterThan(0);
    });

    it(`[${lng}] seating chip 'tables' is non-empty`, () => {
      const result = tAs(lng, "pricing.included.items.seating.chips.tables");
      expect(result.length).toBeGreaterThan(0);
    });
  }

  it("catCount is identical in rendered residents chip across en/ja/zh", () => {
    const results = ["en", "ja", "zh"].map((lng) =>
      tAs(lng, "pricing.included.items.catFood.chips.residents", catCountVars),
    );
    for (const r of results) expect(r).toContain(String(catCount));
  });
});

describe("non-empty assertion — businessConfig throws on empty required fields", () => {
  it("all required string fields are non-empty (assertion runs at import)", () => {
    expect(BUSINESS_CONFIG.name.trim().length).toBeGreaterThan(0);
    expect(BUSINESS_CONFIG.contact.phone.trim().length).toBeGreaterThan(0);
    expect(BUSINESS_CONFIG.contact.email.trim().length).toBeGreaterThan(0);
    expect(BUSINESS_CONFIG.contact.instagramUrl.trim().length).toBeGreaterThan(0);
    expect(BUSINESS_CONFIG.urls.siteUrl.trim().length).toBeGreaterThan(0);
    expect(BUSINESS_CONFIG.urls.mapUrl.trim().length).toBeGreaterThan(0);
    expect(BUSINESS_CONFIG.address.full.trim().length).toBeGreaterThan(0);
    expect(BUSINESS_CONFIG.hours.open.trim().length).toBeGreaterThan(0);
    expect(BUSINESS_CONFIG.hours.close.trim().length).toBeGreaterThan(0);
    expect(BUSINESS_CONFIG.pricing.weekday.firstHour.trim().length).toBeGreaterThan(0);
    expect(BUSINESS_CONFIG.pricing.residentDiscount.trim().length).toBeGreaterThan(0);
  });
});
