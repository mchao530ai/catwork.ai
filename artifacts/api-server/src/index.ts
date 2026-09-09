import app from "./app";
import { logger } from "./lib/logger";
import { db } from "@workspace/db";
import { bookingsTable, pricingPlansTable, siteConfigTable, testimonialsTable, transportInfoTable, nearbyLandmarksTable } from "@workspace/db/schema";
import { asc, eq } from "drizzle-orm";
import cron from "node-cron";
import { sendDailyReport } from "./lib/email";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

async function runStartupMigrations() {
  try {
    const rows = await db
      .select()
      .from(siteConfigTable)
      .where(eq(siteConfigTable.key, "email"));

    if (rows.length === 0) {
      await db.insert(siteConfigTable).values({ key: "email", value: "info@catwork.ai" });
      logger.info("Seeded site_config email");
    } else if (rows[0]!.value === "info@catworkcafe.jp" || rows[0]!.value === "wayadociao@gmail.com") {
      await db
        .update(siteConfigTable)
        .set({ value: "info@catwork.ai" })
        .where(eq(siteConfigTable.key, "email"));
      logger.info("Migrated site_config email to info@catwork.ai");
    }
  } catch (err) {
    logger.warn({ err }, "Startup migration warning (non-fatal)");
  }

  try {
    const existingTestimonials = await db.select().from(testimonialsTable);
    if (existingTestimonials.length === 0) {
      await db.insert(testimonialsTable).values([
        { author: "Sarah M.", role: "Tokyo · February 2026", quote: "Hidden gem after a ski day at GALA. The cats are relaxed, the coffee is excellent, and the vibe is exactly what I needed. Hime sat with me for 45 minutes. I may never leave Yuzawa.", rating: 5, sortOrder: 0, isActive: true },
        { author: "田中 光一", role: "Nagoya · January 2026", quote: "スキーの帰りに立ち寄りました。猫たちが人懐っこくて、コーヒーもとても美味しかったです。また来ます！", rating: 5, sortOrder: 1, isActive: true },
        { author: "Marco L.", role: "Milan, Italy · December 2025", quote: "We stumbled in from the snow and stayed for two hours. The cats are wonderful and the owners make you feel instantly welcome. Best surprise of our Japan trip.", rating: 5, sortOrder: 2, isActive: true },
        { author: "Emma W.", role: "London · March 2026", quote: "Worth the bullet train ride alone. Kiri eventually came and sat on my laptop bag, which I'm counting as a win. Genuinely one of the most peaceful places I've visited in Japan.", rating: 5, sortOrder: 3, isActive: true },
        { author: "Chris T.", role: "Sydney · January 2026", quote: "The perfect combination — great coffee, wifi, cats, and snow outside the window. I got more work done here in two hours than I would have in a normal office all day.", rating: 5, sortOrder: 4, isActive: true },
        { author: "Li Wei", role: "Taipei · February 2026", quote: "台灣老闆超親切！貓貓們都很健康可愛，環境整潔溫馨。Inu 一直來找我玩，真的捨不得走。", rating: 5, sortOrder: 5, isActive: true },
      ]);
      logger.info("Seeded testimonials");
    }
  } catch (err) {
    logger.warn({ err }, "Testimonials seed warning (non-fatal)");
  }

  try {
    const existingTransport = await db.select().from(transportInfoTable);
    if (existingTransport.length === 0) {
      await db.insert(transportInfoTable).values([
        { type: "Shinkansen", title: "By Bullet Train", description: "Joetsu Shinkansen from Tokyo Station — approx. 75 minutes to Echigo Yuzawa.", note: "Near Naeba & GALA Yuzawa ski areas", sortOrder: 0 },
        { type: "Walk", title: "From the Station", description: "Exit via the east gate, enter the indoor shopping arcade, and walk 2 minutes. We are on the left.", note: "Look for the orange noren curtain", sortOrder: 1 },
        { type: "Car", title: "By Car", description: "Kanetsu Expressway (Kan-Etsu Expressway) to Yuzawa IC, then 5 minutes into town.", note: "Paid parking available near the station", sortOrder: 2 },
      ]);
      logger.info("Seeded transport_info");
    }
  } catch (err) {
    logger.warn({ err }, "Transport info seed warning (non-fatal)");
  }

  try {
    const existingLandmarks = await db.select().from(nearbyLandmarksTable);
    if (existingLandmarks.length === 0) {
      await db.insert(nearbyLandmarksTable).values([
        { name: "GALA Yuzawa Ski Resort", distance: "3 min by free shuttle", sortOrder: 0 },
        { name: "Naeba Ski Resort", distance: "15 min by bus", sortOrder: 1 },
        { name: "Echigo Yuzawa Station", distance: "2 min walk", sortOrder: 2 },
        { name: "Gala Yuzawa Onsen", distance: "5 min walk", sortOrder: 3 },
      ]);
      logger.info("Seeded nearby_landmarks");
    }
  } catch (err) {
    logger.warn({ err }, "Nearby landmarks seed warning (non-fatal)");
  }
}

runStartupMigrations().then(() => {
  app.listen(port, (err) => {
    if (err) {
      logger.error({ err }, "Error listening on port");
      process.exit(1);
    }

    logger.info({ port }, "Server listening");
  });
});

// Daily operations report — fires at 18:00 JST on Saturday (6) and Sunday (0)
cron.schedule(
  "0 18 * * 6,0",
  async () => {
    // Safety guard: double-check it is actually Sat or Sun in JST,
    // in case the cron library's timezone handling ever drifts.
    const jstDateStr = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Tokyo" });
    const jstDayNum = new Date(jstDateStr + "T12:00:00").getDay(); // 0 = Sun, 6 = Sat
    if (jstDayNum !== 0 && jstDayNum !== 6) {
      logger.warn({ jstDayNum, jstDateStr }, "Daily report cron fired on non-operating day — skipping");
      return;
    }

    logger.info({ date: jstDateStr }, "Running daily operations report");

    try {
      const [bookings, plans] = await Promise.all([
        db.select().from(bookingsTable).where(eq(bookingsTable.date, jstDateStr)),
        db.select().from(pricingPlansTable).orderBy(asc(pricingPlansTable.sortOrder)),
      ]);

      const entryPlan = plans.find((p) => p.slug === "entry") ?? plans[0];
      const baseEntryPrice = entryPlan
        ? parseInt(entryPlan.price.replace(/[^\d]/g, ""), 10) || 0
        : 0;

      const result = await sendDailyReport({
        date: jstDateStr,
        bookings: bookings.map((b) => ({ name: b.name, timeSlot: b.timeSlot, partySize: b.partySize })),
        baseEntryPrice,
      });

      if (result.sent) {
        logger.info({ date: jstDateStr, bookingCount: bookings.length }, "Daily report email sent");
      } else {
        logger.error({ error: result.error }, "Daily report email failed");
      }
    } catch (err) {
      logger.error({ err }, "Daily report cron error");
    }
  },
  { timezone: "Asia/Tokyo" },
);
