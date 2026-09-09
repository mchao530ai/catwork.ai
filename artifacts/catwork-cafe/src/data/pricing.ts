export interface PricingPlan {
  id: string;
  step?: string;
  title: string;
  titleJa: string;
  price: string;
  priceNote: string;
  description: string;
  includes: string[];
  highlight?: boolean;
  badge?: string;
  cta?: string;
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: "single",
    step: "01",
    title: "Single Entry",
    titleJa: "一回入場",
    price: "¥1,500",
    priceNote: "per person · per hour",
    description: "Drop in for an hour, stay as long as you like at the hourly rate.",
    includes: [
      "Cat food portion included",
      "Access to all seating areas",
      "Manga library access",
      "Free Wi-Fi",
    ],
    badge: "Walk-in Friendly",
  },
  {
    id: "work-session",
    step: "02",
    title: "Work Session Package",
    titleJa: "ワークセッション",
    price: "¥3,000",
    priceNote: "per person · 3 hours",
    description: "A focused work block with 3 hours of café access and one complimentary drink.",
    includes: [
      "3 hours entry",
      "1 complimentary drink",
      "Cat food portion included",
      "Free Wi-Fi",
    ],
    highlight: true,
    badge: "Best Value",
  },
  {
    id: "daypass",
    step: "03",
    title: "Flat-Rate Day Pass",
    titleJa: "一日パス",
    price: "¥4,500",
    priceNote: "per person · full day",
    description: "Stay all day from open to close. Unlimited cat time, two drinks included.",
    includes: [
      "Full day (11:00–18:00)",
      "2 drinks included",
      "Cat food at entry",
      "Priority seating",
    ],
    badge: "Unlimited Time",
  },
  {
    id: "membership",
    step: "04",
    title: "Membership",
    titleJa: "メンバーシップ",
    price: "Coming Soon",
    priceNote: "Phase 2",
    description: "Monthly membership with priority booking, discounted entry, and members-only perks. Register your interest by email.",
    includes: [
      "Priority booking",
      "Discounted entry rates",
      "Members-only events",
      "Early news & cat updates",
    ],
    badge: "Coming Phase 2",
    cta: "メールで問い合わせ",
  },
];
