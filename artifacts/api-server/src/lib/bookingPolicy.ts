const JST_TIME_ZONE = "Asia/Tokyo";
export const MIN_BOOKING_DAYS_AHEAD = 1;

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

export function isValidIsoDate(dateString: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return false;
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export function isBookingDateTooSoon(dateString: string, now = new Date()): boolean {
  if (!isValidIsoDate(dateString)) return true;
  const earliestDate = addDaysToDateString(
    getJstDateString(now),
    MIN_BOOKING_DAYS_AHEAD,
  );
  return dateString < earliestDate;
}