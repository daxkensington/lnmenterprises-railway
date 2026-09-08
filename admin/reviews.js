const { readJSON, writeJSON } = require("./data");

const PLACE_ID = "ChIJ6wH13dDW14kRdfm-TgSpygU";
const CID = "417331751451294069";
const SAGO_PLACE_ID = "ChIJh8jI5dDW14kRkWuKCAVsMeA";
const SAGO_CID = "16154812107228605329";

function reviewKey(r) {
  const author = String(r.authorName || "")
    .trim()
    .toLowerCase();
  const text = String(r.text || "")
    .trim()
    .toLowerCase()
    .slice(0, 80);
  if (author || text) return `at:${author}|${text}`;
  if (r.reviewId) return `id:${r.reviewId}`;
  return `misc:${String(r.time || "")}`;
}

function mergeReviewLists(existing, incoming) {
  const map = new Map();
  for (const r of existing || []) {
    if (!r) continue;
    map.set(reviewKey(r), r);
  }
  for (const r of incoming || []) {
    if (!r) continue;
    const key = reviewKey(r);
    const prev = map.get(key) || {};
    map.set(key, {
      ...prev,
      ...r,
      reviewId: r.reviewId || prev.reviewId || null,
      authorName: r.authorName || prev.authorName || "",
      text: r.text || prev.text || "",
    });
  }
  return Array.from(map.values());
}

function saveReviews(filename, { placeId, cid, name, reviews, rating, totalReviews, source }) {
  const existing = readJSON(filename, null) || {};
  const merged = source === "dataforseo" ? reviews : mergeReviewLists(existing.reviews, reviews);
  const result = {
    placeId,
    cid: existing.cid || cid,
    name: name || existing.name || null,
    lastSyncedAt: new Date().toISOString(),
    source,
    rating: rating != null ? rating : existing.rating || null,
    totalReviews: totalReviews || existing.totalReviews || merged.length,
    reviews: merged,
  };
  writeJSON(filename, result);
  return result;
}

async function fetchJson(url, options = {}, timeoutMs = 15000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    const data = await res.json();
    return { ok: res.ok, status: res.status, data };
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchPlacesReviews(placeId) {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_PLACES_API_KEY not configured");

  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=reviews,rating,user_ratings_total&key=${apiKey}`;
  const { data } = await fetchJson(url);
  if (data.status !== "OK") throw new Error(`Google API: ${data.status}`);
  if (!data.result) throw new Error("Google API returned no result data");

  return {
    rating: data.result.rating || null,
    totalReviews: data.result.user_ratings_total || 0,
    reviews: (data.result.reviews || []).map((r) => ({
      authorName: r.author_name || "",
      rating: r.rating,
      text: r.text || "",
      relativeTimeDescription: r.relative_time_description || "",
      time: r.time,
      reviewId: null,
    })),
  };
}

async function fetchDataForSeoReviews(placeId) {
  const login = process.env.DATAFORSEO_LOGIN;
  const password = process.env.DATAFORSEO_PASSWORD;
  if (!login || !password) return null;

  const auth = Buffer.from(`${login}:${password}`).toString("base64");
  const headers = {
    Authorization: `Basic ${auth}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  const { data: posted } = await fetchJson(
    "https://api.dataforseo.com/v3/business_data/google/reviews/task_post",
    {
      method: "POST",
      headers,
      body: JSON.stringify([
        {
          place_id: placeId,
          location_coordinate: "44.196220,-77.064132,200",
          language_code: "en",
          depth: 40,
          sort_by: "newest",
        },
      ]),
    },
    30000,
  );

  const task = (posted.tasks || [])[0] || {};
  const taskId = task.id;
  if (!taskId) throw new Error(`DataForSEO task_post: ${posted.status_message || "no task id"}`);

  const deadline = Date.now() + 90000;
  while (Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 4000));
    const { data: got } = await fetchJson(
      `https://api.dataforseo.com/v3/business_data/google/reviews/task_get/${taskId}`,
      { headers: { Authorization: `Basic ${auth}`, Accept: "application/json" } },
      30000,
    );
    const t0 = (got.tasks || [])[0] || {};
    if (t0.status_code === 20000 && t0.result && t0.result[0]) {
      const result = t0.result[0];
      return {
        rating: (result.rating && result.rating.value) || null,
        totalReviews: result.reviews_count || 0,
        reviews: (result.items || []).map((r) => ({
          authorName: r.profile_name || "",
          rating: (r.rating && r.rating.value) || null,
          text: (r.review_text || "").trim(),
          relativeTimeDescription: r.time_ago || "",
          time: r.timestamp,
          reviewId: r.review_id || null,
        })),
      };
    }
    if (t0.status_code && ![20000, 20100, 40601, 40602].includes(t0.status_code)) {
      throw new Error(`DataForSEO task_get: ${t0.status_message || t0.status_code}`);
    }
  }
  throw new Error("DataForSEO reviews timed out");
}

async function syncListing(filename, placeId, cid, name) {
  try {
    const full = await fetchDataForSeoReviews(placeId);
    if (full) return saveReviews(filename, { ...full, placeId, cid, name, source: "dataforseo" });
  } catch (err) {
    console.error(`DataForSEO reviews failed for ${name}, falling back to Places:`, err.message);
  }
  const places = await fetchPlacesReviews(placeId);
  return saveReviews(filename, { ...places, placeId, cid, name, source: "places" });
}

async function syncGoogleReviews() {
  const [lnm] = await Promise.all([
    syncListing("google-reviews.json", PLACE_ID, CID, "L & M Enterprises"),
    syncListing("sago-reviews.json", SAGO_PLACE_ID, SAGO_CID, "Sago Gas Bar").catch((err) => {
      console.error("SAGO reviews skipped:", err.message);
      return null;
    }),
  ]);
  return lnm;
}

module.exports = { syncGoogleReviews, PLACE_ID, SAGO_PLACE_ID, SAGO_CID };
