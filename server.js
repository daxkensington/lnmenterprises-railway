const express = require("express");
const path = require("path");
const crypto = require("crypto");
const { readJSON, writeJSON } = require("./admin/data");
const { seedCredentials } = require("./admin/auth");

const app = express();
const publicDir = path.join(__dirname, "public");
const indexFile = path.join(publicDir, "index.html");
const port = process.env.PORT || 3000;
const siteUrl = "https://www.lnmenterprises.ca";

/* ── Seed data on first boot ── */
const defaultCategories = [
  {
    slug: "gas-station-deseronto",
    title: "Gas Station in Deseronto",
    nav: "Gas Station",
    searchTitle: "Gas Station in Deseronto, ON",
    description:
      "Visit L&M Enterprises for fuel in Deseronto with full-service convenience, easy access, and a reliable stop for local drivers and travelers.",
    intro:
      "L&M Enterprises is a local stop for drivers looking for fuel, fast service, and a convenient location near Tyendinaga and Deseronto.",
    localAngle:
      "This page is designed for people searching for a gas station in Deseronto or a nearby fuel stop before heading through Tyendinaga, Napanee, or Belleville routes.",
    details: [
      "Convenient fuel stop for local traffic and through-travelers",
      "Full-service convenience inside the store",
      "Easy location for quick stops before work, school, or road trips",
    ],
    extraHeading: "Useful for local drivers and passing traffic",
    extraCopy:
      "A lot of local searches are not looking for a national chain. They are looking for the nearest practical stop. This page helps L&M Enterprises show up for that kind of nearby fuel and convenience intent.",
    keywords: [
      "gas station Deseronto",
      "gas station near Tyendinaga",
      "fuel Deseronto ON",
      "full service gas Deseronto",
    ],
  },
  {
    slug: "convenience-store-deseronto",
    title: "Convenience Store in Deseronto",
    nav: "Convenience Store",
    searchTitle: "Convenience Store in Deseronto, ON",
    description:
      "L&M Enterprises is a convenience store in Deseronto offering snacks, drinks, everyday essentials, and a quick in-and-out local stop.",
    intro:
      "Our store is designed for everyday convenience, whether you are grabbing a drink, a snack, or essentials while passing through town.",
    localAngle:
      "This page supports searches from people looking for a convenience store in Deseronto, near Tyendinaga, or along their normal local route.",
    details: [
      "Everyday convenience items for local customers",
      "Quick-stop shopping with easy access",
      "A practical stop for snacks, drinks, and essentials",
    ],
    extraHeading: "Built around quick local stops",
    extraCopy:
      "Customers searching for a convenience store nearby are usually looking for speed and simplicity. This page helps surface L&M Enterprises for those everyday local searches.",
    keywords: [
      "convenience store Deseronto",
      "store near Tyendinaga",
      "snacks and drinks Deseronto",
      "local convenience store Ontario",
    ],
  },
  {
    slug: "tobacco-deseronto",
    title: "Tobacco Categories in Deseronto",
    nav: "Tobacco",
    searchTitle: "Tobacco Categories in Deseronto, ON",
    description:
      "Learn about the tobacco categories available at L&M Enterprises in Deseronto, including cigarettes, cigars, rolling tobacco, and related in-store options.",
    intro:
      "We help local customers find the tobacco categories they are looking for in-store, with a focus on convenience and availability.",
    localAngle:
      "This page is aimed at local adult customers searching for tobacco-related categories in Deseronto and nearby communities without listing individual product inventory online.",
    details: [
      "Cigarette, cigar, and rolling tobacco categories",
      "In-store availability information for adult customers",
      "A local stop for tobacco-related convenience shopping",
    ],
    extraHeading: "Category-focused instead of product-by-product",
    extraCopy:
      "Because the site is not operating as ecommerce, this page focuses on category discovery and store intent instead of individual product listings or online checkout.",
    keywords: [
      "tobacco Deseronto",
      "tobacco shop near Tyendinaga",
      "cigarettes Deseronto",
      "rolling tobacco Deseronto",
    ],
  },
  {
    slug: "vape-categories-deseronto",
    title: "Vape Categories in Deseronto",
    nav: "Vape Categories",
    searchTitle: "Vape Categories in Deseronto, ON",
    description:
      "L&M Enterprises offers vape-related product categories in Deseronto for adult customers looking for a local in-store option.",
    intro:
      "If you are looking for vape categories from a local convenience-focused shop, L&M Enterprises serves customers in Deseronto and nearby communities.",
    localAngle:
      "This page is tailored to adult local-intent searches around vape categories in Deseronto and nearby areas where customers want an in-person option.",
    details: [
      "Vape category availability for adult customers",
      "Convenient local stop instead of a longer drive",
      "In-store guidance on what categories are currently stocked",
    ],
    extraHeading: "Local visibility without ecommerce",
    extraCopy:
      "The purpose of this page is to let nearby customers discover that the store carries this category without turning the site into an online product catalog.",
    keywords: [
      "vapes Deseronto",
      "vape shop near Tyendinaga",
      "vape categories Deseronto",
      "local vape store Deseronto",
    ],
  },
  {
    slug: "cigar-categories-deseronto",
    title: "Cigar Categories in Deseronto",
    nav: "Cigar Categories",
    searchTitle: "Cigar Categories in Deseronto, ON",
    description:
      "Explore cigar categories available in-store at L&M Enterprises in Deseronto, serving local adult customers and nearby communities.",
    intro:
      "Our store includes cigar-related categories for customers who want a nearby in-person option in the Deseronto area.",
    localAngle:
      "This page supports local searches from adult customers trying to find cigar-related categories in Deseronto or near Tyendinaga.",
    details: [
      "Local cigar category availability",
      "Convenient access for nearby customers",
      "In-store category guidance for adult shoppers",
    ],
    extraHeading: "A nearby in-person option",
    extraCopy:
      "Many local searches are simply trying to confirm whether a nearby store is worth visiting. This page helps answer that intent with place-based, category-based content.",
    keywords: [
      "cigars Deseronto",
      "cigar categories Deseronto",
      "cigar store near Tyendinaga",
      "local cigars Deseronto",
    ],
  },
  {
    slug: "rolling-tobacco-deseronto",
    title: "Rolling Tobacco in Deseronto",
    nav: "Rolling Tobacco",
    searchTitle: "Rolling Tobacco in Deseronto, ON",
    description:
      "L&M Enterprises carries rolling tobacco categories in Deseronto for adult customers looking for a nearby in-store option.",
    intro:
      "Customers in Deseronto and the surrounding area can visit us for rolling tobacco categories and other convenience-store needs.",
    localAngle:
      "This page is meant to capture local searches for rolling tobacco in Deseronto and nearby communities while keeping the site informational rather than transactional.",
    details: [
      "Rolling tobacco category availability",
      "Easy local access for repeat customers",
      "Convenience-store stop with multiple adult product categories",
    ],
    extraHeading: "Store-visit intent matters here",
    extraCopy:
      "This page is built for people who are searching locally and want a nearby place to visit, not a mail-order or ecommerce experience.",
    keywords: [
      "rolling tobacco Deseronto",
      "tobacco near Tyendinaga",
      "rolling tobacco store Deseronto",
      "local tobacco categories Ontario",
    ],
  },
];

const defaultFaqs = [
  {
    question: "What kinds of products does L&M Enterprises focus on?",
    answer:
      "L&M Enterprises focuses on fuel, convenience-store essentials, and adult-only product categories such as tobacco, cigar, rolling tobacco, and vape-related in-store options.",
  },
  {
    question: "Do you sell products online?",
    answer:
      "No. This site is for store information and category discovery only. Customers visit in person or contact the store about current availability.",
  },
  {
    question: "Why have separate category pages if there is no ecommerce?",
    answer:
      "These pages help local customers find the store when they search for categories in Deseronto, Tyendinaga, and nearby areas.",
  },
  {
    question: "Do customers from Tyendinaga and nearby communities visit the store?",
    answer:
      "Yes. The site is written to help customers from Deseronto, Tyendinaga, and surrounding areas find a nearby in-store option for fuel, convenience, and adult-only product categories.",
  },
];

/* ── Seed defaults + load from JSON ── */
seedCredentials();
if (!readJSON("categories.json")) writeJSON("categories.json", defaultCategories);
if (!readJSON("faqs.json")) writeJSON("faqs.json", defaultFaqs);
if (!readJSON("site-content.json")) {
  writeJSON("site-content.json", {
    businessName: "L&M Enterprises",
    phone: "+1-613-396-2224",
    address: "43 Dundas Street, Deseronto, ON K0K 1X0",
    hours: "6:00 AM - 10:00 PM",
    hoursNote: "Open Daily",
    promoBanner: "Win $1000 in FREE GAS! Monthly contest with SAGO Gas Bar",
    facebookUrl: "https://www.facebook.com/LandMEnterprises",
  });
}
if (!readJSON("blog-posts.json")) writeJSON("blog-posts.json", []);
if (!readJSON("contact-messages.json")) writeJSON("contact-messages.json", []);

function loadCategories() { return readJSON("categories.json", defaultCategories); }
function loadFaqs() { return readJSON("faqs.json", defaultFaqs); }
function loadSiteContent() {
  return readJSON("site-content.json", {
    businessName: "L&M Enterprises", phone: "+1-613-396-2224",
    address: "43 Dundas Street, Deseronto, ON K0K 1X0",
    hours: "6:00 AM - 10:00 PM", hoursNote: "Open Daily",
    promoBanner: "Win $1000 in FREE GAS! Monthly contest with SAGO Gas Bar",
    facebookUrl: "https://www.facebook.com/LandMEnterprises",
  });
}

app.disable("x-powered-by");
app.use(require("compression")());
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; script-src 'self'; connect-src 'self'; frame-src 'self' https://www.google.com; frame-ancestors 'self'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests",
  );

  if (req.hostname === "lnmenterprises.ca") {
    res.redirect(301, `${siteUrl}${req.originalUrl}`);
    return;
  }

  next();
});

function pageTemplate({
  title,
  description,
  canonicalPath = "/",
  content,
  jsonLd,
  keywords = [],
  noindex = false,
}) {
  const canonical = `${siteUrl}${canonicalPath}`;
  const keywordsContent = keywords.join(", ");
  const robotsContent = noindex ? "noindex, nofollow" : "index, follow";
  const canonicalTag = canonicalPath ? `<link rel="canonical" href="${canonical}" />` : "";

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}" />
    <meta name="keywords" content="${escapeHtml(keywordsContent)}" />
    <meta name="robots" content="${robotsContent}" />
    ${canonicalTag}
    <meta property="og:type" content="website" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:url" content="${canonical}" />
    <meta property="og:site_name" content="L&amp;M Enterprises" />
    <meta property="og:image" content="${siteUrl}/og-image.svg" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
    <meta name="twitter:image" content="${siteUrl}/og-image.svg" />
    <link rel="icon" type="image/png" href="/favicon.png" />
    <link rel="manifest" href="/manifest.json" />
    <meta name="theme-color" content="#dc2626" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
    <link rel="stylesheet" href="/styles.css?v=3" />
    <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
  </head>
  <body>
    ${content}
  </body>
</html>`;
}

function siteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "ConvenienceStore",
    "@id": `${siteUrl}/#business`,
    name: "L&M Enterprises",
    description:
      "Local gas station and convenience store in Deseronto, Ontario with tobacco, vape, cigar, and rolling tobacco categories available in-store.",
    url: siteUrl,
    telephone: "+1-613-396-2224",
    image: `${siteUrl}/og-image.svg`,
    address: {
      "@type": "PostalAddress",
      streetAddress: "43 Dundas Street",
      addressLocality: "Deseronto",
      addressRegion: "ON",
      postalCode: "K0K 1X0",
      addressCountry: "CA",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: "44.196220",
      longitude: "-77.064132",
    },
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ],
      opens: "06:00",
      closes: "22:00",
    },
    sameAs: ["https://www.facebook.com/LandMEnterprises"],
  };
}

function faqJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: loadFaqs().map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

/* ── Lucide-style SVG icons (matching the SPA) ── */
const icons = {
  store: '<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/><path d="M22 7v3a2 2 0 0 1-2 2 2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12a2 2 0 0 1-2-2V7"/></svg>',
  fuel: '<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 22V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v17"/><path d="M15 22H3"/><path d="M15 10h2a2 2 0 0 1 2 2v2a2 2 0 0 0 2 2 2 2 0 0 0 2-2V9.83a2 2 0 0 0-.59-1.42L18 5"/><path d="M7 10h4"/></svg>',
  mapPin: '<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>',
  phone: '<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>',
  clock: '<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
  gift: '<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13"/><path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/><path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5"/></svg>',
  facebook: '<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>',
  search: '<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>',
  arrowRight: '<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>',
  leaf: '<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.9C15.5 4.9 17 3.5 19 2c1 2 2 4.5 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>',
  tag: '<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/><circle cx="7.5" cy="7.5" r=".5" fill="currentColor"/></svg>',
  shoppingBag: '<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>',
};

function layout(body) {
  const sc = loadSiteContent();
  return `
    <div class="promo-banner">
      <div class="container">
        ${icons.gift} 🎉 ${escapeHtml(sc.promoBanner)}
      </div>
    </div>
    <header class="site-header">
      <div class="container header-inner">
        <a class="brand" href="/">
          <span class="brand-mark">${icons.store}</span>
          <span class="brand-text">
            <strong>${escapeHtml(sc.businessName).toUpperCase()}</strong>
            <span>Gas &amp; Convenience</span>
          </span>
        </a>
        <nav class="nav">
          <a href="/">Home</a>
          <a href="/#prices">Prices</a>
          <a href="/deseronto-convenience-store-gas-station">Location</a>
          <a href="/blog">Blog</a>
          <a class="nav-cta" href="tel:${escapeHtml(sc.phone)}">${icons.phone} Call Now</a>
        </nav>
      </div>
    </header>
    ${body}
    <footer class="site-footer">
      <div class="container">
        <h3 class="footer-title">${escapeHtml(sc.businessName).toUpperCase()}</h3>
        <div class="footer-divider"></div>
        <p class="footer-tagline">SAGO Gas Bar Partner &bull; Full-Service Gas &amp; Convenience Store</p>
        <div class="footer-contact">
          <a href="tel:${escapeHtml(sc.phone)}">${escapeHtml(sc.phone)}</a>
          <span class="sep">&bull;</span>
          <span>${escapeHtml(sc.address)}</span>
          <span class="sep">&bull;</span>
          <span>${escapeHtml(sc.hoursNote)} ${escapeHtml(sc.hours)}</span>
        </div>
        <p class="footer-subtext">Proudly serving Tyendinaga Mohawk Territory and surrounding communities</p>
        <a class="footer-social" href="${escapeHtml(sc.facebookUrl)}" target="_blank" rel="noopener noreferrer">
          ${icons.facebook} <span>Follow Us on Facebook</span>
        </a>
        <div class="footer-bottom">
          &copy; ${new Date().getFullYear()} ${escapeHtml(sc.businessName)}. All rights reserved.
        </div>
      </div>
    </footer>
  `;
}

function locationPage() {
  const content = `
    <section class="hero">
      <div class="hero-content">
        <div class="hero-badge">Deseronto Location</div>
        <h1>Your Local Gas Station &amp; Convenience Store</h1>
        <p class="lead">Serving Deseronto, Tyendinaga Mohawk Territory, and nearby communities with fuel, everyday essentials, and in-store product categories.</p>
        <div class="hero-buttons">
          <a class="btn btn-primary" href="/contact-directions">${icons.mapPin} Get Directions</a>
          <a class="btn btn-secondary" href="tel:+16133962224">${icons.phone} Call 613-396-2224</a>
        </div>
      </div>
    </section>
    <main>
      <section class="section">
        <div class="container">
          <div class="section-header">
            <h2>Store Information</h2>
            <div class="section-divider"></div>
            <p>Everything you need to plan your visit to L&amp;M Enterprises.</p>
          </div>
          <div class="info-grid">
            <div class="info-card">
              <div class="icon-circle">${icons.mapPin}</div>
              <h3>Address</h3>
              <p>43 Dundas Street<br>Deseronto, ON K0K 1X0</p>
            </div>
            <div class="info-card">
              <div class="icon-circle">${icons.clock}</div>
              <h3>Hours</h3>
              <p>Open Daily<br>6:00 AM &ndash; 10:00 PM</p>
            </div>
            <div class="info-card">
              <div class="icon-circle">${icons.phone}</div>
              <h3>Phone</h3>
              <p><a href="tel:+16133962224">613-396-2224</a><br>Call for store info</p>
            </div>
          </div>
        </div>
      </section>
      <section class="section section-alt">
        <div class="container">
          <div class="section-header">
            <h2>What We Offer</h2>
            <div class="section-divider"></div>
          </div>
          <div class="card-grid">
            <article class="card">
              <div class="icon-circle">${icons.fuel}</div>
              <h3>Full-Service Gas</h3>
              <p>Partner with SAGO Gas Bar next door for guaranteed lower prices on regular, premium, and diesel fuel.</p>
            </article>
            <article class="card">
              <div class="icon-circle">${icons.shoppingBag}</div>
              <h3>Convenience Store</h3>
              <p>Snacks, beverages, and everyday essentials for your journey. Friendly staff ready to help.</p>
            </article>
            <article class="card">
              <div class="icon-circle">${icons.tag}</div>
              <h3>Product Categories</h3>
              <p>Tobacco, vape, cigar, and rolling tobacco categories available in-store for adult customers.</p>
            </article>
          </div>
        </div>
      </section>
      <section class="section">
        <div class="container two-col">
          <div>
            <h2>Why Customers Choose L&amp;M</h2>
            <p>Many customers search for a place first and a category second. L&amp;M Enterprises serves people looking for a gas station in Deseronto, a convenience store near Tyendinaga, or a nearby in-person stop.</p>
            <p>Instead of acting like ecommerce, we focus on helping nearby customers understand where the store is, what we carry, and why we are a practical stop in the area.</p>
            <div class="feature-pills">
              <div class="feature-pill"><span class="pill-icon">${icons.fuel}</span> Full-Service Gas</div>
              <div class="feature-pill"><span class="pill-icon">${icons.shoppingBag}</span> Convenience Store</div>
              <div class="feature-pill"><span class="pill-icon">${icons.leaf}</span> Tobacco &amp; Vapes</div>
              <div class="feature-pill"><span class="pill-icon">${icons.clock}</span> Open 6am-10pm</div>
            </div>
          </div>
          <div>
            <img src="/og-image.svg" alt="L&amp;M Enterprises" style="width:100%;border-radius:16px;box-shadow:0 12px 24px rgba(0,0,0,0.1);" />
          </div>
        </div>
      </section>
    </main>`;

  return pageTemplate({
    title: "L&M Enterprises | Deseronto Convenience Store and Gas Station",
    description:
      "L&M Enterprises is a convenience store and gas station in Deseronto serving Tyendinaga and nearby communities with fuel, convenience-store essentials, and in-store adult-only product categories.",
    canonicalPath: "/deseronto-convenience-store-gas-station",
    keywords: [
      "Deseronto convenience store",
      "gas station Deseronto",
      "gas station near Tyendinaga",
      "convenience store near Tyendinaga",
    ],
    jsonLd: [
      {
        ...siteJsonLd(),
        "@type": "ConvenienceStore",
        name: "L&M Enterprises Deseronto",
        url: `${siteUrl}/deseronto-convenience-store-gas-station`,
      },
    ],
    content: layout(content),
  });
}

function contactPage() {
  const content = `
    <section class="hero">
      <div class="hero-content">
        <div class="hero-badge">Contact &amp; Directions</div>
        <h1>Visit, Call, or Get Directions</h1>
        <p class="lead">Find L&amp;M Enterprises at 43 Dundas Street in Deseronto. We are open daily from 6am to 10pm.</p>
        <div class="hero-buttons">
          <a class="btn btn-primary" href="tel:+16133962224">${icons.phone} Call The Store</a>
          <a class="btn btn-secondary" href="https://maps.google.com/?q=43+Dundas+Street+Deseronto+ON+K0K+1X0" rel="noreferrer">${icons.mapPin} Open In Maps</a>
        </div>
      </div>
    </section>
    <main>
      <section class="section">
        <div class="container">
          <div class="section-header">
            <h2>How to Reach Us</h2>
            <div class="section-divider"></div>
          </div>
          <div class="info-grid">
            <div class="info-card">
              <div class="icon-circle">${icons.mapPin}</div>
              <h3>Address</h3>
              <p>43 Dundas Street<br>Deseronto, ON K0K 1X0</p>
            </div>
            <div class="info-card">
              <div class="icon-circle">${icons.phone}</div>
              <h3>Phone</h3>
              <p><a href="tel:+16133962224">613-396-2224</a><br>Call anytime during hours</p>
            </div>
            <div class="info-card">
              <div class="icon-circle">${icons.clock}</div>
              <h3>Hours</h3>
              <p>Open Daily<br>6:00 AM &ndash; 10:00 PM</p>
            </div>
          </div>
        </div>
      </section>
      <section class="section section-alt">
        <div class="container two-col">
          <div>
            <h2>Serving Nearby Communities</h2>
            <p>L&amp;M Enterprises is positioned to serve Deseronto directly while also being a practical stop for Tyendinaga and surrounding area traffic. Whether you are driving through or live nearby, we are a convenient stop for fuel and essentials.</p>
          </div>
          <div>
            <h2>Before You Visit</h2>
            <p>If you are calling ahead, ask about store hours, category availability, or general visit information. The website is informational and does not process online orders.</p>
          </div>
        </div>
      </section>
      <section class="section">
        <div class="container" style="max-width:600px;">
          <div class="section-header">
            <h2>Send Us a Message</h2>
            <div class="section-divider"></div>
            <p>Have a question? Fill out the form below and we will get back to you.</p>
          </div>
          <form method="POST" action="/contact" style="text-align:left;">
            <div style="margin-bottom:1rem;">
              <label for="name" style="display:block;font-weight:600;margin-bottom:0.25rem;">Name *</label>
              <input type="text" id="name" name="name" required style="width:100%;padding:0.6rem;border:1px solid #d1d5db;border-radius:8px;font-size:0.95rem;" />
            </div>
            <div style="margin-bottom:1rem;">
              <label for="email" style="display:block;font-weight:600;margin-bottom:0.25rem;">Email *</label>
              <input type="email" id="email" name="email" required style="width:100%;padding:0.6rem;border:1px solid #d1d5db;border-radius:8px;font-size:0.95rem;" />
            </div>
            <div style="margin-bottom:1rem;">
              <label for="phone" style="display:block;font-weight:600;margin-bottom:0.25rem;">Phone</label>
              <input type="tel" id="phone" name="phone" style="width:100%;padding:0.6rem;border:1px solid #d1d5db;border-radius:8px;font-size:0.95rem;" />
            </div>
            <div style="margin-bottom:1rem;">
              <label for="subject" style="display:block;font-weight:600;margin-bottom:0.25rem;">Subject</label>
              <input type="text" id="subject" name="subject" style="width:100%;padding:0.6rem;border:1px solid #d1d5db;border-radius:8px;font-size:0.95rem;" />
            </div>
            <div style="margin-bottom:1.5rem;">
              <label for="message" style="display:block;font-weight:600;margin-bottom:0.25rem;">Message *</label>
              <textarea id="message" name="message" rows="5" required style="width:100%;padding:0.6rem;border:1px solid #d1d5db;border-radius:8px;font-size:0.95rem;resize:vertical;"></textarea>
            </div>
            <button type="submit" class="btn btn-primary" style="width:100%;padding:0.75rem;font-size:1rem;">Send Message</button>
          </form>
        </div>
      </section>
    </main>`;

  return pageTemplate({
    title: "L&M Enterprises | Contact and Directions",
    description:
      "Get store contact details, hours, and directions for L&M Enterprises in Deseronto, Ontario.",
    canonicalPath: "/contact-directions",
    keywords: [
      "L&M Enterprises contact",
      "Deseronto directions",
      "Deseronto store phone number",
      "Tyendinaga convenience store directions",
    ],
    jsonLd: [
      {
        ...siteJsonLd(),
        "@type": "ContactPage",
        url: `${siteUrl}/contact-directions`,
      },
    ],
    content: layout(content),
  });
}


function categoryPage(category) {
  const relatedLinks = loadCategories()
    .filter((entry) => entry.slug !== category.slug)
    .slice(0, 4)
    .map(
      (entry) =>
        `<li><a href="/${entry.slug}">${icons.arrowRight} ${escapeHtml(entry.nav)}</a></li>`,
    )
    .join("");

  const detailCards = category.details
    .map(
      (item, i) => `
      <article class="card">
        <div class="icon-circle">${[icons.search, icons.mapPin, icons.tag][i % 3]}</div>
        <h3>${escapeHtml(item)}</h3>
      </article>`,
    )
    .join("");

  const content = `
    <section class="hero">
      <div class="hero-content">
        <div class="hero-badge">${escapeHtml(category.nav)}</div>
        <h1>${escapeHtml(category.searchTitle)}</h1>
        <p class="lead">${escapeHtml(category.intro)}</p>
        <div class="hero-buttons">
          <a class="btn btn-primary" href="/contact-directions">${icons.mapPin} Visit The Store</a>
          <a class="btn btn-secondary" href="tel:+16133962224">${icons.phone} Call Now</a>
        </div>
      </div>
    </section>
    <main>
      <section class="section">
        <div class="container">
          <div class="section-header">
            <h2>About This Category</h2>
            <div class="section-divider"></div>
            <p>${escapeHtml(category.description)}</p>
          </div>
          <div class="card-grid">${detailCards}</div>
        </div>
      </section>
      <section class="section section-alt">
        <div class="container two-col">
          <div>
            <h2>${escapeHtml(category.extraHeading)}</h2>
            <p>${escapeHtml(category.extraCopy)}</p>
            <p>${escapeHtml(category.localAngle)}</p>
          </div>
          <div>
            <h2>Related Categories</h2>
            <ul class="related-list">${relatedLinks}</ul>
          </div>
        </div>
      </section>
      <section class="section section-dark">
        <div class="container">
          <div class="section-header">
            <h2>Visit Us In Store</h2>
            <div class="section-divider"></div>
            <p>L&amp;M Enterprises is located at 43 Dundas Street in Deseronto. Open daily 6am&ndash;10pm.</p>
          </div>
          <div style="text-align:center;">
            <a class="btn btn-primary" href="/contact-directions">${icons.mapPin} Get Directions</a>
          </div>
        </div>
      </section>
    </main>`;

  return pageTemplate({
    title: `L&M Enterprises | ${category.title}`,
    description: category.description,
    canonicalPath: `/${category.slug}`,
    keywords: category.keywords,
    jsonLd: [{
      ...siteJsonLd(),
      "@type": "Store",
      name: `L&M Enterprises - ${category.title}`,
      description: category.description,
      url: `${siteUrl}/${category.slug}`,
    }],
    content: layout(content),
  });
}

function blogPage() {
  const posts = readJSON("blog-posts.json", []).filter((p) => p.published);
  const postCards = posts.length
    ? posts
        .map(
          (p) => `
          <article class="blog-card">
            <span class="kicker">${escapeHtml(p.date)}</span>
            <h2><a href="/blog/${escapeHtml(p.slug)}" style="color:inherit;text-decoration:none;">${escapeHtml(p.title)}</a></h2>
            <p>${escapeHtml((p.content || "").slice(0, 200))}${p.content && p.content.length > 200 ? "..." : ""}</p>
            <a class="btn btn-outline" href="/blog/${escapeHtml(p.slug)}" style="margin-top:0.5rem;">Read More</a>
          </article>`,
        )
        .join("")
    : `<article class="blog-card">
        <span class="kicker">Now Live</span>
        <h2>Our category pages are focused on local search.</h2>
        <p>The current website highlights the categories customers search for most often around Deseronto and nearby communities, while keeping the site informational rather than transactional.</p>
      </article>`;

  const content = `
    <section class="hero">
      <div class="hero-content">
        <div class="hero-badge">Updates</div>
        <h1>Store Updates &amp; Local Info</h1>
        <p class="lead">Local announcements, category highlights, and store information from L&amp;M Enterprises.</p>
      </div>
    </section>
    <main>
      <section class="section">
        <div class="container">${postCards}</div>
      </section>
      <section class="section section-alt">
        <div class="container">
          <div class="section-header">
            <h2>Also Explore</h2>
            <div class="section-divider"></div>
          </div>
          <div class="card-grid">
            <article class="card">
              <div class="icon-circle">${icons.fuel}</div>
              <h3>Gas Station</h3>
              <p>Fuel prices, full-service pumping, and SAGO Gas Bar partnership details.</p>
              <a class="btn btn-outline" href="/gas-station-deseronto" style="margin-top:1rem;">Learn More</a>
            </article>
            <article class="card">
              <div class="icon-circle">${icons.shoppingBag}</div>
              <h3>Convenience Store</h3>
              <p>Snacks, drinks, and everyday essentials at your local stop.</p>
              <a class="btn btn-outline" href="/convenience-store-deseronto" style="margin-top:1rem;">Learn More</a>
            </article>
            <article class="card">
              <div class="icon-circle">${icons.mapPin}</div>
              <h3>Contact &amp; Directions</h3>
              <p>Find the store, get directions, or call ahead before visiting.</p>
              <a class="btn btn-outline" href="/contact-directions" style="margin-top:1rem;">Learn More</a>
            </article>
          </div>
        </div>
      </section>
    </main>`;

  return pageTemplate({
    title: "L&M Enterprises | Store Updates",
    description:
      "Read local store updates and category-focused information from L&M Enterprises in Deseronto, Ontario.",
    canonicalPath: "/blog",
    keywords: ["L&M Enterprises blog", "Deseronto store updates"],
    jsonLd: siteJsonLd(),
    content: layout(content),
  });
}

function blogPostPage(post) {
  const content = `
    <section class="hero">
      <div class="hero-content">
        <div class="hero-badge">${escapeHtml(post.date)}</div>
        <h1>${escapeHtml(post.title)}</h1>
      </div>
    </section>
    <main>
      <section class="section">
        <div class="container">
          <article class="blog-card">
            <div style="white-space:pre-wrap;line-height:1.8;">${escapeHtml(post.content).replace(/\n/g, "<br>")}</div>
          </article>
          <div style="margin-top:2rem;text-align:center;">
            <a class="btn btn-primary" href="/blog">${icons.arrowRight} Back to Blog</a>
          </div>
        </div>
      </section>
    </main>`;

  return pageTemplate({
    title: `${post.title} | L&M Enterprises`,
    description: (post.content || "").slice(0, 160),
    canonicalPath: `/blog/${post.slug}`,
    keywords: ["L&M Enterprises blog", "Deseronto store updates"],
    jsonLd: siteJsonLd(),
    content: layout(content),
  });
}

function notFoundPage() {
  return pageTemplate({
    title: "Page Not Found | L&M Enterprises",
    description: "The page you requested could not be found.",
    canonicalPath: "",
    noindex: true,
    jsonLd: siteJsonLd(),
    content: layout(`
      <main>
        <div class="not-found">
          <div class="container">
            <p class="eyebrow">404</p>
            <h1>Page Not Found</h1>
            <p>The page you are looking for does not exist, but you can head back to the homepage or explore our store pages.</p>
            <a class="btn btn-primary" href="/">Back to Homepage</a>
          </div>
        </div>
      </main>`),
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/* ── Admin routes ── */
app.use("/admin", require("./admin/routes"));

/* ── Contact form handler ── */
const contactRateLimit = new Map();
app.use("/contact", express.urlencoded({ extended: false, limit: "100kb" }));

app.post("/contact", (req, res) => {
  const ip = req.ip;
  const now = Date.now();
  const entry = contactRateLimit.get(ip) || { count: 0, resetTime: now + 3600000 };
  if (now > entry.resetTime) { entry.count = 0; entry.resetTime = now + 3600000; }
  entry.count++;
  contactRateLimit.set(ip, entry);
  if (entry.count > 5) {
    res.status(429).send(pageTemplate({
      title: "Too Many Requests", description: "Rate limited.",
      noindex: true, jsonLd: siteJsonLd(),
      content: layout(`<main><div class="not-found"><div class="container"><h1>Too Many Requests</h1><p>Please wait before submitting another message.</p><a class="btn btn-primary" href="/contact-directions">Go Back</a></div></div></main>`),
    }));
    return;
  }
  const { name, email, phone, subject, message } = req.body;
  if (!name || !email || !message) {
    res.status(400).send("Name, email, and message are required.");
    return;
  }
  const messages = readJSON("contact-messages.json", []);
  messages.unshift({
    id: crypto.randomBytes(8).toString("hex"),
    name, email, phone: phone || "", subject: subject || "",
    message, date: new Date().toISOString(), read: false,
  });
  writeJSON("contact-messages.json", messages);
  res.send(pageTemplate({
    title: "Message Sent | L&M Enterprises",
    description: "Thank you for your message.",
    noindex: true, jsonLd: siteJsonLd(),
    content: layout(`<main><div class="not-found"><div class="container"><p class="eyebrow">Thank You</p><h1>Message Sent</h1><p>We received your message and will get back to you soon.</p><a class="btn btn-primary" href="/">Back to Homepage</a></div></div></main>`),
  }));
});

app.get(/^\/(api)(\/|$)/, (_req, res) => {
  res.status(404).send("Not found");
});

app.get("/files", (_req, res) => {
  res.redirect(301, "/");
});

app.get("/", (_req, res) => {
  res.sendFile(indexFile);
});

app.get("/blog", (_req, res) => {
  res.send(blogPage());
});

app.get("/blog/:slug", (req, res, next) => {
  const posts = readJSON("blog-posts.json", []);
  const post = posts.find((p) => p.slug === req.params.slug && p.published);
  if (!post) return next();
  res.send(blogPostPage(post));
});

app.get("/deseronto-convenience-store-gas-station", (_req, res) => {
  res.send(locationPage());
});

app.get("/contact-directions", (_req, res) => {
  res.send(contactPage());
});

const categorySlugs = new Set(defaultCategories.map((c) => c.slug));
for (const slug of categorySlugs) {
  app.get(`/${slug}`, (_req, res) => {
    const cats = loadCategories();
    const category = cats.find((c) => c.slug === slug);
    if (!category) return res.status(404).send(notFoundPage());
    res.send(categoryPage(category));
  });
}

app.use(express.static(publicDir, { maxAge: "7d" }));

app.use((_req, res) => {
  res.status(404).send(notFoundPage());
});

app.use((err, _req, res, _next) => {
  console.error(`[${new Date().toISOString()}] Error:`, err.message);
  if (process.env.NODE_ENV !== "production") console.error(err.stack);
  res.status(500).send("Internal server error");
});

app.listen(port, () => {
  console.log(`L&M Enterprises Railway server listening on ${port}`);
});
