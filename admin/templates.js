function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function adminLayout({ title, content, activeNav = "", flash = "" }) {
  const navItems = [
    { href: "/admin", label: "Dashboard", key: "dashboard" },
    { href: "/admin/content", label: "Site Content", key: "content" },
    { href: "/admin/categories", label: "Categories", key: "categories" },
    { href: "/admin/faqs", label: "FAQs", key: "faqs" },
    { href: "/admin/blog", label: "Blog", key: "blog" },
    { href: "/admin/messages", label: "Messages", key: "messages" },
    { href: "/admin/password", label: "Password", key: "password" },
  ];

  const nav = navItems
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

module.exports = { adminLayout, loginPage, csrfField, escapeHtml };
