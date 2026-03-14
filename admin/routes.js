const express = require("express");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const { readJSON, writeJSON } = require("./data");
const {
  verifyLogin,
  createSession,
  getSession,
  destroySession,
  setSessionCookie,
  clearSessionCookie,
  requireAuth,
  verifyCsrf,
} = require("./auth");
const { adminLayout, loginPage, csrfField, escapeHtml } = require("./templates");

const router = express.Router();

router.use(express.urlencoded({ extended: false, limit: "1mb" }));

// ── Login ──
router.get("/login", (req, res) => {
  if (getSession(req)) return res.redirect("/admin");
  res.send(loginPage());
});

router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const valid = await verifyLogin(username, password);
  if (!valid) return res.send(loginPage("Invalid username or password."));
  const sessionId = createSession(username);
  setSessionCookie(res, sessionId);
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

  res.send(
    adminLayout({
      title: "Dashboard",
      activeNav: "dashboard",
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
  const { businessName, phone, address, hours, hoursNote, promoBanner, facebookUrl } = req.body;
  writeJSON("site-content.json", { businessName, phone, address, hours, hoursNote, promoBanner, facebookUrl });
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
  const questions = Array.isArray(req.body.question) ? req.body.question : [req.body.question];
  const answers = Array.isArray(req.body.answer) ? req.body.answer : [req.body.answer];
  const faqs = questions.map((q, i) => ({ question: q, answer: answers[i] || "" })).filter((f) => f.question.trim());
  writeJSON("faqs.json", faqs);
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
  res.send(
    adminLayout({
      title: "New Blog Post",
      activeNav: "blog",
      content: `
        <form method="POST" action="/admin/blog">
          ${csrfField(req.session.csrf)}
          <div class="form-group"><label for="title">Title</label><input type="text" id="title" name="title" required /></div>
          <div class="form-group"><label for="content">Content</label><textarea id="content" name="content" rows="12"></textarea></div>
          <div class="form-group"><label><input type="checkbox" name="published" value="1" checked /> Published</label></div>
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
  posts.unshift({
    id: crypto.randomBytes(8).toString("hex"),
    title,
    slug,
    content: req.body.content || "",
    date: new Date().toISOString().slice(0, 10),
    published: req.body.published === "1",
  });
  writeJSON("blog-posts.json", posts);
  res.redirect("/admin/blog?saved=1");
});

router.get("/blog/:id", (req, res) => {
  const posts = readJSON("blog-posts.json", []);
  const post = posts.find((p) => p.id === req.params.id);
  if (!post) return res.status(404).send("Post not found");
  res.send(
    adminLayout({
      title: `Edit: ${post.title}`,
      activeNav: "blog",
      content: `
        <form method="POST" action="/admin/blog/${escapeHtml(post.id)}">
          ${csrfField(req.session.csrf)}
          <div class="form-group"><label for="title">Title</label><input type="text" id="title" name="title" value="${escapeHtml(post.title)}" required /></div>
          <div class="form-group"><label for="slug">Slug</label><input type="text" id="slug" name="slug" value="${escapeHtml(post.slug)}" /></div>
          <div class="form-group"><label for="content">Content</label><textarea id="content" name="content" rows="12">${escapeHtml(post.content)}</textarea></div>
          <div class="form-group"><label><input type="checkbox" name="published" value="1" ${post.published ? "checked" : ""} /> Published</label></div>
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
  posts[idx] = {
    ...posts[idx],
    title: req.body.title || posts[idx].title,
    slug: req.body.slug || posts[idx].slug,
    content: req.body.content || "",
    published: req.body.published === "1",
  };
  writeJSON("blog-posts.json", posts);
  res.redirect("/admin/blog?saved=1");
});

router.post("/blog/:id/delete", verifyCsrf, (req, res) => {
  let posts = readJSON("blog-posts.json", []);
  posts = posts.filter((p) => p.id !== req.params.id);
  writeJSON("blog-posts.json", posts);
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
  messages = messages.filter((m) => m.id !== req.params.id);
  writeJSON("contact-messages.json", messages);
  res.redirect("/admin/messages?deleted=1");
});

// ── Password ──
router.get("/password", (req, res) => {
  const flash = req.query.saved === "1" ? "Password changed successfully." : "";
  res.send(
    adminLayout({
      title: "Change Password",
      activeNav: "password",
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
  const creds = readJSON("credentials.json");
  if (!creds) return res.status(500).send("Credentials file missing");

  const valid = await bcrypt.compare(current, creds.passwordHash);
  if (!valid) {
    return res.send(
      adminLayout({
        title: "Change Password",
        activeNav: "password",
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
        flash: "Password must be at least 8 characters.",
        content: `<a href="/admin/password">Try again</a>`,
      }),
    );
  }
  creds.passwordHash = await bcrypt.hash(newpass, 10);
  writeJSON("credentials.json", creds);
  res.redirect("/admin/password?saved=1");
});

module.exports = router;
