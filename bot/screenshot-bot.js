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
  search: '#searchInput',       // filters the feed on every input event
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
      return topics[Math.floor(Math.random() * topics.length)].t;
    });

    if (!chosen) console.log('window.TRENDY_TOPICS was empty — using the visible feed only');

    if (chosen) {
      console.log(`Searching for "${chosen}"`);
      // Type it in for real — the filter runs off the input event (app.js:1497).
      await page.click(SEL.search);
      await page.type(SEL.search, chosen, { delay: 10 });
      await new Promise((r) => setTimeout(r, 900));

      const hits = await page.$$eval(SEL.card, (els) => els.length);
      if (!hits) {
        // Search found nothing — clear it and fall back to the default feed.
        console.log(`No match for "${chosen}", falling back to the feed`);
        await page.evaluate((s) => { document.querySelector(s).value = ''; }, SEL.search);
        await page.type(SEL.search, ' ', { delay: 10 });
        await page.keyboard.press('Backspace');
        await new Promise((r) => setTimeout(r, 900));
      }
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

  /* Trim: a trailing newline picked up when pasting into the secrets box breaks
     the OAuth signature and is invisible in the GitHub UI. Lengths are logged
     (never values) because a wrong length is the clearest signal of a truncated
     paste or a value from the wrong field. Expected: 25 / 50 / 50 / 45. */
  const creds = {};
  for (const k of need) creds[k] = (process.env[k] || '').trim();

  console.log('Credential lengths — ' + need
    .map((k) => `${k.replace('X_', '')}:${creds[k].length}`)
    .join('  ') + '   (expected KEY:25  SECRET:50  TOKEN:50  ACCESS_SECRET:45)');

  if (!creds.X_ACCESS_TOKEN.includes('-')) {
    console.log('WARNING: access token has no "-" — it should look like 1906...-CWTN...');
  }

  const x = new TwitterApi({
    appKey: creds.X_API_KEY,
    appSecret: creds.X_API_SECRET,
    accessToken: creds.X_ACCESS_TOKEN,
    accessSecret: creds.X_ACCESS_SECRET,
  });

  /* Verify the credentials on their own first. A 401 here means the four keys
     are wrong or mismatched; a 401 only on the upload below means the keys are
     fine but the app lacks access to the v1.1 media endpoint. */
  try {
    const me = await x.v2.me();
    console.log(`Authenticated as @${me.data.username}`);
  } catch (e) {
    // X's own error body says far more than the status line does.
    console.log('--- X error detail ---');
    console.log(JSON.stringify(e.data || e.errors || {}, null, 2));

    // v1.1 uses a different auth path; if it succeeds the keys are actually fine.
    try {
      const u = await x.v1.verifyCredentials();
      console.log(`v1.1 auth DID work — @${u.screen_name}. The keys are valid.`);
    } catch (e2) {
      console.log(`v1.1 auth also failed: ${e2.message}`);
    }
    console.log('----------------------');

    throw new Error(`Credential check failed (${e.code || '?'}): ${e.message}`);
  }

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
