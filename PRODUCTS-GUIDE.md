# Running the Qafizz store

## Add or change a product

Edit `products.json`. Each product looks like this:

```json
{
  "id": "curl-comb",
  "name": "Full product title shown on the product page",
  "short": "Short name for the cart and tab",
  "price": 39.99,
  "was": 54.99,
  "tags": ["bestseller", "lightning"],
  "details": ["Bullet point one", "Bullet point two"],
  "images": ["images/curl-comb-1.jpg", "images/curl-comb-2.jpg"],
  "styles": ["Black", "Beige"],
  "reviews": []
}
```

- `id`: lowercase letters, numbers and dashes. The product link is `qafizz.com/product.html?id=<id>`.
- `was`: old price for the sale tag, or `null`.
- `tags` controls where it shows up:
  - `lightning`: Lightning Deals row on the home page
  - `unbeatable`: Unbeatable Deals row
  - `bestseller`: Best-Selling Items and the green "BEST-SELLING ITEM" line
  - `new`: New In
- `images`: put photos in the `images/` folder. The first one is the main photo. Square photos look best.
- `styles`: options the buyer picks (colours, sizes). Use `[]` for none.
- Commas matter in JSON. Every item except the last one in a list needs a comma after it.

## Add a real review

Only add reviews that real customers sent you. Put them in the product's `reviews` list:

```json
"reviews": [
  { "name": "Jazmin G.", "country": "CA", "date": "2026-09-20", "stars": 5, "text": "Heats up fast and works great." }
]
```

`country` is `CA` or `US` and shows the flag. The review count, the star average and the 5-Star Rated filter all update on their own.

## Turn on checkout (one time)

1. **Stripe:** sign up at stripe.com, finish account activation and connect your bank. Copy your **secret key** from Developers > API keys (it starts with `sk_live_`). Never put it in this website's files.
2. **Cloudflare:** Workers & Pages > Create > Create Worker. Name it `qafizz-checkout` and click Deploy. Then click Edit code, replace everything with the contents of `checkout-worker.js`, and Deploy again.
3. In that worker: Settings > Variables and Secrets > Add. Choose type **Secret**, name `STRIPE_SECRET_KEY`, and paste your secret key.
4. Copy the worker's address (something like `https://qafizz-checkout.yourname.workers.dev`) into `js/config.js` as `checkoutUrl`, then publish the site.

After that, Checkout opens a Stripe page that asks for card, Apple Pay or Google Pay and a shipping address. You get the order with its style and address in your Stripe dashboard under Payments. Then order it from your supplier.

## After you edit anything

When you change `css/` or `js/` files, bump the `?v=` number in the four `.html` files, otherwise visitors may see the old version for up to 10 minutes. Product edits in `products.json` show up within 5 minutes.
