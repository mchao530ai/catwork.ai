import { useState, useEffect } from "react";
import { motion, type Variants } from "framer-motion";
import { Clock, MapPin, Phone, ChevronDown } from "lucide-react";
import { useSiteConfig } from "../hooks/useSiteConfig";
import PageMeta from "../components/shared/PageMeta";
import { useTranslation } from "react-i18next";
import BookingCalendar from "../components/BookingCalendar";
import { analyticsLanguage, trackEvent } from "../lib/analytics";

const GATE_SKIP_KEY = "cwc_skip_google_gate";

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } },
};

// Google "G" monogram SVG
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}

interface BookingForm {
  name: string;
  email: string;
  phone: string;
  date: string;
  timeSlot: string;
  partySize: string;
  notes: string;
}

export default function Visit() {
  const { config: SITE_CONFIG } = useSiteConfig();
  const TIME_SLOTS = SITE_CONFIG.bookingTimeSlots;
  const { t, i18n } = useTranslation();
  const compactDays = (SITE_CONFIG.hours.compact as Record<string, string>)[i18n.language] ?? SITE_CONFIG.hours.compact.en;
  const [form, setForm] = useState<BookingForm>({
    name: "",
    email: "",
    phone: "",
    date: "",
    timeSlot: "",
    partySize: "1",
    notes: "",
  });
  const [errors, setErrors] = useState<Partial<BookingForm>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Gate state: "gate" shows the sign-in card; "form" shows the booking form directly
  const [showGate, setShowGate] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState("");
  // Name from Google shown above form after sign-in
  const [googlePrefilled, setGooglePrefilled] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const googleToken = params.get("googleToken");
    const errorParam = params.get("googleError");

    // Clean URL immediately — no PII ever touches the address bar
    if (googleToken || errorParam) {
      window.history.replaceState({}, "", window.location.pathname);
    }

    if (googleToken) {
      // Exchange the opaque one-time token for the visitor profile
      fetch(`/api/auth/visitor/profile?token=${encodeURIComponent(googleToken)}`)
        .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
        .then((data: { name?: string; email?: string }) => {
          setForm((prev) => ({
            ...prev,
            name: data.name ?? prev.name,
            email: data.email ?? prev.email,
          }));
          setGooglePrefilled(data.name ?? data.email ?? "");
          setShowGate(false);
        })
        .catch(() => {
          setGoogleError(t("visit.form.googleGate.errorRetry"));
          setShowGate(false);
        });
      return;
    }

    if (errorParam) {
      // Google returned an error — skip gate and surface a message
      setGoogleError(t("visit.form.googleGate.errorRetry"));
      setShowGate(false);
      return;
    }

    // Show gate unless user already dismissed it this session
    if (!sessionStorage.getItem(GATE_SKIP_KEY)) {
      setShowGate(true);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleGoogleSignIn = async () => {
    trackEvent("google_sign_in_started", {
      location: "visit_booking_gate",
      language: analyticsLanguage(i18n.language),
    });
    setGoogleLoading(true);
    try {
      const res = await fetch("/api/auth/visitor/google");
      if (!res.ok) throw new Error("Not configured");
      const data = await res.json() as { authUrl?: string };
      if (data.authUrl) {
        window.location.href = data.authUrl;
      }
    } catch {
      setGoogleError(t("visit.form.googleGate.errorRetry"));
      setShowGate(false);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSkipGate = () => {
    sessionStorage.setItem(GATE_SKIP_KEY, "1");
    setShowGate(false);
  };

  const validate = () => {
    const e: Partial<BookingForm> = {};
    if (!form.name.trim()) e.name = t("visit.errors.name");
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) e.email = t("visit.errors.email");
    if (!form.date) e.date = t("visit.errors.date");
    if (!form.timeSlot) e.timeSlot = t("visit.errors.timeSlot");
    return e;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof BookingForm]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      trackEvent("booking_submission_failed", {
        failure: "validation",
        language: analyticsLanguage(i18n.language),
      });
      return;
    }
    setSubmitting(true);
    setSubmitError("");
    try {
      const language = i18n.language.split("-")[0];
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          date: form.date,
          timeSlot: form.timeSlot,
          partySize: form.partySize,
          notes: form.notes.trim(),
          language: language === "ja" || language === "zh" ? language : "en",
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { code?: string; error?: string };
        setSubmitError(
          data.code === "BOOKING_TOO_SOON"
            ? t("visit.errors.advanceBooking")
            : data.error ?? "Something went wrong. Please try again.",
        );
        trackEvent("booking_submission_failed", {
          failure: "server_response",
          language: analyticsLanguage(i18n.language),
        });
        return;
      }
      setSubmitted(true);
      trackEvent("booking_submitted", {
        language: analyticsLanguage(i18n.language),
        party_size: Number(form.partySize),
      });
    } catch {
      setSubmitError("Connection error. Please try again.");
      trackEvent("booking_submission_failed", {
        failure: "network",
        language: analyticsLanguage(i18n.language),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const guestCount = Number(form.partySize);
  const guestWord = guestCount === 1 ? t("visit.success.guest") : t("visit.success.guests");

  return (
    <>
      <PageMeta
        title={t("meta.visit.title")}
        description={t("meta.visit.desc")}
        path="/visit"
      />

      {/* Page Header */}
      <section className="pt-32 pb-16 sm:pt-40 sm:pb-20 px-4 sm:px-8 md:px-12 bg-[#FDFBF7]">
        <div className="max-w-6xl mx-auto">
          <motion.div initial="hidden" animate="visible" variants={fadeInUp}>
            <p className="text-[#D4A373] text-xs tracking-[0.3em] uppercase font-medium mb-5">{t("visit.header.label")}</p>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-['Playfair_Display'] text-[#1A1A1A] mb-6 leading-tight">
              {t("visit.header.heading")}
            </h1>
            <p className="text-[#1A1A1A]/60 text-base sm:text-lg font-light max-w-xl leading-relaxed">
              {t("visit.header.desc")}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Hours & Info */}
      <section className="py-16 sm:py-20 px-4 sm:px-8 md:px-12 bg-[#F4F1EA]">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <div className="bg-[#FDFBF7] p-7 sm:p-9 border border-[#1A1A1A]/6">
              <Clock className="w-5 h-5 text-[#D4A373] mb-5" />
              <h3 className="text-sm font-medium uppercase tracking-wider mb-3">{t("visit.hours.heading")}</h3>
              <p className="text-2xl font-['Playfair_Display'] mb-1">{SITE_CONFIG.hours.days}</p>
              <p className="text-[#D4A373] text-lg font-['Playfair_Display']">{SITE_CONFIG.hours.open} – {SITE_CONFIG.hours.close}</p>
              <p className="text-[#1A1A1A]/40 text-sm font-light mt-3">{t("visit.hours.closed")} {SITE_CONFIG.hours.closedDays}</p>
            </div>

            <div className="bg-[#FDFBF7] p-7 sm:p-9 border border-[#1A1A1A]/6">
              <MapPin className="w-5 h-5 text-[#D4A373] mb-5" />
              <h3 className="text-sm font-medium uppercase tracking-wider mb-3">{t("visit.location.heading")}</h3>
              <p className="text-[#1A1A1A]/70 font-light leading-relaxed">
                {SITE_CONFIG.address.street}<br />
                {SITE_CONFIG.address.city} {SITE_CONFIG.address.postalCode}<br />
                {SITE_CONFIG.address.country}
              </p>
              <p className="text-[#D4A373] text-sm mt-3">{SITE_CONFIG.address.directions}</p>
            </div>

            <div className="bg-[#FDFBF7] p-7 sm:p-9 border border-[#1A1A1A]/6">
              <Phone className="w-5 h-5 text-[#D4A373] mb-5" />
              <h3 className="text-sm font-medium uppercase tracking-wider mb-3">{t("visit.contact.heading")}</h3>
              <div className="space-y-3">
                <a
                  href={SITE_CONFIG.phoneHref}
                  onClick={() => trackEvent("contact_channel_clicked", { channel: "phone", location: "visit_contact_card" })}
                  className="block text-[#1A1A1A]/70 hover:text-[#D4A373] transition-colors font-light"
                >
                  {SITE_CONFIG.phone}
                </a>
                <a
                  href={`mailto:${SITE_CONFIG.email}`}
                  onClick={() => trackEvent("contact_channel_clicked", { channel: "email", location: "visit_contact_card" })}
                  className="block text-[#D4A373] hover:opacity-80 transition-opacity text-sm font-medium"
                >
                  {SITE_CONFIG.email}
                </a>
                <a
                  href={SITE_CONFIG.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackEvent("contact_channel_clicked", { channel: "instagram", location: "visit_contact_card" })}
                  className="block text-[#1A1A1A]/60 hover:text-[#D4A373] transition-colors text-sm font-light"
                >
                  {SITE_CONFIG.instagram}
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Booking Form */}
      <section className="py-20 sm:py-28 md:py-32 px-4 sm:px-8 md:px-12">
        <div className="max-w-2xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} className="mb-10">
            <p className="text-[#D4A373] text-xs tracking-[0.3em] uppercase font-medium mb-5">{t("visit.booking.label")}</p>
            <h2 className="text-3xl sm:text-4xl font-['Playfair_Display'] mb-4">{t("visit.booking.heading")}</h2>
            <p className="text-[#1A1A1A]/55 font-light leading-relaxed">
              {t("visit.booking.desc")}
            </p>
            <div className="mt-5 flex items-start gap-3 bg-[#D4A373]/10 border border-[#D4A373]/30 px-5 py-4">
              <span className="text-lg leading-none mt-0.5">🍪</span>
              <p className="text-[#8B6340] text-sm font-medium leading-relaxed">
                {t("visit.form.cookiePerk")}
              </p>
            </div>
          </motion.div>

          {/* Google sign-in gate */}
          {showGate && !submitted && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="border border-[#1A1A1A]/10 bg-[#FDFBF7] p-8 sm:p-10 text-center"
            >
              <p className="text-xs tracking-[0.2em] uppercase text-[#1A1A1A]/40 mb-3">
                {t("visit.form.googleGate.heading")}
              </p>
              <p className="text-[#1A1A1A]/60 text-sm font-light leading-relaxed max-w-sm mx-auto mb-7">
                {t("visit.form.googleGate.desc")}
              </p>
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={googleLoading}
                className="inline-flex items-center gap-3 px-6 py-3 bg-white border border-[#1A1A1A]/15 text-[#1A1A1A] text-sm font-medium hover:border-[#1A1A1A]/30 hover:shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed mx-auto"
              >
                <GoogleIcon />
                {googleLoading ? "…" : t("visit.form.googleGate.continueWithGoogle")}
              </button>
              <div className="mt-5">
                <button
                  type="button"
                  onClick={handleSkipGate}
                  className="text-xs text-[#1A1A1A]/40 hover:text-[#1A1A1A]/60 transition-colors underline underline-offset-2"
                >
                  {t("visit.form.googleGate.continueWithout")}
                </button>
              </div>
            </motion.div>
          )}

          {submitted ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="border-l-4 border-[#D4A373] bg-[#D4A373]/8 p-8 sm:p-10"
            >
              <h3 className="text-xl sm:text-2xl font-['Playfair_Display'] text-[#1A1A1A] mb-3">
                {t("visit.success.heading")}, {form.name.split(" ")[0]}
              </h3>
              <p className="text-[#1A1A1A]/65 font-light leading-relaxed mb-6">
                {t("visit.success.desc", { date: form.date, time: form.timeSlot, count: form.partySize, guestWord })}
              </p>
              <p className="text-[#1A1A1A]/45 text-sm font-light">
                {t("visit.success.reachUs")}{" "}
                <a
                  href={`mailto:${SITE_CONFIG.email}`}
                  onClick={() => trackEvent("contact_channel_clicked", { channel: "email", location: "visit_success" })}
                  className="text-[#D4A373] hover:opacity-80"
                >
                  {SITE_CONFIG.email}
                </a>
                {" "}{t("visit.success.or")}{" "}
                <a
                  href={SITE_CONFIG.phoneHref}
                  onClick={() => trackEvent("contact_channel_clicked", { channel: "phone", location: "visit_success" })}
                  className="text-[#D4A373] hover:opacity-80"
                >
                  {SITE_CONFIG.phone}
                </a>.
              </p>
            </motion.div>
          ) : !showGate ? (
            <motion.form
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              onSubmit={handleSubmit}
              className="space-y-6"
              noValidate
            >
              {/* Google error notice */}
              {googleError && (
                <div className="flex items-start gap-3 border border-amber-200 bg-amber-50 px-4 py-3 rounded-sm">
                  <span className="text-amber-500 mt-0.5">⚠</span>
                  <p className="text-amber-700 text-sm font-light">{googleError}</p>
                </div>
              )}

              {/* Pre-filled badge */}
              {googlePrefilled && (
                <div className="flex items-center justify-between border border-[#D4A373]/30 bg-[#D4A373]/8 px-4 py-3 rounded-sm">
                  <p className="text-[#8B6340] text-sm font-medium">
                    ✓ {t("visit.form.googleGate.prefilled")} <span className="font-semibold">{googlePrefilled}</span>
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setGooglePrefilled("");
                      setForm((prev) => ({ ...prev, name: "", email: "" }));
                    }}
                    className="text-xs text-[#8B6340]/70 hover:text-[#8B6340] transition-colors underline underline-offset-2 ml-4"
                  >
                    {t("visit.form.googleGate.change")}
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs tracking-wider uppercase text-[#1A1A1A]/60 mb-2" htmlFor="name">
                    {t("visit.form.name")} <span className="text-[#D4A373]">*</span>
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={form.name}
                    onChange={handleChange}
                    placeholder={t("visit.form.namePlaceholder")}
                    className={`w-full border px-4 py-3 text-sm bg-transparent focus:outline-none focus:border-[#D4A373] transition-colors ${errors.name ? "border-red-400" : "border-[#1A1A1A]/15"}`}
                  />
                  {errors.name && <p className="text-red-500 text-xs mt-1.5">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-xs tracking-wider uppercase text-[#1A1A1A]/60 mb-2" htmlFor="email">
                    {t("visit.form.email")} <span className="text-[#D4A373]">*</span>
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="your@email.com"
                    className={`w-full border px-4 py-3 text-sm bg-transparent focus:outline-none focus:border-[#D4A373] transition-colors ${errors.email ? "border-red-400" : "border-[#1A1A1A]/15"}`}
                  />
                  {errors.email && <p className="text-red-500 text-xs mt-1.5">{errors.email}</p>}
                </div>
              </div>

              <div>
                <label className="block text-xs tracking-wider uppercase text-[#1A1A1A]/60 mb-2" htmlFor="phone">
                  {t("visit.form.phone")} <span className="text-[#1A1A1A]/30 text-xs normal-case">{t("visit.form.phoneOptional")}</span>
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder={t("visit.form.phonePlaceholder")}
                  className="w-full border border-[#1A1A1A]/15 px-4 py-3 text-sm bg-transparent focus:outline-none focus:border-[#D4A373] transition-colors"
                />
              </div>

              {/* Date — full-width calendar */}
              <div>
                <label className="block text-xs tracking-wider uppercase text-[#1A1A1A]/60 mb-2">
                  {t("visit.form.date")} <span className="text-[#D4A373]">*</span>
                </label>
                <BookingCalendar
                  value={form.date}
                  onChange={(date) => {
                    setForm((prev) => ({ ...prev, date }));
                    if (errors.date) setErrors((prev) => ({ ...prev, date: undefined }));
                  }}
                  hasError={!!errors.date}
                />
                <p
                  data-testid="advance-booking-notice"
                  className="text-[#8B6340] text-xs mt-2"
                >
                  {t("visit.form.advanceBookingNotice")}
                </p>
                {errors.date && <p className="text-red-500 text-xs mt-1.5">{errors.date}</p>}
                <p className="text-[#1A1A1A]/35 text-xs mt-1.5">{t("visit.form.daysOnly", { days: compactDays })}</p>
                {form.date && (
                  <p className="mt-2 px-3 py-2 bg-[#D4A373]/12 border border-[#D4A373]/30 text-[#8B6340] text-xs font-medium rounded-sm">
                    {t("visit.form.dayBeforePerk")}
                  </p>
                )}
              </div>

              {/* Time slot + Party size */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs tracking-wider uppercase text-[#1A1A1A]/60 mb-2" htmlFor="timeSlot">
                    {t("visit.form.arrivalTime")} <span className="text-[#D4A373]">*</span>
                  </label>
                  <div className="relative">
                    <select
                      id="timeSlot"
                      name="timeSlot"
                      value={form.timeSlot}
                      onChange={handleChange}
                      className={`w-full border px-4 py-3 text-sm bg-[#FDFBF7] focus:outline-none focus:border-[#D4A373] transition-colors appearance-none ${errors.timeSlot ? "border-red-400" : "border-[#1A1A1A]/15"}`}
                    >
                      <option value="">{t("visit.form.selectTimeSlot")}</option>
                      {TIME_SLOTS.map((slot) => (
                        <option key={slot} value={slot}>{slot}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1A1A1A]/40 pointer-events-none" />
                  </div>
                  {errors.timeSlot && <p className="text-red-500 text-xs mt-1.5">{errors.timeSlot}</p>}
                </div>

                <div>
                  <label className="block text-xs tracking-wider uppercase text-[#1A1A1A]/60 mb-2" htmlFor="partySize">
                    {t("visit.form.partySize")}
                  </label>
                  <div className="relative">
                    <select
                      id="partySize"
                      name="partySize"
                      value={form.partySize}
                      onChange={handleChange}
                      className="w-full border border-[#1A1A1A]/15 px-4 py-3 text-sm bg-[#FDFBF7] focus:outline-none focus:border-[#D4A373] transition-colors appearance-none"
                    >
                      {["1", "2", "3", "4", "5", "6", "7", "8"].map((n) => (
                        <option key={n} value={n}>{n} {Number(n) === 1 ? t("visit.form.guest") : t("visit.form.guests")}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1A1A1A]/40 pointer-events-none" />
                  </div>
                  <p className="text-[#1A1A1A]/35 text-xs mt-1.5">{t("visit.form.groupNote")}</p>
                </div>
              </div>

              <div>
                <label className="block text-xs tracking-wider uppercase text-[#1A1A1A]/60 mb-2" htmlFor="notes">
                  {t("visit.form.notes")} <span className="text-[#1A1A1A]/30 text-xs normal-case">{t("visit.form.notesOptional")}</span>
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  rows={4}
                  placeholder={t("visit.form.notesPlaceholder")}
                  className="w-full border border-[#1A1A1A]/15 px-4 py-3 text-sm bg-transparent focus:outline-none focus:border-[#D4A373] transition-colors resize-none"
                />
              </div>

              {submitError && (
                <p className="text-red-500 text-sm border border-red-200 bg-red-50 px-4 py-3 rounded-sm">{submitError}</p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 bg-[#1A1A1A] text-[#FDFBF7] text-xs tracking-[0.2em] uppercase font-medium hover:bg-[#D4A373] transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "Sending…" : t("visit.form.submit")}
              </button>

              <p className="text-[#1A1A1A]/35 text-xs leading-relaxed text-center">
                {t("visit.form.noPayment")}
              </p>
            </motion.form>
          ) : null}
        </div>
      </section>

      {/* Email CTA */}
      <section className="py-16 sm:py-20 bg-[#1A1A1A] text-center px-4 sm:px-8">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} className="max-w-xl mx-auto">
          <p className="text-[#FDFBF7]/50 text-sm font-light mb-6">{t("visit.emailCta.question")}</p>
          <a
            href={`mailto:${SITE_CONFIG.email}`}
            onClick={() => trackEvent("contact_channel_clicked", { channel: "email", location: "visit_cta" })}
            className="inline-flex items-center gap-3 px-8 py-4 bg-[#D4A373] text-white text-sm tracking-widest uppercase font-medium rounded-full hover:bg-[#c49265] transition-colors"
          >
            {SITE_CONFIG.email}
          </a>
          <p className="text-[#FDFBF7]/30 text-xs mt-5">{t("visit.emailCta.reply")}</p>
        </motion.div>
      </section>
    </>
  );
}
