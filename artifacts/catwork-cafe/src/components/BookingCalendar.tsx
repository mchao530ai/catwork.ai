import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { addDaysToDateString, dateFromDateString, getJstDateString } from "../lib/bookingPolicy";

// Closed weekdays (JS Date.getDay()): Monday = 1, Thursday = 4
const CLOSED_JS_DAYS = new Set([1, 4]);

function toDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

interface BookingCalendarProps {
  value: string; // YYYY-MM-DD or ""
  onChange: (date: string) => void;
  hasError?: boolean;
}

export default function BookingCalendar({ value, onChange, hasError }: BookingCalendarProps) {
  const { i18n } = useTranslation();
  const locale =
    i18n.language === "zh" ? "zh-TW" :
    i18n.language === "ja" ? "ja-JP" :
    "en-US";

  const todayString = useMemo(() => getJstDateString(), []);
  const earliestBookingDate = useMemo(
    () => addDaysToDateString(todayString, 1),
    [todayString],
  );
  const earliestBookingDateValue = useMemo(
    () => dateFromDateString(earliestBookingDate),
    [earliestBookingDate],
  );

  const [viewYear, setViewYear] = useState(() => earliestBookingDateValue.getFullYear());
  const [viewMonth, setViewMonth] = useState(() => earliestBookingDateValue.getMonth());

  // Localised month + year heading
  const monthLabel = useMemo(
    () => new Date(viewYear, viewMonth, 1).toLocaleDateString(locale, { month: "long", year: "numeric" }),
    [viewYear, viewMonth, locale],
  );

  // Mon–Sun weekday header labels (Jan 1 2024 is a Monday — use that week)
  const weekdayLabels = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(2024, 0, 1 + i); // Mon 1 Jan … Sun 7 Jan
      const jsDay = d.getDay(); // 1..0
      return {
        label: d.toLocaleDateString(locale, { weekday: "short" }),
        jsDay,
        closed: CLOSED_JS_DAYS.has(jsDay),
      };
    });
  }, [locale]);

  // Calendar cells — null = padding, Date = actual day
  const cells = useMemo(() => {
    const first = new Date(viewYear, viewMonth, 1);
    const last = new Date(viewYear, viewMonth + 1, 0);
    // Monday-indexed offset: Sun(0)→6, Mon(1)→0, Tue(2)→1, …
    const offset = (first.getDay() + 6) % 7;
    const result: (Date | null)[] = Array(offset).fill(null);
    for (let d = 1; d <= last.getDate(); d++) {
      result.push(new Date(viewYear, viewMonth, d));
    }
    while (result.length % 7 !== 0) result.push(null);
    return result;
  }, [viewYear, viewMonth]);

  const canGoPrev =
    viewYear > earliestBookingDateValue.getFullYear() ||
    (viewYear === earliestBookingDateValue.getFullYear() &&
      viewMonth > earliestBookingDateValue.getMonth());

  const goPrev = () => {
    if (!canGoPrev) return;
    if (viewMonth === 0) { setViewYear((y) => y - 1); setViewMonth(11); }
    else setViewMonth((m) => m - 1);
  };

  const goNext = () => {
    if (viewMonth === 11) { setViewYear((y) => y + 1); setViewMonth(0); }
    else setViewMonth((m) => m + 1);
  };

  const handleClick = (date: Date) => {
    const dateString = toDateString(date);
    if (dateString < earliestBookingDate || CLOSED_JS_DAYS.has(date.getDay())) return;
    onChange(dateString);
  };

  return (
    <div
      className={`border rounded-sm select-none ${
        hasError ? "border-red-400" : "border-[#1A1A1A]/15"
      }`}
    >
      {/* Month navigation */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#1A1A1A]/8">
        <button
          type="button"
          onClick={goPrev}
          disabled={!canGoPrev}
          aria-label="Previous month"
          className="p-1.5 rounded-sm hover:bg-[#1A1A1A]/6 transition-colors disabled:opacity-25 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4 text-[#1A1A1A]/60" />
        </button>

        <span className="text-sm font-medium text-[#1A1A1A] capitalize tracking-wide">
          {monthLabel}
        </span>

        <button
          type="button"
          onClick={goNext}
          aria-label="Next month"
          className="p-1.5 rounded-sm hover:bg-[#1A1A1A]/6 transition-colors"
        >
          <ChevronRight className="w-4 h-4 text-[#1A1A1A]/60" />
        </button>
      </div>

      <div className="px-3 py-3">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 mb-1">
          {weekdayLabels.map(({ label, jsDay, closed }) => (
            <div
              key={jsDay}
              className={`text-center text-[10px] uppercase tracking-wider py-1 font-medium ${
                closed ? "text-[#1A1A1A]/22" : "text-[#1A1A1A]/45"
              }`}
            >
              {label}
            </div>
          ))}
        </div>

        {/* Day grid */}
        <div className="grid grid-cols-7 gap-y-0.5">
          {cells.map((date, i) => {
            if (!date) return <div key={`pad-${i}`} className="aspect-square" />;

            const str = toDateString(date);
            const isBeforeMinimum = str < earliestBookingDate;
            const isClosed = CLOSED_JS_DAYS.has(date.getDay());
            const isUnavailable = isBeforeMinimum || isClosed;
            const isSelected = str === value;
            const isToday = str === todayString;

            return (
              <div key={str} className="flex items-center justify-center aspect-square">
                <button
                  type="button"
                  onClick={() => handleClick(date)}
                  disabled={isUnavailable}
                  aria-label={str}
                  aria-pressed={isSelected}
                  className={[
                    "w-8 h-8 sm:w-9 sm:h-9 text-xs sm:text-sm rounded-sm transition-colors",
                    isSelected
                      ? "bg-[#1A1A1A] text-white font-semibold"
                      : isUnavailable
                      ? "text-[#1A1A1A]/22 cursor-not-allowed"
                      : isToday
                      ? "ring-1 ring-[#D4A373] text-[#1A1A1A] font-medium hover:bg-[#D4A373]/12"
                      : "text-[#1A1A1A]/80 hover:bg-[#1A1A1A]/7 hover:text-[#1A1A1A]",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {date.getDate()}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
