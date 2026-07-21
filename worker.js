/* ==========================================================================
   TRUST ME BRO - Cloudflare Worker for share links
   Route:  s.qafizz.com/r/*        (a PROXIED / orange-cloud host)

   Social crawlers (Twitterbot, facebookexternalhit, Discordbot, iMessage) do
   NOT run JavaScript - they read the raw HTML <head>. The app is a static SPA,
   so it can't hand a crawler a per-ranking preview on its own. This Worker sits
   in front of /r/<id> and returns real HTML whose og:image is THIS ranking's
   card (uploaded to Supabase Storage by share.js). Human visitors get bounced
   on to the app at qafizz.com/?list=<id>, which opens the ranking.

   No build step, no npm - paste this straight into the dashboard editor.
   ASCII only + string concatenation so a copy/paste can't mangle it.
   ========================================================================== */

const SUPABASE = "https://penlvacldoriiegbusjz.supabase.co";
const SITE = "https://qafizz.com";

function esc(s) {
  return String(s)
    .split("&").join("&amp;")
    .split("<").join("&lt;")
    .split(">").join("&gt;")
    .split('"').join("&quot;");
}

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const match = url.pathname.match(/^\/r\/([^/]+)\/?$/);
    if (!match) return Response.redirect(SITE + "/", 302);

    const id = decodeURIComponent(match[1]);
    const title = (url.searchParams.get("t") || "Tier list on Trust Me Bro").slice(0, 160);
    const category = (url.searchParams.get("c") || "").slice(0, 60);

    const cardUrl = SUPABASE + "/storage/v1/object/public/cards/" + encodeURIComponent(id) + ".png";
    let image = SITE + "/og-image.png";
    try {
      const head = await fetch(cardUrl, { method: "HEAD" });
      if (head.ok) image = cardUrl;
    } catch (e) {}

    const target = SITE + "/?list=" + encodeURIComponent(id);
    const desc = category
      ? category + " ranked. Vote on the real order - trust me bro."
      : "Vote on the real order - trust me bro.";

    const html =
      '<!DOCTYPE html><html lang="en"><head>' +
      '<meta charset="utf-8">' +
      '<meta name="viewport" content="width=device-width, initial-scale=1">' +
      "<title>" + esc(title) + " - Trust Me Bro</title>" +
      '<meta name="description" content="' + esc(desc) + '">' +
      '<meta property="og:type" content="website">' +
      '<meta property="og:site_name" content="Trust Me Bro">' +
      '<meta property="og:title" content="' + esc(title) + '">' +
      '<meta property="og:description" content="' + esc(desc) + '">' +
      '<meta property="og:url" content="' + esc(url.origin + "/r/" + id) + '">' +
      '<meta property="og:image" content="' + esc(image) + '">' +
      '<meta property="og:image:width" content="1200">' +
      '<meta property="og:image:height" content="630">' +
      '<meta name="twitter:card" content="summary_large_image">' +
      '<meta name="twitter:title" content="' + esc(title) + '">' +
      '<meta name="twitter:description" content="' + esc(desc) + '">' +
      '<meta name="twitter:image" content="' + esc(image) + '">' +
      '<meta http-equiv="refresh" content="0; url=' + esc(target) + '">' +
      "</head><body>" +
      '<p>Redirecting to <a href="' + esc(target) + '">' + esc(title) + "</a>...</p>" +
      "<script>location.replace(" + JSON.stringify(target) + ");</script>" +
      "</body></html>";

    return new Response(html, {
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "public, max-age=300",
      },
    });
  },
};
