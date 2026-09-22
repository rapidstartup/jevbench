/**
 * GET /api/media/:key — serve run evidence (game video, stills) from R2.
 * Keys are flat by convention: sc2-<runid>-<capture.mp4|still-*.png>.
 * Binding: MEDIA (jevbench-media bucket, see wrangler.toml).
 */

const KEY_RE = /^sc2-[A-Za-z0-9_.-]+\.(mp4|png|jpg|jpeg|webp)$/;

export async function onRequestGet(context) {
  const { env, params } = context;
  const key = params && params.key;
  if (!key || !KEY_RE.test(key)) {
    return new Response("Bad key.", { status: 400 });
  }
  if (!env.MEDIA) {
    return new Response("Media store not configured.", { status: 503 });
  }
  let obj;
  try {
    obj = await env.MEDIA.get(key);
  } catch {
    return new Response("Media lookup failed.", { status: 502 });
  }
  if (!obj) {
    return new Response("Not found.", { status: 404 });
  }
  const headers = new Headers();
  obj.writeHttpMetadata(headers);
  if (obj.httpEtag) headers.set("etag", obj.httpEtag);
  headers.set("Cache-Control", "public, max-age=31536000, immutable");
  return new Response(obj.body, { headers });
}

export async function onRequest(context) {
  if (context.request.method === "GET") return onRequestGet(context);
  return new Response("Method not allowed.", { status: 405 });
}
