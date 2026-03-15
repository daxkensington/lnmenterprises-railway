const crypto = require("crypto");
const { readJSON, writeJSON } = require("./data");

function appendAuditLog({ req, actionType, entityType, entityId = null, oldValue = null, newValue = null }) {
  const entries = readJSON("audit-log.json", []);
  entries.push({
    id: crypto.randomBytes(8).toString("hex"),
    timestamp: new Date().toISOString(),
    adminUsername: req.session?.username || "system",
    adminUserId: req.session?.userId || null,
    actionType, // "create", "update", "delete", "sync", "login", "password-change"
    entityType, // "site-content", "category", "faq", "blog-post", "message", "gas-prices", "promotion", "winner", "staff", "review"
    entityId,
    oldValue: oldValue ? JSON.stringify(oldValue) : null,
    newValue: newValue ? JSON.stringify(newValue) : null,
    ipAddress: req.ip || req.connection?.remoteAddress || null,
  });
  // Trim to last 500 entries
  const trimmed = entries.slice(-500);
  writeJSON("audit-log.json", trimmed);
}

module.exports = { appendAuditLog };
