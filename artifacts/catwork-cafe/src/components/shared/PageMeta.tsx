import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useSiteConfig } from "../../hooks/useSiteConfig";

interface PageMetaProps {
  title: string;
  description: string;
  ogImage?: string;
  path?: string;
}

export default function PageMeta({ title, description, ogImage, path = "/" }: PageMetaProps) {
  const { config: SITE_CONFIG } = useSiteConfig();
  const { i18n } = useTranslation();

  const fullTitle = title;
  const ogImg = ogImage ?? `${SITE_CONFIG.siteUrl}/opengraph.jpg`;

  const langCode = i18n.language.startsWith("zh")
    ? "zh"
    : i18n.language === "ja"
    ? "ja"
    : "en";

  const canonical =
    langCode !== "en"
      ? `${SITE_CONFIG.siteUrl}${path}?lang=${langCode}`
      : `${SITE_CONFIG.siteUrl}${path}`;

  useEffect(() => {
    document.title = fullTitle;

    const setMeta = (name: string, content: string, prop = false) => {
      const attr = prop ? "property" : "name";
      let el = document.querySelector(`meta[${attr}="${name}"]`);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    const setLink = (rel: string, href: string, extra?: Record<string, string>) => {
      const selector = extra
        ? `link[rel="${rel}"]${Object.entries(extra)
            .map(([k, v]) => `[${k}="${v}"]`)
            .join("")}`
        : `link[rel="${rel}"]`;
      let el = document.querySelector(selector);
      if (!el) {
        el = document.createElement("link");
        el.setAttribute("rel", rel);
        if (extra) Object.entries(extra).forEach(([k, v]) => el!.setAttribute(k, v));
        document.head.appendChild(el);
      }
      el.setAttribute("href", href);
    };

    setMeta("description", description);
    setMeta("og:title", fullTitle, true);
    setMeta("og:description", description, true);
    setMeta("og:url", canonical, true);
    setMeta("og:image", ogImg, true);
    setMeta("og:type", "website", true);
    setMeta("og:site_name", SITE_CONFIG.name, true);
    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:title", fullTitle);
    setMeta("twitter:description", description);
    setMeta("twitter:image", ogImg);

    setLink("canonical", canonical);
    setLink("alternate", `${SITE_CONFIG.siteUrl}${path}?lang=en`, { hreflang: "en" });
    setLink("alternate", `${SITE_CONFIG.siteUrl}${path}?lang=ja`, { hreflang: "ja" });
    setLink("alternate", `${SITE_CONFIG.siteUrl}${path}?lang=zh`, { hreflang: "zh-Hant" });
    setLink("alternate", `${SITE_CONFIG.siteUrl}${path}`, { hreflang: "x-default" });
  }, [fullTitle, description, canonical, ogImg, SITE_CONFIG.name, path, SITE_CONFIG.siteUrl]);

  return null;
}
