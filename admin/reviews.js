const { readJSON, writeJSON } = require("./data");

const PLACE_ID = "ChIJ6wH13dDW14kRdfm-TgSpygU";

async function syncGoogleReviews() {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_PLACES_API_KEY not configured");

  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${PLACE_ID}&fields=reviews,rating,user_ratings_total&key=${apiKey}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  let res;
  try {
    res = await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
  const data = await res.json();

  if (data.status !== "OK") throw new Error(`Google API: ${data.status}`);
  if (!data.result) throw new Error("Google API returned no result data");

  const result = {
    placeId: PLACE_ID,
    lastSyncedAt: new Date().toISOString(),
    rating: data.result.rating || null,
    totalReviews: data.result.user_ratings_total || 0,
    reviews: (data.result.reviews || []).map((r) => ({
      authorName: r.author_name || "Anonymous",
      rating: r.rating,
      text: r.text || "",
      relativeTimeDescription: r.relative_time_description || "",
      time: r.time,
    })),
  };

  writeJSON("google-reviews.json", result);
  return result;
}

module.exports = { syncGoogleReviews };
