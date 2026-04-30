const { formatDrawMonth } = require("./data");

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
  <link rel="stylesheet" href="/admin.css?v=3" />
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

function loginPage(error = "", success = "") {
  const errorHtml = error
    ? `<div class="admin-error">${escapeHtml(error)}</div>`
    : "";
  const successHtml = success
    ? `<div class="admin-flash">${escapeHtml(success)}</div>`
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
  <link rel="stylesheet" href="/admin.css?v=3" />
</head>
<body class="login-body">
  <div class="login-card">
    <div class="login-icon">
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/><path d="M22 7v3a2 2 0 0 1-2 2 2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12a2 2 0 0 1-2-2V7"/></svg>
    </div>
    <h1>Staff Login</h1>
    <p class="login-subtitle">L&amp;M Enterprises Admin Dashboard</p>
    ${errorHtml}
    ${successHtml}
    <form method="POST" action="/admin/login">
      <div class="form-group">
        <label for="username">Username</label>
        <input type="text" id="username" name="username" required autocomplete="username" placeholder="Enter your username" />
      </div>
      <div class="form-group">
        <label for="password">Password</label>
        <input type="password" id="password" name="password" required autocomplete="current-password" placeholder="Enter your password" />
      </div>
      <button type="submit" style="width:100%;padding:0.75rem;">Sign In</button>
    </form>
    <div class="login-links">
      <a href="/admin/register">Create an account</a>
      <span>•</span>
      <a href="/admin/forgot-password">Forgot password?</a>
    </div>
  </div>
</body>
</html>`;
}

function registerPage(error = "", success = "") {
  const errorHtml = error ? `<div class="admin-error">${escapeHtml(error)}</div>` : "";
  const successHtml = success ? `<div class="admin-flash">${escapeHtml(success)}</div>` : "";

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="robots" content="noindex, nofollow" />
  <title>Register | L&amp;M Enterprises Admin</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="/admin.css?v=3" />
</head>
<body class="login-body">
  <div class="login-card">
    <div class="login-icon">
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
    </div>
    <h1>Create Account</h1>
    <p class="login-subtitle">Register for staff access (requires admin approval)</p>
    ${errorHtml}
    ${successHtml}
    <form method="POST" action="/admin/register">
      <div class="form-group">
        <label for="displayName">Full Name</label>
        <input type="text" id="displayName" name="displayName" required placeholder="Your full name" />
      </div>
      <div class="form-group">
        <label for="email">Email</label>
        <input type="email" id="email" name="email" required placeholder="your@email.com" />
      </div>
      <div class="form-group">
        <label for="username">Username</label>
        <input type="text" id="username" name="username" required autocomplete="username" placeholder="Choose a username" />
      </div>
      <div class="form-group">
        <label for="password">Password (min 8 characters)</label>
        <input type="password" id="password" name="password" required minlength="8" autocomplete="new-password" placeholder="Choose a strong password" />
      </div>
      <div class="form-group">
        <label for="confirmPassword">Confirm Password</label>
        <input type="password" id="confirmPassword" name="confirmPassword" required minlength="8" autocomplete="new-password" placeholder="Re-enter your password" />
      </div>
      <button type="submit" style="width:100%;padding:0.75rem;">Register</button>
    </form>
    <div class="login-links">
      <a href="/admin/login">Already have an account? Sign in</a>
    </div>
  </div>
</body>
</html>`;
}

function forgotPasswordPage(error = "", success = "") {
  const errorHtml = error ? `<div class="admin-error">${escapeHtml(error)}</div>` : "";
  const successHtml = success ? `<div class="admin-flash">${escapeHtml(success)}</div>` : "";

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="robots" content="noindex, nofollow" />
  <title>Forgot Password | L&amp;M Enterprises Admin</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="/admin.css?v=3" />
</head>
<body class="login-body">
  <div class="login-card">
    <div class="login-icon">
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
    </div>
    <h1>Reset Password</h1>
    <p class="login-subtitle">Enter your email to receive a reset link</p>
    ${errorHtml}
    ${successHtml}
    <form method="POST" action="/admin/forgot-password">
      <div class="form-group">
        <label for="email">Email Address</label>
        <input type="email" id="email" name="email" required placeholder="your@email.com" />
      </div>
      <button type="submit" style="width:100%;padding:0.75rem;">Send Reset Link</button>
    </form>
    <div class="login-links">
      <a href="/admin/login">Back to login</a>
    </div>
  </div>
</body>
</html>`;
}

function resetPasswordPage(token, error = "") {
  const errorHtml = error ? `<div class="admin-error">${escapeHtml(error)}</div>` : "";

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="robots" content="noindex, nofollow" />
  <title>Set New Password | L&amp;M Enterprises Admin</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="/admin.css?v=3" />
</head>
<body class="login-body">
  <div class="login-card">
    <div class="login-icon">
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
    </div>
    <h1>Set New Password</h1>
    <p class="login-subtitle">Choose a new password for your account</p>
    ${errorHtml}
    <form method="POST" action="/admin/reset-password">
      <input type="hidden" name="token" value="${escapeHtml(token)}" />
      <div class="form-group">
        <label for="password">New Password (min 8 characters)</label>
        <input type="password" id="password" name="password" required minlength="8" autocomplete="new-password" placeholder="Enter new password" />
      </div>
      <div class="form-group">
        <label for="confirmPassword">Confirm New Password</label>
        <input type="password" id="confirmPassword" name="confirmPassword" required minlength="8" autocomplete="new-password" placeholder="Re-enter new password" />
      </div>
      <button type="submit" style="width:100%;padding:0.75rem;">Reset Password</button>
    </form>
    <div class="login-links">
      <a href="/admin/login">Back to login</a>
    </div>
  </div>
</body>
</html>`;
}

function csrfField(token) {
  return `<input type="hidden" name="_csrf" value="${escapeHtml(token)}" />`;
}

/* ── Staff management templates ── */

function staffListPage({ users, csrf, role }) {
  const pending = users.filter((u) => !u.isActive && !u.lastLoginAt);
  const rest = users.filter((u) => u.isActive || u.lastLoginAt);

  function statusBadge(u) {
    if (!u.isActive && !u.lastLoginAt) return '<span class="staff-badge staff-badge--pending">Pending Approval</span>';
    if (!u.isActive) return '<span class="staff-badge staff-badge--inactive">Deactivated</span>';
    return '<span class="staff-badge staff-badge--active">Active</span>';
  }

  function actionButtons(u) {
    const isSelf = false; // checked server-side
    if (!u.isActive && !u.lastLoginAt) {
      return `
        <form method="POST" action="/admin/staff/${escapeHtml(u.id)}/toggle-active" style="display:inline;">
          <input type="hidden" name="_csrf" value="${csrf}" />
          <button type="submit" class="btn-approve">Approve</button>
        </form>
        <form method="POST" action="/admin/staff/${escapeHtml(u.id)}/deny" style="display:inline; margin-left:0.25rem;">
          <input type="hidden" name="_csrf" value="${csrf}" />
          <button type="submit" class="btn-deny">Deny</button>
        </form>`;
    }
    if (u.isActive) {
      return `
        <a href="/admin/staff/${escapeHtml(u.id)}" class="btn-edit">Edit</a>
        <form method="POST" action="/admin/staff/${escapeHtml(u.id)}/toggle-active" style="display:inline; margin-left:0.25rem;">
          <input type="hidden" name="_csrf" value="${csrf}" />
          <button type="submit" class="btn-danger btn-sm">Deactivate</button>
        </form>`;
    }
    return `
      <form method="POST" action="/admin/staff/${escapeHtml(u.id)}/toggle-active" style="display:inline;">
        <input type="hidden" name="_csrf" value="${csrf}" />
        <button type="submit" class="btn-action btn-sm">Reactivate</button>
      </form>
      <a href="/admin/staff/${escapeHtml(u.id)}" class="btn-edit" style="margin-left:0.25rem;">Edit</a>`;
  }

  function userRow(u) {
    return `
      <tr>
        <td>${escapeHtml(u.displayName)}</td>
        <td>${escapeHtml(u.username)}</td>
        <td>${escapeHtml(u.email || "—")}</td>
        <td>${escapeHtml(u.role)}</td>
        <td>${statusBadge(u)}</td>
        <td>${u.lastLoginAt ? escapeHtml(u.lastLoginAt.slice(0, 10)) : "Never"}</td>
        <td class="staff-actions">${actionButtons(u)}</td>
      </tr>`;
  }

  const pendingSection = pending.length
    ? `<div class="staff-pending-section">
        <h3 class="staff-pending-title">Pending Approval (${pending.length})</h3>
        <table class="admin-table">
          <thead><tr><th>Name</th><th>Username</th><th>Email</th><th>Role</th><th>Status</th><th>Last Login</th><th>Actions</th></tr></thead>
          <tbody>${pending.map(userRow).join("")}</tbody>
        </table>
      </div>`
    : "";

  const activeSection = `
    <h3 style="margin-top:1.5rem; font-size:1rem; color:var(--text-muted);">All Staff</h3>
    <table class="admin-table">
      <thead><tr><th>Name</th><th>Username</th><th>Email</th><th>Role</th><th>Status</th><th>Last Login</th><th>Actions</th></tr></thead>
      <tbody>${rest.length ? rest.map(userRow).join("") : "<tr><td colspan='7'>No staff members.</td></tr>"}</tbody>
    </table>`;

  return adminLayout({
    title: "Staff Management",
    activeNav: "staff",
    role,
    content: `
      <a href="/admin/staff/new" class="btn-action">New Staff Member</a>
      ${pendingSection}
      ${activeSection}`,
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

function promotionsListPage({ promotions, csrf, role, flash = "" }) {
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
    flash,
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

function winnersListPage({ winners, csrf, role, flash = "" }) {
  const rows = winners
    .map(
      (w) => `
      <tr>
        <td style="font-family:ui-monospace,Menlo,monospace;font-weight:600;">${escapeHtml(w.winningNumber || "—")}</td>
        <td>${escapeHtml(w.name || "Pending claim")}</td>
        <td>${escapeHtml(w.prize || "—")}</td>
        <td>${escapeHtml(formatDrawMonth(w.date) || "—")}</td>
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
    flash,
    content: `
      <h3>Post Winning Number</h3>
      <p style="color:var(--text-muted);margin-top:-0.5rem;">Post just the winning number, or fill in the winner's name and prize once they claim.</p>
      <form method="POST" action="/admin/winners" style="margin-bottom:2rem;">
        ${csrfField(csrf)}
        <div class="form-group">
          <label for="winningNumber">Winning Number</label>
          <input type="text" id="winningNumber" name="winningNumber" placeholder="e.g. 158270" inputmode="numeric" />
        </div>
        <div class="form-group">
          <label for="name">Winner Name (optional)</label>
          <input type="text" id="name" name="name" placeholder="Leave blank if unclaimed" />
        </div>
        <div class="form-group">
          <label for="prize">Prize (optional)</label>
          <input type="text" id="prize" name="prize" placeholder="e.g. $1000 Free Gas" />
        </div>
        <div class="form-group">
          <label for="date">Draw Month</label>
          <input type="month" id="date" name="date" placeholder="YYYY-MM" />
        </div>
        <div class="form-group">
          <label for="testimonial">Testimonial (optional)</label>
          <textarea id="testimonial" name="testimonial" rows="2"></textarea>
        </div>
        <button type="submit">Post Winner</button>
      </form>
      <h3>Past Winners</h3>
      <table class="admin-table">
        <thead><tr><th>Winning #</th><th>Name</th><th>Prize</th><th>Date</th><th>Action</th></tr></thead>
        <tbody>${rows || "<tr><td colspan='5'>No winners yet.</td></tr>"}</tbody>
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

function reviewsPage({ reviewData, csrf, role, flash = "" }) {
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
    flash,
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
  registerPage,
  forgotPasswordPage,
  resetPasswordPage,
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
