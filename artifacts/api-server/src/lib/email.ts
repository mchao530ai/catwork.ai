import nodemailer from "nodemailer";

const MAILBOX_EMAIL = "info@catwork.ai";
const SMTP_AUTH_EMAIL = "info.catworkai@gmail.com";
const FROM_EMAIL = "info@catwork.ai";
export const BOOKING_NOTIFICATION_EMAIL = MAILBOX_EMAIL;

function createTransporter(): nodemailer.Transporter | null {
  const pass = process.env["GMAIL_APP_PASSWORD"]?.replace(/\s+/g, "");
  if (!pass) return null;
  return nodemailer.createTransport({
    service: "gmail",
    auth: { user: SMTP_AUTH_EMAIL, pass },
  });
}

function jstNow(locale = "en-US") {
  return new Date().toLocaleString(locale, {
    timeZone: "Asia/Tokyo",
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function isTomorrowJST(dateStr: string): boolean {
  const jstMs = Date.now() + 9 * 60 * 60 * 1000;
  const tomorrowJst = new Date(jstMs + 24 * 60 * 60 * 1000);
  const tomorrowStr = tomorrowJst.toISOString().split("T")[0];
  return dateStr === tomorrowStr;
}

function emailWrapper(title: string, bodyRows: string, replyEmail: string, replyName: string, footerNote: string) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Georgia, serif; background: #FDFBF7; margin: 0; padding: 0;">
  <div style="max-width: 560px; margin: 40px auto; background: #fff; border: 1px solid #e8e0d5; border-top: 4px solid #D4A373;">
    <div style="padding: 32px 36px 24px;">
      <p style="color: #D4A373; font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; margin: 0 0 6px;">Catwork Cafe</p>
      <h1 style="color: #1A1A1A; font-size: 22px; margin: 0 0 24px; font-weight: normal;">${title}</h1>
      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        ${bodyRows}
      </table>
      <div style="margin-top: 28px; padding-top: 20px; border-top: 1px solid #f0ebe3;">
        <a href="mailto:${replyEmail}" style="display: inline-block; background: #1A1A1A; color: #fff; text-decoration: none; font-size: 12px; letter-spacing: 0.15em; text-transform: uppercase; padding: 10px 24px;">Reply to ${replyName}</a>
      </div>
    </div>
    <div style="background: #f7f3ed; padding: 16px 36px; font-size: 11px; color: #999;">
      ${footerNote} &middot; ${jstNow()} JST
    </div>
  </div>
</body>
</html>`;
}

function row(label: string, value: string, first = false) {
  const border = first ? "" : `border-top: 1px solid #f0ebe3;`;
  return `<tr style="${border}">
    <td style="color: #999; padding: 8px 0; width: 120px; vertical-align: top;">${label}</td>
    <td style="color: #1A1A1A; padding: 8px 0;">${value}</td>
  </tr>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

const ENQUIRY_TYPE_LABELS: Record<string, string> = {
  general: "General Enquiry",
  private_hire: "Private Event / Hire",
  partnership: "Partnership / Collaboration",
};

type BookingEmailData = {
  name: string;
  email: string;
  phone?: string;
  date: string;
  timeSlot: string;
  partySize: string | number;
  notes?: string;
  language?: string;
};

export type BookingLanguage = "en" | "ja" | "zh";

export function normalizeBookingLanguage(language: unknown): BookingLanguage {
  if (typeof language !== "string") return "en";
  const base = language.trim().toLowerCase().split("-")[0];
  return base === "ja" || base === "zh" ? base : "en";
}

export async function sendEnquiryNotification(data: {
  name: string;
  email: string;
  phone?: string;
  enquiryType: string;
  subject?: string;
  message: string;
}): Promise<{ sent: boolean; error?: string }> {
  const transporter = createTransporter();
  if (!transporter) {
    return { sent: false, error: "Email not configured (GMAIL_APP_PASSWORD missing)" };
  }

  const typeLabel = ENQUIRY_TYPE_LABELS[data.enquiryType] ?? data.enquiryType;
  const subjectLine = data.subject?.trim()
    ? `[Catwork Cafe Enquiry] ${data.subject}`
    : `[Catwork Cafe Enquiry] ${typeLabel} from ${data.name}`;

  const rows = [
    row("Type", `<strong>${typeLabel}</strong>`, true),
    row("Name", data.name),
    row("Email", `<a href="mailto:${data.email}" style="color:#D4A373;">${data.email}</a>`),
    data.phone ? row("Phone", data.phone) : "",
    data.subject ? row("Subject", data.subject) : "",
    row("Message", `<span style="white-space:pre-wrap;line-height:1.6;">${data.message}</span>`),
  ].join("");

  const html = emailWrapper(
    "New Enquiry Received",
    rows,
    data.email,
    data.name,
    "Sent from the Catwork Cafe contact form",
  );

  try {
    await transporter.sendMail({
      from: `"Catwork Cafe" <${FROM_EMAIL}>`,
      to: MAILBOX_EMAIL,
      replyTo: data.email,
      subject: subjectLine,
      html,
    });
    return { sent: true };
  } catch (err) {
    return { sent: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export function buildBookingConfirmationMailOptions(data: BookingEmailData) {
  const guestCount = Number(data.partySize);
  const language = normalizeBookingLanguage(data.language);
  const copy = {
    en: {
      subject: "Your reservation request at Catwork Cafe",
      eyebrow: "Catwork Cafe · Echigo Yuzawa",
      title: "We received your reservation request",
      greeting: (name: string) => `Hi ${name}, we'll confirm your visit within 1 business day.`,
      date: "Date",
      time: "Time",
      partySize: "Party size",
      guest: "guest",
      guests: "guests",
      notes: "Your notes",
      treatTitle: "Cat treat set included!",
      treatBody: "You reserved in advance — we'll have a set of cat treats ready for you at the door.",
      nextTitle: "What happens next?",
      nextBody: "We'll reply to this email to confirm your booking. If you need to make changes or have any questions, just reply here or call us at",
      nextSuffix: ".",
      footer: "Catwork Cafe · 3-3-13 Yuzawa, Minamiuonuma, Niigata",
      locale: "en-US",
    },
    ja: {
      subject: "Catwork Cafe ご予約リクエスト",
      eyebrow: "Catwork Cafe · 越後湯沢",
      title: "ご予約リクエストを受け付けました",
      greeting: (name: string) => `${name}様、ご予約ありがとうございます。1営業日以内にご来店を確認いたします。`,
      date: "日付",
      time: "時間",
      partySize: "人数",
      guest: "名",
      guests: "名",
      notes: "備考",
      treatTitle: "猫のおやつセットをご用意します！",
      treatBody: "事前にご予約いただいたため、ご来店時に猫のおやつセットをご用意します。",
      nextTitle: "次のステップ",
      nextBody: "予約内容を確認のうえ、このメールに返信してご連絡します。変更やご質問がございましたら、このメールへの返信またはお電話（",
      nextSuffix: "）。",
      footer: "Catwork Cafe · 新潟県南魚沼郡湯沢町湯沢3-3-13",
      locale: "ja-JP",
    },
    zh: {
      subject: "Catwork Cafe 預約申請",
      eyebrow: "Catwork Cafe · 越後湯澤",
      title: "我們已收到您的預約申請",
      greeting: (name: string) => `您好 ${name}，我們將在1個工作日內確認您的到訪。`,
      date: "日期",
      time: "時段",
      partySize: "人數",
      guest: "位",
      guests: "位",
      notes: "備註",
      treatTitle: "已包含貓咪零食套組！",
      treatBody: "您已提前預約——我們會在入口為您準備一份貓咪零食套組。",
      nextTitle: "接下來會怎麼進行？",
      nextBody: "我們會回覆這封電子郵件確認您的預約。如需修改預約或有任何問題，請直接回覆此信，或致電",
      nextSuffix: "。",
      footer: "Catwork Cafe · 新潟縣南魚沼郡湯澤町湯澤3-3-13",
      locale: "zh-TW",
    },
  }[language];
  const guestWord = guestCount === 1 ? copy.guest : copy.guests;
  const subjectLine = `${copy.subject} — ${data.date}`;
  const safeName = escapeHtml(data.name);
  const safeDate = escapeHtml(data.date);
  const safeTimeSlot = escapeHtml(data.timeSlot);
  const safeNotes = data.notes ? escapeHtml(data.notes) : "";
  const rows = [
    row(copy.date, `<strong>${safeDate}</strong>`, true),
    row(copy.time, safeTimeSlot),
    row(copy.partySize, `${guestCount} ${guestWord}`),
    data.notes ? row(copy.notes, `<span style="white-space:pre-wrap;line-height:1.6;">${safeNotes}</span>`) : "",
  ].join("");

  const cookieBlock = `
      <div style="margin-top: 20px; padding: 16px 20px; background: #fff8f0; border: 1px solid #e8c99a; border-left: 4px solid #D4A373; font-size: 13px; color: #6b4c28; line-height: 1.6;">
        🐱 <strong>${copy.treatTitle}</strong><br>
        ${copy.treatBody}
      </div>`;

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Georgia, serif; background: #FDFBF7; margin: 0; padding: 0;">
  <div style="max-width: 560px; margin: 40px auto; background: #fff; border: 1px solid #e8e0d5; border-top: 4px solid #D4A373;">
    <div style="padding: 32px 36px 24px;">
      <p style="color: #D4A373; font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; margin: 0 0 6px;">${copy.eyebrow}</p>
      <h1 style="color: #1A1A1A; font-size: 22px; margin: 0 0 8px; font-weight: normal;">${copy.title}</h1>
      <p style="color: #1A1A1A; opacity: 0.6; font-size: 14px; margin: 0 0 24px; font-weight: 300;">${copy.greeting(safeName)}</p>
      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        ${rows}
      </table>${cookieBlock}
      <div style="margin-top: 28px; padding: 20px; background: #F4F1EA; font-size: 13px; color: #1A1A1A; line-height: 1.6;">
        <strong>${copy.nextTitle}</strong><br>
        ${copy.nextBody} <a href="tel:+8107044206344" style="color: #D4A373;">+81 070-4420-6344</a>${copy.nextSuffix}
      </div>
    </div>
    <div style="background: #f7f3ed; padding: 16px 36px; font-size: 11px; color: #999;">
      ${copy.footer} &middot; ${jstNow(copy.locale)} JST
    </div>
  </div>
</body>
</html>`;

  return {
      from: `"Catwork Cafe" <${FROM_EMAIL}>`,
      to: data.email,
      replyTo: MAILBOX_EMAIL,
      subject: subjectLine,
      html,
  };
}

export async function sendBookingConfirmation(data: BookingEmailData): Promise<{ sent: boolean; error?: string }> {
  const transporter = createTransporter();
  if (!transporter) {
    return { sent: false, error: "Email not configured (GMAIL_APP_PASSWORD missing)" };
  }

  try {
    await transporter.sendMail(buildBookingConfirmationMailOptions(data));
    return { sent: true };
  } catch (err) {
    return { sent: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function sendCatPresenceNotification(
  catName: string,
  emails: string[],
): Promise<{ sent: boolean; error?: string }> {
  const transporter = createTransporter();
  if (!transporter) {
    return { sent: false, error: "Email not configured (GMAIL_APP_PASSWORD missing)" };
  }

  const subjectLine = `${catName} is at Catwork Cafe today! 🐱`;

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Georgia, serif; background: #FDFBF7; margin: 0; padding: 0;">
  <div style="max-width: 560px; margin: 40px auto; background: #fff; border: 1px solid #e8e0d5; border-top: 4px solid #D4A373;">
    <div style="padding: 32px 36px 24px;">
      <p style="color: #D4A373; font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; margin: 0 0 6px;">Catwork Cafe</p>
      <h1 style="color: #1A1A1A; font-size: 22px; margin: 0 0 16px; font-weight: normal;">${catName} is here today</h1>
      <p style="color: #555; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
        You asked us to let you know when <strong>${catName}</strong> arrives at the café — and today's the day!
        Come visit us to spend some time with ${catName}.
      </p>
      <a href="https://catworkcafe.com/visit" style="display: inline-block; background: #1A1A1A; color: #fff; text-decoration: none; font-size: 12px; letter-spacing: 0.15em; text-transform: uppercase; padding: 10px 24px;">Plan Your Visit</a>
    </div>
    <div style="background: #f7f3ed; padding: 16px 36px; font-size: 11px; color: #999;">
      You received this because you subscribed to notifications for ${catName} on the Catwork Cafe website. &middot; ${jstNow()} JST
    </div>
  </div>
</body>
</html>`;

  try {
    await transporter.sendMail({
      from: `"Catwork Cafe" <${FROM_EMAIL}>`,
      bcc: emails,
      subject: subjectLine,
      html,
    });
    return { sent: true };
  } catch (err) {
    return { sent: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function sendDailyReport(data: {
  date: string;
  bookings: Array<{ name: string; timeSlot: string; partySize: number }>;
  baseEntryPrice: number;
}): Promise<{ sent: boolean; error?: string }> {
  const transporter = createTransporter();
  if (!transporter) {
    return { sent: false, error: "Email not configured (GMAIL_APP_PASSWORD missing)" };
  }

  const totalGuests = data.bookings.reduce((sum, b) => sum + b.partySize, 0);
  const estimatedRevenue = data.baseEntryPrice > 0 ? data.baseEntryPrice * totalGuests : null;
  const bookingCount = data.bookings.length;

  const summaryRows = [
    row("Date", `<strong>${data.date}</strong>`, true),
    row("Bookings", String(bookingCount)),
    row("Total guests", String(totalGuests)),
    row(
      "Est. revenue",
      estimatedRevenue !== null && bookingCount > 0
        ? `¥${estimatedRevenue.toLocaleString()}`
        : "—",
    ),
  ].join("");

  const bookingLines =
    bookingCount === 0
      ? `<tr><td colspan="2" style="color:#999; padding: 16px 0; font-size: 13px; border-top: 1px solid #f0ebe3;">No bookings recorded for today.</td></tr>`
      : data.bookings
          .map(
            (b, i) =>
              row(
                `Booking ${i + 1}`,
                `${b.name} · ${b.timeSlot} · ${b.partySize} ${b.partySize === 1 ? "guest" : "guests"}`,
                i === 0,
              ),
          )
          .join("");

  const sectionHeader = `<tr><td colspan="2" style="padding: 16px 0 4px; color: #999; font-size: 11px; text-transform: uppercase; letter-spacing: 0.12em; border-top: 1px solid #f0ebe3;">Bookings detail</td></tr>`;

  const html = emailWrapper(
    `Daily Report — ${data.date}`,
    summaryRows + sectionHeader + bookingLines,
    MAILBOX_EMAIL,
    "Catwork Cafe",
    "Automated daily operations report",
  );

  try {
    await transporter.sendMail({
      from: `"Catwork Cafe" <${FROM_EMAIL}>`,
      to: MAILBOX_EMAIL,
      subject: `[Catwork Cafe] Daily Report — ${data.date}`,
      html,
    });
    return { sent: true };
  } catch (err) {
    return { sent: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export function buildBookingNotificationMailOptions(data: BookingEmailData) {
  const guestCount = Number(data.partySize);
  const guestWord = guestCount === 1 ? "guest" : "guests";
  const subjectLine = `🐱 [Catwork Cafe Booking] ${data.name} — ${data.date} ${data.timeSlot} · CAT TREAT SET`;

  const cookieBanner = `<tr><td colspan="2" style="padding: 12px 16px; background: #fff8f0; border: 1px solid #e8c99a; border-left: 4px solid #D4A373; font-size: 13px; color: #6b4c28; font-weight: bold;">🐱 Advance reservation — prepare a cat treat set for this guest at the door.</td></tr>`;

  const rows = [
    cookieBanner,
    row("Date", `<strong>${data.date}</strong>`, true),
    row("Time", data.timeSlot),
    row("Party size", `${guestCount} ${guestWord}`),
    row("Name", data.name),
    row("Email", `<a href="mailto:${data.email}" style="color:#D4A373;">${data.email}</a>`),
    data.phone ? row("Phone", data.phone) : "",
    data.notes ? row("Notes", `<span style="white-space:pre-wrap;line-height:1.6;">${data.notes}</span>`) : "",
  ].join("");

  const html = emailWrapper(
    "New Reservation Request",
    rows,
    data.email,
    data.name,
    "Sent from the Catwork Cafe reservation form",
  );

  return {
      from: `"Catwork Cafe" <${FROM_EMAIL}>`,
      to: BOOKING_NOTIFICATION_EMAIL,
      replyTo: data.email,
      subject: subjectLine,
      html,
  };
}

export async function sendBookingNotification(data: BookingEmailData): Promise<{ sent: boolean; error?: string }> {
  const transporter = createTransporter();
  if (!transporter) {
    return { sent: false, error: "Email not configured (GMAIL_APP_PASSWORD missing)" };
  }

  try {
    await transporter.sendMail(buildBookingNotificationMailOptions(data));
    return { sent: true };
  } catch (err) {
    return { sent: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function sendAdminReply(data: {
  to: string;
  subject: string;
  message: string;
}): Promise<{ sent: boolean; error?: string }> {
  const transporter = createTransporter();
  if (!transporter) {
    return { sent: false, error: "Email is not configured on the server." };
  }

  const safeMessage = escapeHtml(data.message);
  const html = emailWrapper(
    "A message from Catwork Cafe",
    row("Message", `<span style="white-space:pre-wrap;line-height:1.6;">${safeMessage}</span>`, true),
    MAILBOX_EMAIL,
    "Catwork Cafe",
    "Sent by the Catwork Cafe team",
  );

  try {
    await transporter.sendMail({
      from: `"Catwork Cafe" <${FROM_EMAIL}>`,
      to: data.to,
      replyTo: MAILBOX_EMAIL,
      subject: data.subject,
      text: data.message,
      html,
    });
    return { sent: true };
  } catch (err) {
    return { sent: false, error: err instanceof Error ? err.message : String(err) };
  }
}
