import { motion, type Variants } from "framer-motion";
import { MapPin, Train, Car, Clock, Navigation } from "lucide-react";
import { NEARBY_LANDMARKS, TRANSPORT_INFO } from "../data/siteConfig";
import { useSiteConfig } from "../hooks/useSiteConfig";
import { useListTransportInfo, useListNearbyLandmarks } from "@workspace/api-client-react";
import PageMeta from "../components/shared/PageMeta";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } },
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.12 } },
};

const ICON_MAP: Record<string, React.ReactNode> = {
  Shinkansen: <Train className="w-5 h-5 text-[#D4A373]" />,
  Walk: <Navigation className="w-5 h-5 text-[#D4A373]" />,
  Car: <Car className="w-5 h-5 text-[#D4A373]" />,
};

export default function Access() {
  const { config: SITE_CONFIG } = useSiteConfig();
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const { data: dbTransport = [] } = useListTransportInfo();
  const { data: dbLandmarks = [] } = useListNearbyLandmarks();

  const rawTransport = dbTransport.length > 0 ? dbTransport : TRANSPORT_INFO;
  const rawLandmarks = dbLandmarks.length > 0 ? dbLandmarks : NEARBY_LANDMARKS;

  const transportItems = rawTransport.map((item) => ({
    ...item,
    title:
      (lang === "ja" && "titleJa" in item && item.titleJa) ? item.titleJa
      : (lang === "zh" && "titleZh" in item && item.titleZh) ? item.titleZh
      : item.title,
    description:
      (lang === "ja" && "descriptionJa" in item && item.descriptionJa) ? item.descriptionJa
      : (lang === "zh" && "descriptionZh" in item && item.descriptionZh) ? item.descriptionZh
      : item.description,
    note:
      (lang === "ja" && "noteJa" in item && item.noteJa) ? item.noteJa
      : (lang === "zh" && "noteZh" in item && item.noteZh) ? item.noteZh
      : item.note,
  }));

  const landmarkItems = rawLandmarks.map((item) => ({
    ...item,
    name:
      (lang === "ja" && "nameJa" in item && item.nameJa) ? item.nameJa
      : (lang === "zh" && "nameZh" in item && item.nameZh) ? item.nameZh
      : item.name,
  }));

  return (
    <>
      <PageMeta
        title={t("meta.access.title")}
        description={t("meta.access.desc")}
        path="/access"
      />

      {/* Header */}
      <section className="pt-32 pb-16 sm:pt-40 sm:pb-20 px-4 sm:px-8 md:px-12 bg-[#FDFBF7]">
        <div className="max-w-6xl mx-auto">
          <motion.div initial="hidden" animate="visible" variants={fadeInUp}>
            <p className="text-[#D4A373] text-xs tracking-[0.3em] uppercase font-medium mb-5">{t("access.header.label")}</p>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-['Playfair_Display'] text-[#1A1A1A] mb-6 leading-tight">
              {t("access.header.heading")}
            </h1>
            <p className="text-[#1A1A1A]/60 text-base sm:text-lg font-light max-w-xl leading-relaxed">
              {t("access.header.desc")}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Map + Address */}
      <section className="py-16 sm:py-20 md:py-28 px-4 sm:px-8 md:px-12 bg-[#F4F1EA]">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
            {/* Map Embed */}
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp}>
              <div className="aspect-[4/3] overflow-hidden rounded-sm">
                <iframe
                  src={SITE_CONFIG.mapEmbedUrl}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Catwork Cafe location map"
                  className="w-full h-full"
                />
              </div>
              <a
                href={SITE_CONFIG.mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-block px-5 py-2.5 bg-[#1A1A1A] text-[#FDFBF7] text-xs tracking-widest uppercase font-medium hover:bg-[#D4A373] transition-colors"
              >
                {t("access.mapButton")}
              </a>
            </motion.div>

            {/* Address Details */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
              className="space-y-8"
            >
              <motion.div variants={fadeInUp} className="flex items-start gap-5">
                <div className="w-11 h-11 rounded-full bg-[#D4A373]/12 flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-[#D4A373]" />
                </div>
                <div>
                  <h3 className="text-sm font-medium uppercase tracking-wider mb-2">{t("access.address.heading")}</h3>
                  <p className="text-[#1A1A1A]/65 font-light leading-relaxed">
                    {SITE_CONFIG.address.street}<br />
                    {SITE_CONFIG.address.district}<br />
                    {SITE_CONFIG.address.city} {SITE_CONFIG.address.postalCode}<br />
                    {SITE_CONFIG.address.country}
                  </p>
                  <p className="text-[#D4A373] text-sm mt-2">{SITE_CONFIG.address.directions}</p>
                </div>
              </motion.div>

              <motion.div variants={fadeInUp} className="flex items-start gap-5">
                <div className="w-11 h-11 rounded-full bg-[#D4A373]/12 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5 text-[#D4A373]" />
                </div>
                <div>
                  <h3 className="text-sm font-medium uppercase tracking-wider mb-2">{t("access.openingHours.heading")}</h3>
                  <p className="text-[#1A1A1A]/65 font-light">
                    {SITE_CONFIG.hours.days}<br />
                    {SITE_CONFIG.hours.open} – {SITE_CONFIG.hours.close}
                  </p>
                  <p className="text-[#1A1A1A]/35 text-sm mt-1.5">{t("access.openingHours.closed")} {SITE_CONFIG.hours.closedDays}</p>
                </div>
              </motion.div>

              <motion.div variants={fadeInUp}>
                <h3 className="text-sm font-medium uppercase tracking-wider mb-4">{t("access.nearbyLandmarks.heading")}</h3>
                <ul className="space-y-2">
                  {landmarkItems.map((lm) => (
                    <li key={lm.name} className="flex items-center justify-between text-sm">
                      <span className="text-[#1A1A1A]/65 font-light">{lm.name}</span>
                      <span className="text-[#D4A373] text-xs ml-4 shrink-0">{lm.distance}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Transport Options */}
      <section className="py-20 sm:py-28 px-4 sm:px-8 md:px-12">
        <div className="max-w-6xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} className="mb-12">
            <p className="text-[#D4A373] text-xs tracking-[0.25em] uppercase font-medium mb-5">{t("access.transport.label")}</p>
            <h2 className="text-3xl sm:text-4xl font-['Playfair_Display']">{t("access.transport.heading")}</h2>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {transportItems.map((t_info) => (
              <motion.div key={t_info.type} variants={fadeInUp} className="border border-[#1A1A1A]/8 p-7 sm:p-9 hover:border-[#D4A373]/40 transition-colors">
                <div className="w-10 h-10 rounded-full bg-[#D4A373]/10 flex items-center justify-center mb-5">
                  {ICON_MAP[t_info.type]}
                </div>
                <h3 className="text-sm font-medium uppercase tracking-wider mb-3">{t_info.title}</h3>
                <p className="text-[#1A1A1A]/60 font-light text-sm leading-relaxed mb-3">{t_info.description}</p>
                <p className="text-[#D4A373] text-xs">{t_info.note}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Parking */}
      <section className="py-16 sm:py-20 bg-[#1A1A1A] text-[#FDFBF7] px-4 sm:px-8 md:px-12">
        <div className="max-w-6xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp}>
            <div className="flex items-start gap-6">
              <Car className="w-6 h-6 text-[#D4A373] shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-medium uppercase tracking-wider mb-3">{t("access.parking.heading")}</h3>
                <p className="text-[#FDFBF7]/60 font-light leading-relaxed max-w-2xl">
                  {t("access.parking.desc")}
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-20 bg-[#F4F1EA] text-center px-4 sm:px-8">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} className="max-w-xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-['Playfair_Display'] text-[#1A1A1A] mb-6">{t("access.cta.heading")}</h2>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/visit" className="px-7 py-3.5 bg-[#1A1A1A] text-[#FDFBF7] text-xs tracking-widest uppercase font-medium hover:bg-[#D4A373] transition-colors">
              {t("access.cta.bookVisit")}
            </Link>
            <Link href="/pricing" className="px-7 py-3.5 border border-[#1A1A1A]/20 text-[#1A1A1A] text-xs tracking-widest uppercase font-medium hover:border-[#D4A373] hover:text-[#D4A373] transition-colors">
              {t("access.cta.viewPricing")}
            </Link>
          </div>
        </motion.div>
      </section>
    </>
  );
}
