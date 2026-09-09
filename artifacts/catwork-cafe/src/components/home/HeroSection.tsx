import { useRef, useEffect, useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Star, MapPin } from "lucide-react";
import { useTranslation } from "react-i18next";

const BASE = import.meta.env.BASE_URL;

interface HeroSectionProps {
  siteConfig: {
    location: string;
    nameJapanese: string;
    rating: string | number;
    ratingSource: string;
    catCount: number;
    openedYear: number;
    email: string;
    mapUrl: string;
    hours: {
      days: string;
      open: string;
      close: string;
      closedDays: string;
    };
    lastAdmission: string;
    stationWalkMinutes: number;
  };
  onHeroVisibilityChange?: (visible: boolean) => void;
}

function getIsOpenNow(hours: { open: string; close: string }): boolean {
  const nowUtc = new Date();
  const jstOffsetMs = 9 * 60 * 60 * 1000;
  const nowJst = new Date(nowUtc.getTime() + jstOffsetMs);
  const day = nowJst.getUTCDay();
  const openDays = [0, 2, 3, 5, 6];
  if (!openDays.includes(day)) return false;
  const h = nowJst.getUTCHours();
  const m = nowJst.getUTCMinutes();
  const currentMins = h * 60 + m;
  const [openH, openM] = hours.open.split(":").map(Number) as [number, number];
  const [closeH, closeM] = hours.close.split(":").map(Number) as [number, number];
  return currentMins >= openH * 60 + openM && currentMins < closeH * 60 + closeM;
}

export default function HeroSection({ siteConfig, onHeroVisibilityChange }: HeroSectionProps) {
  const { t } = useTranslation();
  const heroRef = useRef<HTMLElement>(null);
  const isOpen = getIsOpenNow(siteConfig.hours);

  useEffect(() => {
    if (!onHeroVisibilityChange) return;
    const el = heroRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => onHeroVisibilityChange(entry?.isIntersecting ?? true),
      { threshold: 0.05 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [onHeroVisibilityChange]);

  return (
    <section
      ref={heroRef}
      className="relative h-[100dvh] min-h-[550px] w-full overflow-hidden flex items-center justify-center"
      aria-label="Hero"
    >
      <div className="absolute inset-0 z-0">
        <picture>
          <source srcSet={`${BASE}images/cafe-interior.webp`} type="image/webp" />
          <img
            src={`${BASE}images/cafe-interior.jpg`}
            alt="Catwork Cafe interior with cats by snowy window"
            className="w-full h-full object-cover object-center"
            fetchPriority="high"
            decoding="async"
          />
        </picture>
        <div className="absolute inset-0 bg-black/50" />
      </div>

      <div className="relative z-10 text-center px-4 sm:px-8 max-w-4xl mx-auto mt-16">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.1 }}
          className="text-[#D4A373] tracking-[0.25em] sm:tracking-[0.35em] uppercase text-xs sm:text-sm mb-3 font-medium"
        >
          Cat Café · Workspace
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3 }}
          className="fluid-hero text-[#FDFBF7] font-['Playfair_Display'] mb-4"
        >
          {t("home.hero.headline")}
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.45 }}
          className="flex items-center justify-center gap-2 mb-4"
        >
          <MapPin className="w-3.5 h-3.5 text-[#D4A373]" />
          <span className="text-[#FDFBF7]/70 text-xs sm:text-sm tracking-[0.15em] font-light">
            {siteConfig.location}
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.55 }}
          className="flex items-center justify-center gap-2 mb-5"
        >
          <span
            className={`inline-block w-2 h-2 rounded-full shrink-0 ${isOpen ? "bg-green-400 animate-pulse" : "bg-red-400"}`}
          />
          <span className={`text-xs sm:text-sm font-medium tracking-wider ${isOpen ? "text-green-300" : "text-red-300"}`}>
            {isOpen ? t("home.hero.status.open") : t("home.hero.status.closed")}
            {isOpen && (
              <span className="text-[#FDFBF7]/50 font-light ml-2">
                · {t("home.hero.status.lastAdmission", { time: siteConfig.lastAdmission })}
              </span>
            )}
          </span>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.65 }}
          className="text-[#FDFBF7]/85 text-base sm:text-lg md:text-xl font-light max-w-2xl mx-auto leading-relaxed mb-4"
        >
          {t("home.hero.description")}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.8 }}
          className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-[#FDFBF7]/60 text-xs tracking-widest uppercase mb-8 sm:mb-10"
        >
          <div className="flex items-center gap-2">
            <Star className="w-3.5 h-3.5 text-[#D4A373] fill-[#D4A373]" />
            <span>{siteConfig.rating} on {siteConfig.ratingSource}</span>
          </div>
          <span className="opacity-30">·</span>
          <span>{siteConfig.catCount} {t("home.hero.residentCats")}</span>
          <span className="opacity-30">·</span>
          <span>{t("home.hero.since")} {siteConfig.openedYear}</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.95 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link
            href="/visit"
            className="w-full sm:w-auto px-8 sm:px-10 py-3.5 bg-[#D4A373] text-white text-xs tracking-widest uppercase font-medium hover:bg-[#c49265] transition-colors text-center"
          >
            {t("home.hero.cta.reservation")}
          </Link>
          <a
            href={siteConfig.mapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-8 sm:px-10 py-3.5 border border-[#FDFBF7]/40 text-[#FDFBF7] text-xs tracking-widest uppercase font-medium hover:border-[#FDFBF7] transition-colors text-center"
          >
            {t("home.hero.cta.directions")}
          </a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.15 }}
          className="mt-5 flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-[#FDFBF7]/40 text-[10px] sm:text-xs tracking-widest uppercase"
        >
          <Link href="/pricing" className="hover:text-[#D4A373] transition-colors">
            {t("home.hero.cta.prices")}
          </Link>
          <span className="opacity-30">·</span>
          <span>
            {t("home.hero.access.stationSummary", { minutes: siteConfig.stationWalkMinutes })}
          </span>
          <span className="opacity-30">·</span>
          <span>{siteConfig.nameJapanese}</span>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.5 }}
        className="absolute bottom-8 sm:bottom-10 left-1/2 -translate-x-1/2 text-[#FDFBF7]/60 text-xs tracking-widest uppercase flex flex-col items-center gap-3"
      >
        <span>{t("home.hero.scroll")}</span>
        <div className="w-px h-10 bg-[#FDFBF7]/25 overflow-hidden relative">
          <motion.div
            animate={{ y: [0, 40] }}
            transition={{ repeat: Infinity, duration: 1.6, ease: "linear" }}
            className="absolute top-0 left-0 w-full h-1/2 bg-[#D4A373]"
          />
        </div>
      </motion.div>
    </section>
  );
}
