// worker/test/worker.test.js
import test from "node:test";
import assert from "node:assert";
import worker from "../src/worker.js";

function createEnv(initial) {
  const store = new Map(Object.entries(initial || {}));
  return {
    QUIZ_COUNTS: {
      async get(key) { return store.has(key) ? store.get(key) : null; },
      async put(key, value) { store.set(key, value); }
    }
  };
}

test("POST /count increments an existing key", async () => {
  const env = createEnv({ GOA: "3" });
  const request = new Request("https://analytics.example.com/count?result=GOA", { method: "POST" });
  const response = await worker.fetch(request, env);
  const body = await response.json();
  assert.strictEqual(response.status, 200);
  assert.strictEqual(body.count, 4);
});

test("POST /count starts a missing key at 1", async () => {
  const env = createEnv({});
  const request = new Request("https://analytics.example.com/count?result=HOCNA", { method: "POST" });
  const response = await worker.fetch(request, env);
  const body = await response.json();
  assert.strictEqual(body.count, 1);
});

test("POST /count rejects an unknown result key", async () => {
  const env = createEnv({});
  const request = new Request("https://analytics.example.com/count?result=NotAJurisdiction", { method: "POST" });
  const response = await worker.fetch(request, env);
  assert.strictEqual(response.status, 400);
});

test("GET /counts returns all six jurisdictions", async () => {
  const env = createEnv({ GOA: "2", ROCOR: "1" });
  const request = new Request("https://analytics.example.com/counts", { method: "GET" });
  const response = await worker.fetch(request, env);
  const body = await response.json();
  assert.strictEqual(response.status, 200);
  assert.deepStrictEqual(body, { GOA: 2, Antiochian: 0, OCA: 0, ROCOR: 1, Jerusalem: 0, HOCNA: 0 });
});

test("OPTIONS preflight returns CORS headers with no body", async () => {
  const env = createEnv({});
  const request = new Request("https://analytics.example.com/count", { method: "OPTIONS" });
  const response = await worker.fetch(request, env);
  assert.strictEqual(response.status, 204);
  assert.ok(response.headers.get("Access-Control-Allow-Origin"));
});

test("an unmatched route returns 404", async () => {
  const env = createEnv({});
  const request = new Request("https://analytics.example.com/nope", { method: "GET" });
  const response = await worker.fetch(request, env);
  assert.strictEqual(response.status, 404);
});
