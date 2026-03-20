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
  createResetToken,
  verifyResetToken,
  consumeResetToken,
  findUserByEmail,
  checkLoginRateLimit,
  checkResetRateLimit,
} = require("./auth");
const {
  adminLayout,
  loginPage,
  registerPage,
  forgotPasswordPage,
  resetPasswordPage,
  csrfField,
  escapeHtml,
  staffListPage,
  staffFormPage,
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
  if (!checkLoginRateLimit(req.ip)) {
    return res.send(loginPage("Too many login attempts. Please wait 15 minutes and try again."));
  }
  const { username, password } = req.body;
  const user = await verifyLogin(username, password);
  if (!user) {
    appendAuditLog({ req: { session: { username: username || "unknown", userId: "failed" }, ip: req.ip, connection: req.connection }, actionType: "login-failed", entityType: "staff", entityId: username || "unknown" });
    return res.send(loginPage("Invalid username or password."));
  }
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

// ── Register ──
router.get("/register", (req, res) => {
  if (getSession(req)) return res.redirect("/admin");
  res.send(registerPage());
});

router.post("/register", async (req, res) => {
  const { username, email, displayName, password, confirmPassword } = req.body;
  if (!username || !email || !displayName || !password) {
    return res.send(registerPage("All fields are required."));
  }
  if (password.length < 8) {
    return res.send(registerPage("Password must be at least 8 characters."));
  }
  if (password !== confirmPassword) {
    return res.send(registerPage("Passwords do not match."));
  }
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.send(registerPage("Please enter a valid email address."));
  }
  try {
    const user = createUser({ username, email, displayName, password, role: "staff" });
    // Set inactive — requires owner approval to activate
    const users = readJSON("admin-users.json", []);
    const u = users.find((u) => u.id === user.id);
    if (u) { u.isActive = false; writeJSON("admin-users.json", users); }
    appendAuditLog({ req: { session: { username, userId: "self-register" }, ip: req.ip, connection: req.connection }, actionType: "register", entityType: "staff", entityId: username });
    res.send(registerPage("", "Account created! An administrator must approve your account before you can sign in."));
  } catch (err) {
    res.send(registerPage(err.message || "Registration failed."));
  }
});

// ── Forgot Password ──
router.get("/forgot-password", (req, res) => {
  res.send(forgotPasswordPage());
});

router.post("/forgot-password", async (req, res) => {
  if (!checkResetRateLimit(req.ip)) {
    return res.send(forgotPasswordPage("Too many reset requests. Please wait and try again later."));
  }
  const { email } = req.body;
  if (!email) return res.send(forgotPasswordPage("Please enter your email address."));

  const user = findUserByEmail(email);
  // Always show success to prevent email enumeration
  const successMsg = "If an account with that email exists, a reset link has been sent.";

  if (!user) return res.send(forgotPasswordPage("", successMsg));

  if (!process.env.RESEND_API_KEY) {
    console.error("RESEND_API_KEY not configured — cannot send password reset email");
    return res.send(forgotPasswordPage("Password reset is temporarily unavailable. Please contact the site owner."));
  }

  const token = createResetToken(user.id);
  const host = req.headers.host || "lnmenterprises.ca";
  const protocol = req.headers["x-forwarded-proto"] || (host.includes("localhost") ? "http" : "https");
  const resetUrl = `${protocol}://${host}/admin/reset-password?token=${token}`;

  // Send email via Resend
  let emailSent = false;
  try {
    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM || "L&M Enterprises <onboarding@resend.dev>",
        to: [email],
        subject: "Password Reset - L&M Enterprises Admin",
        html: `
          <div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:20px;">
            <h2 style="color:#1e293b;">Password Reset</h2>
            <p>Hi ${escapeHtml(user.displayName)},</p>
            <p>We received a request to reset your password for the L&amp;M Enterprises admin dashboard.</p>
            <p><a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#dc2626;color:#fff;text-decoration:none;border-radius:6px;font-weight:600;">Reset Password</a></p>
            <p style="color:#6b7280;font-size:14px;">This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>
            <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0;" />
            <p style="color:#9ca3af;font-size:12px;">L&amp;M Enterprises &bull; 43 Dundas St, Deseronto, ON</p>
          </div>`,
      }),
    });
    if (resp.ok) {
      emailSent = true;
    } else {
      console.error("Resend error:", await resp.text());
    }
  } catch (err) {
    console.error("Failed to send reset email:", err);
  }

  appendAuditLog({ req: { session: { username: user.username, userId: user.id }, ip: req.ip, connection: req.connection }, actionType: "password-reset-request", entityType: "staff", entityId: user.id });

  if (!emailSent) {
    return res.send(forgotPasswordPage("There was a problem sending the reset email. Please try again or contact the site owner."));
  }
  res.send(forgotPasswordPage("", successMsg));
});

// ── Reset Password (via token) ──
router.get("/reset-password", (req, res) => {
  const { token } = req.query;
  if (!token || !verifyResetToken(token)) {
    return res.send(forgotPasswordPage("Invalid or expired reset link. Please request a new one."));
  }
  res.send(resetPasswordPage(token));
});

router.post("/reset-password", async (req, res) => {
  const { token, password, confirmPassword } = req.body;
  if (!token) return res.send(forgotPasswordPage("Invalid reset request."));

  if (!password || password.length < 8) {
    return res.send(resetPasswordPage(token, "Password must be at least 8 characters."));
  }
  if (password !== confirmPassword) {
    return res.send(resetPasswordPage(token, "Passwords do not match."));
  }

  const userId = consumeResetToken(token);
  if (!userId) {
    return res.send(forgotPasswordPage("Reset link has expired. Please request a new one."));
  }

  changeUserPassword(userId, password);
  appendAuditLog({ req: { session: { username: "system", userId }, ip: req.ip, connection: req.connection }, actionType: "password-reset", entityType: "staff", entityId: userId });
  res.send(loginPage("", "Password reset successfully! You can now sign in."));
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
  const reviewData = readJSON("google-reviews.json", null);
  const recentAudit = readJSON("audit-log.json", []).slice(-5).reverse();
  const flash = req.query.saved === "1" ? "Changes saved successfully." : "";

  const auditRows = recentAudit.length
    ? recentAudit.map((e) => `<tr><td style="white-space:nowrap;font-size:0.8rem;">${escapeHtml((e.timestamp || "").slice(0, 16).replace("T", " "))}</td><td>${escapeHtml(e.adminUsername)}</td><td>${escapeHtml(e.actionType)} ${escapeHtml(e.entityType)}</td></tr>`).join("")
    : `<tr><td colspan="3" style="color:var(--text-muted);">No recent activity</td></tr>`;

  res.send(
    adminLayout({
      title: "Staff Dashboard",
      activeNav: "dashboard",
      role: req.session.role,
      flash,
      content: `
        <p class="dash-subtitle">Update gas prices, promotions, and manage your site content.</p>

        <div class="dash-actions">
          <a href="/admin/gas-prices" class="dash-action-btn"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 22V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v17"/><path d="M15 22H3"/><path d="M15 10h2a2 2 0 0 1 2 2v2a2 2 0 0 0 2 2 2 2 0 0 0 2-2V9.83a2 2 0 0 0-.59-1.42L18 5"/><path d="M7 10h4"/></svg> Gas Prices</a>
          <a href="/admin/promotions" class="dash-action-btn"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13"/><path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/></svg> Promotions</a>
          <a href="/admin/winners" class="dash-action-btn"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg> Winners</a>
          <a href="/admin/blog" class="dash-action-btn"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.855z"/></svg> Blog</a>
          <a href="/admin/reviews" class="dash-action-btn"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> Reviews</a>
          <a href="/admin/messages" class="dash-action-btn">${unread > 0 ? `<span class="dash-badge">${unread}</span>` : ""}<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg> Messages</a>
          ${req.session.role === "owner" ? `<a href="/admin/staff" class="dash-action-btn"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> Staff</a>
          <a href="/admin/audit-log" class="dash-action-btn"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg> Audit Log</a>` : ""}
        </div>

        <div class="dash-grid">
          <div class="dash-card">
            <div class="dash-card-header">
              <div class="dash-card-icon dash-card-icon--red"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 22V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v17"/><path d="M15 22H3"/><path d="M15 10h2a2 2 0 0 1 2 2v2a2 2 0 0 0 2 2 2 2 0 0 0 2-2V9.83a2 2 0 0 0-.59-1.42L18 5"/><path d="M7 10h4"/></svg></div>
              <div>
                <h3>Gas Prices</h3>
                <p>Update daily gas prices (&cent;/L)</p>
              </div>
            </div>
            <form method="POST" action="/admin/gas-prices" class="dash-card-body">
              ${csrfField(req.session.csrf)}
              <input type="hidden" name="_return" value="dashboard" />
              <div class="dash-form-grid">
                <div class="form-group"><label>Regular</label><input type="text" name="regular" value="${escapeHtml(gasPrices.regular || "0.00")}" pattern="[0-9]*\\.?[0-9]*" /></div>
                <div class="form-group"><label>Premium</label><input type="text" name="premium" value="${escapeHtml(gasPrices.premium || "0.00")}" pattern="[0-9]*\\.?[0-9]*" /></div>
                <div class="form-group"><label>Dyed Diesel</label><input type="text" name="dyedDiesel" value="${escapeHtml(gasPrices.dyedDiesel || "0.00")}" pattern="[0-9]*\\.?[0-9]*" /></div>
                <div class="form-group"><label>Clear Diesel</label><input type="text" name="diesel" value="${escapeHtml(gasPrices.diesel || "0.00")}" pattern="[0-9]*\\.?[0-9]*" /></div>
              </div>
              <div class="form-group"><label>Updated Label</label><input type="text" name="updatedLabel" value="${escapeHtml(gasPrices.updatedLabel || "")}" placeholder="e.g. Updated today at 8:00 AM" /></div>
              <button type="submit" class="btn-action" style="background:var(--accent);">Save Gas Prices</button>
            </form>
          </div>

          <div class="dash-card">
            <div class="dash-card-header">
              <div class="dash-card-icon dash-card-icon--blue"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg></div>
              <div>
                <h3>Quick Add Winner</h3>
                <p>Add a new contest winner</p>
              </div>
            </div>
            <form method="POST" action="/admin/winners" class="dash-card-body">
              ${csrfField(req.session.csrf)}
              <div class="dash-form-grid">
                <div class="form-group"><label>Winner Name</label><input type="text" name="name" required placeholder="Full name" /></div>
                <div class="form-group"><label>Prize</label><input type="text" name="prize" required placeholder="e.g. $1000 Free Gas" /></div>
              </div>
              <div class="dash-form-grid">
                <div class="form-group"><label>Date</label><input type="date" name="date" value="${new Date().toISOString().slice(0, 10)}" /></div>
                <div class="form-group"><label>Testimonial (optional)</label><input type="text" name="testimonial" placeholder="Short quote" /></div>
              </div>
              <button type="submit" class="btn-action" style="background:#1e40af;">Add Winner</button>
            </form>
          </div>
        </div>

        <div class="dash-grid" style="margin-top:1.5rem;">
          <div class="dash-card">
            <div class="dash-card-header">
              <h3>Overview</h3>
            </div>
            <div class="dash-card-body">
              <div class="stats-grid" style="grid-template-columns:repeat(3,1fr);">
                <div class="stat-card">
                  <div class="stat-number">${posts.filter(p => p.published).length}</div>
                  <div class="stat-label">Published Posts</div>
                  <a href="/admin/blog">Manage</a>
                </div>
                <div class="stat-card">
                  <div class="stat-number">${unread}</div>
                  <div class="stat-label">Unread Messages</div>
                  <a href="/admin/messages">View</a>
                </div>
                <div class="stat-card">
                  <div class="stat-number">${activePromos}</div>
                  <div class="stat-label">Active Promos</div>
                  <a href="/admin/promotions">Manage</a>
                </div>
              </div>
              <div class="stats-grid" style="grid-template-columns:repeat(3,1fr);margin-top:1rem;">
                <div class="stat-card">
                  <div class="stat-number">${winners.length}</div>
                  <div class="stat-label">Winners</div>
                  <a href="/admin/winners">View</a>
                </div>
                <div class="stat-card">
                  <div class="stat-number">${reviewData && reviewData.rating ? reviewData.rating : "—"}</div>
                  <div class="stat-label">Google Rating</div>
                  <a href="/admin/reviews">Reviews</a>
                </div>
                <div class="stat-card">
                  <div class="stat-number">${readJSON("categories.json", []).length || 6}</div>
                  <div class="stat-label">Categories</div>
                  <a href="/admin/categories">Edit</a>
                </div>
              </div>
            </div>
          </div>

          <div class="dash-card">
            <div class="dash-card-header">
              <h3>Recent Activity</h3>
            </div>
            <div class="dash-card-body">
              <table class="admin-table" style="margin-top:0;">
                <thead><tr><th>Time</th><th>User</th><th>Action</th></tr></thead>
                <tbody>${auditRows}</tbody>
              </table>
            </div>
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
    { key: "premium", label: "Premium" },
    { key: "dyedDiesel", label: "Dyed Diesel" },
    { key: "diesel", label: "Clear Diesel" },
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
    dyedDiesel: req.body.dyedDiesel || "0.00",
    premium: req.body.premium || "0.00",
    diesel: req.body.diesel || "0.00",
    updatedLabel: req.body.updatedLabel || "",
    lastUpdatedAt: new Date().toISOString(),
  };
  writeJSON("gas-prices.json", newPrices);
  appendAuditLog({ req, actionType: "update", entityType: "gas-prices", oldValue: oldPrices, newValue: newPrices });
  const returnTo = req.body._return === "dashboard" ? "/admin?saved=1" : "/admin/gas-prices?saved=1";
  res.redirect(returnTo);
});

// ── Promotions ──
router.get("/promotions", (req, res) => {
  const promotions = readJSON("promotions.json", []);
  const flash = req.query.saved === "1" ? "Promotion saved." : req.query.deleted === "1" ? "Promotion deleted." : "";
  res.send(promotionsListPage({ promotions, csrf: req.session.csrf, role: req.session.role, flash }));
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
  res.send(winnersListPage({ winners, csrf: req.session.csrf, role: req.session.role, flash }));
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
  res.send(reviewsPage({ reviewData, csrf: req.session.csrf, role: req.session.role, flash }));
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
