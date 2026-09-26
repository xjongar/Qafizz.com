/* ==========================================================================
   QAFIZZ - checkout worker (Cloudflare Worker)
   Turns the cart on qafizz.com into a Stripe Checkout page.

   Prices are read from https://qafizz.com/products.json on every checkout,
   never from the browser, so nobody can change what they pay.

   Setup (see PRODUCTS-GUIDE.md for the click-by-click version):
     1. Cloudflare dashboard > Workers & Pages > Create > Worker, name it
        qafizz-checkout, paste this whole file, Deploy.
     2. Worker > Settings > Variables and Secrets > add a Secret named
        STRIPE_SECRET_KEY with your Stripe secret key (sk_live_...).
     3. Put the worker's address in js/config.js as checkoutUrl.
   ========================================================================== */

const SITE = "https://qafizz.com";
const ALLOWED_ORIGINS = ["https://qafizz.com", "https://www.qafizz.com"];
const COUNTRIES = ["CA", "US"];

function cors(origin) {
  const allow = ALLOWED_ORIGINS.indexOf(origin) !== -1 ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin"
  };
}

function json(body, status, origin) {
  return new Response(JSON.stringify(body), {
    status: status,
    headers: Object.assign({ "Content-Type": "application/json" }, cors(origin))
  });
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const url = new URL(request.url);

    if (request.method === "OPTIONS") return new Response(null, { headers: cors(origin) });
    if (request.method !== "POST" || url.pathname !== "/checkout") return json({ error: "Not found" }, 404, origin);
    if (!env.STRIPE_SECRET_KEY) return json({ error: "Checkout is not set up yet" }, 500, origin);

    let body;
    try { body = await request.json(); } catch (e) { return json({ error: "Bad request" }, 400, origin); }
    const items = Array.isArray(body && body.items) ? body.items.slice(0, 50) : [];
    if (!items.length) return json({ error: "Cart is empty" }, 400, origin);

    const res = await fetch(SITE + "/products.json?t=" + Date.now(), { cf: { cacheTtl: 0 } });
    if (!res.ok) return json({ error: "Could not load products" }, 502, origin);
    const products = await res.json();

    const form = new URLSearchParams();
    form.set("mode", "payment");
    form.set("success_url", SITE + "/thanks.html?session={CHECKOUT_SESSION_ID}");
    form.set("cancel_url", SITE + "/");
    form.set("phone_number_collection[enabled]", "true");
    form.set("billing_address_collection", "auto");
    COUNTRIES.forEach(function (c, i) { form.set("shipping_address_collection[allowed_countries][" + i + "]", c); });
    form.set("shipping_options[0][shipping_rate_data][type]", "fixed_amount");
    form.set("shipping_options[0][shipping_rate_data][display_name]", "Free shipping (7 to 15 business days)");
    form.set("shipping_options[0][shipping_rate_data][fixed_amount][amount]", "0");
    form.set("shipping_options[0][shipping_rate_data][fixed_amount][currency]", "cad");

    let n = 0;
    for (const item of items) {
      const p = products.find(function (x) { return x.id === item.id; });
      if (!p) continue;
      const styles = p.styles || [];
      const style = styles.indexOf(item.style) !== -1 ? item.style : (styles[0] || "");
      const qty = Math.max(1, Math.min(99, parseInt(item.qty, 10) || 1));
      const name = (p.short || p.name) + (style ? " - " + style : "");
      form.set("line_items[" + n + "][quantity]", String(qty));
      form.set("line_items[" + n + "][price_data][currency]", "cad");
      form.set("line_items[" + n + "][price_data][unit_amount]", String(Math.round(Number(p.price) * 100)));
      form.set("line_items[" + n + "][price_data][product_data][name]", name.slice(0, 250));
      form.set("line_items[" + n + "][price_data][product_data][metadata][product_id]", p.id);
      form.set("line_items[" + n + "][price_data][product_data][metadata][style]", style);
      if (p.images && p.images[0]) {
        const img = /^https?:\/\//.test(p.images[0]) ? p.images[0] : SITE + "/" + p.images[0].replace(/^\//, "");
        form.set("line_items[" + n + "][price_data][product_data][images][0]", img);
      }
      n++;
    }
    if (!n) return json({ error: "Those items are no longer available" }, 400, origin);

    const stripe = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + env.STRIPE_SECRET_KEY,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: form.toString()
    });
    const session = await stripe.json();
    if (!stripe.ok) return json({ error: (session.error && session.error.message) || "Stripe error" }, 502, origin);
    return json({ url: session.url }, 200, origin);
  }
};
