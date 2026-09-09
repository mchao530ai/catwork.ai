import { useState } from "react";
import { Link } from "wouter";
import { Phone, Instagram, MapPin, Clock, Mail } from "lucide-react";
import { useSiteConfig } from "../../hooks/useSiteConfig";
import { useTranslation } from "react-i18next";
import { trackEvent } from "../../lib/analytics";

export default function Footer() {
  const { config: SITE_CONFIG } = useSiteConfig();
  const { t, i18n } = useTranslation();
  const compactDays = (SITE_CONFIG.hours.compact as Record<string, string>)[i18n.language] ?? SITE_CONFIG.hours.compact.en;
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const NAV_LINKS = [
    { label: t("nav.home"), href: "/" },
    { label: t("footer.visitAndBooking"), href: "/visit" },
    { label: t("nav.pricing"), href: "/pricing" },
    { label: t("nav.cats"), href: "/cats" },
    { label: t("nav.access"), href: "/access" },
    { label: t("nav.faq"), href: "/faq" },
    { label: t("nav.contact"), href: "/contact" },
  ];

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail("");
    }
  };

  return (
    <footer className="bg-[#1A1A1A] text-[#FDFBF7] pt-16 sm:pt-20 pb-10 px-4 sm:px-8 md:px-12">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 sm:gap-12 mb-14">
          <div className="lg:col-span-1">
            <img
              src="/images/logo.jpg"
              alt="Catwork Cafe"
              width="64"
              height="64"
              loading="lazy"
              className="h-16 w-auto object-contain mb-1.5"
            />
            <div className="text-[#FDFBF7]/30 text-sm tracking-[0.15em] mb-4">{SITE_CONFIG.nameJapanese}</div>
            <p className="text-[#FDFBF7]/45 font-light text-sm leading-relaxed mb-6">
              {t("footer.tagline", { days: compactDays }).split("\n").map((line, i) => (
                <span key={i}>{line}{i === 0 ? <br /> : ""}</span>
              ))}
            </p>
            <a
              href={`mailto:${SITE_CONFIG.email}`}
              onClick={() => trackEvent("contact_channel_clicked", { channel: "email", location: "footer" })}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#D4A373] text-white text-xs tracking-widest uppercase font-medium rounded-full hover:bg-[#c49265] transition-colors"
            >
              <Mail className="w-3.5 h-3.5" />
              {SITE_CONFIG.email}
            </a>
          </div>

          <div>
            <h4 className="text-xs tracking-[0.2em] uppercase font-medium text-[#FDFBF7]/40 mb-5">{t("footer.navigation")}</h4>
            <ul className="space-y-2.5">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-[#FDFBF7]/50 hover:text-[#D4A373] transition-colors text-sm font-light"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs tracking-[0.2em] uppercase font-medium text-[#FDFBF7]/40 mb-5">{t("footer.visit")}</h4>
            <div className="space-y-3 text-[#FDFBF7]/50 font-light text-sm">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-3.5 h-3.5 shrink-0 text-[#D4A373] mt-0.5" />
                <div>
                  <p>{SITE_CONFIG.address.street}</p>
                  <p>{SITE_CONFIG.address.city} {SITE_CONFIG.address.postalCode}</p>
                  <p>{SITE_CONFIG.address.country}</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Clock className="w-3.5 h-3.5 shrink-0 text-[#D4A373] mt-0.5" />
                <div>
                  <p>{SITE_CONFIG.hours.days}</p>
                  <p className="text-[#D4A373] text-xs mt-0.5">{SITE_CONFIG.hours.open}–{SITE_CONFIG.hours.close}</p>
                </div>
              </div>
              <a
                href={SITE_CONFIG.phoneHref}
                onClick={() => trackEvent("contact_channel_clicked", { channel: "phone", location: "footer" })}
                className="flex items-center gap-2.5 hover:text-[#D4A373] transition-colors"
              >
                <Phone className="w-3.5 h-3.5 text-[#D4A373]" />
                <span>{SITE_CONFIG.phone}</span>
              </a>
              <a
                href={SITE_CONFIG.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackEvent("contact_channel_clicked", { channel: "instagram", location: "footer" })}
                className="flex items-center gap-2.5 hover:text-[#D4A373] transition-colors"
              >
                <Instagram className="w-3.5 h-3.5 text-[#D4A373]" />
                <span>{SITE_CONFIG.instagram}</span>
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-xs tracking-[0.2em] uppercase font-medium text-[#FDFBF7]/40 mb-5">{t("footer.stayInTouch")}</h4>
            <p className="text-[#FDFBF7]/45 text-sm font-light leading-relaxed mb-4">
              {t("footer.newsletterDesc")}
            </p>
            {subscribed ? (
              <div className="text-[#D4A373] text-sm font-light">
                {t("footer.subscribed")}
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex flex-col gap-2">
                <label htmlFor="footer-email" className="sr-only">
                  {t("footer.emailPlaceholder")}
                </label>
                <div className="flex gap-0">
                  <input
                    id="footer-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t("footer.emailPlaceholder")}
                    required
                    className="flex-1 bg-[#FDFBF7]/8 border border-[#FDFBF7]/12 text-[#FDFBF7] placeholder:text-[#FDFBF7]/25 text-sm px-4 py-2.5 focus:border-[#D4A373] transition-colors rounded-l-sm"
                  />
                  <button
                    type="submit"
                    aria-label={t("footer.subscribeBtn")}
                    className="px-4 bg-[#D4A373] text-white text-xs uppercase tracking-widest font-medium hover:bg-[#c49265] transition-colors rounded-r-sm min-w-[44px]"
                  >
                    <Mail className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
                <p className="text-[#FDFBF7]/20 text-xs">{t("footer.noSpam")}</p>
              </form>
            )}
          </div>
        </div>

        <div className="border-t border-[#FDFBF7]/8 pt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-[#FDFBF7]/20 text-xs">
          <p>© {new Date().getFullYear()} {SITE_CONFIG.name} · Echigo Yuzawa, Niigata</p>
          <p className="tracking-wider">{t("footer.taglineBottom")}</p>
        </div>
      </div>
    </footer>
  );
}
