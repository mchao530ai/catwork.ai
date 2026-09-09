import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import en from "./locales/en";
import ja from "./locales/ja";
import zh from "./locales/zh";

function applyLang(lng: string) {
  const root = document.documentElement;
  const base = lng.split("-")[0]!;
  const htmlLang = base === "zh" ? "zh-Hant" : base;
  root.setAttribute("lang", htmlLang);
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ja: { translation: ja },
      zh: { translation: zh },
    },
    fallbackLng: "en",
    detection: {
      order: ["querystring", "localStorage", "navigator"],
      lookupQuerystring: "lang",
      lookupLocalStorage: "catwork_lang",
      caches: ["localStorage"],
    },
    interpolation: {
      escapeValue: false,
    },
  });

i18n.on("languageChanged", applyLang);
applyLang(i18n.language || "en");

export default i18n;
