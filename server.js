const express = require("express");
const path = require("path");

const app = express();
const publicDir = path.join(__dirname, "public");
const port = process.env.PORT || 3000;
const siteUrl = "https://www.lnmenterprises.ca";

const categories = [
  {
    slug: "gas-station-deseronto",
    title: "Gas Station in Deseronto",
    nav: "Gas Station",
    searchTitle: "Gas Station in Deseronto, ON",
    description:
      "Visit L&M Enterprises for fuel in Deseronto with full-service convenience, easy access, and a reliable stop for local drivers and travelers.",
    intro:
      "L&M Enterprises is a local stop for drivers looking for fuel, fast service, and a convenient location near Tyendinaga and Deseronto.",
    details: [
      "Convenient fuel stop for local traffic and through-travelers",
      "Full-service convenience inside the store",
      "Easy location for quick stops before work, school, or road trips",
    ],
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
    details: [
      "Everyday convenience items for local customers",
      "Quick-stop shopping with easy access",
      "A practical stop for snacks, drinks, and essentials",
    ],
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
    details: [
      "Cigarette, cigar, and rolling tobacco categories",
      "In-store availability information for adult customers",
      "A local stop for tobacco-related convenience shopping",
    ],
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
    details: [
      "Vape category availability for adult customers",
      "Convenient local stop instead of a longer drive",
      "In-store guidance on what categories are currently stocked",
    ],
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
    details: [
      "Local cigar category availability",
      "Convenient access for nearby customers",
      "In-store category guidance for adult shoppers",
    ],
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
    details: [
      "Rolling tobacco category availability",
      "Easy local access for repeat customers",
      "Convenience-store stop with multiple adult product categories",
    ],
    keywords: [
      "rolling tobacco Deseronto",
      "tobacco near Tyendinaga",
      "rolling tobacco store Deseronto",
      "local tobacco categories Ontario",
    ],
  },
];

const faqs = [
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
];

app.disable("x-powered-by");

function pageTemplate({
  title,
  description,
  canonicalPath = "/",
  content,
  jsonLd,
  keywords = [],
}) {
  const canonical = `${siteUrl}${canonicalPath}`;
  const keywordsContent = keywords.join(", ");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}" />
    <meta name="keywords" content="${escapeHtml(keywordsContent)}" />
    <meta name="robots" content="index, follow" />
    <link rel="canonical" href="${canonical}" />
    <meta property="og:type" content="website" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:url" content="${canonical}" />
    <meta property="og:site_name" content="L&amp;M Enterprises" />
    <meta property="og:image" content="${siteUrl}/favicon.png" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
    <meta name="twitter:image" content="${siteUrl}/favicon.png" />
    <link rel="icon" type="image/png" href="/favicon.png" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
    <link rel="stylesheet" href="/styles.css" />
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
    image: `${siteUrl}/favicon.png`,
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

function layout(hero, body) {
  const navLinks = categories
    .map(
      (category) =>
        `<a href="/${category.slug}">${escapeHtml(category.nav)}</a>`,
    )
    .join("");

  return `
    <header class="site-header">
      <div class="wrap header-row">
        <a class="brand" href="/">L&amp;M Enterprises</a>
        <nav class="nav">${navLinks}</nav>
      </div>
    </header>
    ${hero}
    ${body}
    <footer class="site-footer">
      <div class="wrap footer-grid">
        <div>
          <h3>L&amp;M Enterprises</h3>
          <p>43 Dundas Street, Deseronto, ON K0K 1X0</p>
          <p>Open daily 6:00 AM to 10:00 PM</p>
          <p><a href="tel:+16133962224">613-396-2224</a></p>
        </div>
        <div>
          <h3>Popular Pages</h3>
          <ul>
            ${categories
              .map(
                (category) =>
                  `<li><a href="/${category.slug}">${escapeHtml(
                    category.nav,
                  )}</a></li>`,
              )
              .join("")}
          </ul>
        </div>
      </div>
    </footer>
  `;
}

function homePage() {
  const hero = `
    <section class="hero">
      <div class="wrap hero-grid">
        <div>
          <p class="eyebrow">Deseronto, Ontario</p>
          <h1>Local convenience, fuel, and in-store product categories that customers search for nearby.</h1>
          <p class="lede">
            L&amp;M Enterprises serves Deseronto and the surrounding area with fuel, convenience-store essentials, and adult-only in-store categories like tobacco, vape, cigar, and rolling tobacco options.
          </p>
          <div class="cta-row">
            <a class="button" href="tel:+16133962224">Call The Store</a>
            <a class="button button-secondary" href="#categories">Explore Categories</a>
          </div>
        </div>
        <aside class="info-card">
          <h2>Visit Us</h2>
          <p>43 Dundas Street</p>
          <p>Deseronto, ON K0K 1X0</p>
          <p>Open daily from 6:00 AM to 10:00 PM</p>
          <p>Serving Deseronto, Tyendinaga, and nearby communities.</p>
        </aside>
      </div>
    </section>`;

  const categoryCards = categories
    .map(
      (category) => `
        <article class="card">
          <p class="card-kicker">${escapeHtml(category.nav)}</p>
          <h2><a href="/${category.slug}">${escapeHtml(category.searchTitle)}</a></h2>
          <p>${escapeHtml(category.description)}</p>
          <a class="text-link" href="/${category.slug}">Read more</a>
        </article>`,
    )
    .join("");

  const faqItems = faqs
    .map(
      (faq) => `
        <article class="faq-item">
          <h3>${escapeHtml(faq.question)}</h3>
          <p>${escapeHtml(faq.answer)}</p>
        </article>`,
    )
    .join("");

  const body = `
    <main>
      <section class="section">
        <div class="wrap two-col">
          <div>
            <p class="eyebrow">What This Site Does</p>
            <h2>A local SEO site, not an online store.</h2>
            <p>
              This website is built to help nearby customers discover what kinds of products and services L&amp;M Enterprises offers before they visit the store. It is designed for local search visibility, store visits, and phone calls rather than ecommerce checkout.
            </p>
          </div>
          <div class="feature-list">
            <div>
              <strong>Fuel and convenience</strong>
              <p>Quick-stop access for drivers and local shoppers.</p>
            </div>
            <div>
              <strong>Category visibility</strong>
              <p>Pages focused on the groups of products customers search for locally.</p>
            </div>
            <div>
              <strong>In-store action</strong>
              <p>Built to encourage visits, calls, and local discovery.</p>
            </div>
          </div>
        </div>
      </section>
      <section class="section section-alt" id="categories">
        <div class="wrap">
          <p class="eyebrow">Category Pages</p>
          <h2>Browse the main categories customers ask about.</h2>
          <div class="card-grid">${categoryCards}</div>
        </div>
      </section>
      <section class="section">
        <div class="wrap">
          <p class="eyebrow">Frequently Asked Questions</p>
          <h2>Store-focused answers for local customers.</h2>
          <div class="faq-grid">${faqItems}</div>
        </div>
      </section>
    </main>`;

  return pageTemplate({
    title: "L&M Enterprises | Convenience Store, Fuel, and Local Product Categories",
    description:
      "L&M Enterprises is a local convenience store and fuel stop in Deseronto, Ontario with in-store tobacco, vape, cigar, and rolling tobacco categories for adult customers.",
    canonicalPath: "/",
    keywords: [
      "L&M Enterprises",
      "Deseronto convenience store",
      "gas station Deseronto",
      "tobacco categories Deseronto",
      "vape categories Deseronto",
      "rolling tobacco Deseronto",
    ],
    jsonLd: siteJsonLd(),
    content: layout(hero, body),
  });
}

function categoryPage(category) {
  const hero = `
    <section class="hero hero-small">
      <div class="wrap">
        <p class="eyebrow">${escapeHtml(category.nav)}</p>
        <h1>${escapeHtml(category.searchTitle)}</h1>
        <p class="lede">${escapeHtml(category.intro)}</p>
      </div>
    </section>`;

  const detailItems = category.details
    .map((item) => `<li>${escapeHtml(item)}</li>`)
    .join("");

  const relatedLinks = categories
    .filter((entry) => entry.slug !== category.slug)
    .slice(0, 3)
    .map(
      (entry) =>
        `<li><a href="/${entry.slug}">${escapeHtml(entry.searchTitle)}</a></li>`,
    )
    .join("");

  const body = `
    <main>
      <section class="section">
        <div class="wrap detail-grid">
          <div>
            <h2>About this category</h2>
            <p>${escapeHtml(category.description)}</p>
            <ul class="bullet-list">${detailItems}</ul>
          </div>
          <aside class="sidebar-card">
            <h3>Store Details</h3>
            <p>43 Dundas Street</p>
            <p>Deseronto, ON K0K 1X0</p>
            <p>Open daily 6:00 AM to 10:00 PM</p>
            <p><a href="tel:+16133962224">Call for store information</a></p>
          </aside>
        </div>
      </section>
      <section class="section section-alt">
        <div class="wrap two-col">
          <div>
            <h2>Why this page exists</h2>
            <p>
              Customers often search by category rather than by specific product. This page helps people in Deseronto, Tyendinaga, and nearby areas understand what kinds of in-store options L&amp;M Enterprises is known for.
            </p>
          </div>
          <div>
            <h2>Related category pages</h2>
            <ul class="bullet-list">${relatedLinks}</ul>
          </div>
        </div>
      </section>
    </main>`;

  return pageTemplate({
    title: `L&M Enterprises | ${category.title}`,
    description: category.description,
    canonicalPath: `/${category.slug}`,
    keywords: category.keywords,
    jsonLd: {
      ...siteJsonLd(),
      "@type": "Store",
      name: `L&M Enterprises - ${category.title}`,
      description: category.description,
      url: `${siteUrl}/${category.slug}`,
    },
    content: layout(hero, body),
  });
}

function blogPage() {
  const hero = `
    <section class="hero hero-small">
      <div class="wrap">
        <p class="eyebrow">Updates</p>
        <h1>Store updates and local information</h1>
        <p class="lede">A simple updates page for local announcements, category highlights, and store information.</p>
      </div>
    </section>`;

  const body = `
    <main>
      <section class="section">
        <div class="wrap">
          <article class="card single-card">
            <p class="card-kicker">Now Live</p>
            <h2>Our category pages are focused on local search.</h2>
            <p>
              The current website highlights the categories customers search for most often around Deseronto and nearby communities, while keeping the site informational rather than transactional.
            </p>
          </article>
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
    content: layout(hero, body),
  });
}

function notFoundPage() {
  return pageTemplate({
    title: "Page Not Found | L&M Enterprises",
    description: "The page you requested could not be found.",
    canonicalPath: "/404",
    jsonLd: siteJsonLd(),
    content: layout(
      `
      <section class="hero hero-small">
        <div class="wrap">
          <p class="eyebrow">404</p>
          <h1>Page not found</h1>
          <p class="lede">The page you are looking for is not here, but the main category pages are still available.</p>
        </div>
      </section>`,
      `
      <main>
        <section class="section">
          <div class="wrap">
            <a class="button" href="/">Back to homepage</a>
          </div>
        </section>
      </main>`,
    ),
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

app.get(/^\/(admin|api)(\/|$)/, (_req, res) => {
  res.status(404).send("Not found");
});

app.get("/files", (_req, res) => {
  res.redirect(301, "/");
});

app.get("/", (_req, res) => {
  res.send(homePage());
});

app.get("/blog", (_req, res) => {
  res.send(blogPage());
});

for (const category of categories) {
  app.get(`/${category.slug}`, (_req, res) => {
    res.send(categoryPage(category));
  });
}

app.use(express.static(publicDir, { maxAge: "7d" }));

app.use((_req, res) => {
  res.status(404).send(notFoundPage());
});

app.listen(port, () => {
  console.log(`L&M Enterprises Railway server listening on ${port}`);
});
