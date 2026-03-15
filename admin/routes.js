const express = require("express");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const { readJSON, writeJSON, BLOG_CATEGORIES } = require("./data");
const {
  verifyLogin,
  createSession,
  getSession,
  destroySession,
  setSessionCookie,
  clearSessionCookie,
  requireAuth,
  requireRole,
  verifyCsrf,
  getAllUsers,
  findUserById,
  createUser,
  updateUser,
  deactivateUser,
  reactivateUser,
  changeUserPassword,
} = require("./auth");
const {
  adminLayout,
  loginPage,
  csrfField,
  escapeHtml,
  staffListPage,
  staffFormPage,
  gasPricesPage,
  promotionsListPage,
  promotionFormPage,
  winnersListPage,
  auditLogPage,
  reviewsPage,
} = require("./templates");
const { appendAuditLog } = require("./audit");
const { syncGoogleReviews } = require("./reviews");

const router = express.Router();

router.use(express.urlencoded({ extended: false, limit: "1mb" }));

// ── Login ──
router.get("/login", (req, res) => {
  if (getSession(req)) return res.redirect("/admin");
  res.send(loginPage());
});

router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const user = await verifyLogin(username, password);
  if (!user) return res.send(loginPage("Invalid username or password."));
  const sessionId = createSession(user);
  setSessionCookie(res, sessionId);
  appendAuditLog({ req: { session: { username: user.username, userId: user.id }, ip: req.ip, connection: req.connection }, actionType: "login", entityType: "staff", entityId: user.id });
  res.redirect("/admin");
});

router.get("/logout", (req, res) => {
  const session = getSession(req);
  if (session) destroySession(session.id);
  clearSessionCookie(res);
  res.redirect("/admin/login");
});

// ── All routes below require auth ──
router.use(requireAuth);

// ── Dashboard ──
router.get("/", (req, res) => {
  const posts = readJSON("blog-posts.json", []);
  const messages = readJSON("contact-messages.json", []);
  const unread = messages.filter((m) => !m.read).length;
  const gasPrices = readJSON("gas-prices.json", {});
  const promotions = readJSON("promotions.json", []);
  const activePromos = promotions.filter((p) => p.isActive).length;
  const winners = readJSON("winners.json", []);

  res.send(
    adminLayout({
      title: "Dashboard",
      activeNav: "dashboard",
      role: req.session.role,
      content: `
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-number">${posts.length}</div>
            <div class="stat-label">Blog Posts</div>
            <a href="/admin/blog">Manage</a>
          </div>
          <div class="stat-card">
            <div class="stat-number">${unread}</div>
            <div class="stat-label">Unread Messages</div>
            <a href="/admin/messages">View</a>
          </div>
          <div class="stat-card">
            <div class="stat-number">6</div>
            <div class="stat-label">Categories</div>
            <a href="/admin/categories">Edit</a>
          </div>
          <div class="stat-card">
            <div class="stat-number">${gasPrices.regular || "0.00"}</div>
            <div class="stat-label">Regular Gas</div>
            <a href="/admin/gas-prices">Update</a>
          </div>
          <div class="stat-card">
            <div class="stat-number">${activePromos}</div>
            <div class="stat-label">Active Promos</div>
            <a href="/admin/promotions">Manage</a>
          </div>
          <div class="stat-card">
            <div class="stat-number">${winners.length}</div>
            <div class="stat-label">Winners</div>
            <a href="/admin/winners">View</a>
          </div>
        </div>`,
    }),
  );
});

// ── Site Content ──
router.get("/content", (req, res) => {
  const content = readJSON("site-content.json", {});
  const flash = req.query.saved === "1" ? "Site content saved successfully." : "";
  res.send(
    adminLayout({
      title: "Site Content",
      activeNav: "content",
      role: req.session.role,
      flash,
      content: `
        <form method="POST" action="/admin/content">
          ${csrfField(req.session.csrf)}
          <div class="form-group">
            <label for="businessName">Business Name</label>
            <input type="text" id="businessName" name="businessName" value="${escapeHtml(content.businessName || "L&M Enterprises")}" />
          </div>
          <div class="form-group">
            <label for="phone">Phone</label>
            <input type="text" id="phone" name="phone" value="${escapeHtml(content.phone || "+1-613-396-2224")}" />
          </div>
          <div class="form-group">
            <label for="address">Address</label>
            <input type="text" id="address" name="address" value="${escapeHtml(content.address || "43 Dundas Street, Deseronto, ON K0K 1X0")}" />
          </div>
          <div class="form-group">
            <label for="hours">Hours</label>
            <input type="text" id="hours" name="hours" value="${escapeHtml(content.hours || "6:00 AM - 10:00 PM")}" />
          </div>
          <div class="form-group">
            <label for="hoursNote">Hours Note</label>
            <input type="text" id="hoursNote" name="hoursNote" value="${escapeHtml(content.hoursNote || "Open Daily")}" />
          </div>
          <div class="form-group">
            <label for="promoBanner">Promo Banner Text</label>
            <textarea id="promoBanner" name="promoBanner" rows="2">${escapeHtml(content.promoBanner || "Win $1000 in FREE GAS! Monthly contest with SAGO Gas Bar")}</textarea>
          </div>
          <div class="form-group">
            <label for="facebookUrl">Facebook URL</label>
            <input type="url" id="facebookUrl" name="facebookUrl" value="${escapeHtml(content.facebookUrl || "https://www.facebook.com/LandMEnterprises")}" />
          </div>
          <button type="submit">Save Changes</button>
        </form>`,
    }),
  );
});

router.post("/content", verifyCsrf, (req, res) => {
  const oldContent = readJSON("site-content.json", {});
  const { businessName, phone, address, hours, hoursNote, promoBanner, facebookUrl } = req.body;
  const newContent = { businessName, phone, address, hours, hoursNote, promoBanner, facebookUrl };
  writeJSON("site-content.json", newContent);
  appendAuditLog({ req, actionType: "update", entityType: "site-content", oldValue: oldContent, newValue: newContent });
  res.redirect("/admin/content?saved=1");
});

// ── Categories ──
router.get("/categories", (req, res) => {
  const cats = readJSON("categories.json", []);
  const flash = req.query.saved === "1" ? "Category saved successfully." : "";
  const rows = cats
    .map(
      (c) =>
        `<tr><td>${escapeHtml(c.nav)}</td><td>/${escapeHtml(c.slug)}</td><td><a href="/admin/categories/${escapeHtml(c.slug)}">Edit</a></td></tr>`,
    )
    .join("");
  res.send(
    adminLayout({
      title: "Categories",
      activeNav: "categories",
      role: req.session.role,
      flash,
      content: `
        <table class="admin-table">
          <thead><tr><th>Name</th><th>URL</th><th>Action</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>`,
    }),
  );
});

router.get("/categories/:slug", (req, res) => {
  const cats = readJSON("categories.json", []);
  const cat = cats.find((c) => c.slug === req.params.slug);
  if (!cat) return res.status(404).send("Category not found");
  res.send(
    adminLayout({
      title: `Edit: ${cat.nav}`,
      activeNav: "categories",
      role: req.session.role,
      content: `
        <form method="POST" action="/admin/categories/${escapeHtml(cat.slug)}">
          ${csrfField(req.session.csrf)}
          <div class="form-group"><label for="title">Title</label><input type="text" id="title" name="title" value="${escapeHtml(cat.title)}" /></div>
          <div class="form-group"><label for="nav">Nav Label</label><input type="text" id="nav" name="nav" value="${escapeHtml(cat.nav)}" /></div>
          <div class="form-group"><label for="searchTitle">Search Title</label><input type="text" id="searchTitle" name="searchTitle" value="${escapeHtml(cat.searchTitle)}" /></div>
          <div class="form-group"><label for="description">Description</label><textarea id="description" name="description" rows="3">${escapeHtml(cat.description)}</textarea></div>
          <div class="form-group"><label for="intro">Intro</label><textarea id="intro" name="intro" rows="3">${escapeHtml(cat.intro)}</textarea></div>
          <div class="form-group"><label for="localAngle">Local Angle</label><textarea id="localAngle" name="localAngle" rows="3">${escapeHtml(cat.localAngle)}</textarea></div>
          <div class="form-group"><label for="extraHeading">Extra Heading</label><input type="text" id="extraHeading" name="extraHeading" value="${escapeHtml(cat.extraHeading)}" /></div>
          <div class="form-group"><label for="extraCopy">Extra Copy</label><textarea id="extraCopy" name="extraCopy" rows="3">${escapeHtml(cat.extraCopy)}</textarea></div>
          <div class="form-group"><label for="details">Details (one per line)</label><textarea id="details" name="details" rows="4">${escapeHtml((cat.details || []).join("\n"))}</textarea></div>
          <div class="form-group"><label for="keywords">Keywords (comma-separated)</label><textarea id="keywords" name="keywords" rows="2">${escapeHtml((cat.keywords || []).join(", "))}</textarea></div>
          <button type="submit">Save Category</button>
          <a href="/admin/categories" class="btn-link">Cancel</a>
        </form>`,
    }),
  );
});

router.post("/categories/:slug", verifyCsrf, (req, res) => {
  const cats = readJSON("categories.json", []);
  const idx = cats.findIndex((c) => c.slug === req.params.slug);
  if (idx === -1) return res.status(404).send("Category not found");
  const oldCat = { ...cats[idx] };
  const b = req.body;
  cats[idx] = {
    ...cats[idx],
    title: b.title,
    nav: b.nav,
    searchTitle: b.searchTitle,
    description: b.description,
    intro: b.intro,
    localAngle: b.localAngle,
    extraHeading: b.extraHeading,
    extraCopy: b.extraCopy,
    details: (b.details || "").split("\n").map((s) => s.trim()).filter(Boolean),
    keywords: (b.keywords || "").split(",").map((s) => s.trim()).filter(Boolean),
  };
  writeJSON("categories.json", cats);
  appendAuditLog({ req, actionType: "update", entityType: "category", entityId: cats[idx].slug, oldValue: oldCat, newValue: cats[idx] });
  res.redirect("/admin/categories?saved=1");
});

// ── FAQs ──
router.get("/faqs", (req, res) => {
  const faqs = readJSON("faqs.json", []);
  const flash = req.query.saved === "1" ? "FAQs saved successfully." : "";
  const fields = faqs
    .map(
      (f, i) => `
        <fieldset class="faq-fieldset">
          <legend>FAQ ${i + 1}</legend>
          <div class="form-group"><label for="q${i}">Question</label><input type="text" id="q${i}" name="question" value="${escapeHtml(f.question)}" /></div>
          <div class="form-group"><label for="a${i}">Answer</label><textarea id="a${i}" name="answer" rows="3">${escapeHtml(f.answer)}</textarea></div>
        </fieldset>`,
    )
    .join("");
  res.send(
    adminLayout({
      title: "FAQs",
      activeNav: "faqs",
      role: req.session.role,
      flash,
      content: `
        <form method="POST" action="/admin/faqs">
          ${csrfField(req.session.csrf)}
          ${fields}
          <button type="submit">Save FAQs</button>
        </form>`,
    }),
  );
});

router.post("/faqs", verifyCsrf, (req, res) => {
  const oldFaqs = readJSON("faqs.json", []);
  const questions = Array.isArray(req.body.question) ? req.body.question : [req.body.question];
  const answers = Array.isArray(req.body.answer) ? req.body.answer : [req.body.answer];
  const faqs = questions.map((q, i) => ({ question: q, answer: answers[i] || "" })).filter((f) => f.question.trim());
  writeJSON("faqs.json", faqs);
  appendAuditLog({ req, actionType: "update", entityType: "faq", oldValue: oldFaqs, newValue: faqs });
  res.redirect("/admin/faqs?saved=1");
});

// ── Blog ──
router.get("/blog", (req, res) => {
  const posts = readJSON("blog-posts.json", []);
  const flash = req.query.saved === "1" ? "Blog post saved." : req.query.deleted === "1" ? "Blog post deleted." : "";
  const rows = posts
    .map(
      (p) =>
        `<tr><td>${escapeHtml(p.title)}</td><td>${p.published ? "Yes" : "Draft"}</td><td>${escapeHtml(p.date)}</td><td><a href="/admin/blog/${escapeHtml(p.id)}">Edit</a></td></tr>`,
    )
    .join("");
  res.send(
    adminLayout({
      title: "Blog Posts",
      activeNav: "blog",
      role: req.session.role,
      flash,
      content: `
        <a href="/admin/blog/new" class="btn-action">New Post</a>
        <table class="admin-table">
          <thead><tr><th>Title</th><th>Published</th><th>Date</th><th>Action</th></tr></thead>
          <tbody>${rows || "<tr><td colspan='4'>No posts yet.</td></tr>"}</tbody>
        </table>`,
    }),
  );
});

router.get("/blog/new", (req, res) => {
  const catOptions = BLOG_CATEGORIES.map((c) => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("");
  res.send(
    adminLayout({
      title: "New Blog Post",
      activeNav: "blog",
      role: req.session.role,
      content: `
        <form method="POST" action="/admin/blog">
          ${csrfField(req.session.csrf)}
          <div class="form-group"><label for="title">Title</label><input type="text" id="title" name="title" required /></div>
          <div class="form-group"><label for="excerpt">Excerpt</label><textarea id="excerpt" name="excerpt" rows="2" placeholder="Short summary for post cards and SEO"></textarea></div>
          <div class="form-group"><label for="category">Category</label><select id="category" name="category"><option value="">— Select —</option>${catOptions}</select></div>
          <div class="form-group"><label for="featuredImage">Featured Image URL</label><input type="url" id="featuredImage" name="featuredImage" placeholder="https://..." /></div>
          <div class="form-group"><label for="featuredImageAlt">Image Alt Text</label><input type="text" id="featuredImageAlt" name="featuredImageAlt" /></div>
          <div class="form-group"><label for="author">Author</label><input type="text" id="author" name="author" value="L&amp;M Enterprises" /></div>
          <div class="form-group"><label for="content">Content</label><textarea id="content" name="content" rows="12"></textarea></div>
          <div class="form-group"><label><input type="checkbox" name="published" value="1" checked /> Published</label></div>
          <details class="fr-fields" style="margin-top:1.5rem;border:1px solid var(--border,#d5d8db);border-radius:8px;padding:1rem;">
            <summary style="cursor:pointer;font-weight:600;">French Translation (Optional)</summary>
            <div class="form-group"><label for="titleFr">Titre (FR)</label><input type="text" id="titleFr" name="titleFr" /></div>
            <div class="form-group"><label for="excerptFr">Extrait (FR)</label><textarea id="excerptFr" name="excerptFr" rows="2"></textarea></div>
            <div class="form-group"><label for="contentFr">Contenu (FR)</label><textarea id="contentFr" name="contentFr" rows="8"></textarea></div>
          </details>
          <button type="submit">Create Post</button>
          <a href="/admin/blog" class="btn-link">Cancel</a>
        </form>`,
    }),
  );
});

router.post("/blog", verifyCsrf, (req, res) => {
  const posts = readJSON("blog-posts.json", []);
  const title = req.body.title || "Untitled";
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const newPost = {
    id: crypto.randomBytes(8).toString("hex"),
    title,
    slug,
    content: req.body.content || "",
    excerpt: req.body.excerpt || "",
    category: req.body.category || "",
    featuredImage: req.body.featuredImage || "",
    featuredImageAlt: req.body.featuredImageAlt || "",
    author: req.body.author || "L&M Enterprises",
    date: new Date().toISOString().slice(0, 10),
    published: req.body.published === "1",
    titleFr: req.body.titleFr || "",
    excerptFr: req.body.excerptFr || "",
    contentFr: req.body.contentFr || "",
  };
  posts.unshift(newPost);
  writeJSON("blog-posts.json", posts);
  appendAuditLog({ req, actionType: "create", entityType: "blog-post", entityId: newPost.id, newValue: { title: newPost.title, slug: newPost.slug } });
  res.redirect("/admin/blog?saved=1");
});

router.get("/blog/:id", (req, res) => {
  const posts = readJSON("blog-posts.json", []);
  const post = posts.find((p) => p.id === req.params.id);
  if (!post) return res.status(404).send("Post not found");
  const catOptions = BLOG_CATEGORIES.map((c) => `<option value="${escapeHtml(c)}" ${post.category === c ? "selected" : ""}>${escapeHtml(c)}</option>`).join("");
  res.send(
    adminLayout({
      title: `Edit: ${post.title}`,
      activeNav: "blog",
      role: req.session.role,
      content: `
        <form method="POST" action="/admin/blog/${escapeHtml(post.id)}">
          ${csrfField(req.session.csrf)}
          <div class="form-group"><label for="title">Title</label><input type="text" id="title" name="title" value="${escapeHtml(post.title)}" required /></div>
          <div class="form-group"><label for="slug">Slug</label><input type="text" id="slug" name="slug" value="${escapeHtml(post.slug)}" /></div>
          <div class="form-group"><label for="excerpt">Excerpt</label><textarea id="excerpt" name="excerpt" rows="2" placeholder="Short summary for post cards and SEO">${escapeHtml(post.excerpt || "")}</textarea></div>
          <div class="form-group"><label for="category">Category</label><select id="category" name="category"><option value="">— Select —</option>${catOptions}</select></div>
          <div class="form-group"><label for="featuredImage">Featured Image URL</label><input type="url" id="featuredImage" name="featuredImage" value="${escapeHtml(post.featuredImage || "")}" placeholder="https://..." /></div>
          <div class="form-group"><label for="featuredImageAlt">Image Alt Text</label><input type="text" id="featuredImageAlt" name="featuredImageAlt" value="${escapeHtml(post.featuredImageAlt || "")}" /></div>
          <div class="form-group"><label for="author">Author</label><input type="text" id="author" name="author" value="${escapeHtml(post.author || "L&M Enterprises")}" /></div>
          <div class="form-group"><label for="content">Content</label><textarea id="content" name="content" rows="12">${escapeHtml(post.content)}</textarea></div>
          <div class="form-group"><label><input type="checkbox" name="published" value="1" ${post.published ? "checked" : ""} /> Published</label></div>
          <details class="fr-fields" style="margin-top:1.5rem;border:1px solid var(--border,#d5d8db);border-radius:8px;padding:1rem;">
            <summary style="cursor:pointer;font-weight:600;">French Translation (Optional)</summary>
            <div class="form-group"><label for="titleFr">Titre (FR)</label><input type="text" id="titleFr" name="titleFr" value="${escapeHtml(post.titleFr || "")}" /></div>
            <div class="form-group"><label for="excerptFr">Extrait (FR)</label><textarea id="excerptFr" name="excerptFr" rows="2">${escapeHtml(post.excerptFr || "")}</textarea></div>
            <div class="form-group"><label for="contentFr">Contenu (FR)</label><textarea id="contentFr" name="contentFr" rows="8">${escapeHtml(post.contentFr || "")}</textarea></div>
          </details>
          <button type="submit">Save Post</button>
          <a href="/admin/blog" class="btn-link">Cancel</a>
        </form>
        <form method="POST" action="/admin/blog/${escapeHtml(post.id)}/delete" style="margin-top:2rem;">
          ${csrfField(req.session.csrf)}
          <button type="submit" class="btn-danger" onclick="return confirm('Delete this post?')">Delete Post</button>
        </form>`,
    }),
  );
});

router.post("/blog/:id", verifyCsrf, (req, res) => {
  const posts = readJSON("blog-posts.json", []);
  const idx = posts.findIndex((p) => p.id === req.params.id);
  if (idx === -1) return res.status(404).send("Post not found");
  const oldPost = { title: posts[idx].title, slug: posts[idx].slug };
  posts[idx] = {
    ...posts[idx],
    title: req.body.title || posts[idx].title,
    slug: req.body.slug || posts[idx].slug,
    content: req.body.content || "",
    excerpt: req.body.excerpt || "",
    category: req.body.category || "",
    featuredImage: req.body.featuredImage || "",
    featuredImageAlt: req.body.featuredImageAlt || "",
    author: req.body.author || "L&M Enterprises",
    published: req.body.published === "1",
    titleFr: req.body.titleFr || "",
    excerptFr: req.body.excerptFr || "",
    contentFr: req.body.contentFr || "",
  };
  writeJSON("blog-posts.json", posts);
  appendAuditLog({ req, actionType: "update", entityType: "blog-post", entityId: posts[idx].id, oldValue: oldPost, newValue: { title: posts[idx].title, slug: posts[idx].slug } });
  res.redirect("/admin/blog?saved=1");
});

router.post("/blog/:id/delete", verifyCsrf, (req, res) => {
  let posts = readJSON("blog-posts.json", []);
  const post = posts.find((p) => p.id === req.params.id);
  posts = posts.filter((p) => p.id !== req.params.id);
  writeJSON("blog-posts.json", posts);
  appendAuditLog({ req, actionType: "delete", entityType: "blog-post", entityId: req.params.id, oldValue: post ? { title: post.title } : null });
  res.redirect("/admin/blog?deleted=1");
});

// ── Messages ──
router.get("/messages", (req, res) => {
  const messages = readJSON("contact-messages.json", []);
  const flash = req.query.deleted === "1" ? "Message deleted." : "";
  const rows = messages
    .map(
      (m) =>
        `<tr class="${m.read ? "" : "unread"}"><td>${escapeHtml(m.date ? m.date.slice(0, 10) : "")}</td><td>${escapeHtml(m.name)}</td><td>${escapeHtml(m.subject || "(no subject)")}</td><td><a href="/admin/messages/${escapeHtml(m.id)}">View</a></td></tr>`,
    )
    .join("");
  res.send(
    adminLayout({
      title: "Messages",
      activeNav: "messages",
      role: req.session.role,
      flash,
      content: `
        <table class="admin-table">
          <thead><tr><th>Date</th><th>From</th><th>Subject</th><th>Action</th></tr></thead>
          <tbody>${rows || "<tr><td colspan='4'>No messages yet.</td></tr>"}</tbody>
        </table>`,
    }),
  );
});

router.get("/messages/:id", (req, res) => {
  const messages = readJSON("contact-messages.json", []);
  const msg = messages.find((m) => m.id === req.params.id);
  if (!msg) return res.status(404).send("Message not found");
  if (!msg.read) {
    msg.read = true;
    writeJSON("contact-messages.json", messages);
  }
  res.send(
    adminLayout({
      title: "Message",
      activeNav: "messages",
      role: req.session.role,
      content: `
        <div class="message-detail">
          <p><strong>From:</strong> ${escapeHtml(msg.name)} &lt;${escapeHtml(msg.email)}&gt;</p>
          <p><strong>Phone:</strong> ${escapeHtml(msg.phone || "N/A")}</p>
          <p><strong>Subject:</strong> ${escapeHtml(msg.subject || "(no subject)")}</p>
          <p><strong>Date:</strong> ${escapeHtml(msg.date || "")}</p>
          <hr />
          <div class="message-body">${escapeHtml(msg.message).replace(/\n/g, "<br>")}</div>
        </div>
        <div style="margin-top:2rem;display:flex;gap:1rem;">
          <a href="/admin/messages" class="btn-link">Back</a>
          <form method="POST" action="/admin/messages/${escapeHtml(msg.id)}/delete">
            ${csrfField(req.session.csrf)}
            <button type="submit" class="btn-danger" onclick="return confirm('Delete this message?')">Delete</button>
          </form>
        </div>`,
    }),
  );
});

router.post("/messages/:id/delete", verifyCsrf, (req, res) => {
  let messages = readJSON("contact-messages.json", []);
  const msg = messages.find((m) => m.id === req.params.id);
  messages = messages.filter((m) => m.id !== req.params.id);
  writeJSON("contact-messages.json", messages);
  appendAuditLog({ req, actionType: "delete", entityType: "message", entityId: req.params.id, oldValue: msg ? { name: msg.name, subject: msg.subject } : null });
  res.redirect("/admin/messages?deleted=1");
});

// ── Password ──
router.get("/password", (req, res) => {
  const flash = req.query.saved === "1" ? "Password changed successfully." : "";
  res.send(
    adminLayout({
      title: "Change Password",
      activeNav: "password",
      role: req.session.role,
      flash,
      content: `
        <form method="POST" action="/admin/password">
          ${csrfField(req.session.csrf)}
          <div class="form-group"><label for="current">Current Password</label><input type="password" id="current" name="current" required /></div>
          <div class="form-group"><label for="newpass">New Password (min 8 characters)</label><input type="password" id="newpass" name="newpass" required minlength="8" /></div>
          <div class="form-group"><label for="confirm">Confirm New Password</label><input type="password" id="confirm" name="confirm" required minlength="8" /></div>
          <button type="submit">Change Password</button>
        </form>`,
    }),
  );
});

router.post("/password", verifyCsrf, async (req, res) => {
  const { current, newpass, confirm } = req.body;
  const user = findUserById(req.session.userId);
  if (!user) return res.status(500).send("User not found");

  const valid = await bcrypt.compare(current, user.passwordHash);
  if (!valid) {
    return res.send(
      adminLayout({
        title: "Change Password",
        activeNav: "password",
        role: req.session.role,
        flash: "Current password is incorrect.",
        content: `<a href="/admin/password">Try again</a>`,
      }),
    );
  }
  if (newpass !== confirm) {
    return res.send(
      adminLayout({
        title: "Change Password",
        activeNav: "password",
        role: req.session.role,
        flash: "New passwords do not match.",
        content: `<a href="/admin/password">Try again</a>`,
      }),
    );
  }
  if (newpass.length < 8) {
    return res.send(
      adminLayout({
        title: "Change Password",
        activeNav: "password",
        role: req.session.role,
        flash: "Password must be at least 8 characters.",
        content: `<a href="/admin/password">Try again</a>`,
      }),
    );
  }
  changeUserPassword(user.id, newpass);
  appendAuditLog({ req, actionType: "password-change", entityType: "staff", entityId: user.id });
  res.redirect("/admin/password?saved=1");
});

// ── Staff Management (owner only) ──
router.get("/staff", requireRole("owner"), (req, res) => {
  const users = getAllUsers();
  res.send(staffListPage({ users, csrf: req.session.csrf, role: req.session.role }));
});

router.get("/staff/new", requireRole("owner"), (req, res) => {
  res.send(staffFormPage({ user: {}, csrf: req.session.csrf, isNew: true, role: req.session.role }));
});

router.post("/staff", requireRole("owner"), verifyCsrf, (req, res) => {
  const { username, displayName, email, role, password } = req.body;
  if (!username || !password || password.length < 8) {
    return res.send(
      adminLayout({
        title: "New Staff Member",
        activeNav: "staff",
        role: req.session.role,
        flash: "Username and password (min 8 chars) are required.",
        content: `<a href="/admin/staff/new">Try again</a>`,
      }),
    );
  }
  try {
    const newUser = createUser({ username, displayName, email, password, role: role || "staff" });
    appendAuditLog({ req, actionType: "create", entityType: "staff", entityId: newUser.id, newValue: { username: newUser.username, role: newUser.role } });
    res.redirect("/admin/staff");
  } catch (err) {
    return res.send(
      adminLayout({
        title: "New Staff Member",
        activeNav: "staff",
        role: req.session.role,
        flash: err.message,
        content: `<a href="/admin/staff/new">Try again</a>`,
      }),
    );
  }
});

router.get("/staff/:id", requireRole("owner"), (req, res) => {
  const user = findUserById(req.params.id);
  if (!user) return res.status(404).send("User not found");
  res.send(staffFormPage({ user, csrf: req.session.csrf, isNew: false, role: req.session.role }));
});

router.post("/staff/:id", requireRole("owner"), verifyCsrf, (req, res) => {
  const { displayName, email, role } = req.body;
  const oldUser = findUserById(req.params.id);
  const updated = updateUser(req.params.id, { displayName, email, role });
  if (!updated) return res.status(404).send("User not found");
  appendAuditLog({ req, actionType: "update", entityType: "staff", entityId: req.params.id, oldValue: oldUser ? { displayName: oldUser.displayName, role: oldUser.role } : null, newValue: { displayName, role } });
  res.redirect("/admin/staff");
});

router.post("/staff/:id/toggle-active", requireRole("owner"), verifyCsrf, (req, res) => {
  const user = findUserById(req.params.id);
  if (!user) return res.status(404).send("User not found");
  if (user.id === req.session.userId) {
    return res.send(
      adminLayout({
        title: "Staff Management",
        activeNav: "staff",
        role: req.session.role,
        flash: "You cannot deactivate your own account.",
        content: `<a href="/admin/staff">Go back</a>`,
      }),
    );
  }
  if (user.isActive) {
    deactivateUser(user.id);
    appendAuditLog({ req, actionType: "update", entityType: "staff", entityId: user.id, newValue: { isActive: false } });
  } else {
    reactivateUser(user.id);
    appendAuditLog({ req, actionType: "update", entityType: "staff", entityId: user.id, newValue: { isActive: true } });
  }
  res.redirect("/admin/staff");
});

router.post("/staff/:id/reset-password", requireRole("owner"), verifyCsrf, (req, res) => {
  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 8) {
    return res.send(
      adminLayout({
        title: "Staff Management",
        activeNav: "staff",
        role: req.session.role,
        flash: "Password must be at least 8 characters.",
        content: `<a href="/admin/staff/${escapeHtml(req.params.id)}">Go back</a>`,
      }),
    );
  }
  const result = changeUserPassword(req.params.id, newPassword);
  if (!result) return res.status(404).send("User not found");
  appendAuditLog({ req, actionType: "password-change", entityType: "staff", entityId: req.params.id });
  res.redirect("/admin/staff");
});

// ── Gas Prices ──
router.get("/gas-prices", (req, res) => {
  const gasPrices = readJSON("gas-prices.json", {});
  const flash = req.query.saved === "1" ? "Gas prices updated successfully." : "";
  const types = [
    { key: "regular", label: "Regular" },
    { key: "midGrade", label: "Mid-Grade" },
    { key: "premium", label: "Premium" },
    { key: "diesel", label: "Diesel" },
  ];
  const fields = types
    .map(
      (t) => `
      <div class="form-group">
        <label for="${t.key}">${escapeHtml(t.label)} (cents/litre)</label>
        <input type="text" id="${t.key}" name="${t.key}" value="${escapeHtml(gasPrices[t.key] || "0.00")}" pattern="[0-9]*\\.?[0-9]*" />
      </div>`,
    )
    .join("");

  res.send(
    adminLayout({
      title: "Gas Prices",
      activeNav: "gas-prices",
      role: req.session.role,
      flash,
      content: `
        <p>Set current fuel prices. These are displayed on the public site. Set to 0.00 to hide a fuel type.</p>
        <form method="POST" action="/admin/gas-prices">
          ${csrfField(req.session.csrf)}
          ${fields}
          <div class="form-group">
            <label for="updatedLabel">Last Updated Label</label>
            <input type="text" id="updatedLabel" name="updatedLabel" value="${escapeHtml(gasPrices.updatedLabel || "")}" placeholder="e.g. Updated today at 8:00 AM" />
          </div>
          <button type="submit">Save Gas Prices</button>
        </form>`,
    }),
  );
});

router.post("/gas-prices", verifyCsrf, (req, res) => {
  const oldPrices = readJSON("gas-prices.json", {});
  const newPrices = {
    regular: req.body.regular || "0.00",
    midGrade: req.body.midGrade || "0.00",
    premium: req.body.premium || "0.00",
    diesel: req.body.diesel || "0.00",
    updatedLabel: req.body.updatedLabel || "",
    lastUpdatedAt: new Date().toISOString(),
  };
  writeJSON("gas-prices.json", newPrices);
  appendAuditLog({ req, actionType: "update", entityType: "gas-prices", oldValue: oldPrices, newValue: newPrices });
  res.redirect("/admin/gas-prices?saved=1");
});

// ── Promotions ──
router.get("/promotions", (req, res) => {
  const promotions = readJSON("promotions.json", []);
  const flash = req.query.saved === "1" ? "Promotion saved." : req.query.deleted === "1" ? "Promotion deleted." : "";
  res.send(promotionsListPage({ promotions, csrf: req.session.csrf, role: req.session.role }));
});

router.get("/promotions/new", (req, res) => {
  res.send(promotionFormPage({ promotion: null, csrf: req.session.csrf, isNew: true, role: req.session.role }));
});

router.post("/promotions", verifyCsrf, (req, res) => {
  const promotions = readJSON("promotions.json", []);
  const newPromo = {
    id: crypto.randomBytes(8).toString("hex"),
    title: req.body.title || "Untitled Promotion",
    description: req.body.description || "",
    details: req.body.details || "",
    startDate: req.body.startDate || "",
    endDate: req.body.endDate || "",
    isActive: req.body.isActive === "1",
    createdAt: new Date().toISOString(),
  };
  promotions.unshift(newPromo);
  writeJSON("promotions.json", promotions);
  appendAuditLog({ req, actionType: "create", entityType: "promotion", entityId: newPromo.id, newValue: { title: newPromo.title } });
  res.redirect("/admin/promotions?saved=1");
});

router.get("/promotions/:id", (req, res) => {
  const promotions = readJSON("promotions.json", []);
  const promo = promotions.find((p) => p.id === req.params.id);
  if (!promo) return res.status(404).send("Promotion not found");
  res.send(promotionFormPage({ promotion: promo, csrf: req.session.csrf, isNew: false, role: req.session.role }));
});

router.post("/promotions/:id", verifyCsrf, (req, res) => {
  const promotions = readJSON("promotions.json", []);
  const idx = promotions.findIndex((p) => p.id === req.params.id);
  if (idx === -1) return res.status(404).send("Promotion not found");
  const oldPromo = { title: promotions[idx].title };
  promotions[idx] = {
    ...promotions[idx],
    title: req.body.title || promotions[idx].title,
    description: req.body.description || "",
    details: req.body.details || "",
    startDate: req.body.startDate || "",
    endDate: req.body.endDate || "",
    isActive: req.body.isActive === "1",
  };
  writeJSON("promotions.json", promotions);
  appendAuditLog({ req, actionType: "update", entityType: "promotion", entityId: req.params.id, oldValue: oldPromo, newValue: { title: promotions[idx].title } });
  res.redirect("/admin/promotions?saved=1");
});

router.post("/promotions/:id/delete", verifyCsrf, (req, res) => {
  let promotions = readJSON("promotions.json", []);
  const promo = promotions.find((p) => p.id === req.params.id);
  promotions = promotions.filter((p) => p.id !== req.params.id);
  writeJSON("promotions.json", promotions);
  appendAuditLog({ req, actionType: "delete", entityType: "promotion", entityId: req.params.id, oldValue: promo ? { title: promo.title } : null });
  res.redirect("/admin/promotions?deleted=1");
});

// ── Winners ──
router.get("/winners", (req, res) => {
  const winners = readJSON("winners.json", []);
  const flash = req.query.saved === "1" ? "Winner added." : req.query.deleted === "1" ? "Winner removed." : "";
  res.send(winnersListPage({ winners, csrf: req.session.csrf, role: req.session.role }));
});

router.post("/winners", verifyCsrf, (req, res) => {
  const winners = readJSON("winners.json", []);
  const newWinner = {
    id: crypto.randomBytes(8).toString("hex"),
    name: req.body.name || "Unknown",
    prize: req.body.prize || "",
    date: req.body.date || new Date().toISOString().slice(0, 10),
    testimonial: req.body.testimonial || "",
    createdAt: new Date().toISOString(),
  };
  winners.unshift(newWinner);
  writeJSON("winners.json", winners);
  appendAuditLog({ req, actionType: "create", entityType: "winner", entityId: newWinner.id, newValue: { name: newWinner.name, prize: newWinner.prize } });
  res.redirect("/admin/winners?saved=1");
});

router.post("/winners/:id/delete", verifyCsrf, (req, res) => {
  let winners = readJSON("winners.json", []);
  const winner = winners.find((w) => w.id === req.params.id);
  winners = winners.filter((w) => w.id !== req.params.id);
  writeJSON("winners.json", winners);
  appendAuditLog({ req, actionType: "delete", entityType: "winner", entityId: req.params.id, oldValue: winner ? { name: winner.name } : null });
  res.redirect("/admin/winners?deleted=1");
});

// ── Reviews ──
router.get("/reviews", (req, res) => {
  const reviewData = readJSON("google-reviews.json", null);
  const flash = req.query.synced === "1" ? "Reviews synced from Google." : req.query.error ? `Sync error: ${req.query.error}` : "";
  res.send(reviewsPage({ reviewData, csrf: req.session.csrf, role: req.session.role }));
});

router.post("/reviews/sync", verifyCsrf, async (req, res) => {
  try {
    await syncGoogleReviews();
    appendAuditLog({ req, actionType: "sync", entityType: "review" });
    res.redirect("/admin/reviews?synced=1");
  } catch (err) {
    res.redirect(`/admin/reviews?error=${encodeURIComponent(err.message)}`);
  }
});

// ── Audit Log ──
router.get("/audit-log", requireRole("owner"), (req, res) => {
  const entries = readJSON("audit-log.json", []);
  res.send(auditLogPage({ entries, role: req.session.role }));
});

module.exports = router;
