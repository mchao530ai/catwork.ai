export interface Review {
  id: string;
  author: string;
  origin: string;
  rating: number;
  date: string;
  text: string;
  source: string;
}

export const REVIEWS: Review[] = [
  {
    id: "r1",
    author: "Sarah M.",
    origin: "Tokyo",
    rating: 5,
    date: "February 2026",
    text: "Hidden gem after a ski day at GALA. The cats are relaxed, the coffee is excellent, and the vibe is exactly what I needed. Hime sat with me for 45 minutes. I may never leave Yuzawa.",
    source: "Google",
  },
  {
    id: "r2",
    author: "田中 光一",
    origin: "Nagoya",
    rating: 5,
    date: "January 2026",
    text: "スキーの帰りに立ち寄りました。猫たちが人懐っこくて、コーヒーもとても美味しかったです。また来ます！",
    source: "Google",
  },
  {
    id: "r3",
    author: "Marco L.",
    origin: "Milan, Italy",
    rating: 5,
    date: "December 2025",
    text: "We stumbled in from the snow and stayed for two hours. The cats are wonderful and the owners make you feel instantly welcome. Best surprise of our Japan trip.",
    source: "Google",
  },
  {
    id: "r4",
    author: "Emma W.",
    origin: "London",
    rating: 5,
    date: "March 2026",
    text: "Worth the bullet train ride alone. Kiri eventually came and sat on my laptop bag, which I'm counting as a win. Genuinely one of the most peaceful places I've visited in Japan.",
    source: "Google",
  },
  {
    id: "r5",
    author: "Chris T.",
    origin: "Sydney",
    rating: 5,
    date: "January 2026",
    text: "The perfect combination — great coffee, wifi, cats, and snow outside the window. I got more work done here in two hours than I would have in a normal office all day.",
    source: "Google",
  },
  {
    id: "r6",
    author: "Li Wei",
    origin: "Taipei",
    rating: 5,
    date: "February 2026",
    text: "台灣老闆超親切！貓貓們都很健康可愛，環境整潔溫馨。Inu 一直來找我玩，真的捨不得走。",
    source: "Google",
  },
];
