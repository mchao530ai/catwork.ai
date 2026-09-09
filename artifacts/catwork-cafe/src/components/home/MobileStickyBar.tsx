import { AnimatePresence, motion } from "framer-motion";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";

interface MobileStickyBarProps {
  mapUrl: string;
  visible: boolean;
}

export default function MobileStickyBar({ mapUrl, visible }: MobileStickyBarProps) {
  const { t } = useTranslation();

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-[#1A1A1A] border-t border-[#FDFBF7]/10 px-4 py-3 flex gap-3 safe-bottom"
          aria-label="Quick actions"
        >
          <Link
            href="/visit"
            className="flex-1 py-3 bg-[#D4A373] text-white text-[10px] tracking-widest uppercase font-medium hover:bg-[#c49265] transition-colors text-center"
          >
            {t("home.hero.cta.reservation")}
          </Link>
          <a
            href={mapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-3 border border-[#FDFBF7]/30 text-[#FDFBF7] text-[10px] tracking-widest uppercase font-medium hover:border-[#D4A373] hover:text-[#D4A373] transition-colors text-center"
          >
            {t("home.hero.cta.directions")}
          </a>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
