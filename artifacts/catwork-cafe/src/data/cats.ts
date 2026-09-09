const BASE = import.meta.env.BASE_URL;

export interface Cat {
  slug?: string;
  name: string;
  kanji: string;
  image: string;
  role: string;
  breed: string;
  personality: string[];
  bio: string;
  shortBio: string;
}

export const CATS: Cat[] = [
  {
    slug: "hime",
    name: "Hime",
    kanji: "姫",
    image: `${BASE}images/cat-hime.webp`,
    role: "The Empress",
    breed: "Japanese Bobtail",
    personality: ["Regal", "Discerning", "Loyal"],
    bio: "Regal and self-possessed, Hime observes the café from her favorite high perch. She demands respect but rewards patience with a slow, deliberate purr. She was the first cat to arrive at Catwork Cafe and considers herself the rightful owner of the establishment.",
    shortBio:
      "Regal and self-possessed, Hime observes the café from her favorite high perch. She demands respect but rewards patience with a slow, deliberate purr.",
  },
  {
    slug: "inu",
    name: "Inu",
    kanji: "犬",
    image: `${BASE}images/cat-inu.webp`,
    role: "The Performer",
    breed: "Domestic Shorthair",
    personality: ["Playful", "Sociable", "Energetic"],
    bio: "Despite the name, Inu is all cat. Playful and endlessly energetic, she loves chasing toys across the floor and absolutely insists on being the center of attention. She has never met a stranger and will introduce herself to every guest, usually by sitting directly on their laptop.",
    shortBio:
      "Despite the name, Inu is all cat. Playful and endlessly energetic, she loves chasing toys across the floor and absolutely insists on being the center of attention.",
  },
  {
    slug: "sumi",
    name: "Sumi",
    kanji: "墨",
    image: `${BASE}images/cat-sumi.webp`,
    role: "The Watcher",
    breed: "Bombay",
    personality: ["Mysterious", "Curious", "Calm"],
    bio: "Ink-black and mysterious, Sumi keeps her distance but watches you with wide, curious eyes from the café's quieter corners. She has seen things. Those who work quietly for long stretches sometimes find her slowly migrating closer, as if she approves of the silence.",
    shortBio:
      "Ink-black and mysterious, Sumi keeps her distance but watches you with wide, curious eyes from the café's quieter corners. She has seen things.",
  },
  {
    slug: "haru",
    name: "Haru",
    kanji: "春",
    image: `${BASE}images/cat-sleepy.webp`,
    role: "The Dreamer",
    breed: "Scottish Fold",
    personality: ["Dreamy", "Peaceful", "Philosophical"],
    bio: "A sun-worshipping philosopher who naps wherever the afternoon light falls. Do not disturb. Haru is doing important work. In the brief intervals between sleep, she accepts gentle ear scratches with dignified grace.",
    shortBio:
      "A sun-worshipping philosopher who naps wherever the afternoon light falls. Do not disturb. Haru is doing important work.",
  },
  {
    slug: "kiri",
    name: "Kiri",
    kanji: "霧",
    image: `${BASE}images/cat-kiri.webp`,
    role: "The Secret",
    breed: "Russian Blue mix",
    personality: ["Shy", "Gentle", "Faithful"],
    bio: "Shy at first, Kiri takes her time. But if you're patient and quiet, she will eventually find her way to the seat beside you and curl up like she was always there. Many guests consider earning Kiri's trust the highlight of their visit.",
    shortBio:
      "Shy at first, Kiri takes her time. But if you're patient and quiet, she will eventually find her way to the seat beside you and curl up like she was always there.",
  },
];
