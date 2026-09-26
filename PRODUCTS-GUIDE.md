# Running the Qafizz store

## Add or change a product

Edit `products.json`. Each product looks like this:

```json
{
  "id": "curl-comb",
  "name": "Cordless 2-in-1 Straightening Comb",
  "tagline": "One line under the title",
  "price": 39.99,
  "was": 54.99,
  "badge": "Fall Sale",
  "featured": true,
  "bullets": ["Shown with orange check marks", "Keep them short"],
  "images": ["images/curl-comb-1.jpg", "images/curl-comb-2.jpg"],
  "styles": ["Black", "Beige"],
  "packs": [
    { "qty": 1, "label": "" },
    { "qty": 2, "off": 10, "label": "Most popular" },
    { "qty": 3, "off": 20, "label": "Best value" }
  ],
  "packNoun": ["comb", "combs"],
  "stock": null,
  "specs": "Details and specifications accordion text",
  "howToUse": "How and who can use it accordion text",
  "clips": [{ "src": "images/curl-clip-1.mp4", "caption": "POV: no more heat damage" }],
  "reviews": []
}
```

- `id`: lowercase letters, numbers and dashes. The product link is `qafizz.com/product.html?id=<id>`.
- `was`: old price for the crossed-out price, or `null`. `badge` is the little pill next to the price (like "Fall Sale"), or `""`.
- `featured: true` puts the product in the big "The one you came for" section on the home page. Use it on one product only.
- `images`: put photos in the `images/` folder. The first one is the main photo. Portrait photos (4:5) look best.
- `packs`: the "Choose your pack" bundle cards. `off` is the extra % off for that bundle. Use `[]` for no bundles.
- `stock`: a real number shows "Only X left in stock" when it's 20 or less. Leave it `null` if you don't know the real number.
- `clips`: vertical TikTok-style videos (.mp4) or photos for the "Seen on your For You page" strip. Use only clips you made or have permission to use. Leave `[]` to hide the strip.
- Commas matter in JSON. Every item except the last one in a list needs a comma after it.

## Add a real review

Only add reviews that real customers sent you, with their OK to post them:

```json
"reviews": [
  { "name": "Jazmin G.", "date": "2026-09-20", "stars": 5, "text": "Heats up fast and works great.", "photo": "images/review-jazmin.jpg" }
]
```

`photo` is optional. Reviews show in the slider on the product and in the "Don't just listen to us" section on the home page.

## Turn on checkout (one time)

1. **Stripe:** sign up at stripe.com, finish account activation and connect your bank. Copy your **secret key** from Developers > API keys (it starts with `sk_live_`). Never put it in this website's files.
2. **Cloudflare:** Workers & Pages > Create > Create Worker. Name it `qafizz-checkout` and click Deploy. Then click Edit code, replace everything with the contents of `checkout-worker.js`, and Deploy again.
3. In that worker: Settings > Variables and Secrets > Add. Choose type **Secret**, name `STRIPE_SECRET_KEY`, and paste your secret key.
4. Copy the worker's address (something like `https://qafizz-checkout.yourname.workers.dev`) into `js/config.js` as `checkoutUrl`, then publish the site.

After that, Checkout opens a Stripe page that asks for card, Apple Pay or Google Pay and a shipping address. You get the order with its style and address in your Stripe dashboard under Payments. Then order it from your supplier.

## After you edit anything

When you change `css/` or `js/` files, bump the `?v=` number in the five `.html` files, otherwise visitors may see the old version for up to 10 minutes. Product edits in `products.json` show up within 5 minutes.
