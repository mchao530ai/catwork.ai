#!/usr/bin/env node
/**
 * prerender.mjs — post-build multilingual static prerender
 *
 * Generates 27 HTML files (9 routes × 3 languages) for search-engine
 * crawlability. Each file contains the correct <html lang>, <title>,
 * <meta description>, OG tags, and hreflang links for its language — without
 * requiring JavaScript to execute.
 *
 * URL strategy: query-param (?lang=en|ja|zh) throughout.
 *   - Canonical URLs: ?lang=<code> for non-EN locales; bare URL for EN.
 *   - Hreflang alternates: ?lang=en, ?lang=ja, ?lang=zh.
 *
 * Output layout:
 *   dist/public/              ← EN (default)
 *   dist/public/ja/           ← Japanese auxiliary snapshots
 *   dist/public/zh/           ← Chinese auxiliary snapshots
 *
 * Language-set script (JA/ZH files):
 *   A small inline <script> sets localStorage.catwork_lang before the SPA
 *   mounts, so i18next picks up the correct language from localStorage.
 *   It also strips the /ja/ or /zh/ prefix from the URL (history.replaceState)
 *   so the SPA router sees its expected paths (/, /visit, etc.).
 *
 * Usage: node prerender.mjs   (called automatically by `pnpm build`)
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = resolve(__dirname, "dist/public");
const SITE_URL = "https://catwork.ai";

const esc = (s) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const ROUTES = [
  { path: "/", dir: null, slug: "home" },
  { path: "/visit", dir: "visit", slug: "visit" },
  { path: "/pricing", dir: "pricing", slug: "pricing" },
  { path: "/cats", dir: "cats", slug: "cats" },
  { path: "/facilities", dir: "facilities", slug: "facilities" },
  { path: "/access", dir: "access", slug: "access" },
  { path: "/faq", dir: "faq", slug: "faq" },
  { path: "/contact", dir: "contact", slug: "contact" },
  { path: "/reels", dir: "reels", slug: "reels" },
];

const LANGS = [
  { code: "en", prefix: "", htmlLang: "en" },
  { code: "ja", prefix: "/ja", htmlLang: "ja" },
  { code: "zh", prefix: "/zh", htmlLang: "zh-Hant" },
];

const META = {
  en: {
    home: {
      title: "Catwork Cafe — Cat Café & Remote Workspace in Echigo Yuzawa, Niigata",
      desc: "Spend time with five resident cats, enjoy specialty coffee, and work remotely in the mountains of Niigata. Open Tuesday, Wednesday, Friday, Saturday & Sunday, 11:00–18:00.",
    },
    visit: {
      title: "Visit & Booking | Catwork Cafe",
      desc: "Plan your visit to Catwork Cafe in Echigo Yuzawa. Request a booking or walk in. Open Tuesday, Wednesday, Friday, Saturday & Sunday, 11:00–18:00.",
    },
    pricing: {
      title: "Pricing & Entry Fee | Catwork Cafe",
      desc: "Entry from ¥1,200/hr (weekday) or ¥1,500/hr (weekend). One drink required per session. Niigata residents receive ¥500 off. Low-season rates available.",
    },
    cats: {
      title: "The Cats | Catwork Cafe",
      desc: "Meet the five resident cats of Catwork Cafe — Hime, Inu, Sumi, Haru, and Kiri. Each has a unique personality, breed, and story.",
    },
    facilities: {
      title: "Facilities | Catwork Cafe",
      desc: "High-speed Wi-Fi, power at every seat, flexible seating, specialty drinks, manga library, mountain views, and a cat interaction zone.",
    },
    access: {
      title: "Access | Catwork Cafe",
      desc: "Catwork Cafe is 2 minutes from Echigo Yuzawa Station — east exit, inside the indoor shopping arcade. Look for the orange noren curtain.",
    },
    faq: {
      title: "FAQ | Catwork Cafe",
      desc: "Frequently asked questions about Catwork Cafe — booking, opening hours, Wi-Fi, photo policy, cat rules, pricing, and more.",
    },
    contact: {
      title: "Contact | Catwork Cafe",
      desc: "Get in touch with Catwork Cafe — general enquiries, private event hire, or partnership proposals.",
    },
    reels: {
      title: "Reels | Catwork Cafe",
      desc: "Watch the latest reels from Catwork Cafe. Meet Hime, Inu, Sumi, Haru, and Kiri through our Instagram feed.",
    },
  },
  ja: {
    home: {
      title: "キャットワークカフェ — 越後湯沢の猫カフェ・ワークカフェ | 新潟",
      desc: "越後湯沢の猫カフェ。5頭の猫と過ごしながらコーヒーを楽しみ、リモートワークもできる空間。火・水・金・土・日 11:00〜18:00営業。越後湯沢駅から徒歩2分。",
    },
    visit: {
      title: "来店・予約 | キャットワークカフェ",
      desc: "キャットワークカフェへの来店案内。ご予約またはウォークインで。火・水・金・土・日 11:00〜18:00、越後湯沢駅から徒歩2分。",
    },
    pricing: {
      title: "料金 | キャットワークカフェ",
      desc: "平日1時間¥1,200〜、土日祝1時間¥1,500〜。ワンドリンクオーダー制。新潟県民¥500割引あり。低シーズン料金もございます。",
    },
    cats: {
      title: "猫たち | キャットワークカフェ",
      desc: "キャットワークカフェの5頭の猫たちをご紹介 — ヒメ、イヌ、スミ、ハル、キリ。それぞれ個性豊かな猫たちです。",
    },
    facilities: {
      title: "設備 | キャットワークカフェ",
      desc: "高速Wi-Fi、全席電源完備、多様な座席、スペシャルティドリンク、漫画ライブラリ、山の眺め、猫ふれあいゾーン。",
    },
    access: {
      title: "アクセス | キャットワークカフェ",
      desc: "越後湯沢駅東口から徒歩2分のアーケード内。オレンジの暖簾が目印。JR上越新幹線・越後湯沢駅下車。",
    },
    faq: {
      title: "よくある質問 | キャットワークカフェ",
      desc: "キャットワークカフェのよくある質問 — ご予約、営業時間、Wi-Fi、撮影ポリシー、猫のルール、料金など。",
    },
    contact: {
      title: "お問い合わせ | キャットワークカフェ",
      desc: "キャットワークカフェへのお問い合わせ — 一般のご質問、貸し切りイベント、提携のご提案など。",
    },
    reels: {
      title: "リール | キャットワークカフェ",
      desc: "キャットワークカフェの最新インスタグラムリール。ヒメ、イヌ、スミ、ハル、キリの日常をご覧ください。",
    },
  },
  zh: {
    home: {
      title: "CatWork Cafe — 新潟越後湯澤的貓咪咖啡廳與遠端工作空間",
      desc: "越後湯澤貓咪咖啡廳。與五隻駐店貓咪共度時光、品嚐精品咖啡、享受遠端辦公。週二、三、五、六、日 11:00–18:00 營業，越後湯澤站步行2分鐘。",
    },
    visit: {
      title: "參觀與預約 | Catwork Cafe",
      desc: "前往越後湯澤 Catwork Cafe 的參觀指南。提前預約或直接到訪均歡迎。週二、三、五、六、日 11:00–18:00，越後湯澤站步行2分鐘。",
    },
    pricing: {
      title: "價格與入場費 | Catwork Cafe",
      desc: "平日入場費首小時 ¥1,200 起，週末首小時 ¥1,500 起。需點一杯飲品。新潟縣民享 ¥500 折扣。提供淡季優惠。",
    },
    cats: {
      title: "貓咪們 | Catwork Cafe",
      desc: "認識 Catwork Cafe 的五隻駐店貓咪 — Hime、Inu、Sumi、Haru 和 Kiri。各有獨特性格與故事。",
    },
    facilities: {
      title: "設施 | Catwork Cafe",
      desc: "高速 Wi-Fi、每座均設電源、多元座位選擇、精品飲品、漫畫圖書館、山景窗景，以及貓咪互動區。",
    },
    access: {
      title: "交通資訊 | Catwork Cafe",
      desc: "越後湯澤站東口室內商業街內，步行約2分鐘。搭乘JR上越新幹線至越後湯澤站下車。橘色門簾為標誌。",
    },
    faq: {
      title: "常見問題 | Catwork Cafe",
      desc: "Catwork Cafe 常見問題 — 預約、營業時間、Wi-Fi、拍照規定、貓咪守則、入場費等。",
    },
    contact: {
      title: "聯絡我們 | Catwork Cafe",
      desc: "聯絡 Catwork Cafe — 一般詢問、包場活動或合作提案。",
    },
    reels: {
      title: "短片 | Catwork Cafe",
      desc: "觀看 Catwork Cafe 最新 Instagram 短片。透過我們的貼文認識 Hime、Inu、Sumi、Haru 和 Kiri。",
    },
  },
};

const templatePath = resolve(DIST, "index.html");
if (!existsSync(templatePath)) {
  console.error("✗ dist/public/index.html not found — run vite build first.");
  process.exit(1);
}

const template = readFileSync(templatePath, "utf-8");
let count = 0;

for (const route of ROUTES) {
  for (const lang of LANGS) {
    const meta = META[lang.code][route.slug];
    const enUrl = `${SITE_URL}${route.path}`;

    const canonical =
      lang.code !== "en"
        ? `${enUrl}?lang=${lang.code}`
        : enUrl;

    const hreflangBlock = [
      `  <link rel="alternate" hreflang="en" href="${enUrl}?lang=en" />`,
      `  <link rel="alternate" hreflang="ja" href="${enUrl}?lang=ja" />`,
      `  <link rel="alternate" hreflang="zh-Hant" href="${enUrl}?lang=zh" />`,
      `  <link rel="alternate" hreflang="x-default" href="${enUrl}" />`,
    ].join("\n");

    const langSetScript =
      lang.code !== "en"
        ? `  <script>(function(){try{localStorage.setItem('catwork_lang','${lang.code}');}catch(e){}var p=location.pathname,s=p.replace(/^\\/(ja|zh)/,'');if(s!==p)history.replaceState({},'',s||'/');})();</script>`
        : "";

    let html = template
      .replace(/(<html\b[^>]*\slang=")[^"]*(")/i, `$1${lang.htmlLang}$2`)
      .replace(/(<title>)[^<]*(<\/title>)/, `$1${esc(meta.title)}$2`)
      .replace(
        /(<meta\s+name="description"\s+content=")[^"]*(")/,
        `$1${esc(meta.desc)}$2`
      )
      .replace(
        /(<meta\s+property="og:title"\s+content=")[^"]*(")/,
        `$1${esc(meta.title)}$2`
      )
      .replace(
        /(<meta\s+property="og:description"\s+content=")[^"]*(")/,
        `$1${esc(meta.desc)}$2`
      )
      .replace(
        /(<meta\s+property="og:url"\s+content=")[^"]*(")/,
        `$1${canonical}$2`
      )
      .replace(
        /(<link\s+rel="canonical"\s+href=")[^"]*(")/,
        `$1${canonical}$2`
      );

    html = html.replace(
      /<link\s+rel="alternate"\s+hreflang="[^"]*"\s+href="[^"]*"\s*\/>\n?/g,
      ""
    );

    const injection =
      hreflangBlock + (langSetScript ? "\n" + langSetScript : "");
    html = html.replace("</head>", `${injection}\n</head>`);

    const outBase = lang.code === "en" ? DIST : resolve(DIST, lang.code);
    const outDir = route.dir ? resolve(outBase, route.dir) : outBase;
    if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
    writeFileSync(resolve(outDir, "index.html"), html, "utf-8");

    count++;
    console.log(`  ✓ ${lang.prefix || ""}${route.path}`);
  }
}

console.log(
  `\n✓ Prerendered ${count} files (${ROUTES.length} routes × ${LANGS.length} languages) → ${DIST}\n`
);
