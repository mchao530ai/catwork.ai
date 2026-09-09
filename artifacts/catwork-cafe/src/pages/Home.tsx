import { useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { Star, Coffee, MapPin, ArrowRight, Wifi, Instagram, ChevronLeft, ChevronRight } from "lucide-react";
import { useListCats, useListFaqs, useListEvents, useListPhotos, useListInstagramReels, useListTestimonials } from "@workspace/api-client-react";
import { REVIEWS } from "../data/reviews";
import { FACILITIES } from "../data/facilities";
import { useSiteConfig } from "../hooks/useSiteConfig";
import PageMeta from "../components/shared/PageMeta";
import CatImageCarousel from "../components/CatImageCarousel";
import HeroSection from "../components/home/HeroSection";
import MobileStickyBar from "../components/home/MobileStickyBar";
import { useTranslation } from "react-i18next";
import { trackEvent } from "../lib/analytics";

const BASE = import.meta.env.BASE_URL;

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } },
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15 } },
};

function FaqPreviewItem({ question, answer }: { question: string; answer: string }) {
  return (
    <motion.div variants={fadeInUp} className="border-b border-[#1A1A1A]/10 py-5">
      <p className="text-base sm:text-lg font-medium text-[#1A1A1A] mb-2">{question}</p>
      <p className="text-[#1A1A1A]/55 font-light leading-relaxed text-sm sm:text-base">{answer}</p>
    </motion.div>
  );
}

type AnyReview = {
  id: string | number;
  author: string;
  rating: number;
  quote?: string;
  text?: string;
  role?: string;
  origin?: string;
  date?: string;
  source?: string | null;
};

function ReviewCard({ r }: { r: AnyReview }) {
  const text = "quote" in r && r.quote ? r.quote : r.text ?? "";
  const sub = "role" in r && r.role
    ? r.role
    : [r.origin, r.date].filter(Boolean).join(" · ");

  return (
    <div className="border border-[#1A1A1A]/8 p-6 sm:p-8 hover:border-[#D4A373]/40 transition-colors h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <div className="flex gap-0.5">
          {[...Array(r.rating)].map((_, i) => (
            <Star key={i} className="w-3.5 h-3.5 text-[#D4A373] fill-[#D4A373]" />
          ))}
        </div>
        {r.source && (
          <span className="text-[10px] text-[#1A1A1A]/40 tracking-wide uppercase ml-auto">via {r.source}</span>
        )}
      </div>
      <p className="text-[#1A1A1A]/70 font-light leading-relaxed text-sm sm:text-base mb-5 italic flex-1">"{text}"</p>
      <div>
        <p className="text-sm font-medium text-[#1A1A1A]">{r.author}</p>
        {sub && <p className="text-xs text-[#1A1A1A]/40 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function ReviewsCarousel({ reviews, SITE_CONFIG, t }: {
  reviews: AnyReview[];
  SITE_CONFIG: { rating: string | number };
  t: (key: string) => string;
}) {
  const [page, setPage] = useState(0);
  const [direction, setDirection] = useState(0);
  const [dragStartX, setDragStartX] = useState<number | null>(null);

  const PER_PAGE = 3;
  const totalPages = Math.max(1, Math.ceil(reviews.length / PER_PAGE));
  const pageReviews = reviews.slice(page * PER_PAGE, page * PER_PAGE + PER_PAGE);

  const go = (next: number) => {
    setDirection(next > page ? 1 : -1);
    setPage(next);
  };
  const prev = () => { if (page > 0) go(page - 1); };
  const next = () => { if (page < totalPages - 1) go(page + 1); };

  const variants: Variants = {
    enter: (d: number) => ({ x: d > 0 ? 60 : -60, opacity: 0 }),
    center: { x: 0, opacity: 1, transition: { duration: 0.45, ease: "easeOut" } },
    exit: (d: number) => ({ x: d > 0 ? -60 : 60, opacity: 0, transition: { duration: 0.3, ease: "easeIn" } }),
  };

  return (
    <section className="py-20 sm:py-28 md:py-32 px-4 sm:px-8 md:px-12">
      <div className="max-w-6xl mx-auto">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} className="text-center mb-12 sm:mb-16">
          <p className="text-[#D4A373] text-xs tracking-[0.25em] uppercase font-medium mb-5">{t("home.reviews.label")}</p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-['Playfair_Display'] mb-4">{t("home.reviews.heading")}</h2>
          <div className="flex items-center justify-center gap-1 mt-2">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-4 h-4 text-[#D4A373] fill-[#D4A373]" />
            ))}
            <span className="ml-2 text-sm text-[#1A1A1A]/50">{SITE_CONFIG.rating} {t("home.reviews.ratingOn")}</span>
          </div>
        </motion.div>

        <div
          className="relative overflow-hidden"
          onPointerDown={(e) => setDragStartX(e.clientX)}
          onPointerUp={(e) => {
            if (dragStartX === null) return;
            const delta = dragStartX - e.clientX;
            if (Math.abs(delta) > 40) { delta > 0 ? next() : prev(); }
            setDragStartX(null);
          }}
        >
          <AnimatePresence custom={direction} mode="wait">
            <motion.div
              key={page}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {pageReviews.map((r) => (
                <ReviewCard key={r.id} r={r} />
              ))}
            </motion.div>
          </AnimatePresence>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 mt-10">
            <button
              onClick={prev}
              disabled={page === 0}
              aria-label="Previous reviews"
              className="w-9 h-9 flex items-center justify-center border border-[#1A1A1A]/15 text-[#1A1A1A]/50 hover:border-[#D4A373] hover:text-[#D4A373] transition-colors disabled:opacity-25 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex gap-2">
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => go(i)}
                  aria-label={`Go to page ${i + 1}`}
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${i === page ? "bg-[#D4A373]" : "bg-[#1A1A1A]/20 hover:bg-[#1A1A1A]/40"}`}
                />
              ))}
            </div>

            <button
              onClick={next}
              disabled={page === totalPages - 1}
              aria-label="Next reviews"
              className="w-9 h-9 flex items-center justify-center border border-[#1A1A1A]/15 text-[#1A1A1A]/50 hover:border-[#D4A373] hover:text-[#D4A373] transition-colors disabled:opacity-25 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

function HomeEmailSubscription() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail("");
    }
  };

  return (
    <section className="py-16 sm:py-20 bg-[#F4F1EA] px-4 sm:px-8 md:px-12">
      <div className="max-w-xl mx-auto text-center">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp}>
          <p className="text-[#D4A373] text-xs tracking-[0.25em] uppercase font-medium mb-5">{t("home.subscribe.label")}</p>
          <h2 className="text-2xl sm:text-3xl font-['Playfair_Display'] text-[#1A1A1A] mb-4">
            {t("home.subscribe.heading")}
          </h2>
          <p className="text-[#1A1A1A]/55 font-light text-sm sm:text-base leading-relaxed mb-8">
            {t("home.subscribe.desc")}
          </p>
          {subscribed ? (
            <p className="text-[#D4A373] font-medium">{t("home.subscribe.subscribed")}</p>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-0 max-w-md mx-auto">
              <label htmlFor="home-subscribe-email" className="sr-only">
                {t("home.subscribe.placeholder")}
              </label>
              <input
                id="home-subscribe-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("home.subscribe.placeholder")}
                required
                className="flex-1 border border-[#1A1A1A]/15 px-4 py-3.5 text-sm bg-[#FDFBF7] focus:border-[#D4A373] transition-colors"
              />
              <button
                type="submit"
                className="px-6 py-3.5 bg-[#1A1A1A] text-[#FDFBF7] text-xs tracking-widest uppercase font-medium hover:bg-[#D4A373] transition-colors"
              >
                {t("home.subscribe.subscribe")}
              </button>
            </form>
          )}
          <p className="text-[#1A1A1A]/30 text-xs mt-4">{t("home.subscribe.noSpam")}</p>
        </motion.div>
      </div>
    </section>
  );
}

export default function Home() {
  const { config: SITE_CONFIG } = useSiteConfig();
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const compactDays = (SITE_CONFIG.hours.compact as Record<string, string>)[lang] ?? SITE_CONFIG.hours.compact.en;
  const { data: cats = [] } = useListCats();
  const { data: faqs = [] } = useListFaqs();
  const { data: events = [] } = useListEvents();
  const { data: photos = [] } = useListPhotos();
  const { data: reels = [] } = useListInstagramReels();
  const { data: dbTestimonials = [] } = useListTestimonials();

  const [heroVisible, setHeroVisible] = useState(true);

  const activeTestimonials = dbTestimonials.filter(t => t.isActive);
  const reviews = activeTestimonials.length > 0
    ? activeTestimonials.map((t) => ({
        ...t,
        quote:
          (lang === "ja" && t.quoteJa) ? t.quoteJa
          : (lang === "zh" && t.quoteZh) ? t.quoteZh
          : t.quote,
      }))
    : REVIEWS;

  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "CafeOrCoffeeShop",
    name: SITE_CONFIG.name,
    alternateName: SITE_CONFIG.nameJapanese,
    description: "A cat café in Echigo Yuzawa, Niigata. Work, relax, and spend time with five resident cats.",
    url: SITE_CONFIG.siteUrl,
    telephone: SITE_CONFIG.phone,
    email: SITE_CONFIG.email,
    image: `${SITE_CONFIG.siteUrl}/images/cafe-interior.jpg`,
    servesCuisine: "Cat Café, Coffee",
    address: {
      "@type": "PostalAddress",
      streetAddress: SITE_CONFIG.address.street,
      addressLocality: "Yuzawa",
      addressRegion: "Niigata",
      postalCode: SITE_CONFIG.address.postalCode,
      addressCountry: "JP",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 36.9377485,
      longitude: 138.8120502,
    },
    hasMap: SITE_CONFIG.mapUrl,
    openingHours: ["Tu 11:00-18:00", "We 11:00-18:00", "Fr 11:00-18:00", "Sa 11:00-18:00", "Su 11:00-18:00"],
    sameAs: [SITE_CONFIG.instagramUrl],
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: SITE_CONFIG.rating,
      bestRating: "5",
      worstRating: "1",
      reviewCount: String(activeTestimonials.length > 0 ? activeTestimonials.length : REVIEWS.length),
      ratingExplanation: `Rated ${SITE_CONFIG.rating}/5 on ${SITE_CONFIG.ratingSource}`,
    },
  };

  const presentCats = cats.filter(c => c.active && c.presentNow);

  const features = [
    { icon: "🐱", label: t("home.features.cats.label"), sub: t("home.features.cats.sub") },
    { icon: "☕", label: t("home.features.coffee.label"), sub: t("home.features.coffee.sub") },
    { icon: "📶", label: t("home.features.wifi.label"), sub: t("home.features.wifi.sub") },
    { icon: "🏔️", label: t("home.features.mountain.label"), sub: t("home.features.mountain.sub") },
  ];

  return (
    <>
      <PageMeta
        title={t("meta.home.title")}
        description={t("meta.home.desc")}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
      />

      {/* ── Hero ── */}
      <HeroSection
        siteConfig={SITE_CONFIG}
        onHeroVisibilityChange={setHeroVisible}
      />

      {/* ── Mobile Sticky Action Bar (appears when hero leaves viewport) ── */}
      <MobileStickyBar mapUrl={SITE_CONFIG.mapUrl} visible={!heroVisible} />

      {/* ── In the Café Today (Current visit info) ── */}
      {presentCats.length > 0 && (
        <section className="bg-[#D4A373]/10 border-b border-[#D4A373]/20 px-4 sm:px-8 md:px-12 py-8 sm:py-10">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse shrink-0" />
                  <p className="text-[#1A1A1A] text-xs tracking-[0.3em] uppercase font-medium">
                    In the café today
                  </p>
                </div>
                <Link
                  href="/cats"
                  className="inline-flex items-center gap-2 text-[#D4A373] text-xs tracking-widest uppercase font-medium hover:gap-3 transition-all"
                >
                  Meet all the cats <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="flex flex-wrap gap-3 sm:gap-4">
                {presentCats.map(cat => (
                  <Link key={cat.id} href="/cats">
                    <div className="flex items-center gap-3 bg-white border border-[#D4A373]/30 rounded-sm px-4 py-3 shadow-sm hover:border-[#D4A373] hover:shadow-md transition-all cursor-pointer">
                      {cat.image ? (
                        <img
                          src={cat.image}
                          alt={cat.name}
                          className="w-10 h-10 object-cover rounded-full shrink-0 ring-2 ring-green-400/40"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-[#1A1A1A]/10 flex items-center justify-center text-xl shrink-0">
                          🐱
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-[#1A1A1A]">{cat.name}</p>
                        <span className="text-[10px] text-green-600 font-medium tracking-wider uppercase">
                          Here today ✓
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* ── Brand Intro / Cat Café Experience (Our Story) ── */}
      <section className="py-20 sm:py-28 md:py-36 px-4 sm:px-8 md:px-12">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={fadeInUp}
            className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-20 items-center"
          >
            <div>
              <p className="text-[#D4A373] text-xs tracking-[0.25em] uppercase font-medium mb-5">
                {t("home.story.label")}
              </p>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-['Playfair_Display'] text-[#1A1A1A] mb-6 leading-tight">
                {t("home.story.heading1")}<br />
                <span className="italic text-[#D4A373]">{t("home.story.heading2")}</span>
              </h2>
              <div className="space-y-4 sm:space-y-5 text-[#1A1A1A]/70 text-base sm:text-lg font-light leading-relaxed">
                <p>{t("home.story.p1")}</p>
                <p>{t("home.story.p2", { catCount: SITE_CONFIG.catCount })}</p>
              </div>
              <div className="mt-8 flex flex-wrap gap-5 sm:gap-8 text-xs sm:text-sm tracking-widest uppercase text-[#1A1A1A]/60">
                <div className="flex items-center gap-2.5">
                  <Coffee className="w-4 h-4 text-[#D4A373]" />
                  <span>{t("home.story.specialtyCoffee")}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Star className="w-4 h-4 text-[#D4A373]" />
                  <span>{SITE_CONFIG.catCount} {t("home.story.residentCats")}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <MapPin className="w-4 h-4 text-[#D4A373]" />
                  <span>{t("home.story.skiCountry")}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Wifi className="w-4 h-4 text-[#D4A373]" />
                  <span>{t("home.story.workFriendly")}</span>
                </div>
              </div>
            </div>

            <div className="relative mt-4 lg:mt-0">
              <div className="aspect-[4/5] overflow-hidden rounded-sm">
                <img
                  src={`${BASE}images/cafe-exterior.jpg`}
                  alt="Catwork Cafe storefront"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-1000"
                />
              </div>
              <div className="absolute -bottom-6 -left-6 w-32 sm:w-48 h-32 sm:h-48 bg-[#D4A373]/15 rounded-full -z-10 blur-3xl" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Pricing Summary / Why Work Here ── */}
      <section className="py-20 sm:py-28 px-4 sm:px-8 md:px-12 bg-[#1A1A1A] text-[#FDFBF7]">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-center mb-12 sm:mb-16"
          >
            <p className="text-[#D4A373] text-xs tracking-[0.25em] uppercase font-medium mb-5">
              {t("home.whyWork.label")}
            </p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-['Playfair_Display'] mb-5 leading-tight">
              {t("home.whyWork.heading")}
            </h2>
            <p className="text-[#FDFBF7]/60 font-light max-w-lg mx-auto text-base sm:text-lg leading-relaxed">
              {t("home.whyWork.desc")}
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-6 mb-6"
          >
            <motion.div variants={fadeInUp} className="border border-[#FDFBF7]/10 p-7 sm:p-8 hover:border-[#D4A373]/50 transition-colors">
              <div className="text-3xl mb-5">📶</div>
              <h3 className="text-base font-medium uppercase tracking-wider text-[#FDFBF7] mb-4">
                {t("home.whyWork.wifi.heading")}
              </h3>
              <div className="mb-4">
                <span className="text-2xl font-semibold text-[#D4A373] font-['Playfair_Display']">{SITE_CONFIG.wifiSpeed}</span>
                <p className="text-[#D4A373]/60 text-xs uppercase tracking-widest mt-1">{t("home.whyWork.wifi.statLabel")}</p>
              </div>
              <p className="text-[#FDFBF7]/50 text-sm font-light leading-relaxed">
                {t("home.whyWork.wifi.body")}
              </p>
            </motion.div>

            <motion.div variants={fadeInUp} className="border border-[#FDFBF7]/10 p-7 sm:p-8 hover:border-[#D4A373]/50 transition-colors">
              <div className="text-3xl mb-5">🔌</div>
              <h3 className="text-base font-medium uppercase tracking-wider text-[#FDFBF7] mb-4">
                {t("home.whyWork.power.heading")}
              </h3>
              <div className="mb-4">
                <span className="text-2xl font-semibold text-[#D4A373] font-['Playfair_Display']">{SITE_CONFIG.outletCount}</span>
                <p className="text-[#D4A373]/60 text-xs uppercase tracking-widest mt-1">{t("home.whyWork.power.statLabel")}</p>
              </div>
              <p className="text-[#FDFBF7]/50 text-sm font-light leading-relaxed">
                {t("home.whyWork.power.body")}
              </p>
            </motion.div>

            <motion.div variants={fadeInUp} className="border border-[#FDFBF7]/10 p-7 sm:p-8 hover:border-[#D4A373]/50 transition-colors">
              <div className="text-3xl mb-5">🤫</div>
              <h3 className="text-base font-medium uppercase tracking-wider text-[#FDFBF7] mb-3">
                {t("home.whyWork.quiet.heading")}
              </h3>
              <p className="text-[#FDFBF7]/50 text-sm font-light leading-relaxed">
                {t("home.whyWork.quiet.body")}
              </p>
            </motion.div>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="border border-[#D4A373]/40 bg-[#D4A373]/8 p-7 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-5 sm:gap-8"
          >
            <div className="text-4xl flex-shrink-0">🐱</div>
            <div>
              <h3 className="text-base font-medium uppercase tracking-wider text-[#D4A373] mb-2">
                {t("home.whyWork.cats.heading", { catCount: SITE_CONFIG.catCount })}
              </h3>
              <p className="text-[#FDFBF7]/60 text-sm font-light leading-relaxed">
                {t("home.whyWork.cats.body")}
              </p>
            </div>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="mt-10 sm:mt-12 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              href="/pricing"
              className="inline-block px-8 sm:px-10 py-3.5 bg-[#D4A373] text-white text-xs tracking-widest uppercase font-medium hover:bg-[#c49265] transition-colors"
            >
              {t("home.whyWork.cta")}
            </Link>
            <Link
              href="/visit"
              className="inline-block px-8 sm:px-10 py-3.5 border border-[#D4A373] text-[#D4A373] text-xs tracking-widest uppercase font-medium hover:bg-[#D4A373]/10 transition-colors"
            >
              {t("home.whyWork.ctaVisit")}
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-16 sm:py-20 bg-[#F4F1EA] px-4 sm:px-8 md:px-12">
        <div className="max-w-6xl mx-auto">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {features.map((f, i) => (
              <motion.div
                key={i}
                variants={fadeInUp}
                className="text-center p-6 sm:p-8 bg-[#FDFBF7] border border-[#1A1A1A]/6"
              >
                <div className="text-3xl mb-4">{f.icon}</div>
                <div className="text-sm font-medium uppercase tracking-wider text-[#1A1A1A] mb-1.5">{f.label}</div>
                <div className="text-[#1A1A1A]/50 text-sm font-light">{f.sub}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Facilities ── */}
      <section className="py-20 sm:py-28 px-4 sm:px-8 md:px-12">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-center mb-12 sm:mb-16"
          >
            <p className="text-[#D4A373] text-xs tracking-[0.25em] uppercase font-medium mb-5">{t("facilities.label")}</p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-['Playfair_Display'] mb-5">
              {t("facilities.heading")}
            </h2>
            <p className="text-[#1A1A1A]/55 font-light max-w-lg mx-auto">
              {t("facilities.subheading")}
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 mb-10"
          >
            {FACILITIES.map((facility) => (
              <motion.div
                key={facility.titleKey}
                variants={fadeInUp}
                className="p-6 sm:p-7 border border-[#1A1A1A]/8 hover:border-[#D4A373]/40 transition-colors bg-[#FDFBF7]"
              >
                <div className="text-3xl mb-4">{facility.icon}</div>
                <h3 className="text-sm font-medium uppercase tracking-wider text-[#1A1A1A] mb-2">{t(facility.titleKey)}</h3>
                <p className="text-[#1A1A1A]/50 text-sm font-light leading-relaxed">{t(facility.descKey)}</p>
              </motion.div>
            ))}
          </motion.div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} className="text-center">
            <Link href="/facilities" className="inline-flex items-center gap-2 text-[#D4A373] text-sm tracking-widest uppercase font-medium hover:gap-4 transition-all">
              {t("facilities.learnMore")} <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── Meet the Cats ── */}
      <section className="py-20 sm:py-28 md:py-36 bg-[#1A1A1A] text-[#FDFBF7]">
        <div className="px-4 sm:px-8 md:px-12 max-w-6xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-center mb-16 sm:mb-20"
          >
            <p className="text-[#D4A373] text-xs tracking-[0.25em] uppercase font-medium mb-5">{t("home.cats.label")}</p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-['Playfair_Display'] mb-5">
              {t("home.cats.heading")}
            </h2>
            <p className="text-[#FDFBF7]/60 text-base sm:text-lg font-light max-w-xl mx-auto">
              {t("home.cats.desc")}
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-12"
          >
            {cats.filter(c => c.active).slice(0, 3).map((cat) => (
              <motion.div key={cat.slug} variants={fadeInUp} className="group">
                <div className="aspect-square overflow-hidden mb-5 rounded-sm">
                  <CatImageCarousel
                    image={cat.image}
                    images={cat.images}
                    alt={`${cat.name} the cat`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex items-baseline gap-3 mb-2">
                  <h3 className="text-xl sm:text-2xl font-['Playfair_Display']">{cat.name}</h3>
                  <span className="text-[#FDFBF7]/30 text-lg">{cat.kanji}</span>
                </div>
                <p className="text-[#D4A373] text-xs tracking-widest uppercase mb-3">{cat.role}</p>
                <p className="text-[#FDFBF7]/55 font-light leading-relaxed text-sm">{cat.shortBio}</p>
              </motion.div>
            ))}
          </motion.div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} className="text-center">
            <Link href="/cats" className="inline-flex items-center gap-2 text-[#D4A373] text-sm tracking-widest uppercase font-medium hover:gap-4 transition-all">
              {t("home.cats.meetAll")} <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── Interior / Experience Photos ── */}
      <section className="py-20 sm:py-28 md:py-32 px-4 sm:px-8 md:px-12">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-center mb-12 sm:mb-16"
          >
            <p className="text-[#D4A373] text-xs tracking-[0.25em] uppercase font-medium mb-5">{t("home.space.label")}</p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-['Playfair_Display'] mb-5">
              {t("home.space.heading")}
            </h2>
            <p className="text-[#1A1A1A]/55 font-light max-w-lg mx-auto">
              {SITE_CONFIG.seating}. Compact and intentional — nothing wasted.
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6"
          >
            {photos.length > 0 ? (
              <>
                <motion.div variants={fadeInUp} className="aspect-[4/3] overflow-hidden rounded-sm sm:row-span-2 sm:aspect-auto">
                  <img src={photos[0]?.url ?? `${BASE}images/cafe-interior.jpg`} alt={photos[0]?.caption || "Café interior"} className="w-full h-full object-cover hover:scale-105 transition-transform duration-1000" loading="lazy" />
                </motion.div>
                {photos[1] && (
                  <motion.div variants={fadeInUp} className="aspect-[4/3] overflow-hidden rounded-sm">
                    <img src={photos[1].url} alt={photos[1].caption || "Café exterior"} className="w-full h-full object-cover hover:scale-105 transition-transform duration-1000" />
                  </motion.div>
                )}
                {photos[2] && (
                  <motion.div variants={fadeInUp} className="aspect-[4/3] overflow-hidden rounded-sm">
                    <img src={photos[2].url} alt={photos[2].caption || "Café photo"} className="w-full h-full object-cover hover:scale-105 transition-transform duration-1000" />
                  </motion.div>
                )}
              </>
            ) : (
              <>
                <motion.div variants={fadeInUp} className="aspect-[4/3] overflow-hidden rounded-sm sm:row-span-2 sm:aspect-auto">
                  <img src={`${BASE}images/space-1.jpg`} alt="Catwork Cafe seating area" className="w-full h-full object-cover hover:scale-105 transition-transform duration-1000" />
                </motion.div>
                <motion.div variants={fadeInUp} className="aspect-[4/3] overflow-hidden rounded-sm">
                  <img src={`${BASE}images/space-2.jpg`} alt="Catwork Cafe workspace" className="w-full h-full object-cover hover:scale-105 transition-transform duration-1000" />
                </motion.div>
                <motion.div variants={fadeInUp} className="aspect-[4/3] overflow-hidden rounded-sm">
                  <img src={`${BASE}images/space-3.jpg`} alt="Catwork Cafe atmosphere" className="w-full h-full object-cover hover:scale-105 transition-transform duration-1000" />
                </motion.div>
              </>
            )}
          </motion.div>
        </div>
      </section>

      {/* ── Reviews ── */}
      <ReviewsCarousel reviews={reviews} SITE_CONFIG={SITE_CONFIG} t={t} />

      {/* ── FAQ Preview ── */}
      <section className="py-20 sm:py-28 bg-[#F4F1EA] px-4 sm:px-8 md:px-12">
        <div className="max-w-3xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} className="mb-10 sm:mb-12">
            <p className="text-[#D4A373] text-xs tracking-[0.25em] uppercase font-medium mb-5">{t("home.faq.label")}</p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-['Playfair_Display']">{t("home.faq.heading")}</h2>
          </motion.div>

          <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            {faqs.slice(0, 3).map((faq) => (
              <FaqPreviewItem key={faq.id} question={faq.question} answer={faq.answer} />
            ))}
          </motion.div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} className="mt-8">
            <Link href="/faq" className="inline-flex items-center gap-2 text-[#D4A373] text-sm tracking-widest uppercase font-medium hover:gap-4 transition-all">
              {t("home.faq.allQuestions")} <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── News & Events ── */}
      <section className="py-20 sm:py-28 md:py-32 px-4 sm:px-8 md:px-12">
        <div className="max-w-6xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} className="text-center mb-12 sm:mb-16">
            <p className="text-[#D4A373] text-xs tracking-[0.25em] uppercase font-medium mb-5">{t("home.events.label")}</p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-['Playfair_Display']">{t("home.events.heading")}</h2>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {events.map((item) => (
              <motion.div key={item.id} variants={fadeInUp} className="group border border-[#1A1A1A]/8 p-6 sm:p-8 hover:border-[#D4A373]/40 transition-colors">
                <div className="flex items-center gap-3 mb-4">
                  <span className="px-2.5 py-1 bg-[#D4A373]/10 text-[#D4A373] text-xs tracking-widest uppercase font-medium">
                    {item.tag ?? item.type}
                  </span>
                  <span className="text-xs text-[#1A1A1A]/35">{item.date}</span>
                </div>
                <h3 className="text-lg sm:text-xl font-['Playfair_Display'] mb-3 text-[#1A1A1A]">{item.title}</h3>
                {item.titleJa && <p className="text-xs text-[#1A1A1A]/35 tracking-wider mb-3">{item.titleJa}</p>}
                <p className="text-[#1A1A1A]/60 font-light text-sm leading-relaxed">{item.summary}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Email Subscription ── */}
      <HomeEmailSubscription />

      {/* ── Instagram Reels ── */}
      {reels.length > 0 && (
        <section className="py-20 sm:py-28 md:py-32 px-4 sm:px-8 md:px-12">
          <div className="max-w-6xl mx-auto">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} className="text-center mb-12 sm:mb-16">
              <p className="text-[#D4A373] text-xs tracking-[0.25em] uppercase font-medium mb-5">{t("home.instagram.label")}</p>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-['Playfair_Display'] mb-4">{t("home.instagram.heading")}</h2>
              <p className="text-[#1A1A1A]/55 font-light">
                {t("home.instagram.desc")}{" "}
                <a
                  href="https://www.instagram.com/catwork_cafe"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackEvent("contact_channel_clicked", { channel: "instagram", location: "home_instagram_intro" })}
                  className="text-[#D4A373] hover:underline"
                >
                  @catwork_cafe
                </a>
              </p>
            </motion.div>

            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4"
            >
              {reels.slice(0, 9).map((reel) => (
                <motion.a
                  key={reel.mediaId}
                  href={reel.permalink}
                  target="_blank"
                  rel="noopener noreferrer"
                  variants={fadeInUp}
                  className="group relative aspect-square overflow-hidden rounded-sm bg-[#F4F1EA] block"
                >
                  {reel.thumbnailUrl ? (
                    <img
                      src={reel.thumbnailUrl}
                      alt={reel.caption ? reel.caption.slice(0, 60) : "Instagram reel"}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-[#F4F1EA]">
                      <Instagram className="w-8 h-8 text-[#1A1A1A]/20" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 flex items-end p-3">
                    {reel.caption && (
                      <p className="text-white text-xs leading-snug line-clamp-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        {reel.caption}
                      </p>
                    )}
                  </div>
                  <div className="absolute top-2 right-2 bg-black/40 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <Instagram className="w-3 h-3 text-white" />
                  </div>
                </motion.a>
              ))}
            </motion.div>

            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} className="text-center mt-10">
              <a
                href="https://www.instagram.com/catwork_cafe"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackEvent("contact_channel_clicked", { channel: "instagram", location: "home_instagram_cta" })}
                className="inline-flex items-center gap-2 text-[#D4A373] text-sm tracking-widest uppercase font-medium hover:gap-4 transition-all"
              >
                {t("home.instagram.follow")} <Instagram className="w-4 h-4" />
              </a>
            </motion.div>
          </div>
        </section>
      )}

      {/* ── Final CTA ── */}
      <section className="py-20 sm:py-28 bg-[#1A1A1A] text-[#FDFBF7] text-center px-4 sm:px-8">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} className="max-w-2xl mx-auto">
          <p className="text-[#D4A373] text-xs tracking-[0.35em] uppercase font-medium mb-6">{SITE_CONFIG.nameJapanese}</p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-['Playfair_Display'] mb-6 leading-tight">
            {t("home.cta.heading1")}<br />
            <span className="italic text-[#D4A373]">{t("home.cta.heading2")}</span>
          </h2>
          <p className="text-[#FDFBF7]/55 font-light mb-10 text-base sm:text-lg leading-relaxed">
            {t("home.cta.openHours", { days: compactDays, open: SITE_CONFIG.hours.open, close: SITE_CONFIG.hours.close })}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/visit" className="px-7 sm:px-9 py-3.5 bg-[#D4A373] text-white text-xs tracking-widest uppercase font-medium hover:bg-[#c49265] transition-colors">
              {t("home.cta.planVisit")}
            </Link>
            <a
              href={`mailto:${SITE_CONFIG.email}`}
              onClick={() => trackEvent("contact_channel_clicked", { channel: "email", location: "home_cta" })}
              className="px-7 sm:px-9 py-3.5 border border-[#FDFBF7]/30 text-[#FDFBF7] text-xs tracking-widest uppercase font-medium hover:border-[#D4A373] hover:text-[#D4A373] transition-colors"
            >
              {t("home.cta.emailUs")}
            </a>
          </div>
        </motion.div>
      </section>
    </>
  );
}
