function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function adminLayout({ title, content, activeNav = "", flash = "", role = "staff" }) {
  const navItems = [
    { href: "/admin", label: "Dashboard", key: "dashboard", roles: ["owner", "staff"] },
    { href: "/admin/content", label: "Site Content", key: "content", roles: ["owner", "staff"] },
    { href: "/admin/categories", label: "Categories", key: "categories", roles: ["owner", "staff"] },
    { href: "/admin/faqs", label: "FAQs", key: "faqs", roles: ["owner", "staff"] },
    { href: "/admin/blog", label: "Blog", key: "blog", roles: ["owner", "staff"] },
    { href: "/admin/messages", label: "Messages", key: "messages", roles: ["owner", "staff"] },
    { href: "/admin/gas-prices", label: "Gas Prices", key: "gas-prices", roles: ["owner", "staff"] },
    { href: "/admin/promotions", label: "Promotions", key: "promotions", roles: ["owner", "staff"] },
    { href: "/admin/winners", label: "Winners", key: "winners", roles: ["owner", "staff"] },
    { href: "/admin/reviews", label: "Reviews", key: "reviews", roles: ["owner", "staff"] },
    { href: "/admin/staff", label: "Staff", key: "staff", roles: ["owner"] },
    { href: "/admin/audit-log", label: "Audit Log", key: "audit-log", roles: ["owner"] },
    { href: "/admin/password", label: "Password", key: "password", roles: ["owner", "staff"] },
  ];

  const nav = navItems
    .filter((item) => item.roles.includes(role))
    .map(
      (item) =>
        `<a href="${item.href}" class="admin-nav-link${activeNav === item.key ? " active" : ""}">${escapeHtml(item.label)}</a>`,
    )
    .join("");

  const flashHtml = flash
    ? `<div class="admin-flash">${escapeHtml(flash)}</div>`
    : "";

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="robots" content="noindex, nofollow" />
  <title>${escapeHtml(title)} | Admin</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="/admin.css" />
</head>
<body>
  <div class="admin-shell">
    <aside class="admin-sidebar">
      <div class="admin-brand">
        <strong>L&amp;M Admin</strong>
      </div>
      <nav class="admin-nav">${nav}</nav>
      <div class="admin-sidebar-footer">
        <a href="/" target="_blank">View Site</a>
        <a href="/admin/logout">Logout</a>
      </div>
    </aside>
    <main class="admin-main">
      <header class="admin-header">
        <h1>${escapeHtml(title)}</h1>
      </header>
      ${flashHtml}
      <div class="admin-content">
        ${content}
      </div>
    </main>
  </div>
</body>
</html>`;
}

function loginPage(error = "") {
  const errorHtml = error
    ? `<div class="admin-error">${escapeHtml(error)}</div>`
    : "";

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="robots" content="noindex, nofollow" />
  <title>Admin Login | L&amp;M Enterprises</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="/admin.css" />
</head>
<body class="login-body">
  <div class="login-card">
    <h1>L&amp;M Admin</h1>
    <p class="login-subtitle">Sign in to manage your site</p>
    ${errorHtml}
    <form method="POST" action="/admin/login">
      <label for="username">Username</label>
      <input type="text" id="username" name="username" required autocomplete="username" />
      <label for="password">Password</label>
      <input type="password" id="password" name="password" required autocomplete="current-password" />
      <button type="submit">Sign In</button>
    </form>
  </div>
</body>
</html>`;
}

function csrfField(token) {
  return `<input type="hidden" name="_csrf" value="${escapeHtml(token)}" />`;
}

/* ── Staff management templates ── */

function staffListPage({ users, csrf, role }) {
  const rows = users
    .map(
      (u) => `
      <tr>
        <td>${escapeHtml(u.displayName)}</td>
        <td>${escapeHtml(u.username)}</td>
        <td>${escapeHtml(u.email || "—")}</td>
        <td>${escapeHtml(u.role)}</td>
        <td>${u.isActive ? '<span style="color:green;">Active</span>' : '<span style="color:#999;">Inactive</span>'}</td>
        <td>${u.lastLoginAt ? escapeHtml(u.lastLoginAt.slice(0, 10)) : "Never"}</td>
        <td><a href="/admin/staff/${escapeHtml(u.id)}">Edit</a></td>
      </tr>`,
    )
    .join("");

  return adminLayout({
    title: "Staff Management",
    activeNav: "staff",
    role,
    content: `
      <a href="/admin/staff/new" class="btn-action">New Staff Member</a>
      <table class="admin-table">
        <thead><tr><th>Name</th><th>Username</th><th>Email</th><th>Role</th><th>Status</th><th>Last Login</th><th>Action</th></tr></thead>
        <tbody>${rows || "<tr><td colspan='7'>No staff members.</td></tr>"}</tbody>
      </table>`,
  });
}

function staffFormPage({ user, csrf, isNew, role }) {
  const roleOptions = ["staff", "owner"]
    .map((r) => `<option value="${r}" ${!isNew && user.role === r ? "selected" : ""}>${r}</option>`)
    .join("");

  const toggleHtml = !isNew
    ? `
      <form method="POST" action="/admin/staff/${escapeHtml(user.id)}/toggle-active" style="margin-top:2rem;">
        ${csrfField(csrf)}
        <button type="submit" class="btn-danger">${user.isActive ? "Deactivate User" : "Reactivate User"}</button>
      </form>
      <form method="POST" action="/admin/staff/${escapeHtml(user.id)}/reset-password" style="margin-top:1rem;">
        ${csrfField(csrf)}
        <div class="form-group">
          <label for="newPassword">Reset Password</label>
          <input type="password" id="newPassword" name="newPassword" minlength="8" placeholder="New password (min 8 chars)" required />
        </div>
        <button type="submit" class="btn-action">Reset Password</button>
      </form>`
    : "";

  return adminLayout({
    title: isNew ? "New Staff Member" : `Edit: ${user.displayName}`,
    activeNav: "staff",
    role,
    content: `
      <form method="POST" action="${isNew ? "/admin/staff" : `/admin/staff/${escapeHtml(user.id)}`}">
        ${csrfField(csrf)}
        <div class="form-group">
          <label for="username">Username</label>
          <input type="text" id="username" name="username" value="${escapeHtml(isNew ? "" : user.username)}" required ${!isNew ? "readonly" : ""} />
        </div>
        <div class="form-group">
          <label for="displayName">Display Name</label>
          <input type="text" id="displayName" name="displayName" value="${escapeHtml(isNew ? "" : user.displayName)}" required />
        </div>
        <div class="form-group">
          <label for="email">Email</label>
          <input type="email" id="email" name="email" value="${escapeHtml(isNew ? "" : (user.email || ""))}" />
        </div>
        <div class="form-group">
          <label for="role">Role</label>
          <select id="role" name="role">${roleOptions}</select>
        </div>
        ${isNew ? `<div class="form-group"><label for="password">Password (min 8 characters)</label><input type="password" id="password" name="password" required minlength="8" /></div>` : ""}
        <button type="submit">${isNew ? "Create Staff Member" : "Save Changes"}</button>
        <a href="/admin/staff" class="btn-link">Cancel</a>
      </form>
      ${toggleHtml}`,
  });
}

/* ── Gas Prices template ── */

function gasPricesPage({ gasPrices, csrf, role }) {
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

  return adminLayout({
    title: "Gas Prices",
    activeNav: "gas-prices",
    role,
    content: `
      <p>Set current fuel prices. These are displayed on the public site. Set to 0.00 to hide a fuel type.</p>
      <form method="POST" action="/admin/gas-prices">
        ${csrfField(csrf)}
        ${fields}
        <div class="form-group">
          <label for="updatedLabel">Last Updated Label</label>
          <input type="text" id="updatedLabel" name="updatedLabel" value="${escapeHtml(gasPrices.updatedLabel || "")}" placeholder="e.g. Updated today at 8:00 AM" />
        </div>
        <button type="submit">Save Gas Prices</button>
      </form>`,
  });
}

/* ── Promotions templates ── */

function promotionsListPage({ promotions, csrf, role }) {
  const rows = promotions
    .map(
      (p) => `
      <tr>
        <td>${escapeHtml(p.title)}</td>
        <td>${p.isActive ? '<span style="color:green;">Active</span>' : '<span style="color:#999;">Inactive</span>'}</td>
        <td>${escapeHtml(p.startDate || "—")}</td>
        <td>${escapeHtml(p.endDate || "—")}</td>
        <td><a href="/admin/promotions/${escapeHtml(p.id)}">Edit</a></td>
      </tr>`,
    )
    .join("");

  return adminLayout({
    title: "Promotions",
    activeNav: "promotions",
    role,
    content: `
      <a href="/admin/promotions/new" class="btn-action">New Promotion</a>
      <table class="admin-table">
        <thead><tr><th>Title</th><th>Status</th><th>Start</th><th>End</th><th>Action</th></tr></thead>
        <tbody>${rows || "<tr><td colspan='5'>No promotions yet.</td></tr>"}</tbody>
      </table>`,
  });
}

function promotionFormPage({ promotion, csrf, isNew, role }) {
  const p = promotion || { title: "", description: "", startDate: "", endDate: "", isActive: true, details: "" };

  return adminLayout({
    title: isNew ? "New Promotion" : `Edit: ${p.title}`,
    activeNav: "promotions",
    role,
    content: `
      <form method="POST" action="${isNew ? "/admin/promotions" : `/admin/promotions/${escapeHtml(p.id)}`}">
        ${csrfField(csrf)}
        <div class="form-group">
          <label for="title">Title</label>
          <input type="text" id="title" name="title" value="${escapeHtml(p.title)}" required />
        </div>
        <div class="form-group">
          <label for="description">Short Description</label>
          <textarea id="description" name="description" rows="3">${escapeHtml(p.description || "")}</textarea>
        </div>
        <div class="form-group">
          <label for="details">Details / Rules</label>
          <textarea id="details" name="details" rows="5">${escapeHtml(p.details || "")}</textarea>
        </div>
        <div class="form-group">
          <label for="startDate">Start Date</label>
          <input type="date" id="startDate" name="startDate" value="${escapeHtml(p.startDate || "")}" />
        </div>
        <div class="form-group">
          <label for="endDate">End Date</label>
          <input type="date" id="endDate" name="endDate" value="${escapeHtml(p.endDate || "")}" />
        </div>
        <div class="form-group">
          <label><input type="checkbox" name="isActive" value="1" ${p.isActive ? "checked" : ""} /> Active</label>
        </div>
        <button type="submit">${isNew ? "Create Promotion" : "Save Promotion"}</button>
        <a href="/admin/promotions" class="btn-link">Cancel</a>
      </form>
      ${!isNew ? `
      <form method="POST" action="/admin/promotions/${escapeHtml(p.id)}/delete" style="margin-top:2rem;">
        ${csrfField(csrf)}
        <button type="submit" class="btn-danger" onclick="return confirm('Delete this promotion?')">Delete Promotion</button>
      </form>` : ""}`,
  });
}

/* ── Winners templates ── */

function winnersListPage({ winners, csrf, role }) {
  const rows = winners
    .map(
      (w) => `
      <tr>
        <td>${escapeHtml(w.name)}</td>
        <td>${escapeHtml(w.prize)}</td>
        <td>${escapeHtml(w.date || "—")}</td>
        <td>
          <form method="POST" action="/admin/winners/${escapeHtml(w.id)}/delete" style="display:inline;">
            ${csrfField(csrf)}
            <button type="submit" class="btn-danger" onclick="return confirm('Remove this winner?')" style="padding:0.25rem 0.5rem;font-size:0.85rem;">Remove</button>
          </form>
        </td>
      </tr>`,
    )
    .join("");

  return adminLayout({
    title: "Contest Winners",
    activeNav: "winners",
    role,
    content: `
      <h3>Add Winner</h3>
      <form method="POST" action="/admin/winners" style="margin-bottom:2rem;">
        ${csrfField(csrf)}
        <div class="form-group">
          <label for="name">Winner Name</label>
          <input type="text" id="name" name="name" required />
        </div>
        <div class="form-group">
          <label for="prize">Prize</label>
          <input type="text" id="prize" name="prize" required placeholder="e.g. $1000 Free Gas" />
        </div>
        <div class="form-group">
          <label for="date">Date</label>
          <input type="date" id="date" name="date" />
        </div>
        <div class="form-group">
          <label for="testimonial">Testimonial (optional)</label>
          <textarea id="testimonial" name="testimonial" rows="2"></textarea>
        </div>
        <button type="submit">Add Winner</button>
      </form>
      <h3>Past Winners</h3>
      <table class="admin-table">
        <thead><tr><th>Name</th><th>Prize</th><th>Date</th><th>Action</th></tr></thead>
        <tbody>${rows || "<tr><td colspan='4'>No winners yet.</td></tr>"}</tbody>
      </table>`,
  });
}

/* ── Audit Log template ── */

function auditLogPage({ entries, role }) {
  const rows = entries
    .slice()
    .reverse()
    .map(
      (e) => `
      <tr>
        <td style="white-space:nowrap;">${escapeHtml(e.timestamp ? e.timestamp.slice(0, 19).replace("T", " ") : "")}</td>
        <td>${escapeHtml(e.adminUsername)}</td>
        <td>${escapeHtml(e.actionType)}</td>
        <td>${escapeHtml(e.entityType)}</td>
        <td>${escapeHtml(e.entityId || "—")}</td>
        <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(e.ipAddress || "—")}</td>
      </tr>`,
    )
    .join("");

  return adminLayout({
    title: "Audit Log",
    activeNav: "audit-log",
    role,
    content: `
      <p>Recent admin actions (last 500 entries, newest first).</p>
      <table class="admin-table">
        <thead><tr><th>Timestamp</th><th>User</th><th>Action</th><th>Entity</th><th>Entity ID</th><th>IP</th></tr></thead>
        <tbody>${rows || "<tr><td colspan='6'>No audit entries yet.</td></tr>"}</tbody>
      </table>`,
  });
}

/* ── Reviews template ── */

function reviewsPage({ reviewData, csrf, role }) {
  const hasData = reviewData && reviewData.reviews && reviewData.reviews.length > 0;

  const starsHtml = (rating) => {
    let s = "";
    for (let i = 1; i <= 5; i++) {
      s += i <= Math.round(rating) ? '<span style="color:#f59e0b;">&#9733;</span>' : '<span style="color:#d1d5db;">&#9734;</span>';
    }
    return s;
  };

  let reviewRows = "";
  if (hasData) {
    reviewRows = reviewData.reviews
      .map(
        (r) => `
        <tr>
          <td>${escapeHtml(r.authorName)}</td>
          <td>${starsHtml(r.rating)}</td>
          <td style="max-width:400px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(r.text || "")}</td>
          <td>${escapeHtml(r.relativeTimeDescription || "")}</td>
        </tr>`,
      )
      .join("");
  }

  const summaryHtml = hasData
    ? `<div class="stats-grid" style="margin-bottom:2rem;">
        <div class="stat-card">
          <div class="stat-number">${escapeHtml(String(reviewData.rating || "—"))}</div>
          <div class="stat-label">Average Rating</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">${escapeHtml(String(reviewData.totalReviews || "—"))}</div>
          <div class="stat-label">Total Reviews</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">${escapeHtml(reviewData.lastSyncedAt ? reviewData.lastSyncedAt.slice(0, 10) : "Never")}</div>
          <div class="stat-label">Last Synced</div>
        </div>
      </div>`
    : `<p style="color:#6b7280;">No review data yet. Click Sync to fetch reviews from Google.</p>`;

  return adminLayout({
    title: "Google Reviews",
    activeNav: "reviews",
    role,
    content: `
      ${summaryHtml}
      <form method="POST" action="/admin/reviews/sync" style="margin-bottom:2rem;">
        ${csrfField(csrf)}
        <button type="submit" class="btn-action">Sync Reviews from Google</button>
      </form>
      ${hasData ? `
      <table class="admin-table">
        <thead><tr><th>Author</th><th>Rating</th><th>Review</th><th>Time</th></tr></thead>
        <tbody>${reviewRows}</tbody>
      </table>` : ""}`,
  });
}

module.exports = {
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
};
