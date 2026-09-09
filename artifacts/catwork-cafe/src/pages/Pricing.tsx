import { Link } from "wouter";
import { motion, type Variants, AnimatePresence } from "framer-motion";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { useListPricingPlans, useListPhotos } from "@workspace/api-client-react";
import { useSiteConfig } from "../hooks/useSiteConfig";
import PageMeta from "../components/shared/PageMeta";
import { useTranslation } from "react-i18next";
import { trackEvent } from "../lib/analytics";
import { useState, useEffect, useCallback } from "react";

const BASE = import.meta.env.BASE_URL;

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } },
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15 } },
};

const SEATING_FALLBACK = [
  { src: `${BASE}images/space-1.jpg`, alt: "Seating area — workspace tables" },
  { src: `${BASE}images/space-2.jpg`, alt: "Seating area — counter seats" },
  { src: `${BASE}images/space-3.jpg`, alt: "Seating area — cat bench zone" },
  { src: `${BASE}images/cafe-interior.jpg`, alt: "Café interior" },
];

const CAT_FALLBACK = [
  { src: `${BASE}images/cat-hime.webp`, alt: "Hime" },
  { src: `${BASE}images/cat-kiri.webp`, alt: "Kiri" },
  { src: `${BASE}images/cat-sleepy.webp`, alt: "Sleepy" },
  { src: `${BASE}images/cat-sumi.webp`, alt: "Sumi" },
  { src: `${BASE}images/cat-inu.webp`, alt: "Inu" },
];

type SlidePhoto = { src: string; alt: string };

function SeatingCarousel({ photos }: { photos: SlidePhoto[] }) {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);

  const go = useCallback((next: number) => {
    setDirection(next > current ? 1 : -1);
    setCurrent(next);
  }, [current]);

  const prev = () => go((current - 1 + photos.length) % photos.length);
  const next = () => go((current + 1) % photos.length);

  useEffect(() => {
    if (photos.length <= 1) return;
    const t = setInterval(() => {
      setDirection(1);
      setCurrent((c) => (c + 1) % photos.length);
    }, 4000);
    return () => clearInterval(t);
  }, [photos.length]);

  const slideVariants: Variants = {
    enter: (d: number) => ({ x: d > 0 ? "100%" : "-100%", opacity: 0 }),
    center: { x: 0, opacity: 1, transition: { duration: 0.55, ease: "easeInOut" } },
    exit: (d: number) => ({ x: d > 0 ? "-100%" : "100%", opacity: 0, transition: { duration: 0.45, ease: "easeInOut" } }),
  };

  return (
    <div className="relative w-full h-full min-h-[280px] overflow-hidden bg-[#1A1A1A]/5">
      <AnimatePresence initial={false} custom={direction}>
        <motion.img
          key={current}
          src={photos[current].src}
          alt={photos[current].alt}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          className="absolute inset-0 w-full h-full object-cover"
        />
      </AnimatePresence>

      {/* Prev / Next */}
      <button
        onClick={prev}
        className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-white/80 hover:bg-white transition-colors z-10"
        aria-label="Previous photo"
      >
        <ChevronLeft className="w-4 h-4 text-[#1A1A1A]" />
      </button>
      <button
        onClick={next}
        className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-white/80 hover:bg-white transition-colors z-10"
        aria-label="Next photo"
      >
        <ChevronRight className="w-4 h-4 text-[#1A1A1A]" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-0.5 z-10">
        {photos.map((_, i) => (
          <button
            key={i}
            onClick={() => go(i)}
            className="w-7 h-7 flex items-center justify-center group"
            aria-label={`Go to photo ${i + 1}`}
            aria-current={i === current ? "true" : undefined}
          >
            <span className={`block rounded-full transition-all ${i === current ? "bg-white w-4 h-1.5" : "bg-white/50 w-1.5 h-1.5 group-hover:bg-white/75"}`} />
          </button>
        ))}
      </div>
    </div>
  );
}

export default function Pricing() {
  const { config: SITE_CONFIG } = useSiteConfig();
  const { t, i18n } = useTranslation();
  const compactDays = (SITE_CONFIG.hours.compact as Record<string, string>)[i18n.language] ?? SITE_CONFIG.hours.compact.en;
  const { data: plans = [] } = useListPricingPlans();
  const { data: allPhotos = [] } = useListPhotos();

  const seatingPhotos: SlidePhoto[] = (() => {
    const fromApi = allPhotos
      .filter((p) => p.category === "seating")
      .map((p) => ({ src: p.url, alt: p.caption || "Seating area" }));
    return fromApi.length > 0 ? fromApi : SEATING_FALLBACK;
  })();

  const catPhotos: SlidePhoto[] = (() => {
    const fromApi = allPhotos
      .filter((p) => p.category === "cats")
      .map((p) => ({ src: p.url, alt: p.caption || "Cat zone" }));
    return fromApi.length > 0 ? fromApi : CAT_FALLBACK;
  })();

  const pricingNote = SITE_CONFIG.pricingNote
    ? SITE_CONFIG.pricingNote
    : t("pricing.note", {
        days: compactDays,
        open: SITE_CONFIG.hours.open,
        close: SITE_CONFIG.hours.close,
        residentDiscount: SITE_CONFIG.pricing.residentDiscount,
      });

  const otherItems = [
    { icon: "📶", title: t("pricing.included.items.wifi.title"), desc: t("pricing.included.items.wifi.desc") },
    { icon: "📚", title: t("pricing.included.items.manga.title"), desc: t("pricing.included.items.manga.desc") },
    { icon: "🏔️", title: t("pricing.included.items.mountain.title"), desc: t("pricing.included.items.mountain.desc") },
    { icon: "☕", title: t("pricing.included.items.drinks.title"), desc: t("pricing.included.items.drinks.desc") },
  ];

  return (
    <>
      <PageMeta
        title={t("meta.pricing.title")}
        description={t("meta.pricing.desc")}
        path="/pricing"
      />

      {/* Header */}
      <section className="pt-32 pb-16 sm:pt-40 sm:pb-20 px-4 sm:px-8 md:px-12 bg-[#FDFBF7]">
        <div className="max-w-6xl mx-auto">
          <motion.div initial="hidden" animate="visible" variants={fadeInUp}>
            <p className="text-[#D4A373] text-xs tracking-[0.3em] uppercase font-medium mb-5">{t("pricing.header.label")}</p>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-['Playfair_Display'] text-[#1A1A1A] mb-6 leading-tight">
              {t("pricing.header.heading")}
            </h1>
            <p className="text-[#1A1A1A]/60 text-base sm:text-lg font-light max-w-xl leading-relaxed">
              {t("pricing.header.desc")}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-16 sm:py-20 md:py-28 px-4 sm:px-8 md:px-12 bg-[#F4F1EA]">
        <div className="max-w-6xl mx-auto">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6"
          >
            {plans.map((plan) => (
              <motion.div
                key={plan.id}
                variants={fadeInUp}
                className={`bg-[#FDFBF7] p-7 sm:p-8 flex flex-col border ${plan.highlight ? "border-[#D4A373]" : "border-[#1A1A1A]/8"} relative`}
              >
                {plan.badge && (
                  <span className="absolute -top-3 left-6 px-3 py-1 bg-[#D4A373] text-white text-xs tracking-widest uppercase font-medium">
                    {plan.badge}
                  </span>
                )}

                {plan.step && (
                  <div className="text-[#D4A373]/30 text-4xl font-['Playfair_Display'] mb-4">{plan.step}</div>
                )}

                <h3 className="text-xs font-medium uppercase tracking-wider text-[#1A1A1A]/60 mb-1">{plan.title}</h3>
                <p className="text-xs text-[#D4A373] tracking-wider mb-4">{plan.titleJa}</p>

                <div className="mb-2">
                  <div className="text-2xl sm:text-3xl font-['Playfair_Display'] text-[#1A1A1A]">{plan.price}</div>
                  <div className="text-xs text-[#1A1A1A]/40 mt-1">{plan.priceNote}</div>
                </div>

                <p className="text-[#1A1A1A]/55 text-sm font-light leading-relaxed mt-3 mb-6 flex-1">{plan.description}</p>

                <ul className="space-y-2 mb-6">
                  {plan.includes.map((item) => (
                    <li key={item} className="flex items-center gap-2.5 text-sm text-[#1A1A1A]/60">
                      <Check className="w-3.5 h-3.5 text-[#D4A373] shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                {plan.cta ? (
                  <a
                    href={`mailto:${SITE_CONFIG.email}`}
                    onClick={() => trackEvent("contact_channel_clicked", { channel: "email", location: "pricing_plan_cta" })}
                    className="block w-full text-center py-3 bg-[#D4A373] text-white text-xs tracking-widest uppercase font-medium rounded-sm hover:bg-[#c49265] transition-colors"
                  >
                    {plan.cta}
                  </a>
                ) : (
                  <Link
                    href="/visit"
                    className="block w-full text-center py-3 bg-[#1A1A1A] text-[#FDFBF7] text-xs tracking-widest uppercase font-medium hover:bg-[#D4A373] transition-colors"
                  >
                    {t("pricing.bookVisit")}
                  </Link>
                )}
              </motion.div>
            ))}
          </motion.div>

          {/* Note */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="mt-8 p-5 sm:p-7 bg-[#FDFBF7] border-l-2 border-[#D4A373]"
          >
            <p className="text-[#1A1A1A]/65 font-light text-sm sm:text-base leading-relaxed">
              {pricingNote}
            </p>
          </motion.div>
        </div>
      </section>

      {/* What's Included */}
      <section className="py-20 sm:py-28 px-4 sm:px-8 md:px-12">
        <div className="max-w-6xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} className="text-center mb-12">
            <p className="text-[#D4A373] text-xs tracking-[0.25em] uppercase font-medium mb-5">{t("pricing.included.label")}</p>
            <h2 className="text-3xl sm:text-4xl font-['Playfair_Display']">{t("pricing.included.heading")}</h2>
          </motion.div>

          {/* Featured: Seating carousel — photo left, text right */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="mb-6 border border-[#1A1A1A]/8 overflow-hidden grid grid-cols-1 md:grid-cols-2"
          >
            <div className="md:h-[360px]">
              <SeatingCarousel photos={seatingPhotos} />
            </div>
            <div className="flex flex-col justify-center p-8 sm:p-10 bg-[#FDFBF7]">
              <div className="text-3xl mb-5">🪑</div>
              <h3 className="text-sm font-medium uppercase tracking-wider mb-4">
                {t("pricing.included.items.seating.title")}
              </h3>
              <p className="text-[#1A1A1A]/55 font-light text-sm leading-relaxed mb-6">
                {t("pricing.included.items.seating.desc")}
              </p>
              <div className="flex flex-wrap gap-2">
                {(["tables", "counter", "bench"] as const).map((key) => (
                  <span key={key} className="text-xs px-3 py-1 border border-[#D4A373]/40 text-[#D4A373] tracking-wide">
                    {t(`pricing.included.items.seating.chips.${key}`)}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Featured: Cat zone carousel — text left, photo right */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="mb-6 border border-[#1A1A1A]/8 overflow-hidden grid grid-cols-1 md:grid-cols-2"
          >
            <div className="flex flex-col justify-center p-8 sm:p-10 bg-[#FDFBF7] order-2 md:order-1">
              <div className="text-3xl mb-5">🐱</div>
              <h3 className="text-sm font-medium uppercase tracking-wider mb-4">
                {t("pricing.included.items.catFood.title")}
              </h3>
              <p className="text-[#1A1A1A]/55 font-light text-sm leading-relaxed mb-6">
                {t("pricing.included.items.catFood.desc")}
              </p>
              <div className="flex flex-wrap gap-2">
                {(["residents", "food", "days"] as const).map((key) => (
                  <span key={key} className="text-xs px-3 py-1 border border-[#D4A373]/40 text-[#D4A373] tracking-wide">
                    {t(`pricing.included.items.catFood.chips.${key}`, { catCount: SITE_CONFIG.catCount })}
                  </span>
                ))}
              </div>
            </div>
            <div className="md:h-[360px] order-1 md:order-2">
              <SeatingCarousel photos={catPhotos} />
            </div>
          </motion.div>

          {/* Remaining 4 items */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {otherItems.map((item, i) => (
              <motion.div key={i} variants={fadeInUp} className="p-6 sm:p-7 border border-[#1A1A1A]/8 hover:border-[#D4A373]/40 transition-colors">
                <div className="text-3xl mb-4">{item.icon}</div>
                <h3 className="text-sm font-medium uppercase tracking-wider mb-3">{item.title}</h3>
                <p className="text-[#1A1A1A]/55 font-light text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-20 bg-[#1A1A1A] text-center px-4 sm:px-8">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} className="max-w-xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-['Playfair_Display'] text-[#FDFBF7] mb-6">{t("pricing.cta.heading")}</h2>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/visit" className="px-7 py-3.5 bg-[#D4A373] text-white text-xs tracking-widest uppercase font-medium hover:bg-[#c49265] transition-colors">
              {t("pricing.cta.bookVisit")}
            </Link>
            <a
              href={`mailto:${SITE_CONFIG.email}`}
              onClick={() => trackEvent("contact_channel_clicked", { channel: "email", location: "pricing_cta" })}
              className="px-7 py-3.5 border border-[#FDFBF7]/30 text-[#FDFBF7] text-xs tracking-widest uppercase font-medium hover:border-[#D4A373] hover:text-[#D4A373] transition-colors"
            >
              {t("pricing.cta.emailUs")}
            </a>
          </div>
        </motion.div>
      </section>
    </>
  );
}
