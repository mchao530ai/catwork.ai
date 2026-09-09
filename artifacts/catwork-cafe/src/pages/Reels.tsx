import { motion, type Variants } from "framer-motion";
import { Instagram, ExternalLink } from "lucide-react";
import { useListInstagramReels } from "@workspace/api-client-react";
import PageMeta from "../components/shared/PageMeta";
import { useTranslation } from "react-i18next";
import { BUSINESS_CONFIG } from "../data/businessConfig";

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07 } },
};

export default function Reels() {
  const { data: reels = [], isLoading } = useListInstagramReels();
  const { t } = useTranslation();
  const catCount = BUSINESS_CONFIG.catCount;

  return (
    <>
      <PageMeta
        title={t("meta.reels.title")}
        description={t("meta.reels.desc")}
        path="/reels"
      />

      {/* ── Hero ── */}
      <section className="pt-32 pb-16 sm:pt-40 sm:pb-20 px-4 sm:px-8 md:px-12 bg-[#FDFBF7]">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            className="max-w-2xl"
          >
            <p className="text-[#D4A373] text-xs tracking-[0.25em] uppercase font-medium mb-5">
              @catwork_cafe
            </p>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-['Playfair_Display'] text-[#1A1A1A] mb-6 leading-tight">
              {t("reels.header.heading1", { catCount })} <span className="italic text-[#D4A373]">{t("reels.header.heading2", { catCount })}</span>
            </h1>
            <p className="text-[#1A1A1A]/60 text-base sm:text-lg font-light leading-relaxed mb-8">
              {t("reels.header.desc")}
            </p>
            <a
              href="https://www.instagram.com/catwork_cafe"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 px-5 py-3 bg-[#1A1A1A] text-[#FDFBF7] text-xs tracking-widest uppercase font-medium rounded-full hover:bg-[#D4A373] transition-colors"
            >
              <Instagram className="w-3.5 h-3.5" />
              {t("reels.header.followButton")}
            </a>
          </motion.div>
        </div>
      </section>

      {/* ── Reels Grid ── */}
      <section className="pb-24 sm:pb-32 px-4 sm:px-8 md:px-12 bg-[#FDFBF7]">
        <div className="max-w-6xl mx-auto">

          {isLoading && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="aspect-square bg-[#1A1A1A]/5 rounded-sm animate-pulse" />
              ))}
            </div>
          )}

          {!isLoading && reels.length === 0 && (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeInUp}
              className="text-center py-24"
            >
              <div className="w-16 h-16 rounded-full bg-[#D4A373]/15 flex items-center justify-center mx-auto mb-6">
                <Instagram className="w-7 h-7 text-[#D4A373]" />
              </div>
              <h2 className="text-2xl font-['Playfair_Display'] text-[#1A1A1A] mb-3">{t("reels.empty.heading")}</h2>
              <p className="text-[#1A1A1A]/50 font-light text-sm max-w-xs mx-auto leading-relaxed mb-8">
                {t("reels.empty.desc")}
              </p>
              <a
                href="https://www.instagram.com/catwork_cafe"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-[#D4A373] hover:text-[#1A1A1A] transition-colors"
              >
                {t("reels.empty.viewOnInstagram")} <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </motion.div>
          )}

          {!isLoading && reels.length > 0 && (
            <>
              <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4"
              >
                {reels.map((reel) => (
                  <motion.a
                    key={reel.mediaId}
                    variants={fadeInUp}
                    href={reel.permalink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative aspect-square overflow-hidden rounded-sm bg-[#1A1A1A]/5 block"
                  >
                    {reel.thumbnailUrl ? (
                      <img
                        src={reel.thumbnailUrl}
                        alt={reel.caption ? reel.caption.slice(0, 80) : "Instagram reel"}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Instagram className="w-8 h-8 text-[#1A1A1A]/20" />
                      </div>
                    )}

                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/55 transition-colors duration-300 flex flex-col items-start justify-end p-3 sm:p-4">
                      {reel.caption && (
                        <p className="text-white text-xs font-light leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity duration-300 line-clamp-4">
                          {reel.caption}
                        </p>
                      )}
                      <span className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 inline-flex items-center gap-1.5 text-white/70 text-[10px] tracking-wider uppercase">
                        <Instagram className="w-3 h-3" />
                        {t("reels.viewReel")}
                      </span>
                    </div>

                    {/* Reel badge */}
                    <div className="absolute top-2 right-2 bg-black/50 rounded-full p-1.5 backdrop-blur-sm">
                      <Instagram className="w-3 h-3 text-white" />
                    </div>
                  </motion.a>
                ))}
              </motion.div>

              {/* Footer CTA */}
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeInUp}
                className="text-center mt-14 sm:mt-18"
              >
                <p className="text-[#1A1A1A]/40 text-sm font-light mb-5 tracking-wide">
                  {reels.length} reel{reels.length !== 1 ? "s" : ""} from @catwork_cafe
                </p>
                <a
                  href="https://www.instagram.com/catwork_cafe"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2.5 px-6 py-3.5 border border-[#1A1A1A]/15 text-[#1A1A1A] text-xs tracking-widest uppercase font-medium hover:border-[#D4A373] hover:text-[#D4A373] transition-colors rounded-full"
                >
                  <Instagram className="w-3.5 h-3.5" />
                  {t("reels.seeMore")}
                </a>
              </motion.div>
            </>
          )}
        </div>
      </section>
    </>
  );
}
