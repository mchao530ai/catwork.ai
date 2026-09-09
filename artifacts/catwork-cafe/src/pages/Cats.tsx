import { useState } from "react";
import { motion, type Variants } from "framer-motion";
import { useListCats } from "@workspace/api-client-react";
import { useSiteConfig } from "../hooks/useSiteConfig";
import PageMeta from "../components/shared/PageMeta";
import { Link } from "wouter";
import CatImageCarousel from "../components/CatImageCarousel";
import { useTranslation } from "react-i18next";

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } },
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.12 } },
};

interface NotifyState {
  email: string;
  status: "idle" | "submitting" | "success" | "error" | "already";
  errorMsg: string;
}

function NotifyButton({ catId, catName }: { catId: number; catName: string }) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<NotifyState>({ email: "", status: "idle", errorMsg: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState(s => ({ ...s, status: "submitting", errorMsg: "" }));
    try {
      const res = await fetch(`/api/cats/${catId}/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: state.email }),
      });
      const data = await res.json() as { success?: boolean; alreadySubscribed?: boolean; error?: string };
      if (!res.ok) {
        setState(s => ({ ...s, status: "error", errorMsg: data.error ?? "Something went wrong" }));
      } else if (data.alreadySubscribed) {
        setState(s => ({ ...s, status: "already" }));
      } else {
        setState(s => ({ ...s, status: "success" }));
      }
    } catch {
      setState(s => ({ ...s, status: "error", errorMsg: "Network error — please try again" }));
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 border border-[#FDFBF7]/20 text-[#FDFBF7]/60 text-xs tracking-widest uppercase font-medium hover:border-[#D4A373] hover:text-[#D4A373] transition-colors"
      >
        <span>🔔</span>
        Notify me when {catName} is here
      </button>
    );
  }

  if (state.status === "success") {
    return (
      <div className="mt-6 flex items-center gap-2 text-sm text-green-400">
        <span>✓</span>
        <span>You're on the list — we'll email you when {catName} arrives.</span>
      </div>
    );
  }

  if (state.status === "already") {
    return (
      <div className="mt-6 flex items-center gap-2 text-sm text-[#D4A373]">
        <span>✓</span>
        <span>You're already subscribed for {catName} notifications.</span>
      </div>
    );
  }

  const inputId = `notify-email-${catId}`;
  return (
    <form onSubmit={handleSubmit} className="mt-6 flex flex-col sm:flex-row gap-2 items-start">
      <label htmlFor={inputId} className="sr-only">
        Your email address to be notified when {catName} is here
      </label>
      <input
        id={inputId}
        type="email"
        value={state.email}
        onChange={e => setState(s => ({ ...s, email: e.target.value }))}
        placeholder="your@email.com"
        required
        className="px-4 py-2.5 bg-transparent border border-[#FDFBF7]/20 text-[#FDFBF7] placeholder-[#FDFBF7]/30 text-sm focus:border-[#D4A373] w-full sm:w-64"
      />
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={state.status === "submitting"}
          className="px-5 py-2.5 bg-[#D4A373] text-[#1A1A1A] text-xs tracking-widest uppercase font-medium hover:bg-[#c4915f] transition-colors disabled:opacity-50 whitespace-nowrap"
        >
          {state.status === "submitting" ? "…" : "Notify me"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="px-3 py-2.5 border border-[#FDFBF7]/15 text-[#FDFBF7]/40 text-xs hover:border-[#FDFBF7]/30 transition-colors"
        >
          ✕
        </button>
      </div>
      {state.status === "error" && (
        <p className="text-red-400 text-xs mt-1 sm:mt-0 sm:self-center">{state.errorMsg}</p>
      )}
    </form>
  );
}

export default function Cats() {
  const { config: SITE_CONFIG } = useSiteConfig();
  const { t, i18n } = useTranslation();
  const compactDays = (SITE_CONFIG.hours.compact as Record<string, string>)[i18n.language] ?? SITE_CONFIG.hours.compact.en;
  const { data: cats = [] } = useListCats();

  const catRules = t("cats.rules.items", { returnObjects: true }) as string[];
  const activeCats = cats.filter(c => c.active);
  const presentCats = activeCats.filter(c => c.presentNow);

  return (
    <>
      <PageMeta
        title={t("meta.cats.title")}
        description={t("meta.cats.desc")}
        path="/cats"
      />

      {/* Header */}
      <section className="pt-32 pb-16 sm:pt-40 sm:pb-20 px-4 sm:px-8 md:px-12 bg-[#1A1A1A] text-[#FDFBF7]">
        <div className="max-w-6xl mx-auto">
          <motion.div initial="hidden" animate="visible" variants={fadeInUp}>
            <p className="text-[#D4A373] text-xs tracking-[0.3em] uppercase font-medium mb-5">{t("cats.header.label")}</p>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-['Playfair_Display'] text-[#FDFBF7] mb-6 leading-tight">
              {t("cats.header.heading")}
            </h1>
            <p className="text-[#FDFBF7]/60 text-base sm:text-lg font-light max-w-xl leading-relaxed">
              {t("cats.header.desc")}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Who's here today */}
      {presentCats.length > 0 && (
        <section className="bg-[#D4A373]/10 border-b border-[#D4A373]/20 px-4 sm:px-8 md:px-12 py-10">
          <div className="max-w-6xl mx-auto">
            <motion.div initial="hidden" animate="visible" variants={fadeInUp}>
              <div className="flex items-center gap-3 mb-6">
                <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <p className="text-[#1A1A1A] text-xs tracking-[0.3em] uppercase font-medium">Who's here today</p>
              </div>
              <div className="flex flex-wrap gap-4">
                {presentCats.map(cat => (
                  <div key={cat.id} className="flex items-center gap-3 bg-white border border-[#D4A373]/30 rounded-sm px-4 py-3 shadow-sm">
                    {cat.image ? (
                      <img
                        src={cat.image}
                        alt={cat.name}
                        className="w-10 h-10 object-cover rounded-full shrink-0 ring-2 ring-green-400/40"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-[#1A1A1A]/10 flex items-center justify-center text-xl shrink-0">🐱</div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-[#1A1A1A]">{cat.name}</p>
                      <span className="text-[10px] text-green-600 font-medium tracking-wider uppercase">Here today ✓</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* Cat Gallery */}
      <section className="py-16 sm:py-20 md:py-28 bg-[#1A1A1A] text-[#FDFBF7]">
        <div className="px-4 sm:px-8 md:px-12 max-w-6xl mx-auto">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="space-y-16 sm:space-y-24"
          >
            {activeCats.map((cat, i) => (
              <motion.article
                key={cat.id}
                variants={fadeInUp}
                className={`grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center ${i % 2 === 1 ? "lg:[direction:rtl]" : ""}`}
              >
                <div className={`aspect-[4/5] overflow-hidden rounded-sm group ${i % 2 === 1 ? "lg:[direction:ltr]" : ""}`}>
                  {cat.image ? (
                    <CatImageCarousel
                      image={cat.image}
                      images={cat.images}
                      alt={`${cat.name} — ${cat.role}`}
                      className="w-full h-full object-cover"
                      loading={i === 0 ? "eager" : "lazy"}
                    />
                  ) : (
                    <div className="w-full h-full bg-[#FDFBF7]/10 flex items-center justify-center text-[#FDFBF7]/30 text-6xl" aria-hidden="true">🐱</div>
                  )}
                </div>

                <div className={i % 2 === 1 ? "lg:[direction:ltr]" : ""}>
                  <div className="flex items-baseline gap-4 mb-2">
                    <h2 className="text-3xl sm:text-4xl font-['Playfair_Display']">{cat.name}</h2>
                    <span className="text-[#FDFBF7]/25 text-2xl">{cat.kanji}</span>
                  </div>

                  <div className="flex items-center gap-3 mb-3">
                    <p className="text-[#D4A373] text-xs tracking-[0.25em] uppercase font-medium">{cat.role}</p>
                    {cat.presentNow ? (
                      <span className="inline-flex items-center gap-1 text-[10px] text-green-400 border border-green-400/30 bg-green-400/10 px-2 py-0.5 tracking-wider uppercase font-medium rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                        Here today ✓
                      </span>
                    ) : cat.onVacation ? (
                      <span className="inline-flex items-center gap-1.5 text-[10px] text-amber-400 border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 tracking-wider uppercase font-medium rounded-full">
                        🌴 Currently on vacation
                      </span>
                    ) : (
                      <span className="text-[10px] text-[#FDFBF7]/30 border border-[#FDFBF7]/10 px-2 py-0.5 tracking-wider uppercase font-medium rounded-full">
                        Currently away
                      </span>
                    )}
                  </div>
                  <p className="text-[#FDFBF7]/35 text-xs tracking-wider mb-6">{cat.breed}</p>

                  <p className="text-[#FDFBF7]/65 font-light leading-relaxed text-base sm:text-lg mb-8">
                    {cat.bio}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {cat.personality.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1.5 border border-[#FDFBF7]/12 text-[#FDFBF7]/50 text-xs tracking-widest uppercase font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {!cat.presentNow && (
                    <NotifyButton catId={cat.id} catName={cat.name} />
                  )}
                </div>
              </motion.article>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Rules */}
      <section className="py-16 sm:py-20 bg-[#FDFBF7] px-4 sm:px-8 md:px-12">
        <div className="max-w-3xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp}>
            <p className="text-[#D4A373] text-xs tracking-[0.25em] uppercase font-medium mb-5">{t("cats.rules.label")}</p>
            <h2 className="text-2xl sm:text-3xl font-['Playfair_Display'] mb-8">{t("cats.rules.heading")}</h2>
            <ul className="space-y-4">
              {catRules.map((rule, i) => (
                <li key={i} className="flex items-start gap-4">
                  <span className="text-[#D4A373] font-['Playfair_Display'] text-lg shrink-0 mt-0.5">{String(i + 1).padStart(2, "0")}</span>
                  <p className="text-[#1A1A1A]/65 font-light leading-relaxed">{rule}</p>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-20 bg-[#F4F1EA] text-center px-4 sm:px-8">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} className="max-w-xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-['Playfair_Display'] text-[#1A1A1A] mb-4">{t("cats.cta.heading")}</h2>
          <p className="text-[#1A1A1A]/55 font-light mb-8">{t("cats.cta.hours", { days: compactDays, open: SITE_CONFIG.hours.open, close: SITE_CONFIG.hours.close })}</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/visit" className="px-7 py-3.5 bg-[#1A1A1A] text-[#FDFBF7] text-xs tracking-widest uppercase font-medium hover:bg-[#D4A373] transition-colors">
              {t("cats.cta.planVisit")}
            </Link>
            <Link href="/pricing" className="px-7 py-3.5 border border-[#1A1A1A]/20 text-[#1A1A1A] text-xs tracking-widest uppercase font-medium hover:border-[#D4A373] hover:text-[#D4A373] transition-colors">
              {t("cats.cta.viewPricing")}
            </Link>
          </div>
        </motion.div>
      </section>
    </>
  );
}
