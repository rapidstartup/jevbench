/**
 * GET/HEAD /api/media/:key — serve run evidence (game video, stills) from R2.
 * Keys are flat by convention: <sc2|mc>-<runid>-<file>.
 * Supports Range requests so the long gameplay video can seek/stream.
 * Binding: MEDIA (jevbench-media bucket, see wrangler.toml).
 */

const KEY_RE = /^(sc2|mc)-[A-Za-z0-9_.-]+\.(mp4|png|jpg|jpeg|webp)$/;

function parseRange(header, size) {
  const m = /^bytes=(\d*)-(\d*)$/.exec((header || "").trim());
  if (!m) return null;
  const startRaw = m[1];
  const endRaw = m[2];
  if (startRaw === "" && endRaw === "") return null;
  let start;
  let end;
  if (startRaw === "") {
    const suffix = Number(endRaw);
    if (!Number.isFinite(suffix) || suffix <= 0) return null;
    start = Math.max(0, size - suffix);
    end = size - 1;
  } else {
    start = Number(startRaw);
    end = endRaw === "" ? size - 1 : Math.min(Number(endRaw), size - 1);
  }
  if (!Number.isFinite(start) || start >= size || start > end) return null;
  return { offset: start, length: end - start + 1 };
}

async function serve(context, headOnly) {
  const { env, params, request } = context;
  const key = params && params.key;
  if (!key || !KEY_RE.test(key)) {
    return new Response("Bad key.", { status: 400 });
  }
  if (!env.MEDIA) {
    return new Response("Media store not configured.", { status: 503 });
  }

  // Metadata + size first (no body), so suffix ranges can be resolved.
  let meta;
  try {
    meta = await env.MEDIA.head(key);
  } catch {
    return new Response("Media lookup failed.", { status: 502 });
  }
  if (!meta) {
    return new Response("Not found.", { status: 404 });
  }

  const headers = new Headers();
  meta.writeHttpMetadata(headers);
  if (meta.httpEtag) headers.set("etag", meta.httpEtag);
  if (!headers.get("Content-Type")) {
    const ext = key.slice(key.lastIndexOf(".") + 1).toLowerCase();
    const types = { mp4: "video/mp4", png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp" };
    if (types[ext]) headers.set("Content-Type", types[ext]);
  }
  headers.set("Accept-Ranges", "bytes");
  headers.set("Cache-Control", "public, max-age=31536000, immutable");
  const size = meta.size;

  if (headOnly) {
    headers.set("Content-Length", String(size));
    return new Response(null, { status: 200, headers });
  }

  const range = parseRange(request.headers.get("range"), size);
  let obj;
  try {
    obj = range
      ? await env.MEDIA.get(key, { range: { offset: range.offset, length: range.length } })
      : await env.MEDIA.get(key);
  } catch {
    return new Response("Media lookup failed.", { status: 502 });
  }
  if (!obj) {
    return new Response("Not found.", { status: 404 });
  }

  if (range && obj.range) {
    const offset = obj.range.offset;
    const length = obj.range.length;
    headers.set("Content-Range", `bytes ${offset}-${offset + length - 1}/${size}`);
    headers.set("Content-Length", String(length));
    return new Response(obj.body, { status: 206, headers });
  }

  headers.set("Content-Length", String(size));
  return new Response(obj.body, { status: 200, headers });
}

export async function onRequestGet(context) {
  return serve(context, false);
}

export async function onRequestHead(context) {
  return serve(context, true);
}

export async function onRequest(context) {
  const method = context.request.method;
  if (method === "GET") return onRequestGet(context);
  if (method === "HEAD") return onRequestHead(context);
  return new Response("Method not allowed.", { status: 405 });
}
