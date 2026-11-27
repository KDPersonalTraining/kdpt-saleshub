// Runs after `vite build`. Writes one HTML file per main page with its own
// title, description, canonical URL, structured data and a readable copy of the
// page content inside #root. Search engines and AI assistants that don't run
// JavaScript read this copy; for visitors, React replaces it as soon as it loads.
import { readFileSync, writeFileSync } from "node:fs";

const SITE = "https://start.kdpersonaltraining.com";
const OG_IMAGE = `${SITE}/images/enquire/og.jpg`;
const dist = new URL("../dist/", import.meta.url);
const base = readFileSync(new URL("index.html", dist), "utf8");

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const BUSINESS = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "@id": `${SITE}/#business`,
  name: "KD Personal Training",
  alternateName: "KDPT",
  url: `${SITE}/`,
  logo: `${SITE}/logo.png`,
  image: OG_IMAGE,
  description: "Personal trainer in Northampton and online coach. 1:1 personal training at Trilogy Active, online coaching and personalised training programmes.",
  areaServed: [{ "@type": "City", name: "Northampton" }, { "@type": "Country", name: "United Kingdom" }],
  address: { "@type": "PostalAddress", addressLocality: "Northampton", addressCountry: "GB" },
  priceRange: "£49–£290",
  founder: { "@id": `${SITE}/#kyle` },
  sameAs: ["https://www.instagram.com/kyle.coaching"],
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Coaching options",
    itemListElement: [
      { "@type": "Offer", url: `${SITE}/online`, price: "120", priceCurrency: "GBP", itemOffered: { "@type": "Service", name: "Online Coaching", description: "Custom programme, weekly check-ins, nutrition guidance and messaging in Everfit. Billed monthly, no lock-in." } },
      { "@type": "Offer", url: `${SITE}/programmes`, price: "49", priceCurrency: "GBP", itemOffered: { "@type": "Service", name: "Personalised Training Programme", description: "A one-off training programme built around your goals, schedule and equipment, delivered in Everfit within 3 to 5 working days." } },
      { "@type": "Offer", url: `${SITE}/pt`, price: "90", priceCurrency: "GBP", itemOffered: { "@type": "Service", name: "1:1 Personal Training in Northampton", description: "In-person, technique-focused sessions at Trilogy Active. Monthly packages from £90." } },
    ],
  },
};

const PERSON = {
  "@context": "https://schema.org",
  "@type": "Person",
  "@id": `${SITE}/#kyle`,
  name: "Kyle Denny",
  jobTitle: "Personal Trainer and Online Coach",
  worksFor: { "@id": `${SITE}/#business` },
  homeLocation: { "@type": "City", name: "Northampton" },
  sameAs: ["https://www.instagram.com/kyle.coaching"],
};

const faqLd = (faq) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faq.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
});

const NAV = `<nav><a href="/">Home</a> · <a href="/online">Online coaching</a> · <a href="/programmes">Programmes</a> · <a href="/pt">Personal training</a> · <a href="/unstuck">Free 30-day programme</a> · <a href="/enquire">Enquire</a></nav>`;

const PAGES = {
  index: {
    path: "/",
    title: "KD Personal Training | Personal Trainer in Northampton & Online Coach",
    description: "Personal trainer in Northampton and online coach. 1:1 personal training at Trilogy Active, online coaching from £120 a month and personalised programmes for £49.",
    h1: "KD Personal Training: personal trainer in Northampton and online coach",
    intro: "KDPT is built around education, structure and long-term progress. Coaching with Kyle Denny comes in three forms: online coaching, a personalised programme, or 1:1 personal training in Northampton.",
    sections: [
      ["Three ways to work with KDPT", `<ul><li><a href="/online">Online Coaching</a>: £120 a month. A programme built around you, weekly check-ins, nutrition guidance and messaging in the Everfit app. No lock-in.</li><li><a href="/programmes">Personalised Programmes</a>: £49, one payment. A full programme built around your goals, schedule and equipment, delivered within 3 to 5 working days.</li><li><a href="/pt">Personal Training</a>: 1:1 sessions at Trilogy Active in Northampton. Packages from £90 a month, starting with a free consultation.</li></ul>`],
      ["About Kyle", "<p>Hi, I'm Kyle. I started KDPT because I was tired of seeing people follow generic programmes, crash diets and unrealistic plans that were never built around them. Whether you train with me in person, online or through a personalised programme, the approach is the same: your coaching should fit your goals, your lifestyle and what you can realistically stick to.</p>"],
      ["Free 30-day programme", `<p>Feeling stuck in the gym? <a href="/unstuck">Unstuck</a> is a free 30-day programme: 12 full-body sessions, daily coaching emails and a tracker to log your progress.</p>`],
    ],
    faq: [
      ["How do I know which option is right for me?", "Use the Help Me Choose quiz on the site. It asks five quick questions and recommends an option based on your goals, lifestyle and the level of support you need."],
      ["Is online coaching actually effective?", "Yes, when it's structured properly: a plan that adjusts as you progress, regular check-ins to keep you accountable and someone in your corner when things get in the way."],
      ["Do I need any gym experience to get started?", "No. Whether you're brand new to training or have been at it for years, everything is built around where you are right now."],
      ["Can coaching work around an injury or physical limitation?", "Yes. Every programme is built around the individual, including injuries, mobility issues or medical considerations."],
      ["What happens after I sign up?", "You fill in a short intake form covering your goals, training history and lifestyle. Your programme is built around that and you're set up in Everfit within a few days. Personal training starts with a free consultation."],
    ],
  },
  online: {
    path: "/online",
    title: "Online Coaching | KD Personal Training",
    description: "Online coaching with Kyle Denny: a programme built around you, weekly check-ins, nutrition guidance and messaging in Everfit. £120 a month, no lock-in.",
    h1: "Online coaching with Kyle Denny",
    intro: "Ongoing remote coaching with weekly check-ins, nutrition support and a programme that adapts as you progress. Train wherever works for you. £120 a month, cancel any time.",
    sections: [
      ["What's included", "<ul><li>Fully custom training programme</li><li>Weekly check-ins and adjustments</li><li>Ongoing nutrition guidance</li><li>Everfit app access</li><li>Direct messaging support</li></ul>"],
      ["Built around your hours", "<p>Shifts, nights, travel: it still works. There are no fixed session times, so your plan fits your rota rather than a 9 to 5.</p>"],
    ],
    faq: [
      ["How does a weekly check-in work?", "Each week you submit progress photos, weight and training feedback through Everfit. Kyle reviews everything and responds within 48 hours with any adjustments to your programme or nutrition."],
      ["Is nutrition guidance included?", "Yes. Nutrition guidance is included in every online coaching plan, tailored to your goals, preferences and lifestyle."],
      ["What app do I need?", "Everfit. It's free to download. Your programme, video demos, habit tracking and messaging are all in one place."],
      ["I work shifts or nights. Will this work for me?", "Yes. Your programme is built around the days and times you can actually train, including nights, rotating shifts and weeks away."],
      ["Is there a minimum commitment?", "No. Coaching runs month to month and you can cancel with notice before your next billing date."],
    ],
  },
  programmes: {
    path: "/programmes",
    title: "Personalised Training Programmes | KD Personal Training",
    description: "A training programme built around your goals, schedule and equipment, delivered in Everfit within 3 to 5 working days. One payment of £49.",
    h1: "Personalised training programmes",
    intro: "A complete training programme designed around your goals, schedule and equipment. Not a template. One payment of £49, built and delivered within 3 to 5 working days.",
    sections: [
      ["What's included", "<ul><li>Fully custom training plan</li><li>Delivered via Everfit</li><li>Video guidance for every exercise</li><li>Built around your equipment</li><li>Yours to keep, no subscription</li></ul>"],
    ],
    faq: [
      ["How long does delivery take?", "Built and delivered within 3 to 5 working days of completing your intake form."],
      ["Is this a one-off purchase?", "Yes. One payment, no subscriptions and no recurring charges. The programme is yours to keep."],
      ["Do I need gym access?", "No. Your programme is built around whatever equipment you have, whether that's a home setup or a commercial gym."],
      ["Can I ask questions after I receive it?", "Yes. There is a short follow-up window after delivery to clarify anything about your programme."],
    ],
  },
  pt: {
    path: "/pt",
    title: "Personal Trainer in Northampton | 1:1 PT | KD Personal Training",
    description: "1:1 personal training in Northampton at Trilogy Active with Kyle Denny. Technique-focused sessions, packages from £90 a month, free consultation first.",
    h1: "Personal trainer in Northampton",
    intro: "1:1 personal training with Kyle Denny at Trilogy Active, Northampton. Technique-focused, fully tailored sessions, starting with a free, no-pressure consultation.",
    sections: [
      ["Monthly packages", "<ul><li>2 sessions a month: £90</li><li>4 sessions a month: £160</li><li>8 sessions a month: £290</li></ul>"],
      ["Free consultation", `<p>A free chat of around 30 minutes about your goals, training background and whether 1:1 sessions are right for you. No commitment. <a href="/enquire">Book a free consultation</a>.</p>`],
    ],
    faq: [
      ["Where do sessions take place?", "Sessions take place at Trilogy Active in Northampton. Exact details are confirmed once your consultation is booked."],
      ["How long is the consultation?", "Around 30 minutes. It covers your goals, training background and whether 1:1 sessions are the right fit."],
      ["How much are sessions?", "Monthly packages are £90 for 2 sessions, £160 for 4 sessions and £290 for 8 sessions."],
      ["Is there a minimum commitment?", "No. How often you train is agreed in your consultation, based on your goals, schedule and budget."],
      ["What should I bring to my first session?", "Comfortable training kit and water. Everything else is taken care of."],
    ],
  },
};

const STYLE = `<style>#seo{max-width:680px;margin:0 auto;padding:40px 22px 80px;font:16px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI",Inter,sans-serif;color:#cfcfcf;animation:seoIn .3s 1s both}#seo h1{color:#fff;font-size:30px;line-height:1.2}#seo h2{color:#fff;font-size:20px;margin-top:32px}#seo a{color:#fff}#seo nav{font-size:14px;margin-bottom:28px}@keyframes seoIn{from{opacity:0}to{opacity:1}}</style>`;

function render(key, page) {
  const url = SITE + page.path;
  const body = [
    NAV,
    `<h1>${esc(page.h1)}</h1>`,
    `<p>${esc(page.intro)}</p>`,
    ...page.sections.map(([h, html]) => `<h2>${esc(h)}</h2>${html}`),
    `<h2>Questions</h2>`,
    ...page.faq.map(([q, a]) => `<h3>${esc(q)}</h3><p>${esc(a)}</p>`),
    `<p><a href="/enquire">Enquire about coaching</a> · <a href="https://www.instagram.com/kyle.coaching">Instagram: @kyle.coaching</a></p>`,
  ].join("\n");

  const ld = [BUSINESS, PERSON, faqLd(page.faq)]
    .map((o) => `<script type="application/ld+json">${JSON.stringify(o).replace(/</g, "\\u003c")}</script>`)
    .join("\n");

  let html = base;
  const swap = (re, value, label) => {
    if (!re.test(html)) throw new Error(`prerender: could not find ${label} in dist/index.html`);
    html = html.replace(re, value);
  };
  swap(/<title>[\s\S]*?<\/title>/, `<title>${esc(page.title)}</title>`, "title");
  swap(/<meta name="description"[^>]*>/, `<meta name="description" content="${esc(page.description)}" />`, "description");
  swap(/<link rel="canonical"[^>]*>/, `<link rel="canonical" href="${url}" />`, "canonical");
  swap(/<meta property="og:url"[^>]*>/, `<meta property="og:url" content="${url}" />`, "og:url");
  swap(/<meta property="og:title"[^>]*>/, `<meta property="og:title" content="${esc(page.title)}" />`, "og:title");
  swap(/<meta property="og:description"[^>]*>/, `<meta property="og:description" content="${esc(page.description)}" />`, "og:description");
  swap(/<meta property="og:image"[^>]*>/, `<meta property="og:image" content="${OG_IMAGE}" />`, "og:image");
  swap(/<div id="root"><\/div>/, `<div id="root"><main id="seo">\n${body}\n</main></div>`, "#root");
  html = html.replace("</head>", `${STYLE}\n${ld}\n</head>`);
  writeFileSync(new URL(`${key}.html`, dist), html);
  console.log(`prerender: wrote ${key}.html`);
}

for (const [key, page] of Object.entries(PAGES)) render(key, page);
