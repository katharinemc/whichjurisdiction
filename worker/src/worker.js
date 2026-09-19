const JURISDICTION_KEYS = ["GOA", "Antiochian", "OCA", "ROCOR", "Jerusalem", "HOCNA"];
// Placeholder — replace with the site's real deployed domain before going live.
const ALLOWED_ORIGIN = "https://your-domain-here.com";

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
}

function jsonResponse(body, status) {
  return new Response(JSON.stringify(body), {
    status: status,
    headers: Object.assign({ "Content-Type": "application/json" }, corsHeaders())
  });
}

async function handleCount(request, env) {
  const url = new URL(request.url);
  const result = url.searchParams.get("result");
  if (!JURISDICTION_KEYS.includes(result)) {
    return jsonResponse({ error: "invalid result key" }, 400);
  }
  const current = parseInt((await env.QUIZ_COUNTS.get(result)) || "0", 10);
  const next = current + 1;
  await env.QUIZ_COUNTS.put(result, String(next));
  return jsonResponse({ result: result, count: next }, 200);
}

async function handleCounts(env) {
  const counts = {};
  for (const key of JURISDICTION_KEYS) {
    counts[key] = parseInt((await env.QUIZ_COUNTS.get(key)) || "0", 10);
  }
  return jsonResponse(counts, 200);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    if (url.pathname === "/count" && request.method === "POST") {
      return handleCount(request, env);
    }

    if (url.pathname === "/counts" && request.method === "GET") {
      return handleCounts(env);
    }

    return jsonResponse({ error: "not found" }, 404);
  }
};
