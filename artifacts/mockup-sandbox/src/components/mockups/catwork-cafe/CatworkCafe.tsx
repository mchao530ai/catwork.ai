import React, { useState } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { MapPin, Clock, Phone, Instagram, Coffee, Star, ChevronDown, Train } from "lucide-react";

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } },
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 },
  },
};

const cats = [
  {
    name: "Hime",
    kanji: "姫",
    image: "/__mockup/images/cat-hime.png",
    role: "The Empress",
    desc: "Regal and self-possessed, Hime observes the café from her favorite high perch. She demands respect but rewards patience with a slow, deliberate purr.",
  },
  {
    name: "Inu",
    kanji: "犬",
    image: "/__mockup/images/cat-inu.png",
    role: "The Performer",
    desc: "Despite the name, Inu is all cat. Playful and endlessly energetic, she loves chasing toys across the floor and absolutely insists on being the center of attention.",
  },
  {
    name: "Sumi",
    kanji: "墨",
    image: "/__mockup/images/cat-sumi.png",
    role: "The Watcher",
    desc: "Ink-black and mysterious, Sumi keeps her distance but watches you with wide, curious eyes from the café's quieter corners. She has seen things.",
  },
  {
    name: "Haru",
    kanji: "春",
    image: "/__mockup/images/cat-sleepy.png",
    role: "The Dreamer",
    desc: "A sun-worshipping philosopher who naps wherever the afternoon light falls. Do not disturb. Haru is doing important work.",
  },
  {
    name: "Kiri",
    kanji: "霧",
    image: "/__mockup/images/cat-kiri.png",
    role: "The Secret",
    desc: "Shy at first, Kiri takes her time. But if you're patient and quiet, she will eventually find her way to the seat beside you and curl up like she was always there.",
  },
];

const faqs = [
  {
    q: "Do I need a reservation?",
    a: "Walk-ins are welcome. We recommend arriving early on weekends as the café can fill quickly, especially during ski season.",
  },
  {
    q: "Is it family-friendly?",
    a: "Absolutely. Families are a big part of our community. Children are welcome — just ask them to be gentle with our residents.",
  },
  {
    q: "Can I bring my own cat?",
    a: "For the wellbeing of our resident cats, outside animals cannot enter the café.",
  },
  {
    q: "What drinks do you serve?",
    a: "We serve coffee, tea, and soft drinks including apple juice. Drinks are ordered separately from the entry fee.",
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="border-b border-[#1A1A1A]/10 py-5 cursor-pointer"
      onClick={() => setOpen(!open)}
    >
      <div className="flex items-center justify-between gap-4">
        <span className="text-base md:text-lg font-medium text-[#1A1A1A]">{q}</span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.3 }}>
          <ChevronDown className="w-5 h-5 text-[#D4A373] shrink-0" />
        </motion.div>
      </div>
      <AnimatePresence>
        {open && (
          <motion.p
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-3 text-[#1A1A1A]/60 font-light leading-relaxed overflow-hidden text-sm md:text-base"
          >
            {a}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function CatworkCafe() {
  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#1A1A1A] selection:bg-[#D4A373] selection:text-white overflow-x-hidden">

      {/* ── Navigation ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 sm:px-8 md:px-12 py-4 mix-blend-difference text-[#FDFBF7]">
        <div className="font-['Playfair_Display'] text-lg sm:text-xl tracking-wide font-medium whitespace-nowrap">
          Catwork Cafe
        </div>
        <div className="hidden md:flex space-x-6 lg:space-x-10 text-xs tracking-[0.2em] uppercase font-medium">
          <a href="#about" className="hover:opacity-60 transition-opacity">About</a>
          <a href="#cats" className="hover:opacity-60 transition-opacity">The Cats</a>
          <a href="#pricing" className="hover:opacity-60 transition-opacity">Pricing</a>
          <a href="#visit" className="hover:opacity-60 transition-opacity">Visit</a>
          <a href="#faq" className="hover:opacity-60 transition-opacity">FAQ</a>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative h-[100dvh] min-h-[500px] w-full overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 z-0">
          <img
            src="/__mockup/images/cafe-interior.png"
            alt="Catwork Cafe interior with cats by snowy window"
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-black/45" />
        </div>

        <div className="relative z-10 text-center px-4 sm:px-8 max-w-4xl mx-auto mt-16">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="text-[#D4A373] tracking-[0.25em] sm:tracking-[0.35em] uppercase text-xs sm:text-sm mb-5 sm:mb-6 font-medium"
          >
            Echigo Yuzawa · Niigata, Japan
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl text-[#FDFBF7] font-['Playfair_Display'] mb-5 sm:mb-6 leading-tight"
          >
            A Healing Hideaway
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.55 }}
            className="text-[#FDFBF7]/50 text-sm sm:text-base tracking-[0.2em] mb-4 font-light"
          >
            キャットワークカフェ
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.6 }}
            className="text-[#FDFBF7]/85 text-base sm:text-lg md:text-xl font-light max-w-xl sm:max-w-2xl mx-auto leading-relaxed"
          >
            Where the snow falls quietly outside, and a warm drink feels like the most important thing in the world.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.85 }}
            className="mt-6 sm:mt-8 flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-[#FDFBF7]/70 text-xs sm:text-sm tracking-widest uppercase"
          >
            <div className="flex items-center gap-2">
              <Star className="w-3.5 h-3.5 text-[#D4A373] fill-[#D4A373]" />
              <span>4.8 on Google</span>
            </div>
            <span className="opacity-30">·</span>
            <span>5 Resident Cats</span>
            <span className="opacity-30">·</span>
            <span>Since 2025</span>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.4 }}
          className="absolute bottom-8 sm:bottom-10 left-1/2 -translate-x-1/2 text-[#FDFBF7]/60 text-xs tracking-widest uppercase flex flex-col items-center gap-3"
        >
          <span>Scroll</span>
          <div className="w-px h-10 sm:h-12 bg-[#FDFBF7]/25 overflow-hidden relative">
            <motion.div
              animate={{ y: [0, 48] }}
              transition={{ repeat: Infinity, duration: 1.6, ease: "linear" }}
              className="absolute top-0 left-0 w-full h-1/2 bg-[#D4A373]"
            />
          </div>
        </motion.div>
      </section>

      {/* ── About ── */}
      <section id="about" className="py-20 sm:py-28 md:py-36 px-4 sm:px-8 md:px-12">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={fadeInUp}
            className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-20 items-center"
          >
            <div>
              <p className="text-[#D4A373] text-xs tracking-[0.25em] uppercase font-medium mb-5">
                Our Story
              </p>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-['Playfair_Display'] text-[#1A1A1A] mb-6 sm:mb-8 leading-tight">
                Between the station<br />
                <span className="italic text-[#D4A373]">&amp; the mountains</span>
              </h2>
              <div className="space-y-4 sm:space-y-5 text-[#1A1A1A]/70 text-base sm:text-lg font-light leading-relaxed">
                <p>
                  Opened in July 2025, Catwork Cafe is nestled in the shopping arcade just steps from Echigo Yuzawa Station — a warm sanctuary between ski runs, bullet train rides, and mountain walks.
                </p>
                <p>
                  Our Taiwanese owners have created something genuinely rare: a clean, calm space that feels personal and unhurried. Come to read manga, work quietly, or simply let the cats find you.
                </p>
              </div>
              <div className="mt-8 sm:mt-10 flex flex-wrap gap-5 sm:gap-8 text-xs sm:text-sm tracking-widest uppercase text-[#1A1A1A]/60">
                <div className="flex items-center gap-2.5">
                  <Coffee className="w-4 h-4 text-[#D4A373]" />
                  <span>Specialty Coffee</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Star className="w-4 h-4 text-[#D4A373]" />
                  <span>5 Resident Cats</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <MapPin className="w-4 h-4 text-[#D4A373]" />
                  <span>Ski Country</span>
                </div>
              </div>
            </div>

            <div className="relative mt-4 lg:mt-0">
              <div className="aspect-[4/5] overflow-hidden rounded-sm">
                <img
                  src="/__mockup/images/cafe-exterior.png"
                  alt="Catwork Cafe exterior in the snowy mountains"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-1000"
                />
              </div>
              <div className="absolute -bottom-6 -left-6 w-32 sm:w-48 h-32 sm:h-48 bg-[#D4A373]/15 rounded-full -z-10 blur-3xl" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Meet the Cats ── */}
      <section id="cats" className="py-20 sm:py-28 md:py-36 bg-[#1A1A1A] text-[#FDFBF7]">
        <div className="px-4 sm:px-8 md:px-12 max-w-6xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-center mb-16 sm:mb-20"
          >
            <p className="text-[#D4A373] text-xs tracking-[0.25em] uppercase font-medium mb-5">
              Five Personalities
            </p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-['Playfair_Display'] mb-5">
              Meet the Residents
            </h2>
            <p className="text-[#FDFBF7]/60 text-base sm:text-lg font-light max-w-xl mx-auto">
              Each cat has a story. Some will greet you immediately. Others take time. All of them will stay with you.
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8"
          >
            {cats.map((cat, i) => (
              <motion.div
                key={cat.name}
                variants={fadeInUp}
                className={`group ${i === 4 ? "sm:col-span-2 lg:col-span-1" : ""}`}
              >
                <div className="aspect-square overflow-hidden mb-5 rounded-sm">
                  <img
                    src={cat.image}
                    alt={`${cat.name} the cat`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                </div>
                <div className="flex items-baseline gap-3 mb-2">
                  <h3 className="text-xl sm:text-2xl font-['Playfair_Display']">{cat.name}</h3>
                  <span className="text-[#FDFBF7]/30 text-lg">{cat.kanji}</span>
                </div>
                <p className="text-[#D4A373] text-xs tracking-widest uppercase mb-3">{cat.role}</p>
                <p className="text-[#FDFBF7]/55 font-light leading-relaxed text-sm sm:text-base">
                  {cat.desc}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="py-20 sm:py-28 md:py-36 px-4 sm:px-8 md:px-12 bg-[#FDFBF7]">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-center mb-12 sm:mb-16"
          >
            <p className="text-[#D4A373] text-xs tracking-[0.25em] uppercase font-medium mb-5">
              Entry & Drinks
            </p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-['Playfair_Display'] mb-5">
              How It Works
            </h2>
            <p className="text-[#1A1A1A]/60 font-light max-w-xl mx-auto text-base sm:text-lg">
              Pay by the hour. Order a drink. Receive cat food at the door. Everything else happens naturally.
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8"
          >
            {[
              {
                step: "01",
                title: "Entry Fee",
                detail: "~¥1,500 / hour",
                sub: "Per person. Cat food included.",
              },
              {
                step: "02",
                title: "Order a Drink",
                detail: "¥600–¥800",
                sub: "Coffee, tea, juice, and more.",
              },
              {
                step: "03",
                title: "Total Budget",
                detail: "¥1,000 – ¥1,999",
                sub: "Per person, per visit.",
              },
            ].map((item) => (
              <motion.div
                key={item.step}
                variants={fadeInUp}
                className="border border-[#1A1A1A]/8 p-7 sm:p-9 hover:border-[#D4A373]/50 transition-colors duration-300"
              >
                <div className="text-[#D4A373]/40 text-4xl sm:text-5xl font-['Playfair_Display'] mb-5">
                  {item.step}
                </div>
                <h3 className="text-base sm:text-lg font-medium uppercase tracking-wide mb-3">{item.title}</h3>
                <div className="text-2xl sm:text-3xl font-['Playfair_Display'] mb-2">{item.detail}</div>
                <p className="text-[#1A1A1A]/50 text-sm font-light">{item.sub}</p>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="mt-8 sm:mt-10 p-5 sm:p-7 bg-[#1A1A1A]/4 border-l-2 border-[#D4A373]"
          >
            <p className="text-[#1A1A1A]/70 font-light text-sm sm:text-base leading-relaxed">
              <strong className="text-[#1A1A1A] font-medium">Open weekends only</strong> — Saturday &amp; Sunday, 11:00 AM to 6:00 PM. We are closed Monday through Friday. No reservations needed — walk-ins welcome.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── Getting Here ── */}
      <section id="visit" className="py-20 sm:py-28 md:py-36 bg-[#1A1A1A] text-[#FDFBF7]">
        <div className="px-4 sm:px-8 md:px-12 max-w-6xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start"
          >
            <div>
              <p className="text-[#D4A373] text-xs tracking-[0.25em] uppercase font-medium mb-5">
                Access
              </p>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-['Playfair_Display'] mb-10 sm:mb-12 leading-tight">
                Getting Here
              </h2>

              <div className="space-y-8 sm:space-y-10">
                <div className="flex items-start gap-5 group">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#FDFBF7]/8 flex items-center justify-center shrink-0 group-hover:bg-[#D4A373] transition-colors duration-300">
                    <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-[#D4A373] group-hover:text-white transition-colors duration-300" />
                  </div>
                  <div>
                    <h4 className="text-sm sm:text-base font-medium uppercase tracking-wider mb-2">Address</h4>
                    <p className="text-[#FDFBF7]/60 font-light leading-relaxed text-sm sm:text-base">
                      3-3-13 Yuzawa, Minamiuonuma District<br />
                      Niigata 949-6101, Japan<br />
                      <span className="text-[#D4A373] text-sm mt-1.5 block">
                        East exit shopping arcade — walk from the station
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-5 group">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#FDFBF7]/8 flex items-center justify-center shrink-0 group-hover:bg-[#D4A373] transition-colors duration-300">
                    <Train className="w-4 h-4 sm:w-5 sm:h-5 text-[#D4A373] group-hover:text-white transition-colors duration-300" />
                  </div>
                  <div>
                    <h4 className="text-sm sm:text-base font-medium uppercase tracking-wider mb-2">By Train</h4>
                    <p className="text-[#FDFBF7]/60 font-light leading-relaxed text-sm sm:text-base">
                      Joetsu Shinkansen from Tokyo Station<br />
                      ~75 minutes to Echigo Yuzawa<br />
                      <span className="text-[#D4A373] text-sm mt-1.5 block">
                        Near Naeba &amp; GALA Yuzawa ski areas
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-5 group">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#FDFBF7]/8 flex items-center justify-center shrink-0 group-hover:bg-[#D4A373] transition-colors duration-300">
                    <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-[#D4A373] group-hover:text-white transition-colors duration-300" />
                  </div>
                  <div>
                    <h4 className="text-sm sm:text-base font-medium uppercase tracking-wider mb-2">Hours</h4>
                    <p className="text-[#FDFBF7]/60 font-light leading-relaxed text-sm sm:text-base">
                      Saturday &amp; Sunday only<br />
                      11:00 AM – 6:00 PM<br />
                      <span className="text-[#D4A373] text-sm mt-1.5 block">Closed Monday – Friday</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-6 sm:gap-8">
              <div className="aspect-video overflow-hidden rounded-sm">
                <img
                  src="/__mockup/images/cafe-exterior.png"
                  alt="Catwork Cafe exterior at dusk in winter"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-1000"
                />
              </div>
              <div className="bg-[#FDFBF7]/5 border border-[#FDFBF7]/10 p-6 sm:p-8">
                <h3 className="text-lg sm:text-xl font-['Playfair_Display'] mb-3">The Space</h3>
                <p className="text-[#FDFBF7]/55 font-light text-sm leading-relaxed mb-5">
                  6 table seats · 2 counter seats · bench seating close to the cats. Compact and intentional — nothing wasted.
                </p>
                <h3 className="text-lg sm:text-xl font-['Playfair_Display'] mb-4">Contact</h3>
                <div className="space-y-4">
                  <a
                    href="tel:+815018081838"
                    className="flex items-center gap-3 text-[#FDFBF7]/70 hover:text-[#D4A373] transition-colors text-sm sm:text-base"
                  >
                    <Phone className="w-4 h-4 shrink-0" />
                    <span>+81 50-1808-1838</span>
                  </a>
                  <a
                    href="https://instagram.com/catwork_cafe"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-[#FDFBF7]/70 hover:text-[#D4A373] transition-colors text-sm sm:text-base"
                  >
                    <Instagram className="w-4 h-4 shrink-0" />
                    <span>@catwork_cafe</span>
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="py-20 sm:py-28 md:py-36 px-4 sm:px-8 md:px-12 bg-[#FDFBF7]">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="mb-12 sm:mb-16"
          >
            <p className="text-[#D4A373] text-xs tracking-[0.25em] uppercase font-medium mb-5">
              Questions
            </p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-['Playfair_Display']">
              Good to Know
            </h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {faqs.map((item) => (
              <motion.div key={item.q} variants={fadeInUp}>
                <FaqItem q={item.q} a={item.a} />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-[#1A1A1A] py-12 sm:py-16 px-4 sm:px-8 border-t border-[#FDFBF7]/8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="text-center sm:text-left">
            <div className="font-['Playfair_Display'] text-xl sm:text-2xl text-[#FDFBF7] mb-1">
              キャットワークカフェ
            </div>
            <p className="text-[#FDFBF7]/35 text-xs tracking-widest uppercase">
              Echigo Yuzawa · Niigata · Japan
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-8">
            <a
              href="tel:+815018081838"
              className="flex items-center gap-2 text-[#FDFBF7]/50 hover:text-[#D4A373] transition-colors text-sm"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>+81 50-1808-1838</span>
            </a>
            <a
              href="https://instagram.com/catwork_cafe"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-[#FDFBF7]/50 hover:text-[#D4A373] transition-colors text-sm"
            >
              <Instagram className="w-3.5 h-3.5" />
              <span>@catwork_cafe</span>
            </a>
          </div>
          <p className="text-[#FDFBF7]/25 text-xs">&copy; 2025 Catwork Cafe</p>
        </div>
      </footer>

    </div>
  );
}
