export interface AddressConfig {
  street: string;
  district: string;
  city: string;
  postalCode: string;
  country: string;
  full: string;
  directions: string;
}

export interface HoursConfig {
  days: string;
  open: string;
  close: string;
  closedDays: string;
  display: string;
  compact: {
    en: string;
    ja: string;
    zh: string;
  };
}

export interface ContactConfig {
  phone: string;
  phoneHref: string;
  email: string;
  instagram: string;
  instagramUrl: string;
}

export interface UrlConfig {
  siteUrl: string;
  mapEmbedUrl: string;
  mapUrl: string;
  instagramUrl: string;
}

export interface FacilitiesConfig {
  wifiSpeed: string;
  outletCount: number;
  seating: string;
  amenityCount: number;
  seatingAreasDisplay: string;
  wifiCoverageDisplay: string;
}

export interface PricingTierConfig {
  firstHour: string;
  threeHours: string;
}

export interface PricingConfig {
  weekday: PricingTierConfig;
  weekend: PricingTierConfig;
  residentDiscount: string;
}

export interface TransportItem {
  type: string;
  title: string;
  titleJa: string;
  titleZh: string;
  description: string;
  descriptionJa: string;
  descriptionZh: string;
  note: string;
  noteJa: string;
  noteZh: string;
}

export interface LandmarkItem {
  name: string;
  nameJa: string;
  nameZh: string;
  distance: string;
}

export interface PolicyConfig {
  ageLimit: string | null;
  reservationUrl: string | null;
  lastAdmission: string | null;
}

export interface BusinessConfig {
  name: string;
  nameJapanese: string;
  tagline: string;
  location: string;
  address: AddressConfig;
  hours: HoursConfig;
  contact: ContactConfig;
  urls: UrlConfig;
  openedYear: number;
  rating: string;
  ratingSource: string;
  catCount: number;
  facilities: FacilitiesConfig;
  pricing: PricingConfig;
  transport: TransportItem[];
  landmarks: LandmarkItem[];
  policy: PolicyConfig;
}

export const BUSINESS_CONFIG = {
  name: "Catwork Cafe",
  nameJapanese: "キャットワークカフェ",
  tagline: "A Healing Hideaway",
  location: "Echigo Yuzawa · Niigata, Japan",

  address: {
    street: "3-3-13 Yuzawa",
    district: "Minamiuonuma District",
    city: "Niigata",
    postalCode: "949-6101",
    country: "Japan",
    full: "3-3-13 Yuzawa, Minamiuonuma District, Niigata 949-6101, Japan",
    directions: "East exit shopping arcade — walk from the station",
  },

  hours: {
    days: "Tuesday, Wednesday, Friday, Saturday & Sunday",
    open: "13:00",
    close: "18:00",
    closedDays: "Monday & Thursday",
    display: "Tue, Wed, Fri–Sun · 11:00–18:00",
    compact: {
      en: "Tue, Wed & Fri–Sun",
      ja: "火・水・金・土・日",
      zh: "週二、三、五至日",
    },
  },

  contact: {
    phone: "+81 070-4420-6344",
    phoneHref: "tel:+8107044206344",
    email: "info@catwork.ai",
    instagram: "@catwork_cafe",
    instagramUrl: "https://instagram.com/catwork_cafe",
  },

  urls: {
    siteUrl: "https://catwork.ai",
    mapEmbedUrl:
      "https://maps.google.com/maps?q=36.9377485,138.8120502&z=17&output=embed",
    mapUrl:
      "https://www.google.com/maps/place/Yuzawa+Catwork+Cafe/@36.9377528,138.8094753,995m/data=!3m2!1e3!4b1!4m6!3m5!1s0x601e03e6d94dd335:0x916bd364ade26e92!8m2!3d36.9377485!4d138.8120502!16s%2Fg%2F11y8wyn2ds?entry=ttu&g_ep=EgoyMDI2MDQwNS4wIKXMDSoASAFQAw%3D%3D",
    instagramUrl: "https://instagram.com/catwork_cafe",
  },

  openedYear: 2025,
  rating: "4.8",
  ratingSource: "Google",
  catCount: 5,

  facilities: {
    wifiSpeed: "200 Mbps",
    outletCount: 12,
    seating: "6 table seats · 2 counter seats · bench seating close to the cats",
    amenityCount: 7,
    seatingAreasDisplay: "6+",
    wifiCoverageDisplay: "100%",
  },

  pricing: {
    weekday: {
      firstHour: "¥1,200",
      threeHours: "¥2,500",
    },
    weekend: {
      firstHour: "¥1,500",
      threeHours: "¥3,000",
    },
    residentDiscount: "¥500",
  },

  transport: [
    {
      type: "Shinkansen",
      title: "By Bullet Train",
      titleJa: "新幹線で",
      titleZh: "搭乘新幹線",
      description: "Joetsu Shinkansen from Tokyo Station — approx. 75 minutes to Echigo Yuzawa.",
      descriptionJa: "東京駅から上越新幹線で約75分、越後湯沢駅へ。",
      descriptionZh: "從東京車站搭乘上越新幹線，約75分鐘抵達越後湯澤。",
      note: "Near Naeba & GALA Yuzawa ski areas",
      noteJa: "苗場・GALAスキーエリア最寄り",
      noteZh: "鄰近苗場與GALA湯澤滑雪場",
    },
    {
      type: "Walk",
      title: "From the Station",
      titleJa: "駅から",
      titleZh: "從車站步行",
      description:
        "Exit via the east gate, enter the indoor shopping arcade, and walk 2 minutes. We are on the left.",
      descriptionJa: "東口から出て、屋根付きアーケード商店街に入り、2分ほど歩くと左手にあります。",
      descriptionZh: "從東口出站，進入有蓋購物商業街，步行2分鐘，在左手邊。",
      note: "Look for the orange noren curtain",
      noteJa: "オレンジ色の暖簾が目印です",
      noteZh: "請尋找橙色暖簾",
    },
    {
      type: "Car",
      title: "By Car",
      titleJa: "お車で",
      titleZh: "自駕",
      description:
        "Kanetsu Expressway (Kan-Etsu Expressway) to Yuzawa IC, then 5 minutes into town.",
      descriptionJa: "関越自動車道の湯沢ICを下りて、市街地まで約5分です。",
      descriptionZh: "從關越自動車道湯澤交流道下，約5分鐘即可抵達市區。",
      note: "Paid parking available near the station",
      noteJa: "駅周辺に有料駐車場あり",
      noteZh: "車站附近設有收費停車場",
    },
  ],

  landmarks: [
    { name: "GALA Yuzawa Ski Resort", nameJa: "GALAゆざわスキー場", nameZh: "GALA湯澤滑雪場", distance: "3 min by free shuttle" },
    { name: "Naeba Ski Resort", nameJa: "苗場スキー場", nameZh: "苗場滑雪場", distance: "15 min by bus" },
    { name: "Echigo Yuzawa Station", nameJa: "越後湯沢駅", nameZh: "越後湯澤車站", distance: "2 min walk" },
    { name: "Gala Yuzawa Onsen", nameJa: "ガーラ湯沢温泉", nameZh: "GALA湯澤溫泉", distance: "5 min walk" },
  ],

  policy: {
    ageLimit: null,
    reservationUrl: null,
    lastAdmission: null,
  },
} satisfies BusinessConfig;

const _REQUIRED_NON_EMPTY: ReadonlyArray<[string, string]> = [
  ["name", BUSINESS_CONFIG.name],
  ["nameJapanese", BUSINESS_CONFIG.nameJapanese],
  ["tagline", BUSINESS_CONFIG.tagline],
  ["contact.phone", BUSINESS_CONFIG.contact.phone],
  ["contact.email", BUSINESS_CONFIG.contact.email],
  ["contact.instagramUrl", BUSINESS_CONFIG.contact.instagramUrl],
  ["urls.siteUrl", BUSINESS_CONFIG.urls.siteUrl],
  ["urls.mapUrl", BUSINESS_CONFIG.urls.mapUrl],
  ["address.street", BUSINESS_CONFIG.address.street],
  ["address.city", BUSINESS_CONFIG.address.city],
  ["address.postalCode", BUSINESS_CONFIG.address.postalCode],
  ["address.country", BUSINESS_CONFIG.address.country],
  ["address.full", BUSINESS_CONFIG.address.full],
  ["hours.open", BUSINESS_CONFIG.hours.open],
  ["hours.close", BUSINESS_CONFIG.hours.close],
  ["hours.days", BUSINESS_CONFIG.hours.days],
  ["hours.closedDays", BUSINESS_CONFIG.hours.closedDays],
  ["hours.compact.en", BUSINESS_CONFIG.hours.compact.en],
  ["hours.compact.ja", BUSINESS_CONFIG.hours.compact.ja],
  ["hours.compact.zh", BUSINESS_CONFIG.hours.compact.zh],
  ["pricing.weekday.firstHour", BUSINESS_CONFIG.pricing.weekday.firstHour],
  ["pricing.weekday.threeHours", BUSINESS_CONFIG.pricing.weekday.threeHours],
  ["pricing.weekend.firstHour", BUSINESS_CONFIG.pricing.weekend.firstHour],
  ["pricing.weekend.threeHours", BUSINESS_CONFIG.pricing.weekend.threeHours],
  ["pricing.residentDiscount", BUSINESS_CONFIG.pricing.residentDiscount],
];

for (const [field, value] of _REQUIRED_NON_EMPTY) {
  if (!value || value.trim() === "") {
    throw new Error(`[businessConfig] Required field "${field}" must not be empty.`);
  }
}
