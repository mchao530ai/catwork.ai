import { useState } from "react";
import { motion, type Variants } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useSiteConfig } from "../hooks/useSiteConfig";
import PageMeta from "../components/shared/PageMeta";
import { useTranslation } from "react-i18next";
import { analyticsLanguage, trackEvent } from "../lib/analytics";

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } },
};

type EnquiryType = "general" | "private_hire" | "partnership";

interface ContactForm {
  name: string;
  email: string;
  phone: string;
  enquiryType: EnquiryType;
  subject: string;
  message: string;
}

export default function Contact() {
  const { config: SITE_CONFIG } = useSiteConfig();
  const { t, i18n } = useTranslation();
  const compactDays = (SITE_CONFIG.hours.compact as Record<string, string>)[i18n.language] ?? SITE_CONFIG.hours.compact.en;

  const ENQUIRY_TYPES: { value: EnquiryType; label: string; labelJa: string; placeholder: string }[] = [
    {
      value: "general",
      label: "General Enquiry",
      labelJa: "一般問い合わせ",
      placeholder: "E.g. I'd like to know more about visiting with a group...",
    },
    {
      value: "private_hire",
      label: "Private Event / Hire",
      labelJa: "プライベートイベント・貸し切り",
      placeholder: "E.g. We'd like to hire the café for a birthday party for 8 people on...",
    },
    {
      value: "partnership",
      label: "Partnership / Collaboration",
      labelJa: "パートナーシップ・コラボ",
      placeholder: "E.g. We are a local tourism company and would like to propose...",
    },
  ];

  const [form, setForm] = useState<ContactForm>({
    name: "",
    email: "",
    phone: "",
    enquiryType: "general",
    subject: "",
    message: "",
  });
  const [errors, setErrors] = useState<Partial<ContactForm>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof ContactForm]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validate = () => {
    const e: Partial<ContactForm> = {};
    if (!form.name.trim()) e.name = t("contact.errors.name");
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) e.email = t("contact.errors.email");
    if (!form.message.trim()) e.message = t("contact.errors.message");
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      trackEvent("contact_submission_failed", {
        failure: "validation",
        language: analyticsLanguage(i18n.language),
      });
      return;
    }
    setSubmitting(true);
    setSubmitError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          enquiryType: form.enquiryType,
          subject: form.subject.trim(),
          message: form.message.trim(),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setSubmitError(data.error ?? "Something went wrong. Please try again.");
        trackEvent("contact_submission_failed", {
          failure: "server_response",
          language: analyticsLanguage(i18n.language),
        });
        return;
      }
      setSubmitted(true);
      trackEvent("contact_submitted", {
        enquiry_type: form.enquiryType,
        language: analyticsLanguage(i18n.language),
      });
    } catch {
      setSubmitError("Connection error. Please try again.");
      trackEvent("contact_submission_failed", {
        failure: "network",
        language: analyticsLanguage(i18n.language),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const currentType = ENQUIRY_TYPES.find((t) => t.value === form.enquiryType)!;

  return (
    <>
      <PageMeta
        title={t("meta.contact.title")}
        description={t("meta.contact.desc")}
        path="/contact"
      />

      {/* Header */}
      <section className="pt-32 pb-16 sm:pt-40 sm:pb-20 px-4 sm:px-8 md:px-12 bg-[#FDFBF7]">
        <div className="max-w-6xl mx-auto">
          <motion.div initial="hidden" animate="visible" variants={fadeInUp}>
            <p className="text-[#D4A373] text-xs tracking-[0.3em] uppercase font-medium mb-5">{t("contact.header.label")}</p>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-['Playfair_Display'] text-[#1A1A1A] mb-6 leading-tight">
              {t("contact.header.heading")}
            </h1>
            <p className="text-[#1A1A1A]/60 text-base sm:text-lg font-light max-w-xl leading-relaxed">
              {t("contact.header.desc")}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact Options */}
      <section className="py-12 sm:py-16 px-4 sm:px-8 md:px-12 bg-[#F4F1EA]">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="grid grid-cols-1 sm:grid-cols-3 gap-5"
          >
            <a
              href={`mailto:${SITE_CONFIG.email}`}
              onClick={() => trackEvent("contact_channel_clicked", { channel: "email", location: "contact_options" })}
              className="group bg-[#FDFBF7] p-6 sm:p-8 border border-[#1A1A1A]/8 hover:border-[#D4A373]/50 transition-colors"
            >
              <div className="text-2xl mb-3">✉️</div>
              <h3 className="text-sm font-medium uppercase tracking-wider mb-2">{t("contact.options.email.heading")}</h3>
              <p className="text-[#1A1A1A]/50 text-sm font-light">{t("contact.options.email.desc")}</p>
              <p className="text-[#D4A373] text-sm mt-3 font-medium group-hover:underline">{SITE_CONFIG.email} →</p>
            </a>
            <a
              href={SITE_CONFIG.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackEvent("contact_channel_clicked", { channel: "instagram", location: "contact_options" })}
              className="group bg-[#FDFBF7] p-6 sm:p-8 border border-[#1A1A1A]/8 hover:border-[#D4A373]/40 transition-colors"
            >
              <div className="text-2xl mb-3">📷</div>
              <h3 className="text-sm font-medium uppercase tracking-wider mb-2">{t("contact.options.instagram.heading")}</h3>
              <p className="text-[#1A1A1A]/50 text-sm font-light">{t("contact.options.instagram.desc")}</p>
              <p className="text-[#D4A373] text-sm mt-3 font-medium group-hover:underline">{SITE_CONFIG.instagram} →</p>
            </a>
            <a
              href={SITE_CONFIG.phoneHref}
              onClick={() => trackEvent("contact_channel_clicked", { channel: "phone", location: "contact_options" })}
              className="group bg-[#FDFBF7] p-6 sm:p-8 border border-[#1A1A1A]/8 hover:border-[#D4A373]/40 transition-colors"
            >
              <div className="text-2xl mb-3">📞</div>
              <h3 className="text-sm font-medium uppercase tracking-wider mb-2">{t("contact.options.phone.heading")}</h3>
              <p className="text-[#1A1A1A]/50 text-sm font-light">{t("contact.options.phone.desc", { phone: SITE_CONFIG.phone, days: compactDays, open: SITE_CONFIG.hours.open, close: SITE_CONFIG.hours.close })}</p>
              <p className="text-[#D4A373] text-sm mt-3 font-medium">{SITE_CONFIG.phone}</p>
            </a>
          </motion.div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="py-20 sm:py-28 md:py-32 px-4 sm:px-8 md:px-12">
        <div className="max-w-2xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} className="mb-10">
            <p className="text-[#D4A373] text-xs tracking-[0.3em] uppercase font-medium mb-5">{t("contact.form.label")}</p>
            <h2 className="text-3xl sm:text-4xl font-['Playfair_Display'] mb-4">{t("contact.form.heading")}</h2>
          </motion.div>

          {submitted ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="border-l-4 border-[#D4A373] bg-[#D4A373]/8 p-8 sm:p-10"
            >
              <h3 className="text-xl sm:text-2xl font-['Playfair_Display'] text-[#1A1A1A] mb-3">
                {t("contact.success.heading")}, {form.name.split(" ")[0]}
              </h3>
              <p className="text-[#1A1A1A]/65 font-light leading-relaxed mb-6">
                {t("contact.success.desc", { type: currentType.label.toLowerCase(), email: form.email })}
              </p>
              <p className="text-[#1A1A1A]/45 text-sm font-light">
                {t("contact.success.reachUs")}{" "}
                <a href={SITE_CONFIG.phoneHref} className="text-[#D4A373] hover:opacity-80">{SITE_CONFIG.phone}</a>{" "}
                {t("contact.success.duringHours")}
              </p>
            </motion.div>
          ) : (
            <motion.form
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              onSubmit={handleSubmit}
              className="space-y-6"
              noValidate
            >
              <div>
                <label className="block text-xs tracking-wider uppercase text-[#1A1A1A]/60 mb-2" htmlFor="enquiryType">
                  {t("contact.form.enquiryType")}
                </label>
                <div className="relative">
                  <select
                    id="enquiryType"
                    name="enquiryType"
                    value={form.enquiryType}
                    onChange={handleChange}
                    className="w-full border border-[#1A1A1A]/15 px-4 py-3 text-sm bg-[#FDFBF7] focus:outline-none focus:border-[#D4A373] transition-colors appearance-none"
                  >
                    {ENQUIRY_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label} — {t.labelJa}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1A1A1A]/40 pointer-events-none" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs tracking-wider uppercase text-[#1A1A1A]/60 mb-2" htmlFor="name">
                    {t("contact.form.name")} <span className="text-[#D4A373]">*</span>
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={form.name}
                    onChange={handleChange}
                    placeholder={t("contact.form.namePlaceholder")}
                    className={`w-full border px-4 py-3 text-sm bg-transparent focus:outline-none focus:border-[#D4A373] transition-colors ${errors.name ? "border-red-400" : "border-[#1A1A1A]/15"}`}
                  />
                  {errors.name && <p className="text-red-500 text-xs mt-1.5">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-xs tracking-wider uppercase text-[#1A1A1A]/60 mb-2" htmlFor="email">
                    {t("contact.form.email")} <span className="text-[#D4A373]">*</span>
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
                  {t("contact.form.phone")} <span className="text-[#1A1A1A]/30 text-xs normal-case">{t("contact.form.phoneOptional")}</span>
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder={t("contact.form.phonePlaceholder")}
                  className="w-full border border-[#1A1A1A]/15 px-4 py-3 text-sm bg-transparent focus:outline-none focus:border-[#D4A373] transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs tracking-wider uppercase text-[#1A1A1A]/60 mb-2" htmlFor="subject">
                  {t("contact.form.subject")} <span className="text-[#1A1A1A]/30 text-xs normal-case">{t("contact.form.subjectOptional")}</span>
                </label>
                <input
                  id="subject"
                  name="subject"
                  type="text"
                  value={form.subject}
                  onChange={handleChange}
                  placeholder={t("contact.form.subjectPlaceholder")}
                  className="w-full border border-[#1A1A1A]/15 px-4 py-3 text-sm bg-transparent focus:outline-none focus:border-[#D4A373] transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs tracking-wider uppercase text-[#1A1A1A]/60 mb-2" htmlFor="message">
                  {t("contact.form.message")} <span className="text-[#D4A373]">*</span>
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  rows={6}
                  placeholder={currentType.placeholder}
                  className={`w-full border px-4 py-3 text-sm bg-transparent focus:outline-none focus:border-[#D4A373] transition-colors resize-none ${errors.message ? "border-red-400" : "border-[#1A1A1A]/15"}`}
                />
                {errors.message && <p className="text-red-500 text-xs mt-1.5">{errors.message}</p>}
              </div>

              {submitError && (
                <p className="text-red-500 text-sm border border-red-200 bg-red-50 px-4 py-3 rounded-sm">{submitError}</p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 bg-[#1A1A1A] text-[#FDFBF7] text-xs tracking-[0.2em] uppercase font-medium hover:bg-[#D4A373] transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "Sending…" : t("contact.form.submit")}
              </button>

              <p className="text-[#1A1A1A]/30 text-xs text-center">
                {t("contact.form.replyNote")}
              </p>
            </motion.form>
          )}
        </div>
      </section>
    </>
  );
}
