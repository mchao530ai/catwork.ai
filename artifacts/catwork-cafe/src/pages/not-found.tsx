import { Link } from "wouter";
import { useTranslation } from "react-i18next";

export default function NotFound() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex items-center justify-center text-center px-4">
      <div>
        <p className="text-[#D4A373] text-xs tracking-[0.25em] uppercase mb-4">404</p>
        <h1 className="text-3xl sm:text-4xl font-['Playfair_Display'] text-[#1A1A1A] mb-4">
          {t("notFound.heading")}
        </h1>
        <Link href="/" className="text-sm text-[#1A1A1A]/50 hover:text-[#D4A373] transition-colors">
          {t("notFound.returnHome")}
        </Link>
      </div>
    </div>
  );
}
