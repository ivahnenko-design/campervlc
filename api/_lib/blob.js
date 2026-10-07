// Vercel Blob wrapper that works with both public and private stores. A store's
// access mode is fixed when it is created and the SDK rejects the wrong one
// ("Cannot use public access on a private store"), so we start with the mode
// from BLOB_ACCESS (default: private) and flip once if the store says otherwise.
import * as sdk from "@vercel/blob";

const other = (a) => (a === "private" ? "public" : "private");
const isAccessMismatch = (e) => /access on an? (private|public) store|store is configured with/i.test(e?.message || "");

export function createBlobAccess(blob, initial = "private") {
  let access = initial === "public" ? "public" : "private";

  async function withAccess(fn) {
    try {
      return await fn(access);
    } catch (err) {
      if (!isAccessMismatch(err)) throw err;
      access = other(access);
      return fn(access);
    }
  }

  return {
    get access() {
      return access;
    },
    // Overwrites by default; with `ifMatch` the write only lands if the ETag still matches.
    put(pathname, data, options = {}) {
      const opts = { contentType: "application/json", addRandomSuffix: false, ...options };
      if (!opts.ifMatch) opts.allowOverwrite = true;
      return withAccess((a) =>
        blob.put(pathname, typeof data === "string" ? data : JSON.stringify(data), { ...opts, access: a }),
      );
    },
    /** { data, etag } parsed from JSON, or null when the blob is missing. */
    async readJson(pathname) {
      const res = await withAccess((a) => blob.get(pathname, { access: a, useCache: false }));
      if (!res || res.statusCode !== 200) return null;
      const text = await new Response(res.stream).text();
      return { data: JSON.parse(text), etag: res.blob.etag };
    },
  };
}

export const blobStore = createBlobAccess(sdk, process.env.BLOB_ACCESS || "private");
export const { list } = sdk;
