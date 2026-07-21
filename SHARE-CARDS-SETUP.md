# Per-ranking share cards — setup

Shared links like `s.qafizz.com/r/100` show **that ranking's own image** on X,
Facebook, Discord and iMessage. Two one-time setup steps make it live. Until you
do them, sharing still works — links just fall back to the generic site card.

How it fits together:

```
share.js  ──renders PNG──▶  Supabase Storage (cards/<id>.png)
   │
   └──shares link──▶  s.qafizz.com/r/<id>  ──Worker──▶  HTML w/ og:image = that PNG
                                                          └─redirects humans─▶ qafizz.com/?list=<id>
```

---

## Step 1 — Supabase Storage bucket (holds the card images)

1. Dashboard → **Storage** → **New bucket**
   - Name: `cards`
   - **Public bucket: ON** (so crawlers can fetch the images)
   - Create.
2. Dashboard → **SQL Editor** → run this (lets the site upload/overwrite cards;
   public read comes free with a public bucket):

   ```sql
   create policy "cards upload" on storage.objects
     for insert to public with check (bucket_id = 'cards');

   create policy "cards update" on storage.objects
     for update to public using (bucket_id = 'cards') with check (bucket_id = 'cards');
   ```

   > Anyone can write to this bucket, same as votes/comments. It only holds
   > throwaway preview PNGs (upsert overwrites by id), so the blast radius is
   > small. Tighten to `to authenticated` if you'd rather only signed-in users
   > generate cards.

Test: open any ranking on the site, hit **Share**. A file `<id>.png` should
appear under Storage → `cards`.

---

## Step 2 — Cloudflare Worker (serves the preview HTML)

The apex `qafizz.com` DNS is **grey-cloud / DNS-only** so GitHub Pages keeps its
cert — and Worker routes only fire on **proxied (orange-cloud)** traffic. So the
Worker runs on a proxied **subdomain**, `s.qafizz.com`, and redirects visitors
back to the apex app. The apex is left untouched.

1. **DNS** → add a record so the subdomain exists and is proxied:
   - Type `AAAA`, Name `s`, IPv6 `100::` (a discard address — the Worker route
     intercepts before it's ever used), **Proxy status: Proxied (orange)**.
   - (An `A` record `s` → `192.0.2.1` proxied works too — any placeholder is
     fine; the route takes over.)
2. **Workers & Pages** → **Create** → **Create Worker** → name it
   `qafizz-share` → **Deploy**.
3. **Edit code** → paste the contents of [`worker.js`](./worker.js) → **Deploy**.
4. The worker → **Settings** → **Domains & Routes** → **Add** → **Route**:
   - Route: `s.qafizz.com/r/*`
   - Zone: `qafizz.com`
   - Save.

Test:
- Visit `https://s.qafizz.com/r/100` — you should land on the site with that
  ranking open.
- Paste the same URL into the
  [X Card Validator](https://cards-dev.twitter.com/validator) — it should show
  the ranking's card. (X caches hard; the validator forces a refresh.)

---

## If you'd rather use the apex (`qafizz.com/r/...`)

Only if you move the site onto **Cloudflare Pages** (so the apex is proxied
already). Then set the route to `qafizz.com/r/*` and change **one line** in
`js/share.js`:

```js
const CARD_HOST = "https://qafizz.com";
```

Don't proxy the apex while it's still on GitHub Pages — that's what broke cert
issuance before.
