#!/usr/bin/env node
/**
 * test-seo.mjs — SEO regression tests (pure Node.js, no framework)
 *
 * URL contract: query-param (?lang=en|ja|zh) throughout.
 *   - Canonical: bare for EN, ?lang=<code> for JA/ZH
 *   - Hreflang alternates: ?lang=en, ?lang=ja, ?lang=zh
 *   - x-default: bare canonical URL
 *
 * Sections 1–6: source-level checks (always run)
 * Section 7:    build-artifact checks (requires dist/public — run pnpm build)
 *
 * Usage:
 *   node scripts/test-seo.mjs
 *   pnpm --filter @workspace/catwork-cafe test:seo
 */
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

let pass = 0;
let fail = 0;

function ok(desc) {
  console.log(`  \x1b[32m✓\x1b[0m ${desc}`);
  pass++;
}
function err(desc, detail = "") {
  console.error(`  \x1b[31m✗\x1b[0m ${desc}${detail ? ` — ${detail}` : ""}`);
  fail++;
}

const read = (rel) => readFileSync(resolve(root, rel), "utf-8");

const PAGE_SLUGS = [
  "home", "visit", "pricing", "cats",
  "facilities", "access", "faq", "contact", "reels",
];

// ── 1. Locale meta keys ───────────────────────────────────────────────────
console.log("\n[1] Locale meta keys");
for (const lang of ["en", "ja", "zh"]) {
  const src = read(`src/i18n/locales/${lang}.ts`);
  if (!src.includes("meta: {")) { err(`${lang}.ts has meta: { } section`); continue; }
  for (const slug of PAGE_SLUGS) {
    if (src.includes(`    ${slug}: {`)) ok(`${lang}.meta.${slug}`);
    else err(`${lang}.meta.${slug}`, "slug block not found");
  }
}

// ── 2. robots.txt ────────────────────────────────────────────────────────
console.log("\n[2] robots.txt");
const robots = read("public/robots.txt");
if (robots.includes("Disallow: /admin")) ok("Disallow: /admin");
else err("Disallow: /admin");
if (robots.includes("Disallow: /api/")) ok("Disallow: /api/");
else err("Disallow: /api/");
if (robots.includes("Sitemap:")) ok("Sitemap directive");
else err("Sitemap directive");

// ── 3. sitemap.xml — query-param hreflang ────────────────────────────────
console.log("\n[3] sitemap.xml (?lang= query-param contract)");
const sitemap = read("public/sitemap.xml");
if (sitemap.includes("?lang=en")) ok("?lang=en alternates present");
else err("?lang=en", "not found");
if (sitemap.includes("?lang=ja")) ok("?lang=ja alternates present");
else err("?lang=ja", "not found");
if (sitemap.includes("?lang=zh")) ok("?lang=zh alternates present");
else err("?lang=zh", "not found");
if (sitemap.includes('hreflang="zh-Hant"')) ok('hreflang="zh-Hant" used');
else err('hreflang="zh-Hant"');
if (!sitemap.includes('hreflang="zh"')) ok('no bare hreflang="zh"');
else err('bare hreflang="zh" exists', "should be zh-Hant");
if (sitemap.includes('hreflang="x-default"')) ok("x-default present");
else err("x-default");
const sitemapHasPathLocs = sitemap.includes("<loc>https://catwork.ai/ja/") ||
  sitemap.includes("<loc>https://catwork.ai/zh/");
if (!sitemapHasPathLocs) ok("no /ja/ or /zh/ <loc> entries (query-param strategy)");
else err("path-based <loc> entries found", "sitemap should use ?lang= only");

// ── 4. Home.tsx JSON-LD ──────────────────────────────────────────────────
console.log("\n[4] Home.tsx JSON-LD");
const homeSrc = read("src/pages/Home.tsx");
if (!homeSrc.includes("reviewBody")) ok("no fake reviewBody");
else err("reviewBody present");
if (!homeSrc.includes('"47"')) ok('no hardcoded reviewCount "47"');
else err('hardcoded reviewCount "47"');
if (homeSrc.includes("Tu 11:00-18:00")) ok("openingHours: Tue included");
else err("openingHours: Tue missing");
if (homeSrc.includes("We 11:00-18:00")) ok("openingHours: Wed included");
else err("openingHours: Wed missing");
if (homeSrc.includes("Fr 11:00-18:00")) ok("openingHours: Fri included");
else err("openingHours: Fri missing");

// ── 5. PageMeta.tsx — query-param hreflang ───────────────────────────────
console.log("\n[5] PageMeta.tsx (?lang= query-param contract)");
const pageMeta = read("src/components/shared/PageMeta.tsx");
if (pageMeta.includes("?lang=en")) ok("hreflang en → ?lang=en");
else err("hreflang en", "?lang=en not found");
if (pageMeta.includes("?lang=ja")) ok("hreflang ja → ?lang=ja");
else err("hreflang ja", "?lang=ja not found");
if (pageMeta.includes("?lang=zh")) ok("hreflang zh → ?lang=zh");
else err("hreflang zh", "?lang=zh not found");
if (pageMeta.includes("zh-Hant")) ok('hreflang uses zh-Hant BCP-47 code');
else err("hreflang zh-Hant");
if (pageMeta.includes("x-default")) ok("x-default hreflang present");
else err("x-default hreflang");
if (pageMeta.includes("?lang=${langCode}")) ok("canonical includes ?lang= for non-EN locales");
else err("canonical", "?lang= param not included for non-EN");
const hasPathBasedHreflang = pageMeta.includes("siteUrl}/ja") || pageMeta.includes("siteUrl}/zh");
if (!hasPathBasedHreflang) ok("no path-based /ja/ or /zh/ hreflang prefixes");
else err("path-based hreflang found", "should use ?lang= not path prefix");

// ── 6. i18n setup ────────────────────────────────────────────────────────
console.log("\n[6] i18n setup");
const i18nSrc = read("src/i18n/index.ts");
if (i18nSrc.includes('"querystring"')) ok("querystring detector first in order");
else err("querystring detector");
if (i18nSrc.includes('lookupQuerystring: "lang"')) ok('lookupQuerystring: "lang"');
else err('lookupQuerystring: "lang"');
if (i18nSrc.includes("zh-Hant")) ok("applyLang maps zh→zh-Hant");
else err("applyLang zh-Hant mapping");

// ── 7. Build artifacts ───────────────────────────────────────────────────
const distDir = resolve(root, "dist/public");
if (existsSync(distDir)) {
  console.log("\n[7] Prerendered HTML build artifacts (?lang= contract)");

  const check = (relPath, specs) => {
    const fullPath = resolve(distDir, relPath);
    if (!existsSync(fullPath)) {
      err(relPath, "file not found — run pnpm build first");
      return;
    }
    const html = readFileSync(fullPath, "utf-8");
    for (const [desc, test] of specs) {
      if (test(html)) ok(`${relPath}: ${desc}`);
      else err(`${relPath}: ${desc}`);
    }
  };

  check("index.html", [
    ["lang=en on <html>", (h) => h.includes('lang="en"')],
    ["English title", (h) => h.includes("Catwork Cafe")],
    ["no lang-set redirect script", (h) => !h.includes("catwork_lang")],
    ["hreflang uses ?lang=en", (h) => h.includes("?lang=en")],
    ["hreflang uses ?lang=ja", (h) => h.includes("?lang=ja")],
    ["canonical is bare URL (no ?lang=)", (h) => {
      const m = h.match(/<link\s+rel="canonical"\s+href="([^"]*)"/);
      return m ? !m[1].includes("?lang=") : false;
    }],
  ]);

  check("ja/index.html", [
    ["lang=ja on <html>", (h) => h.includes('lang="ja"')],
    ["Japanese title present", (h) => h.includes("キャットワークカフェ")],
    ["lang-set script injected", (h) => h.includes("catwork_lang") && h.includes("'ja'")],
    ["hreflang uses ?lang=ja (not /ja/ path)", (h) =>
      h.includes("?lang=ja") && !h.includes('href="https://catwork.ai/ja/"')],
    ["canonical is ?lang=ja", (h) => {
      const m = h.match(/<link\s+rel="canonical"\s+href="([^"]*)"/);
      return m ? m[1].includes("?lang=ja") : false;
    }],
  ]);

  check("zh/index.html", [
    ["lang=zh-Hant on <html>", (h) => h.includes('lang="zh-Hant"')],
    ["Chinese title present", (h) => h.includes("貓咪") || h.includes("CatWork")],
    ["lang-set script injected", (h) => h.includes("catwork_lang") && h.includes("'zh'")],
    ["canonical is ?lang=zh", (h) => {
      const m = h.match(/<link\s+rel="canonical"\s+href="([^"]*)"/);
      return m ? m[1].includes("?lang=zh") : false;
    }],
  ]);

  check("visit/index.html", [
    ["English visit title", (h) => h.includes("Visit") && h.includes("Booking")],
    ["canonical is bare /visit", (h) => {
      const m = h.match(/<link\s+rel="canonical"\s+href="([^"]*)"/);
      return m ? m[1] === "https://catwork.ai/visit" : false;
    }],
    ["hreflang ?lang=ja present", (h) => h.includes("visit?lang=ja")],
  ]);

  check("ja/visit/index.html", [
    ["lang=ja on <html>", (h) => h.includes('lang="ja"')],
    ["Japanese visit title", (h) => h.includes("来店・予約")],
    ["canonical is visit?lang=ja", (h) => {
      const m = h.match(/<link\s+rel="canonical"\s+href="([^"]*)"/);
      return m ? m[1].includes("visit?lang=ja") : false;
    }],
  ]);

  check("zh/pricing/index.html", [
    ["lang=zh-Hant on <html>", (h) => h.includes('lang="zh-Hant"')],
    ["Chinese pricing title", (h) => h.includes("價格")],
    ["canonical is pricing?lang=zh", (h) => {
      const m = h.match(/<link\s+rel="canonical"\s+href="([^"]*)"/);
      return m ? m[1].includes("pricing?lang=zh") : false;
    }],
  ]);
} else {
  console.log(
    "\n[7] Build artifacts — \x1b[33mskipped\x1b[0m (run `pnpm build` first)"
  );
}

// ── Summary ──────────────────────────────────────────────────────────────
const total = pass + fail;
console.log(`\n${"─".repeat(50)}`);
console.log(`Results: ${pass}/${total} passed${fail > 0 ? `, ${fail} failed` : " ✓"}\n`);
if (fail > 0) process.exit(1);
