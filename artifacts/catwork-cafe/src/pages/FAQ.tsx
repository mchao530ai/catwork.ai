import { motion, type Variants } from "framer-motion";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "../components/ui/accordion";
import { FAQ_CATEGORIES } from "../data/faqs";
import { useSiteConfig } from "../hooks/useSiteConfig";
import PageMeta from "../components/shared/PageMeta";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { useListFaqs } from "@workspace/api-client-react";
import { trackEvent } from "../lib/analytics";

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } },
};

interface LocaleFaqItem {
  category: string;
  question: string;
  answer: string;
}

export default function FAQ() {
  const { config: SITE_CONFIG } = useSiteConfig();
  const { t, i18n } = useTranslation();
  const { data: dbFaqs = [] } = useListFaqs();
  const lang = i18n.language;

  const localeItems = t("faq.items", {
    returnObjects: true,
    defaultValue: [],
    open: SITE_CONFIG.hours.open,
    close: SITE_CONFIG.hours.close,
    days: SITE_CONFIG.hours.days,
    closedDays: SITE_CONFIG.hours.closedDays,
    weekdayPrice1h: SITE_CONFIG.pricing.weekday.firstHour,
    weekdayPrice3h: SITE_CONFIG.pricing.weekday.threeHours,
    weekendPrice1h: SITE_CONFIG.pricing.weekend.firstHour,
    weekendPrice3h: SITE_CONFIG.pricing.weekend.threeHours,
    residentDiscount: SITE_CONFIG.pricing.residentDiscount,
  }) as LocaleFaqItem[];

  const hasDbFaqs = dbFaqs.length > 0;

  const faqs = hasDbFaqs
    ? dbFaqs.map((item) => ({
        ...item,
        question:
          (lang === "ja" && item.questionJa) ? item.questionJa
          : (lang === "zh" && item.questionZh) ? item.questionZh
          : item.question,
        answer:
          (lang === "ja" && item.answerJa) ? item.answerJa
          : (lang === "zh" && item.answerZh) ? item.answerZh
          : item.answer,
      }))
    : Array.isArray(localeItems)
      ? localeItems.map((item, idx) => ({ id: idx, category: item.category, question: item.question, answer: item.answer, sortOrder: idx }))
      : [];

  const categories = Object.entries(FAQ_CATEGORIES) as [keyof typeof FAQ_CATEGORIES, string][];

  const faqPageSchema = faqs.length > 0
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqs.map((f) => ({
          "@type": "Question",
          name: f.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: f.answer,
          },
        })),
      }
    : null;

  return (
    <>
      <PageMeta
        title={t("meta.faq.title")}
        description={t("meta.faq.desc")}
        path="/faq"
      />
      {faqPageSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqPageSchema) }}
        />
      )}

      {/* Header */}
      <section className="pt-32 pb-16 sm:pt-40 sm:pb-20 px-4 sm:px-8 md:px-12 bg-[#FDFBF7]">
        <div className="max-w-3xl mx-auto">
          <motion.div initial="hidden" animate="visible" variants={fadeInUp}>
            <p className="text-[#D4A373] text-xs tracking-[0.3em] uppercase font-medium mb-5">{t("faq.header.label")}</p>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-['Playfair_Display'] text-[#1A1A1A] mb-6 leading-tight">
              {t("faq.header.heading")}
            </h1>
            <p className="text-[#1A1A1A]/60 text-base sm:text-lg font-light leading-relaxed">
              {t("faq.header.desc")}
            </p>
          </motion.div>
        </div>
      </section>

      {/* FAQ Sections */}
      <section className="py-16 sm:py-20 md:py-28 px-4 sm:px-8 md:px-12">
        <div className="max-w-3xl mx-auto space-y-14 sm:space-y-20">
          {categories.map(([catKey, catLabel]) => {
            const items = faqs.filter((f) => f.category === catKey);
            if (!items.length) return null;
            return (
              <motion.div
                key={catKey}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-60px" }}
                variants={fadeInUp}
              >
                <h2 className="text-xl sm:text-2xl font-['Playfair_Display'] text-[#1A1A1A] mb-4 pb-4 border-b-2 border-[#D4A373]">
                  {catLabel}
                </h2>
                <Accordion type="multiple" className="w-full">
                  {items.map((item) => (
                    <AccordionItem
                      key={item.id}
                      value={String(item.id)}
                      className="border-b border-[#1A1A1A]/10"
                    >
                      <AccordionTrigger className="text-base md:text-lg font-medium text-[#1A1A1A] text-left py-5 hover:no-underline hover:text-[#D4A373] transition-colors [&[data-state=open]]:text-[#D4A373] [&[data-state=open]>svg]:text-[#D4A373] [&>svg]:text-[#D4A373] [&>svg]:w-5 [&>svg]:h-5">
                        {item.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-[#1A1A1A]/60 font-light leading-relaxed text-sm md:text-base pb-5">
                        {item.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Still have questions */}
      <section className="py-16 sm:py-20 bg-[#1A1A1A] text-[#FDFBF7] text-center px-4 sm:px-8">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} className="max-w-xl mx-auto">
          <p className="text-[#D4A373] text-xs tracking-[0.3em] uppercase font-medium mb-4">{t("faq.stillCurious.label")}</p>
          <h2 className="text-2xl sm:text-3xl font-['Playfair_Display'] mb-4">{t("faq.stillCurious.heading")}</h2>
          <p className="text-[#FDFBF7]/50 font-light text-sm mb-8 leading-relaxed">
            {t("faq.stillCurious.desc")}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <a
              href={`mailto:${SITE_CONFIG.email}`}
              onClick={() => trackEvent("contact_channel_clicked", { channel: "email", location: "faq_cta" })}
              className="px-7 py-3.5 bg-[#D4A373] text-white text-xs tracking-widest uppercase font-medium rounded-full hover:bg-[#c49265] transition-colors"
            >
              {SITE_CONFIG.email}
            </a>
            <Link href="/contact" className="px-7 py-3.5 border border-[#FDFBF7]/30 text-[#FDFBF7] text-xs tracking-widest uppercase font-medium hover:border-[#D4A373] hover:text-[#D4A373] transition-colors">
              {t("faq.stillCurious.contactForm")}
            </Link>
          </div>
        </motion.div>
      </section>
    </>
  );
}
