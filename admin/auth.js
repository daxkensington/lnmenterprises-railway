const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const signature = require("cookie-signature");
const { readJSON, writeJSON } = require("./data");

const COOKIE_SECRET = process.env.COOKIE_SECRET || crypto.randomBytes(32).toString("hex");
const SESSION_TTL = 24 * 60 * 60 * 1000; // 24 hours
const sessions = new Map();

function seedCredentials() {
  const existing = readJSON("credentials.json");
  if (existing) return;
  const hash = bcrypt.hashSync("changeme", 10);
  writeJSON("credentials.json", { username: "admin", passwordHash: hash });
  console.log("Admin credentials seeded (username: admin, password: changeme). Change immediately!");
}

async function verifyLogin(username, password) {
  const creds = readJSON("credentials.json");
  if (!creds || creds.username !== username) return false;
  return bcrypt.compare(password, creds.passwordHash);
}

function createSession(username) {
  const id = crypto.randomBytes(32).toString("hex");
  const csrf = crypto.randomBytes(24).toString("hex");
  sessions.set(id, { username, csrf, createdAt: Date.now() });
  return id;
}

function getSession(req) {
  const raw = parseCookies(req).session;
  if (!raw) return null;
  const id = signature.unsign(raw, COOKIE_SECRET);
  if (id === false) return null;
  const session = sessions.get(id);
  if (!session) return null;
  if (Date.now() - session.createdAt > SESSION_TTL) {
    sessions.delete(id);
    return null;
  }
  return { id, ...session };
}

function destroySession(id) {
  sessions.delete(id);
}

function setSessionCookie(res, sessionId) {
  const signed = signature.sign(sessionId, COOKIE_SECRET);
  res.setHeader("Set-Cookie", `session=${signed}; HttpOnly; SameSite=Strict; Path=/admin; Max-Age=86400${process.env.NODE_ENV === "production" ? "; Secure" : ""}`);
}

function clearSessionCookie(res) {
  res.setHeader("Set-Cookie", `session=; HttpOnly; SameSite=Strict; Path=/admin; Max-Age=0`);
}

function requireAuth(req, res, next) {
  const session = getSession(req);
  if (!session) {
    res.redirect("/admin/login");
    return;
  }
  req.session = session;
  next();
}

function verifyCsrf(req, res, next) {
  const session = req.session;
  const token = req.body && req.body._csrf;
  if (!session || !token || token !== session.csrf) {
    res.status(403).send("Invalid or missing CSRF token. <a href='/admin'>Go back</a>");
    return;
  }
  next();
}

function parseCookies(req) {
  const header = req.headers.cookie || "";
  const cookies = {};
  header.split(";").forEach((pair) => {
    const [key, ...val] = pair.trim().split("=");
    if (key) cookies[key.trim()] = decodeURIComponent(val.join("="));
  });
  return cookies;
}

module.exports = {
  seedCredentials,
  verifyLogin,
  createSession,
  getSession,
  destroySession,
  setSessionCookie,
  clearSessionCookie,
  requireAuth,
  verifyCsrf,
};
