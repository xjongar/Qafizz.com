/* Qafizz poll bot — opens a random tier list on the live site, screenshots the
   detail panel, and posts it to X with a caption built from the real numbers.

   Selectors here mirror js/app.js and index.html. If the markup changes, the
   three constants in SEL are the only things that should need touching. */

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const { TwitterApi } = require('twitter-api-v2');

const SITE = process.env.SITE_URL || 'https://qafizz.com';
const SHOT = path.join(__dirname, 'poll-screenshot.png');
const DRY_RUN = process.argv.includes('--dry-run');

const SEL = {
  card: '.tier-card-main',      // feed card; click handler opens Detail (app.js:896)
  overlay: '#detailOverlay',    // wrapper, carries the [hidden] attribute
  panel: '.detail-panel',       // the actual card we screenshot (index.html:160)
};

/* The panel contains an ad slot and the whole comments thread below the tier
   rows. Both are dead weight in a screenshot, so they come out before capture. */
const HIDE_IN_SHOT = ['.detail-panel .ad-banner', '.detail-panel .comments'];

function buildCaption({ title, meta, items }) {
  const [first, second] = items;
  const votes = (meta.match(/([\d,]+)\s+votes?/) || [])[1];

  let body;
  if (first && second) {
    body = `${first.name} is out front on ${title} — ${first.pct}, with ${second.name} close behind at ${second.pct}.`;
  } else if (first) {
    body = `${first.name} is leading ${title} at ${first.pct}.`;
  } else {
    body = `${title} is live.`;
  }

  const tally = votes ? ` ${votes} votes in.` : '';
  return `${body}${tally} Think that's wrong? Vote → ${SITE.replace(/^https?:\/\//, '')}`;
}

async function capture() {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    // deviceScaleFactor 2 keeps text crisp once X recompresses the image.
    await page.setViewport({ width: 1200, height: 1000, deviceScaleFactor: 2 });

    console.log(`Loading ${SITE}`);
    await page.goto(SITE, { waitUntil: 'networkidle2', timeout: 60000 });
    await page.waitForSelector(SEL.card, { timeout: 30000 });

    /* The feed only renders PAGE_SIZE (12) cards at a time, so sampling the
       visible cards would draw from the same dozen every run. Instead pick from
       the whole seed corpus and use the site's own search to surface that one
       card — every topic is reachable in a single step, no pagination.

       Falls back to picking from whatever is on screen if the internals aren't
       reachable (Feed is a top-level const, not hung off window). */
    const chosen = await page.evaluate(() => {
      const topics = window.TRENDY_TOPICS || [];
      if (!topics.length) return null;
      const t = topics[Math.floor(Math.random() * topics.length)];
      try {
        Feed.setQuery(t.t);
        return t.t;
      } catch (e) {
        return null;
      }
    });

    if (chosen) {
      console.log(`Searching for "${chosen}"`);
      await new Promise((r) => setTimeout(r, 800));
    }

    /* Polls have no URLs of their own — the feed is client-rendered and a card
       opens via a JS click handler, so picking one means clicking one. */
    const count = await page.$$eval(SEL.card, (els) => els.length);
    if (!count) throw new Error('No poll cards found in the feed.');

    const pick = chosen ? 0 : Math.floor(Math.random() * count);
    console.log(chosen ? `Opening "${chosen}"` : `Opening poll ${pick + 1} of ${count}`);
    await page.evaluate((sel, i) => document.querySelectorAll(sel)[i].click(), SEL.card, pick);

    // Overlay is hidden via the [hidden] attribute, so wait on it being gone.
    await page.waitForSelector(`${SEL.overlay}:not([hidden])`, { timeout: 15000 });
    await new Promise((r) => setTimeout(r, 1500)); // let the bar-width animation settle

    const data = await page.evaluate((sel, hide) => {
      hide.forEach((h) => document.querySelectorAll(h).forEach((el) => { el.style.display = 'none'; }));
      const text = (el) => (el ? el.textContent.trim() : '');
      return {
        title: text(document.querySelector('#detailTitle')),
        meta: text(document.querySelector('#detailMeta')),
        items: Array.from(document.querySelectorAll(`${sel} .tier-row`))
          .slice(0, 3)
          .map((row) => ({
            name: text(row.querySelector('.tier-row-label')),
            pct: text(row.querySelector('.tier-row-pct')),
          })),
      };
    }, SEL.panel, HIDE_IN_SHOT);

    if (!data.title) throw new Error('Poll opened but the title was empty.');

    const panel = await page.$(SEL.panel);
    await panel.screenshot({ path: SHOT });
    console.log(`Captured "${data.title}" -> ${SHOT}`);

    return data;
  } finally {
    await browser.close();
  }
}

async function post(caption) {
  const need = ['X_API_KEY', 'X_API_SECRET', 'X_ACCESS_TOKEN', 'X_ACCESS_SECRET'];
  const missing = need.filter((k) => !process.env[k]);
  if (missing.length) throw new Error(`Missing secrets: ${missing.join(', ')}`);

  const x = new TwitterApi({
    appKey: process.env.X_API_KEY,
    appSecret: process.env.X_API_SECRET,
    accessToken: process.env.X_ACCESS_TOKEN,
    accessSecret: process.env.X_ACCESS_SECRET,
  });

  const mediaId = await x.v1.uploadMedia(SHOT);
  const { data } = await x.v2.tweet({ text: caption, media: { media_ids: [mediaId] } });
  return data.id;
}

(async () => {
  const data = await capture();
  const caption = buildCaption(data);

  console.log(`\nCaption (${caption.length} chars):\n${caption}\n`);

  if (DRY_RUN) {
    console.log('Dry run — nothing posted. Screenshot is at ' + SHOT);
    return;
  }

  const id = await post(caption);
  console.log(`Posted: https://x.com/i/web/status/${id}`);
})().catch((err) => {
  console.error('Failed:', err.message);
  if (fs.existsSync(SHOT)) console.error('(screenshot was saved, so the failure came after capture)');
  process.exit(1);
});
