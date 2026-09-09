export interface FaqItem {
  id: string;
  category: "booking" | "rules" | "facilities" | "policies";
  question: string;
  answer: string;
}

export const FAQS: FaqItem[] = [
  {
    id: "faq-1",
    category: "booking",
    question: "Do I need a reservation?",
    answer:
      "Walk-ins are welcome. We recommend arriving early on weekends as the café can fill quickly, especially during ski season. You can also contact us by email to check availability on the day.",
  },
  {
    id: "faq-2",
    category: "booking",
    question: "Can I book for a group?",
    answer:
      "Yes. For groups of 4 or more, we recommend reaching out by email in advance so we can ensure you all have space together. Private hire for events is also available — please use the Contact page.",
  },
  {
    id: "faq-3",
    category: "booking",
    question: "What happens if I need to cancel?",
    answer:
      "For standard walk-in visits, no cancellation is needed. For advance bookings made by email, please notify us at least 24 hours before your visit.",
  },
  {
    id: "faq-4",
    category: "rules",
    question: "Is it family-friendly?",
    answer:
      "Absolutely. Families are a big part of our community. Children are welcome — just ask them to be gentle with our residents.",
  },
  {
    id: "faq-5",
    category: "rules",
    question: "Can I bring my own cat?",
    answer:
      "For the wellbeing of our resident cats, outside animals cannot enter the café.",
  },
  {
    id: "faq-6",
    category: "rules",
    question: "Can I pick up the cats?",
    answer:
      "Please let the cats approach you. Picking up or chasing cats is not permitted. Our cats set the terms of every interaction.",
  },
  {
    id: "faq-7",
    category: "rules",
    question: "Is photography allowed?",
    answer:
      "Photos and videos for personal use are warmly encouraged. Please do not use flash photography, and do not post content that clearly identifies or makes uncomfortable any other guests without their consent.",
  },
  {
    id: "faq-8",
    category: "facilities",
    question: "How fast is the Wi-Fi?",
    answer:
      "Fast and reliable — we run a dedicated connection suitable for video calls, large uploads, and a full remote work day. The password is provided at entry.",
  },
  {
    id: "faq-9",
    category: "facilities",
    question: "Are there power outlets at every seat?",
    answer:
      "Yes. Every seat has easy access to a power outlet. Arrive with a low battery and stay for as long as your work needs.",
  },
  {
    id: "faq-10",
    category: "facilities",
    question: "Can I take phone or video calls here?",
    answer:
      "Yes, calls are perfectly fine. The café has a calm, working atmosphere — just keep your voice at a considerate level so nearby guests can focus.",
  },
  {
    id: "faq-11",
    category: "facilities",
    question: "What is the noise level like?",
    answer:
      "Catwork Cafe is a relaxed, focused environment. Soft background music and easy conversation are the norm. Quiet enough to concentrate, but it has a genuine café feel — not a library.",
  },
  {
    id: "faq-12",
    category: "facilities",
    question: "What drinks do you serve?",
    answer:
      "We serve specialty coffee, Japanese teas, and soft drinks including apple juice. Drinks are ordered separately from the entry fee.",
  },
  {
    id: "faq-13",
    category: "facilities",
    question: "Do you serve food?",
    answer:
      "We currently offer drinks only. You are welcome to bring your own light snacks, though please be considerate of the cats.",
  },
  {
    id: "faq-14",
    category: "policies",
    question: "How long can I stay?",
    answer:
      "There is no time limit on your session. Entry is charged by the hour, so you simply pay for the time you spend. Many guests settle in for a half-day or longer.",
  },
  {
    id: "faq-15",
    category: "policies",
    question: "What are your opening hours?",
    answer:
      "We are open Tuesday, Wednesday, Friday, Saturday and Sunday from 11:00 to 18:00. We are closed Monday and Thursday.",
  },
  {
    id: "faq-16",
    category: "policies",
    question: "How is the entry fee calculated?",
    answer:
      "Entry is charged per hour. A portion of cat food is included on weekdays. Drinks are ordered separately at the counter. See the Pricing page for current rates.",
  },
];

export const FAQ_CATEGORIES: Record<FaqItem["category"], string> = {
  booking: "Booking & Reservations",
  rules: "In-Café Rules",
  facilities: "Facilities & Workspace",
  policies: "Hours & Pricing",
};
