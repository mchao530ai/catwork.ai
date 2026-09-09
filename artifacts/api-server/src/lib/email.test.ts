import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  BOOKING_NOTIFICATION_EMAIL,
  buildBookingConfirmationMailOptions,
  buildBookingNotificationMailOptions,
  normalizeBookingLanguage,
} from "./email";

const booking = {
  name: "Aiko Tanaka",
  email: "guest@example.com",
  phone: "+81 90 1234 5678",
  date: "2026-09-20",
  timeSlot: "14:00",
  partySize: 2,
  notes: "Window seat, please.",
};

describe("booking email recipients", () => {
  it("sends the owner reservation notification to the cafe business mailbox", () => {
    const options = buildBookingNotificationMailOptions(booking);

    assert.equal(BOOKING_NOTIFICATION_EMAIL, "info@catwork.ai");
    assert.equal(options.to, "info@catwork.ai");
    assert.equal(options.from, '"Catwork Cafe" <info@catwork.ai>');
    assert.equal(options.replyTo, booking.email);
  });

  it("keeps guest confirmations addressed to the submitted email", () => {
    const options = buildBookingConfirmationMailOptions(booking);

    assert.equal(options.to, booking.email);
    assert.equal(options.from, '"Catwork Cafe" <info@catwork.ai>');
    assert.equal(options.replyTo, "info@catwork.ai");
  });
});

describe("booking confirmation language", () => {
  it("normalizes supported and unsupported language values", () => {
    assert.equal(normalizeBookingLanguage("en"), "en");
    assert.equal(normalizeBookingLanguage("ja-JP"), "ja");
    assert.equal(normalizeBookingLanguage("zh-TW"), "zh");
    assert.equal(normalizeBookingLanguage("ko"), "en");
    assert.equal(normalizeBookingLanguage(undefined), "en");
  });

  it("builds an English confirmation by default", () => {
    const options = buildBookingConfirmationMailOptions(booking);

    assert.equal(options.subject, "Your reservation request at Catwork Cafe — 2026-09-20");
    assert.match(options.html, /We received your reservation request/);
    assert.match(options.html, /Hi Aiko Tanaka/);
    assert.match(options.html, />Date</);
    assert.match(options.html, /What happens next\?/);
    assert.match(options.html, /Cat treat set included!/);
  });

  it("builds a Japanese confirmation without English copy", () => {
    const options = buildBookingConfirmationMailOptions({ ...booking, language: "ja" });

    assert.equal(options.subject, "Catwork Cafe ご予約リクエスト — 2026-09-20");
    assert.match(options.html, /ご予約リクエストを受け付けました/);
    assert.match(options.html, /Aiko Tanaka様/);
    assert.match(options.html, />日付</);
    assert.match(options.html, /猫のおやつセットをご用意します/);
    assert.match(options.html, /次のステップ/);
    assert.doesNotMatch(options.html, /What happens next\?/);
  });

  it("builds a Traditional Chinese confirmation", () => {
    const options = buildBookingConfirmationMailOptions({ ...booking, language: "zh" });

    assert.equal(options.subject, "Catwork Cafe 預約申請 — 2026-09-20");
    assert.match(options.html, /我們已收到您的預約申請/);
    assert.match(options.html, /您好 Aiko Tanaka/);
    assert.match(options.html, />日期</);
    assert.match(options.html, /已包含貓咪零食套組/);
    assert.match(options.html, /接下來會怎麼進行？/);
  });

  it("falls back to English for an unknown language", () => {
    const options = buildBookingConfirmationMailOptions({ ...booking, language: "fr" });

    assert.equal(options.subject, "Your reservation request at Catwork Cafe — 2026-09-20");
    assert.match(options.html, /We received your reservation request/);
    assert.doesNotMatch(options.html, /ご予約リクエスト/);
  });

  it("escapes guest-provided confirmation content", () => {
    const options = buildBookingConfirmationMailOptions({
      ...booking,
      name: "<Aiko>",
      notes: "Please <call> & confirm",
    });

    assert.match(options.html, /&lt;Aiko&gt;/);
    assert.match(options.html, /Please &lt;call&gt; &amp; confirm/);
    assert.doesNotMatch(options.html, /<Aiko>/);
  });
});