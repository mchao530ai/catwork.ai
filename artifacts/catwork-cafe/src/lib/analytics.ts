export type AnalyticsEventName =
  | "booking_submitted"
  | "booking_submission_failed"
  | "contact_submitted"
  | "contact_submission_failed"
  | "google_sign_in_started"
  | "language_changed"
  | "contact_channel_clicked";

type AnalyticsData = Record<string, string | number | boolean>;

declare global {
  interface Window {
    umami?: {
      track(name: AnalyticsEventName, data?: AnalyticsData): void;
    };
  }
}

export function trackEvent(name: AnalyticsEventName, data?: AnalyticsData): void {
  if (typeof window === "undefined") return;

  try {
    window.umami?.track(name, data);
  } catch {
    // Analytics must never affect the visitor experience.
  }
}

export function analyticsLanguage(language: string): string {
  const code = language.split("-")[0];
  return code === "en" || code === "ja" || code === "zh" ? code : "other";
}