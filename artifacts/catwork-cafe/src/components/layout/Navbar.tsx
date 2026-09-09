import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Globe } from "lucide-react";
import { useSiteConfig } from "../../hooks/useSiteConfig";
import { useTranslation } from "react-i18next";
import { analyticsLanguage, trackEvent } from "../../lib/analytics";

export default function Navbar() {
  const { config: SITE_CONFIG } = useSiteConfig();
  const { t, i18n } = useTranslation();
  const [location] = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);
  const langBtnRef = useRef<HTMLButtonElement>(null);
  const mobileCloseRef = useRef<HTMLButtonElement>(null);
  const mobileFirstLinkRef = useRef<HTMLAnchorElement>(null);
  const mobileLastRef = useRef<HTMLButtonElement>(null);

  const NAV_LINKS = [
    { label: t("nav.home"), href: "/" },
    { label: t("nav.visit"), href: "/visit" },
    { label: t("nav.pricing"), href: "/pricing" },
    { label: t("nav.facilities"), href: "/facilities" },
    { label: t("nav.cats"), href: "/cats" },
    { label: t("nav.reels"), href: "/reels" },
    { label: t("nav.access"), href: "/access" },
    { label: t("nav.faq"), href: "/faq" },
    { label: t("nav.contact"), href: "/contact" },
  ];

  const LANGUAGES = [
    { code: "en", label: t("lang.en") },
    { code: "ja", label: t("lang.ja") },
    { code: "zh", label: t("lang.zh") },
  ];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!langOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setLangOpen(false);
        langBtnRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [langOpen]);

  useEffect(() => {
    if (!mobileOpen) return;
    mobileCloseRef.current?.focus();
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileOpen(false);
      }
      if (e.key === "Tab") {
        const focusable = Array.from(
          document.querySelectorAll<HTMLElement>(
            '[data-mobile-menu] button, [data-mobile-menu] a, [data-mobile-menu] [tabindex]:not([tabindex="-1"])'
          )
        ).filter((el) => !el.closest("[hidden]") && el.offsetParent !== null);
        if (focusable.length === 0) return;
        const first = focusable[0]!;
        const last = focusable[focusable.length - 1]!;
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [mobileOpen]);

  const changeLanguage = useCallback((code: string) => {
    i18n.changeLanguage(code);
    localStorage.setItem("catwork_lang", code);
    const url = new URL(window.location.href);
    url.searchParams.set("lang", code);
    window.history.replaceState({}, "", url.toString());
    trackEvent("language_changed", {
      language: analyticsLanguage(code),
      location: "navbar",
    });
    setLangOpen(false);
    langBtnRef.current?.focus();
  }, [i18n]);

  const isHome = location === "/";
  const textColor = scrolled || !isHome ? "#1A1A1A" : "#FDFBF7";

  const activeLangLabel = LANGUAGES.find(
    (l) => i18n.language === l.code || i18n.language.startsWith(l.code)
  )?.label ?? "Language";

  return (
    <>
      <motion.nav
        initial={false}
        animate={scrolled || !isHome ? { backgroundColor: "rgba(253,251,247,0.97)", backdropFilter: "blur(12px)" } : { backgroundColor: "transparent", backdropFilter: "blur(0px)" }}
        transition={{ duration: 0.3 }}
        className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-8 md:px-12"
        aria-label="Main navigation"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between h-16 sm:h-18">
          <Link
            href="/"
            aria-label={SITE_CONFIG.name}
            className={`flex items-center gap-2 rounded-full transition-colors duration-300 ${isHome && !scrolled ? "bg-black/20 backdrop-blur-sm px-2 py-1" : ""}`}
          >
            <img
              src="/images/logo.jpg"
              alt=""
              aria-hidden="true"
              width="48"
              height="48"
              className="h-12 sm:h-14 w-auto object-contain"
            />
            <span
              className="text-sm font-semibold tracking-wide whitespace-nowrap"
              style={{ color: textColor }}
            >
              {SITE_CONFIG.name}
            </span>
          </Link>

          <div className="hidden lg:flex items-center gap-7 xl:gap-10">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={location === link.href ? "page" : undefined}
                className="text-xs tracking-[0.15em] uppercase font-medium transition-opacity hover:opacity-60 focus-visible:opacity-100"
                style={{ color: textColor }}
              >
                {link.label}
              </Link>
            ))}
            <a
              href={`mailto:${SITE_CONFIG.email}`}
              onClick={() => trackEvent("contact_channel_clicked", { channel: "email", location: "navbar_desktop" })}
              className="ml-2 px-4 py-2 bg-[#1A1A1A] text-[#FDFBF7] text-xs tracking-widest uppercase font-medium rounded-full hover:bg-[#D4A373] transition-colors whitespace-nowrap"
            >
              {t("nav.emailUs")}
            </a>
          </div>

          <div className="flex items-center gap-2">
            {/* Language Switcher */}
            <div className="relative" ref={langRef}>
              <button
                ref={langBtnRef}
                onClick={() => setLangOpen((o) => !o)}
                className="p-1.5 rounded-sm transition-opacity hover:opacity-60 min-w-[44px] min-h-[44px] flex items-center justify-center"
                style={{ color: textColor }}
                aria-label={`${t("nav.selectLanguage")} — ${activeLangLabel}`}
                aria-expanded={langOpen}
                aria-haspopup="listbox"
              >
                <Globe className="w-5 h-5" />
              </button>
              <AnimatePresence>
                {langOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    role="listbox"
                    aria-label={t("nav.selectLanguage")}
                    className="absolute right-0 top-full mt-2 bg-[#FDFBF7] border border-[#1A1A1A]/10 shadow-lg rounded-sm min-w-[140px] overflow-hidden z-50"
                  >
                    {LANGUAGES.map((lang) => {
                      const isSelected = i18n.language === lang.code || i18n.language.startsWith(lang.code);
                      return (
                        <button
                          key={lang.code}
                          onClick={() => changeLanguage(lang.code)}
                          role="option"
                          aria-selected={isSelected}
                          className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors hover:bg-[#F4F1EA] ${isSelected ? "text-[#D4A373]" : "text-[#1A1A1A]"}`}
                        >
                          {lang.label}
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Hamburger */}
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-1.5 rounded-sm min-w-[44px] min-h-[44px] flex items-center justify-center"
              style={{ color: textColor }}
              aria-label={t("nav.openMenu")}
              aria-expanded={mobileOpen}
              aria-controls="mobile-menu"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </motion.nav>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            id="mobile-menu"
            data-mobile-menu
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[60] bg-[#FDFBF7] flex flex-col"
            role="dialog"
            aria-modal="true"
            aria-label={t("nav.mobileMenuLabel")}
          >
            <div className="flex items-center justify-between px-4 sm:px-8 h-16">
              <Link href="/" className="flex items-center gap-2" aria-label={SITE_CONFIG.name}>
                <img
                  src="/images/logo.jpg"
                  alt=""
                  aria-hidden="true"
                  width="48"
                  height="48"
                  className="h-12 w-auto object-contain"
                />
                <span className="text-sm font-semibold tracking-wide text-[#1A1A1A] whitespace-nowrap">
                  {SITE_CONFIG.name}
                </span>
              </Link>
              <button
                ref={mobileCloseRef}
                onClick={() => setMobileOpen(false)}
                aria-label={t("nav.closeMenu")}
                className="p-1.5 min-w-[44px] min-h-[44px] flex items-center justify-center"
              >
                <X className="w-6 h-6 text-[#1A1A1A]" />
              </button>
            </div>

            <nav className="flex flex-col gap-1 px-4 sm:px-8 pt-6 flex-1" aria-label="Mobile navigation">
              {NAV_LINKS.map((link, i) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                >
                  <Link
                    href={link.href}
                    aria-current={location === link.href ? "page" : undefined}
                    className="block py-4 text-2xl font-['Playfair_Display'] text-[#1A1A1A] border-b border-[#1A1A1A]/8 hover:text-[#D4A373] transition-colors"
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: NAV_LINKS.length * 0.06 + 0.1 }}
                className="mt-8"
              >
                <a
                  href={`mailto:${SITE_CONFIG.email}`}
                  onClick={() => trackEvent("contact_channel_clicked", { channel: "email", location: "navbar_mobile" })}
                  className="block w-full text-center px-6 py-4 bg-[#1A1A1A] text-[#FDFBF7] text-sm tracking-widest uppercase font-medium rounded-full hover:bg-[#D4A373] transition-colors"
                >
                  {t("nav.emailUs")}
                </a>
              </motion.div>

              {/* Mobile language switcher */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: NAV_LINKS.length * 0.06 + 0.2 }}
                className="mt-4 flex gap-2 justify-center"
                role="group"
                aria-label={t("nav.selectLanguage")}
              >
                {LANGUAGES.map((lang) => {
                  const isSelected = i18n.language === lang.code || i18n.language.startsWith(lang.code);
                  return (
                    <button
                      key={lang.code}
                      ref={lang.code === LANGUAGES[LANGUAGES.length - 1]?.code ? mobileLastRef : undefined}
                      onClick={() => changeLanguage(lang.code)}
                      aria-pressed={isSelected}
                      className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors min-w-[44px] min-h-[44px] ${isSelected ? "bg-[#D4A373] border-[#D4A373] text-white" : "border-[#1A1A1A]/20 text-[#1A1A1A]/60 hover:border-[#D4A373] hover:text-[#D4A373]"}`}
                    >
                      {lang.label}
                    </button>
                  );
                })}
              </motion.div>
            </nav>

            <p className="px-4 sm:px-8 pb-8 text-xs text-[#1A1A1A]/30 tracking-widest" aria-hidden="true">
              {SITE_CONFIG.nameJapanese}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
