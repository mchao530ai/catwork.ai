const JST_TIME_ZONE = "Asia/Tokyo";

function formatDateParts(parts: Intl.DateTimeFormatPart[]): string {
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function getJstDateString(now = new Date()): string {
  return formatDateParts(
    new Intl.DateTimeFormat("en-US", {
      timeZone: JST_TIME_ZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(now),
  );
}

export function addDaysToDateString(dateString: string, days: number): string {
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0"),
  ].join("-");
}

export function dateFromDateString(dateString: string): Date {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day);
}