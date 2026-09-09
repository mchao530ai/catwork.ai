import { Link } from "wouter";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight, X, Expand } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useEffect, useState, useMemo, useCallback } from "react";
import { useListPhotos } from "@workspace/api-client-react";
import { FACILITIES } from "../data/facilities";
import { BUSINESS_CONFIG } from "../data/businessConfig";
import PageMeta from "../components/shared/PageMeta";

const BASE = import.meta.env.BASE_URL;

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } },
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.12 } },
};

const CATEGORY_DISPLAY_ORDER = ["seating", "cats", "views", "cafe"];

const CATEGORY_ALIASES: Record<string, string> = {
  interior: "seating",
  exterior: "views",
  mountain: "views",
};

function normalizeCategory(category: string): string {
  return CATEGORY_ALIASES[category] ?? category;
}

const FALLBACK_PHOTOS = [
  { url: `${BASE}images/cafe-interior.jpg`, caption: "Café interior", category: "seating" },
  { url: `${BASE}images/cafe-exterior.jpg`, caption: "Café exterior", category: "views" },
  { url: `${BASE}images/cat-hime.webp`, caption: "Hime in the cat zone", category: "cats" },
  { url: `${BASE}images/cat-kiri.webp`, caption: "Kiri by the window", category: "cats" },
];

type PhotoEntry = { url: string; caption: string; category: string };

const slideVariants: Variants = {
  enter: (d: number) => ({ x: d > 0 ? "100%" : "-100%", opacity: 0 }),
  center: { x: 0, opacity: 1, transition: { duration: 0.55, ease: "easeInOut" } },
  exit: (d: number) => ({ x: d > 0 ? "-100%" : "100%", opacity: 0, transition: { duration: 0.45, ease: "easeInOut" } }),
};

function CategoryCarousel({ photos, onOpen }: { photos: PhotoEntry[]; onOpen: (i: number) => void }) {
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
    }, 4500);
    return () => clearInterval(t);
  }, [photos.length]);

  if (photos.length === 0) return null;

  return (
    <div className="relative w-full aspect-[16/7] overflow-hidden bg-[#1A1A1A]/5">
      <AnimatePresence initial={false} custom={direction}>
        <motion.button
          key={current}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          onClick={() => onOpen(current)}
          className="absolute inset-0 w-full h-full cursor-zoom-in"
          aria-label={`View full-size: ${photos[current].caption}`}
        >
          <img
            src={photos[current].url}
            alt={photos[current].caption}
            className="w-full h-full object-cover"
          />
          <span className="absolute bottom-3 right-3 bg-black/40 text-white rounded p-1 pointer-events-none">
            <Expand className="w-4 h-4" />
          </span>
        </motion.button>
      </AnimatePresence>

      {photos.length > 1 && (
        <>
          <button onClick={prev} className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-white/80 hover:bg-white transition-colors z-10" aria-label="Previous">
            <ChevronLeft className="w-4 h-4 text-[#1A1A1A]" />
          </button>
          <button onClick={next} className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-white/80 hover:bg-white transition-colors z-10" aria-label="Next">
            <ChevronRight className="w-4 h-4 text-[#1A1A1A]" />
          </button>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-0.5 z-10">
            {photos.map((_, i) => (
              <button
                key={i}
                onClick={() => go(i)}
                className="w-7 h-7 flex items-center justify-center group"
                aria-label={`Slide ${i + 1}`}
                aria-current={i === current ? "true" : undefined}
              >
                <span className={`block rounded-full transition-all ${i === current ? "bg-white w-5 h-1.5" : "bg-white/50 w-1.5 h-1.5 group-hover:bg-white/75"}`} />
              </button>
            ))}
          </div>
        </>
      )}

      {photos[current].caption && (
        <p className="absolute bottom-3 left-4 text-white/80 text-xs tracking-wide font-light pointer-events-none z-10 drop-shadow">
          {photos[current].caption}
        </p>
      )}
    </div>
  );
}

export default function Facilities() {
  const { t, i18n } = useTranslation();
  const { data: apiPhotos = [] } = useListPhotos();
  const rawPhotos: PhotoEntry[] =
    apiPhotos.length > 0
      ? apiPhotos.map((p) => ({ url: p.url, caption: p.caption, category: p.category ?? "cafe" }))
      : FALLBACK_PHOTOS;

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const categorizedGroups = useMemo(() => {
    const map = new Map<string, PhotoEntry[]>();
    for (const photo of rawPhotos) {
      const cat = normalizeCategory(photo.category || "cafe");
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(photo);
    }
    return Array.from(map.entries()).sort(([a], [b]) => {
      const ai = CATEGORY_DISPLAY_ORDER.indexOf(a);
      const bi = CATEGORY_DISPLAY_ORDER.indexOf(b);
      if (ai === -1 && bi === -1) return a.localeCompare(b);
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    });
  }, [rawPhotos]);

  const allPhotos = useMemo(
    () => categorizedGroups.flatMap(([, photos]) => photos),
    [categorizedGroups],
  );

  function getCategoryLabel(category: string): string {
    const key = `facilities.gallery.categories.${category}` as const;
    const translated = t(key as Parameters<typeof t>[0]);
    if (translated === key) {
      return category.charAt(0).toUpperCase() + category.slice(1);
    }
    return translated;
  }

  let globalIndex = 0;

  useEffect(() => {
    if (lightboxIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxIndex(null);
      if (e.key === "ArrowLeft") setLightboxIndex((i) => i !== null ? (i - 1 + allPhotos.length) % allPhotos.length : null);
      if (e.key === "ArrowRight") setLightboxIndex((i) => i !== null ? (i + 1) % allPhotos.length : null);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [lightboxIndex, allPhotos.length]);

  return (
    <>
      <PageMeta
        title={t("meta.facilities.title")}
        description={t("meta.facilities.desc")}
        path="/facilities"
      />

      {/* Header */}
      <section className="pt-32 pb-16 sm:pt-40 sm:pb-20 px-4 sm:px-8 md:px-12 bg-[#FDFBF7]">
        <div className="max-w-6xl mx-auto">
          <motion.div initial="hidden" animate="visible" variants={fadeInUp}>
            <p className="text-[#D4A373] text-xs tracking-[0.3em] uppercase font-medium mb-5">
              {t("facilities.label")}
            </p>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-['Playfair_Display'] text-[#1A1A1A] mb-6 leading-tight">
              {t("facilities.heading")}
            </h1>
            <p className="text-[#1A1A1A]/60 text-base sm:text-lg font-light max-w-xl leading-relaxed">
              {t("facilities.subheading")}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Facility Cards */}
      <section className="py-16 sm:py-20 md:py-28 px-4 sm:px-8 md:px-12 bg-[#F4F1EA]">
        <div className="max-w-6xl mx-auto">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {FACILITIES.map((facility) => (
              <motion.div
                key={facility.titleKey}
                variants={fadeInUp}
                className="bg-[#FDFBF7] border border-[#1A1A1A]/8 p-7 sm:p-8 hover:border-[#D4A373]/40 transition-colors"
              >
                <div className="text-3xl mb-5">{facility.icon}</div>
                <h3 className="text-sm font-medium uppercase tracking-wider text-[#1A1A1A] mb-3">
                  {t(facility.titleKey)}
                </h3>
                <p className="text-[#1A1A1A]/55 font-light text-sm leading-relaxed">
                  {t(facility.descKey, { catCount: BUSINESS_CONFIG.catCount })}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Photo Gallery */}
      <section className="py-16 sm:py-20 md:py-28 px-4 sm:px-8 md:px-12 bg-[#FDFBF7]">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="mb-12 sm:mb-16"
          >
            <p className="text-[#D4A373] text-xs tracking-[0.3em] uppercase font-medium mb-4">
              {t("facilities.gallery.label")}
            </p>
            <h2 className="text-3xl sm:text-4xl font-['Playfair_Display'] text-[#1A1A1A] mb-3 leading-tight">
              {t("facilities.gallery.heading")}
            </h2>
            <p className="text-[#1A1A1A]/55 font-light text-base leading-relaxed max-w-lg">
              {t("facilities.gallery.subheading")}
            </p>
          </motion.div>

          <div className="space-y-14 sm:space-y-20">
            {categorizedGroups.map(([category, photos]) => {
              const startIndex = globalIndex;
              globalIndex += photos.length;
              const isSeating = category === "seating";
              return (
                <motion.div
                  key={category}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={isSeating ? fadeInUp : staggerContainer}
                >
                  <div className="flex items-center gap-4 mb-6">
                    <span className="text-[#1A1A1A] text-xs tracking-[0.25em] uppercase font-medium">
                      {getCategoryLabel(category)}
                    </span>
                    <div className="flex-1 h-px bg-[#1A1A1A]/10" />
                  </div>

                  {isSeating ? (
                    <CategoryCarousel
                      photos={photos}
                      onOpen={(i) => setLightboxIndex(startIndex + i)}
                    />
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {photos.map((photo, i) => {
                        const photoGlobalIndex = startIndex + i;
                        return (
                          <motion.div key={i} variants={fadeInUp} className="overflow-hidden">
                            <button
                              onClick={() => setLightboxIndex(photoGlobalIndex)}
                              className="w-full overflow-hidden block cursor-zoom-in group aspect-[4/3] relative"
                              aria-label={`View full-size: ${photo.caption}`}
                            >
                                      <img
                                src={photo.url}
                                alt={photo.caption}
                                loading="lazy"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
                              />
                              <span aria-hidden="true" className="absolute bottom-2 right-2 bg-black/40 text-white rounded p-1 transition-opacity duration-300 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 pointer-events-none">
                                <Expand className="w-4 h-4" />
                              </span>
                            </button>
                            {photo.caption && (
                              <p className="text-[#1A1A1A]/40 text-xs tracking-wide mt-2 font-light">
                                {photo.caption}
                              </p>
                            )}
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Additional Details */}
      <section className="py-20 sm:py-28 px-4 sm:px-8 md:px-12">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-20 items-center"
          >
            <motion.div variants={fadeInUp}>
              <p className="text-[#D4A373] text-xs tracking-[0.25em] uppercase font-medium mb-5">
                {t("facilities.label")}
              </p>
              <h2 className="text-3xl sm:text-4xl font-['Playfair_Display'] text-[#1A1A1A] mb-6 leading-tight">
                {t("facilities.detail.heading1")}<br />
                <span className="italic text-[#D4A373]">{t("facilities.detail.heading2")}</span>
              </h2>
              <div className="space-y-4 text-[#1A1A1A]/65 font-light leading-relaxed text-base">
                <p>{t("facilities.detail.p1", { catCount: BUSINESS_CONFIG.catCount })}</p>
                <p>{t("facilities.detail.p2")}</p>
              </div>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/pricing"
                  className="inline-flex items-center gap-2 text-[#D4A373] text-sm tracking-widest uppercase font-medium hover:gap-4 transition-all"
                >
                  {t("facilities.cta.seePricing")} <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </motion.div>

            <motion.div variants={fadeInUp} className="grid grid-cols-2 gap-4">
              {[
                { num: String(BUSINESS_CONFIG.facilities.amenityCount), label: t("facilities.stats.amenities") },
                { num: BUSINESS_CONFIG.facilities.seatingAreasDisplay, label: t("facilities.stats.seatingAreas") },
                { num: BUSINESS_CONFIG.facilities.wifiCoverageDisplay, label: t("facilities.stats.wifiCoverage") },
                { num: String(BUSINESS_CONFIG.catCount), label: t("facilities.stats.residentCats") },
              ].map((stat, i) => (
                <div
                  key={i}
                  className="bg-[#F4F1EA] p-6 sm:p-8 text-center border border-[#1A1A1A]/6"
                >
                  <div className="text-3xl sm:text-4xl font-['Playfair_Display'] text-[#D4A373] mb-2">
                    {stat.num}
                  </div>
                  <div className="text-xs uppercase tracking-wider text-[#1A1A1A]/50 font-medium">
                    {stat.label}
                  </div>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-20 bg-[#1A1A1A] text-center px-4 sm:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          className="max-w-xl mx-auto"
        >
          <h2 className="text-2xl sm:text-3xl font-['Playfair_Display'] text-[#FDFBF7] mb-6">
            {t("facilities.cta.heading")}
          </h2>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/visit"
              className="px-7 py-3.5 bg-[#D4A373] text-white text-xs tracking-widest uppercase font-medium hover:bg-[#c49265] transition-colors"
            >
              {t("facilities.cta.bookVisit")}
            </Link>
            <Link
              href="/pricing"
              className="px-7 py-3.5 border border-[#FDFBF7]/30 text-[#FDFBF7] text-xs tracking-widest uppercase font-medium hover:border-[#D4A373] hover:text-[#D4A373] transition-colors"
            >
              {t("facilities.cta.seePricing")}
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxIndex !== null && (() => {
          const activePhoto = allPhotos[lightboxIndex];
          if (!activePhoto) return null;
          const hasPrev = allPhotos.length > 1;
          const hasNext = allPhotos.length > 1;
          const goPrev = () => setLightboxIndex((i) => i !== null ? (i - 1 + allPhotos.length) % allPhotos.length : null);
          const goNext = () => setLightboxIndex((i) => i !== null ? (i + 1) % allPhotos.length : null);
          return (
            <motion.div
              key="lightbox"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
              onClick={() => setLightboxIndex(null)}
              role="dialog"
              aria-modal="true"
              aria-label={`Photo: ${activePhoto.caption || "Gallery image"}`}
            >
              {/* Prev arrow */}
              {hasPrev && (
                <button
                  onClick={(e) => { e.stopPropagation(); goPrev(); }}
                  className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-10 text-white/70 hover:text-white bg-black/30 hover:bg-black/50 rounded-full p-2 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                  aria-label="Previous photo"
                >
                  <ChevronLeft className="w-7 h-7" />
                </button>
              )}

              <motion.div
                initial={{ scale: 0.92, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.92, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="relative max-w-4xl w-full"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => setLightboxIndex(null)}
                  className="absolute -top-10 right-0 text-white/70 hover:text-white transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                  aria-label="Close lightbox"
                  autoFocus
                >
                  <X className="w-6 h-6" />
                </button>
                <img
                  src={activePhoto.url}
                  alt={activePhoto.caption}
                  className="w-full max-h-[80vh] object-contain"
                />
                {activePhoto.caption && (
                  <p className="text-white/60 text-sm text-center mt-4 font-light tracking-wide">
                    {activePhoto.caption}
                  </p>
                )}
                {allPhotos.length > 1 && (
                  <p className="text-white/30 text-xs text-center mt-2 font-light" aria-live="polite">
                    {lightboxIndex + 1} / {allPhotos.length}
                  </p>
                )}
              </motion.div>

              {/* Next arrow */}
              {hasNext && (
                <button
                  onClick={(e) => { e.stopPropagation(); goNext(); }}
                  className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-10 text-white/70 hover:text-white bg-black/30 hover:bg-black/50 rounded-full p-2 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                  aria-label="Next photo"
                >
                  <ChevronRight className="w-7 h-7" />
                </button>
              )}
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </>
  );
}
