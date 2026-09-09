import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "../lib/db/src/schema/index.js";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set.");
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

const BASE = "/";

async function seed() {
  console.log("Seeding database...");

  // Cats
  const existingCats = await db.select().from(schema.catsTable);
  if (existingCats.length === 0) {
    await db.insert(schema.catsTable).values([
      {
        slug: "hime",
        name: "Hime",
        kanji: "姫",
        image: `${BASE}images/cat-hime.png`,
        role: "The Empress",
        breed: "Japanese Bobtail",
        personality: ["Regal", "Discerning", "Loyal"],
        bio: "Regal and self-possessed, Hime observes the café from her favorite high perch. She demands respect but rewards patience with a slow, deliberate purr. She was the first cat to arrive at Catwork Cafe and considers herself the rightful owner of the establishment.",
        shortBio: "Regal and self-possessed, Hime observes the café from her favorite high perch. She demands respect but rewards patience with a slow, deliberate purr.",
        sortOrder: 0,
        active: true,
      },
      {
        slug: "inu",
        name: "Inu",
        kanji: "犬",
        image: `${BASE}images/cat-inu.png`,
        role: "The Performer",
        breed: "Domestic Shorthair",
        personality: ["Playful", "Sociable", "Energetic"],
        bio: "Despite the name, Inu is all cat. Playful and endlessly energetic, she loves chasing toys across the floor and absolutely insists on being the center of attention. She has never met a stranger and will introduce herself to every guest, usually by sitting directly on their laptop.",
        shortBio: "Despite the name, Inu is all cat. Playful and endlessly energetic, she loves chasing toys across the floor and absolutely insists on being the center of attention.",
        sortOrder: 1,
        active: true,
      },
      {
        slug: "sumi",
        name: "Sumi",
        kanji: "墨",
        image: `${BASE}images/cat-sumi.png`,
        role: "The Watcher",
        breed: "Bombay",
        personality: ["Mysterious", "Curious", "Calm"],
        bio: "Ink-black and mysterious, Sumi keeps her distance but watches you with wide, curious eyes from the café's quieter corners. She has seen things. Those who work quietly for long stretches sometimes find her slowly migrating closer, as if she approves of the silence.",
        shortBio: "Ink-black and mysterious, Sumi keeps her distance but watches you with wide, curious eyes from the café's quieter corners. She has seen things.",
        sortOrder: 2,
        active: true,
      },
      {
        slug: "haru",
        name: "Haru",
        kanji: "春",
        image: `${BASE}images/cat-sleepy.png`,
        role: "The Dreamer",
        breed: "Scottish Fold",
        personality: ["Dreamy", "Peaceful", "Philosophical"],
        bio: "A sun-worshipping philosopher who naps wherever the afternoon light falls. Do not disturb. Haru is doing important work. In the brief intervals between sleep, she accepts gentle ear scratches with dignified grace.",
        shortBio: "A sun-worshipping philosopher who naps wherever the afternoon light falls. Do not disturb. Haru is doing important work.",
        sortOrder: 3,
        active: true,
      },
      {
        slug: "kiri",
        name: "Kiri",
        kanji: "霧",
        image: `${BASE}images/cat-kiri.png`,
        role: "The Secret",
        breed: "Russian Blue mix",
        personality: ["Shy", "Gentle", "Faithful"],
        bio: "Shy at first, Kiri takes her time. But if you're patient and quiet, she will eventually find her way to the seat beside you and curl up like she was always there. Many guests consider earning Kiri's trust the highlight of their visit.",
        shortBio: "Shy at first, Kiri takes her time. But if you're patient and quiet, she will eventually find her way to the seat beside you and curl up like she was always there.",
        sortOrder: 4,
        active: true,
      },
    ]);
    console.log("✓ Cats seeded");
  } else {
    console.log("- Cats already seeded, skipping");
  }

  // Site config
  const existingConfig = await db.select().from(schema.siteConfigTable);
  if (existingConfig.length === 0) {
    const configs = {
      name: "Catwork Cafe",
      nameJapanese: "キャットワークカフェ",
      tagline: "A Healing Hideaway",
      location: "Echigo Yuzawa · Niigata, Japan",
      addressStreet: "3-3-13 Yuzawa",
      addressDistrict: "Minamiuonuma District",
      addressCity: "Niigata",
      addressPostalCode: "949-6101",
      addressCountry: "Japan",
      addressFull: "3-3-13 Yuzawa, Minamiuonuma District, Niigata 949-6101, Japan",
      addressDirections: "East exit shopping arcade — walk from the station",
      hoursDays: "Saturday & Sunday",
      hoursOpen: "11:00",
      hoursClose: "18:00",
      hoursClosedDays: "Monday – Friday",
      hoursDisplay: "Sat–Sun · 11:00–18:00",
      phone: "+81 070-4420-6344",
      phoneHref: "tel:+8107044206344",
      instagram: "@catwork_cafe",
      instagramUrl: "https://instagram.com/catwork_cafe",
      email: "wayadociao@gmail.com",
      openedYear: "2025",
      rating: "4.8",
      ratingSource: "Google",
      catCount: "5",
      seating: "6 table seats · 2 counter seats · bench seating close to the cats",
      siteUrl: "https://catworkcafe.jp",
      pricingNote: "Open weekends only — Saturday & Sunday, 11:00 AM to 6:00 PM. Walk-ins welcome for single entry. No reservations required.",
    };
    for (const [key, value] of Object.entries(configs)) {
      await db.insert(schema.siteConfigTable).values({ key, value });
    }
    console.log("✓ Site config seeded");
  } else {
    console.log("- Site config already seeded, skipping");
  }

  // Pricing plans
  const existingPricing = await db.select().from(schema.pricingPlansTable);
  if (existingPricing.length === 0) {
    await db.insert(schema.pricingPlansTable).values([
      {
        slug: "single",
        step: "01",
        title: "Single Entry",
        titleJa: "一回入場",
        price: "¥1,500",
        priceNote: "per person · per hour",
        description: "Drop in for an hour, stay as long as you like at the hourly rate.",
        includes: ["Cat food portion included", "Access to all seating areas", "Manga library access", "Free Wi-Fi"],
        highlight: false,
        badge: "Walk-in Friendly",
        cta: "",
        sortOrder: 0,
      },
      {
        slug: "work-session",
        step: "02",
        title: "Work Session Package",
        titleJa: "ワークセッション",
        price: "¥3,000",
        priceNote: "per person · 3 hours",
        description: "A focused work block with 3 hours of café access and one complimentary drink.",
        includes: ["3 hours entry", "1 complimentary drink", "Cat food portion included", "Free Wi-Fi"],
        highlight: true,
        badge: "Best Value",
        cta: "",
        sortOrder: 1,
      },
      {
        slug: "daypass",
        step: "03",
        title: "Flat-Rate Day Pass",
        titleJa: "一日パス",
        price: "¥4,500",
        priceNote: "per person · full day",
        description: "Stay all day from open to close. Unlimited cat time, two drinks included.",
        includes: ["Full day (11:00–18:00)", "2 drinks included", "Cat food at entry", "Priority seating"],
        highlight: false,
        badge: "Unlimited Time",
        cta: "",
        sortOrder: 2,
      },
      {
        slug: "membership",
        step: "04",
        title: "Membership",
        titleJa: "メンバーシップ",
        price: "Coming Soon",
        priceNote: "Phase 2",
        description: "Monthly membership with priority booking, discounted entry, and members-only perks. Register your interest by email.",
        includes: ["Priority booking", "Discounted entry rates", "Members-only events", "Early news & cat updates"],
        highlight: false,
        badge: "Coming Phase 2",
        cta: "メールで問い合わせ",
        sortOrder: 3,
      },
    ]);
    console.log("✓ Pricing plans seeded");
  } else {
    console.log("- Pricing plans already seeded, skipping");
  }

  // FAQs
  const existingFaqs = await db.select().from(schema.faqsTable);
  if (existingFaqs.length === 0) {
    await db.insert(schema.faqsTable).values([
      { category: "booking", question: "Do I need a reservation?", answer: "Walk-ins are welcome. We recommend arriving early on weekends as the café can fill quickly, especially during ski season. You can also contact us by email to check availability on the day.", sortOrder: 0 },
      { category: "booking", question: "Can I book for a group?", answer: "Yes. For groups of 4 or more, we recommend reaching out by email in advance so we can ensure you all have space together. Private hire for events is also available — please use the Contact page.", sortOrder: 1 },
      { category: "booking", question: "What happens if I need to cancel?", answer: "For standard walk-in visits, no cancellation is needed. For advance bookings made by email, please notify us at least 24 hours before your visit.", sortOrder: 2 },
      { category: "rules", question: "Is it family-friendly?", answer: "Absolutely. Families are a big part of our community. Children are welcome — just ask them to be gentle with our residents.", sortOrder: 3 },
      { category: "rules", question: "Can I bring my own cat?", answer: "For the wellbeing of our resident cats, outside animals cannot enter the café.", sortOrder: 4 },
      { category: "rules", question: "Can I pick up the cats?", answer: "Please let the cats approach you. Picking up or chasing cats is not permitted. Our cats set the terms of every interaction.", sortOrder: 5 },
      { category: "rules", question: "Is photography allowed?", answer: "Photos and videos for personal use are warmly encouraged. Please do not use flash photography, and do not post content that clearly identifies or makes uncomfortable any other guests without their consent.", sortOrder: 6 },
      { category: "facilities", question: "How fast is the Wi-Fi?", answer: "Fast and reliable — we run a dedicated connection suitable for video calls, large uploads, and a full remote work day. The password is provided at entry.", sortOrder: 7 },
      { category: "facilities", question: "Are there power outlets at every seat?", answer: "Yes. Every seat has easy access to a power outlet. Arrive with a low battery and stay for as long as your work needs.", sortOrder: 8 },
      { category: "facilities", question: "Can I take phone or video calls here?", answer: "Yes, calls are perfectly fine. The café has a calm, working atmosphere — just keep your voice at a considerate level so nearby guests can focus.", sortOrder: 9 },
      { category: "facilities", question: "What is the noise level like?", answer: "Catwork Cafe is a relaxed, focused environment. Soft background music and easy conversation are the norm. Quiet enough to concentrate, but it has a genuine café feel — not a library.", sortOrder: 10 },
      { category: "facilities", question: "What drinks do you serve?", answer: "We serve specialty coffee, Japanese teas, and soft drinks including apple juice. Drinks are ordered separately from the entry fee.", sortOrder: 11 },
      { category: "facilities", question: "Do you serve food?", answer: "We currently offer drinks only. You are welcome to bring your own light snacks, though please be considerate of the cats.", sortOrder: 12 },
      { category: "policies", question: "How long can I stay?", answer: "There is no time limit on your session. Entry is charged by the hour, so you simply pay for the time you spend. Many guests settle in for a half-day or longer.", sortOrder: 13 },
      { category: "policies", question: "What are your opening hours?", answer: "We are open every Saturday and Sunday from 11:00 AM to 6:00 PM. We are closed Monday through Friday.", sortOrder: 14 },
      { category: "policies", question: "How is the entry fee calculated?", answer: "Entry is approximately ¥1,500 per person per hour. A portion of cat food is included with entry. Drinks are ordered separately at the counter.", sortOrder: 15 },
    ]);
    console.log("✓ FAQs seeded");
  } else {
    console.log("- FAQs already seeded, skipping");
  }

  // Photos
  const existingPhotos = await db.select().from(schema.photosTable);
  if (existingPhotos.length === 0) {
    await db.insert(schema.photosTable).values([
      { url: "/images/cafe-interior.png", caption: "Café interior with mountain views", category: "cafe", sortOrder: 0 },
      { url: "/images/cafe-exterior.png", caption: "Café exterior in winter", category: "exterior", sortOrder: 1 },
      { url: "/images/cat-hime.png", caption: "Hime, our resident empress", category: "cats", sortOrder: 2 },
      { url: "/images/cat-inu.png", caption: "Inu, the playful performer", category: "cats", sortOrder: 3 },
      { url: "/images/cat-sumi.png", caption: "Sumi, the mysterious watcher", category: "cats", sortOrder: 4 },
    ]);
    console.log("✓ Photos seeded");
  } else {
    console.log("- Photos already seeded, skipping");
  }

  // Events
  const existingEvents = await db.select().from(schema.eventsTable);
  if (existingEvents.length === 0) {
    await db.insert(schema.eventsTable).values([
      {
        type: "news",
        date: "March 2026",
        title: "Spring Hours Announcement",
        titleJa: "春の営業時間のお知らせ",
        summary: "As the snow begins to melt, we will continue our regular Saturday and Sunday hours through spring. New seasonal drinks coming soon.",
        image: "",
        tag: "Announcement",
        sortOrder: 0,
      },
      {
        type: "event",
        date: "April 2026",
        title: "Hanami Cat Afternoon",
        titleJa: "花見猫の午後",
        summary: "Celebrate cherry blossom season with us. Special sakura latte, cat-themed treats, and an afternoon of gentle music. Limited seats — contact us by email.",
        image: "",
        tag: "Event",
        sortOrder: 1,
      },
      {
        type: "news",
        date: "February 2026",
        title: "Kiri's First Birthday",
        titleJa: "霧の一歳",
        summary: "Our shyest resident turned one year old. Thank you to all the guests whose patience has helped her come out of her shell.",
        image: `${BASE}images/cat-kiri.png`,
        tag: "Cat News",
        sortOrder: 2,
      },
    ]);
    console.log("✓ Events seeded");
  } else {
    console.log("- Events already seeded, skipping");
  }

  console.log("Seed complete!");
  await pool.end();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
