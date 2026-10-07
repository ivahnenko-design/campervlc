import { test } from "node:test";
import assert from "node:assert/strict";
import { createBlobAccess } from "./blob.js";

function fakeSdk(storeAccess) {
  const files = new Map();
  const check = (a) => {
    if (a !== storeAccess) {
      throw new Error(`Vercel Blob: Cannot use ${a} access on a ${storeAccess} store. The store is configured with ${storeAccess} access.`);
    }
  };
  return {
    files,
    calls: [],
    async put(path, body, opts) {
      this.calls.push(["put", opts.access]);
      check(opts.access);
      files.set(path, body);
      return { pathname: path };
    },
    async get(path, opts) {
      this.calls.push(["get", opts.access]);
      check(opts.access);
      if (!files.has(path)) return { statusCode: 404 };
      return { statusCode: 200, stream: new Response(files.get(path)).body, blob: { etag: "e1" } };
    },
  };
}

for (const [initial, store] of [["private", "private"], ["private", "public"], ["public", "private"]]) {
  test(`blob access: starts ${initial}, store is ${store}`, async () => {
    const sdk = fakeSdk(store);
    const b = createBlobAccess(sdk, initial);
    await b.put("a.json", { id: "x" });
    assert.deepEqual((await b.readJson("a.json")).data, { id: "x" });
    assert.equal(b.access, store);
    assert.equal(await b.readJson("missing.json"), null);
    // After the first flip no further mismatches happen.
    assert.equal(sdk.calls.filter(([, a]) => a !== store).length, initial === store ? 0 : 1);
  });
}

test("blob access: other errors are not retried", async () => {
  const sdk = { put: async () => { throw new Error("network down"); } };
  await assert.rejects(createBlobAccess(sdk).put("a", {}), /network down/);
});
