export interface NewsEvent {
  id: string;
  type: "news" | "event";
  date: string;
  title: string;
  titleJa?: string;
  summary: string;
  image?: string;
  tag?: string;
}

const BASE = import.meta.env.BASE_URL;

export const NEWS_EVENTS: NewsEvent[] = [
  {
    id: "ne1",
    type: "news",
    date: "March 2026",
    title: "Spring Hours Announcement",
    titleJa: "春の営業時間のお知らせ",
    summary:
      "As the snow begins to melt, we will continue our regular Saturday and Sunday hours through spring. New seasonal drinks coming soon.",
    tag: "Announcement",
  },
  {
    id: "ne2",
    type: "event",
    date: "April 2026",
    title: "Hanami Cat Afternoon",
    titleJa: "花見猫の午後",
    summary:
      "Celebrate cherry blossom season with us. Special sakura latte, cat-themed treats, and an afternoon of gentle music. Limited seats — contact us by email.",
    tag: "Event",
  },
  {
    id: "ne3",
    type: "news",
    date: "February 2026",
    title: "Kiri's First Birthday",
    titleJa: "霧の一歳",
    summary:
      "Our shyest resident turned one year old. Thank you to all the guests whose patience has helped her come out of her shell.",
    tag: "Cat News",
    image: `${BASE}images/cat-kiri.webp`,
  },
];
