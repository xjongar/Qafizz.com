/* ==========================================================================
   TRUST ME BRO — share.js
   Turns any ranking into a shareable image card and pushes it to X (Twitter).

   The card IS the marketing: a screenshottable ranking with the hot take baked
   in, watermarked back to qafizz.com. Rendered on a <canvas> at export
   resolution so it stays crisp when re-posted. Colours are read live from the
   current theme's CSS variables, so a card matches whatever theme the visitor
   is looking at (neon-lime dark or muted-orange light).

   X's web compose (intent/tweet) takes text + url + hashtags but CANNOT attach
   an image, so we copy the PNG to the clipboard and open X pre-filled — the user
   pastes to attach. On mobile, navigator.share hands the file straight to the X
   app instead. Plain script, no modules, to match the rest of the site.
   ========================================================================== */

window.ShareCard = (() => {
  const SITE_URL = "https://qafizz.com"; // where the app lives (redirect target)
  /* Where the /r/<id> preview Worker runs. The apex stays DNS-only so GitHub
     Pages keeps its cert, and Worker routes only fire on PROXIED traffic — so
     the Worker lives on a proxied subdomain. If you route it on the apex
     instead, set this back to SITE_URL. See SHARE-CARDS-SETUP.md. */
  const CARD_HOST = "https://s.qafizz.com";
  const MAX_BARS = 8;

  /* Pull a colour from the live theme so the card tracks dark/light. */
  function v(name, fallback) {
    const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return raw || fallback;
  }

  function palette() {
    return {
      bg:       v("--bg-card", "#171917"),
      panel:    v("--bg-elevated", "#131513"),
      hover:    v("--bg-hover", "#1e211e"),
      text:     v("--text", "#f4f6f4"),
      muted:    v("--text-muted", "#9aa39a"),
      faint:    v("--text-faint", "#5f675f"),
      accent:   v("--accent", "#b6ff2e"),
      onAccent: v("--on-accent", "#0c0d0c"),
      border:   v("--border", "#242824"),
      tier: {
        S: v("--tier-s", "#b6ff2e"),
        A: v("--tier-a", "#b6ff2e"),
        B: v("--tier-b", "#939fb1"),
        C: v("--tier-c", "#939fb1"),
        D: v("--tier-d", "#939fb1"),
      },
    };
  }

  const fmt = (n) =>
    window.Votes && Votes.format
      ? Votes.format(n)
      : n >= 1000
      ? (n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, "") + "k"
      : String(n);

  /* ---------- canvas helpers ---------- */

  function roundRect(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function ellipsize(ctx, text, maxWidth) {
    if (ctx.measureText(text).width <= maxWidth) return text;
    let t = text;
    while (t.length && ctx.measureText(t + "…").width > maxWidth) t = t.slice(0, -1);
    return t.replace(/\s+$/, "") + "…";
  }

  function wrapLines(ctx, text, maxWidth, maxLines) {
    const words = String(text).split(/\s+/);
    const lines = [];
    let line = "";
    for (const word of words) {
      const trial = line ? line + " " + word : word;
      if (ctx.measureText(trial).width > maxWidth && line) {
        lines.push(line);
        line = word;
        if (lines.length === maxLines - 1) break;
      } else {
        line = trial;
      }
    }
    // Whatever is left (plus any words we broke out early on) goes on the last line.
    const restIndex = lines.reduce((n, l) => n + l.split(" ").length, 0);
    const rest = words.slice(restIndex).join(" ") || line;
    lines.push(ellipsize(ctx, rest, maxWidth));
    return lines.slice(0, maxLines);
  }

  /* ---------- the card ---------- */

  const FONT = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

  /* 1200x630 landscape — the ratio X/Facebook/Discord show without cropping.
     Left column: brand, category, title, meta, CTA. Right column: the bars. */
  function draw(list, entries) {
    const p = palette();
    const W = 1200;
    const H = 630;

    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    ctx.textBaseline = "alphabetic";

    // Columns
    const LX = 56;                 // left column start
    const LW = 470;                // left column width
    const RX = 576;                // right column start
    const RW = W - RX - 56;        // right column width

    // Background + accent top bar
    ctx.fillStyle = p.bg;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = p.accent;
    ctx.fillRect(0, 0, W, 10);

    // ---- LEFT COLUMN ----
    // Brand mark + wordmark
    ctx.fillStyle = p.accent;
    roundRect(ctx, LX, 54, 74, 74, 18);
    ctx.fill();
    ctx.fillStyle = p.onAccent;
    ctx.font = `800 32px ${FONT}`;
    ctx.textAlign = "center";
    ctx.fillText("TM", LX + 37, 54 + 49);
    ctx.textAlign = "left";
    ctx.font = `800 34px ${FONT}`;
    ctx.fillStyle = p.text;
    ctx.fillText("Trust Me ", LX + 74 + 20, 54 + 48);
    const tmW = ctx.measureText("Trust Me ").width;
    ctx.fillStyle = p.accent;
    ctx.fillText("Bro", LX + 74 + 20 + tmW, 54 + 48);

    // Category (accent, uppercase)
    let ly = 186;
    if (list.category) {
      ctx.font = `700 22px ${FONT}`;
      ctx.fillStyle = p.accent;
      ctx.fillText(ellipsize(ctx, list.category.toUpperCase(), LW), LX, ly);
      ly += 20;
    }

    // Title — wrap to the left column, up to 4 lines
    const titleFont = `800 50px ${FONT}`;
    ctx.font = titleFont;
    const titleLines = wrapLines(ctx, list.title, LW, 4);
    ctx.fillStyle = p.text;
    titleLines.forEach((ln, i) => ctx.fillText(ln, LX, ly + 44 + i * 56));
    ly = ly + 44 + titleLines.length * 56;

    // Meta
    ctx.font = `500 26px ${FONT}`;
    ctx.fillStyle = p.muted;
    ctx.fillText(`by @${list.author || "someone"} · ${fmt(list.votes || 0)} votes`, LX, ly + 8);

    // CTA pinned near the bottom of the left column
    ctx.font = `700 30px ${FONT}`;
    ctx.fillStyle = p.text;
    ctx.fillText("Vote on the real ranking →", LX, H - 96);
    ctx.font = `800 36px ${FONT}`;
    ctx.fillStyle = p.accent;
    ctx.fillText("qafizz.com", LX, H - 50);

    // Divider
    ctx.strokeStyle = p.border;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(RX - 28, 60);
    ctx.lineTo(RX - 28, H - 48);
    ctx.stroke();

    // ---- RIGHT COLUMN: bars ----
    const bars = entries.slice(0, MAX_BARS);
    const extra = Math.max(0, entries.length - bars.length);
    const maxShare = bars.reduce((m, e) => Math.max(m, e.share || 0), 0) || 1;

    const rowH = extra ? 62 : 68;
    const trackH = 22;
    const top0 = 66;
    bars.forEach((e, i) => {
      const top = top0 + i * rowH;
      const tierColor = p.tier[e.tier] || p.accent;
      const pct = (e.share || 0).toFixed(1) + "%";

      ctx.font = `700 28px ${FONT}`;
      ctx.fillStyle = tierColor;
      ctx.textAlign = "right";
      const pctW = ctx.measureText(pct).width;
      ctx.fillText(pct, RX + RW, top + 26);

      ctx.textAlign = "left";
      ctx.fillStyle = p.text;
      ctx.font = `600 28px ${FONT}`;
      ctx.fillText(ellipsize(ctx, `${i + 1}.  ${e.item}`, RW - pctW - 18), RX, top + 26);

      const trackY = top + 38;
      ctx.fillStyle = p.hover;
      roundRect(ctx, RX, trackY, RW, trackH, trackH / 2);
      ctx.fill();
      ctx.fillStyle = tierColor;
      roundRect(ctx, RX, trackY, Math.max(trackH, (e.share / maxShare) * RW), trackH, trackH / 2);
      ctx.fill();
    });

    if (extra) {
      ctx.textAlign = "left";
      ctx.fillStyle = p.faint;
      ctx.font = `500 24px ${FONT}`;
      ctx.fillText(`+ ${extra} more pick${extra > 1 ? "s" : ""}`, RX, top0 + bars.length * rowH + 22);
    }

    return canvas;
  }

  /* ---------- tweet text ---------- */

  function tagFrom(str) {
    const t = String(str || "").replace(/[^a-z0-9]/gi, "");
    return t ? t.charAt(0).toUpperCase() + t.slice(1) : "";
  }

  /* One post in the Trust Me Bro voice. Category sits on top, then the take,
     then a full blank line before the link and another before the hashtags —
     so X and WhatsApp lay it out with real spacing. No quotes, no dashes. */
  function tweetParts(list) {
    const category = list.category || "Tier List";
    const tags = ["TierList", "TrustMeBro", tagFrom(list.category)]
      .filter(Boolean)
      .map((h) => "#" + h)
      .join(" ");
    const body =
      category + "\n\n" +
      list.title + " ranked. trust me bro 🏆\n" +
      "you're gonna disagree. vote on the real order 👇";
    return { body, tags };
  }

  /* Per-list link the Cloudflare Worker serves at /r/<id>: it returns HTML with
     this ranking's own og:image (the uploaded card) so X/Facebook/Discord show
     the ranking in the preview, then redirects a human visitor to /?list=<id>.
     Just the id — the card image already carries the title, so no query string. */
  function shareUrl(list) {
    return CARD_HOST + "/r/" + encodeURIComponent(list.id);
  }

  /* Everything rides in the text field so the blank lines survive — the intent's
     separate url/hashtags params would get appended with no spacing at all. */
  function tweetText(list, includeUrl) {
    const { body, tags } = tweetParts(list);
    return body + (includeUrl ? "\n\n" + shareUrl(list) : "") + "\n\n" + tags;
  }

  function xIntentUrl(list) {
    const q = new URLSearchParams({ text: tweetText(list, true) });
    return "https://twitter.com/intent/tweet?" + q.toString();
  }

  /* Web share URLs for every network that accepts a pre-filled compose link.
     `copyFirst` marks the ones that let you attach an image after paste — we
     copy the PNG to the clipboard before opening those. Facebook only reads the
     link's own preview, so text/image there come from the page, not the URL. */
  function shareTargets(list) {
    const url = encodeURIComponent(shareUrl(list));
    const redditTitle = encodeURIComponent(list.title + " ranked on Trust Me Bro. vote on the real order");
    const waText = encodeURIComponent(tweetText(list, true));
    const tgText = encodeURIComponent(tweetText(list, false));
    return [
      { key: "reddit",   label: "Reddit",   copyFirst: true,  href: `https://www.reddit.com/submit?url=${url}&title=${redditTitle}` },
      { key: "facebook", label: "Facebook", copyFirst: false, href: `https://www.facebook.com/sharer/sharer.php?u=${url}` },
      { key: "whatsapp", label: "WhatsApp", copyFirst: false, href: `https://api.whatsapp.com/send?text=${waText}` },
      { key: "telegram", label: "Telegram", copyFirst: false, href: `https://t.me/share/url?url=${url}&text=${tgText}` },
    ];
  }

  /* ---------- overlay UI ---------- */

  let els = null;
  let current = { blob: null, url: null, list: null };
  const uploaded = new Set(); // ranking ids whose card is already in Storage this session

  function injectStyles() {
    if (document.getElementById("sc-styles")) return;
    const css = `
      .sc-overlay{position:fixed;inset:0;z-index:1000;display:flex;align-items:center;
        justify-content:center;padding:1.25rem;background:rgba(0,0,0,.62);
        backdrop-filter:blur(4px);overflow-y:auto;}
      .sc-overlay[hidden]{display:none;}
      .sc-panel{position:relative;width:min(560px,100%);background:var(--bg-elevated);
        border:1px solid var(--border);border-radius:20px;box-shadow:var(--shadow-pop);
        padding:1.5rem;margin:auto;}
      .sc-panel h2{font-size:1.25rem;margin:0 0 .25rem;}
      .sc-sub{color:var(--text-muted);font-size:.9rem;margin:0 0 1rem;}
      .sc-preview{border:1px solid var(--border);border-radius:14px;overflow:hidden;
        background:var(--bg-card);line-height:0;}
      .sc-preview img{width:100%;height:auto;display:block;}
      .sc-actions{display:grid;grid-template-columns:1fr 1fr;gap:.6rem;margin-top:1.1rem;}
      .sc-actions .sc-x{grid-column:1/-1;}
      .sc-utils{margin-top:.6rem;grid-template-columns:1fr 1fr 1fr;}
      .sc-networks{display:grid;grid-template-columns:repeat(4,1fr);gap:.6rem;margin-top:.6rem;}
      .sc-net{display:flex;flex-direction:column;align-items:center;justify-content:center;
        gap:.35rem;padding:.7rem .4rem;border-radius:11px;border:1px solid var(--border);
        background:transparent;color:var(--text-muted);font-weight:600;font-size:.78rem;
        cursor:pointer;transition:all .15s ease;}
      .sc-net:hover{color:var(--text);border-color:var(--border-strong);background:var(--bg-hover);}
      .sc-net svg{width:22px;height:22px;}
      @media(max-width:420px){.sc-networks{grid-template-columns:repeat(2,1fr);}
        .sc-utils{grid-template-columns:1fr;}}
      .sc-btn{display:inline-flex;align-items:center;justify-content:center;gap:.5rem;
        padding:.7rem 1rem;border-radius:11px;font-weight:600;font-size:.92rem;
        border:1px solid var(--border-strong);color:var(--text);background:transparent;
        cursor:pointer;transition:all .15s ease;}
      .sc-btn:hover{border-color:var(--accent);color:var(--accent);}
      .sc-btn.sc-x{background:#000;color:#fff;border-color:#000;font-size:1rem;padding:.85rem 1rem;}
      .sc-btn.sc-x:hover{background:#111;color:#fff;}
      :root[data-theme="light"] .sc-btn.sc-x{background:#000;color:#fff;}
      .sc-hint{color:var(--text-faint);font-size:.8rem;margin:.9rem 0 0;text-align:center;}
      .sc-close{position:absolute;top:.75rem;right:.75rem;width:34px;height:34px;
        border-radius:9px;border:none;background:var(--bg-hover);color:var(--text-muted);
        font-size:1.25rem;line-height:1;cursor:pointer;}
      .sc-close:hover{color:var(--text);}
      .sc-toast{position:fixed;left:50%;bottom:2rem;transform:translateX(-50%);
        background:var(--accent);color:var(--on-accent);font-weight:600;font-size:.9rem;
        padding:.7rem 1.1rem;border-radius:11px;box-shadow:var(--shadow-pop);z-index:1100;
        max-width:90vw;text-align:center;}
      .sc-toast[hidden]{display:none;}
      @media(max-width:420px){.sc-actions{grid-template-columns:1fr;}}
    `;
    const style = document.createElement("style");
    style.id = "sc-styles";
    style.textContent = css;
    document.head.appendChild(style);
  }

  function build() {
    injectStyles();
    const overlay = document.createElement("div");
    overlay.className = "sc-overlay";
    overlay.hidden = true;
    overlay.innerHTML = `
      <div class="sc-panel" role="dialog" aria-modal="true" aria-label="Share this ranking">
        <button class="sc-close" aria-label="Close">&times;</button>
        <h2>Share your ranking</h2>
        <p class="sc-sub">Post the card to X — the link and hashtags are written for you.</p>
        <div class="sc-preview"><img alt="Ranking card preview" /></div>
        <div class="sc-actions">
          <button class="sc-btn sc-x">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.66l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            Share to X
          </button>
          <button class="sc-btn sc-native" hidden>Share…</button>
        </div>
        <div class="sc-networks"></div>
        <div class="sc-actions sc-utils">
          <button class="sc-btn sc-download">Download image</button>
          <button class="sc-btn sc-copyimg">Copy image</button>
          <button class="sc-btn sc-copylink">Copy link</button>
        </div>
        <p class="sc-hint">Reddit &amp; X can't auto-attach — the image is copied, so just paste (Ctrl / ⌘ V) into your post. Download it for TikTok, Instagram or Discord.</p>
      </div>
      <div class="sc-toast" hidden></div>
    `;
    document.body.appendChild(overlay);

    els = {
      overlay,
      panel: overlay.querySelector(".sc-panel"),
      img: overlay.querySelector(".sc-preview img"),
      close: overlay.querySelector(".sc-close"),
      x: overlay.querySelector(".sc-x"),
      native: overlay.querySelector(".sc-native"),
      networks: overlay.querySelector(".sc-networks"),
      download: overlay.querySelector(".sc-download"),
      copyimg: overlay.querySelector(".sc-copyimg"),
      copylink: overlay.querySelector(".sc-copylink"),
      toast: overlay.querySelector(".sc-toast"),
    };

    els.close.addEventListener("click", hide);
    overlay.addEventListener("click", (e) => { if (e.target === overlay) hide(); });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !overlay.hidden) hide();
    });

    els.x.addEventListener("click", shareToX);
    els.native.addEventListener("click", nativeShare);
    els.download.addEventListener("click", download);
    els.copyimg.addEventListener("click", () => copyImage().then((ok) =>
      toast(ok ? "Image copied to clipboard" : "Copy failed — try Download instead")));
    els.copylink.addEventListener("click", () => {
      copyText(current.list ? shareUrl(current.list) : SITE_URL);
      toast("Link copied");
    });
  }

  let toastTimer = null;
  function toast(msg) {
    if (!els) return;
    els.toast.textContent = msg;
    els.toast.hidden = false;
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (els.toast.hidden = true), 3200);
  }

  function copyText(text) {
    try {
      navigator.clipboard && navigator.clipboard.writeText(text);
    } catch (e) {}
  }

  async function copyImage() {
    if (!current.blob || !navigator.clipboard || !window.ClipboardItem) return false;
    try {
      await navigator.clipboard.write([new ClipboardItem({ "image/png": current.blob })]);
      return true;
    } catch (e) {
      return false;
    }
  }

  function download() {
    if (!current.url) return;
    const a = document.createElement("a");
    a.href = current.url;
    const slug = (current.list.title || "ranking").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);
    a.download = `qafizz-${slug || "ranking"}.png`;
    a.click();
  }

  /* X web compose can't attach an image, so copy it first and tell the user to
     paste. The intent opens pre-filled with the tweet text, link and hashtags. */
  async function shareToX() {
    const copied = await copyImage();
    window.open(xIntentUrl(current.list), "_blank", "noopener");
    toast(copied
      ? "Image copied — paste it (Ctrl/⌘V) into your X post"
      : "X opened — download the image and attach it to your post");
  }

  const NET_ICONS = {
    reddit: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2m5.01 11.31c.02.16.03.32.03.49 0 2.49-2.9 4.51-6.48 4.51s-6.48-2.02-6.48-4.51c0-.17.01-.33.03-.49a1.4 1.4 0 0 1 .79-2.56c.38 0 .72.15.97.39a4.8 4.8 0 0 1 2.62-.83l.5-2.34 1.62.35a1.02 1.02 0 1 1 .96 1.34l-1.35-.29-.44 2.07c1.03.05 1.97.36 2.72.84.25-.24.59-.39.97-.39a1.4 1.4 0 0 1 .5 2.72m-6.7.32c0 .53-.43.96-.96.96s-.96-.43-.96-.96.43-.96.96-.96.96.43.96.96m4.66 1.9c-.6.6-1.86.65-2.23.65s-1.63-.05-2.23-.65a.25.25 0 0 1 .36-.35c.38.38 1.19.51 1.87.51s1.49-.13 1.87-.51a.25.25 0 0 1 .36.35m-.28-.94c-.53 0-.96-.43-.96-.96s.43-.96.96-.96.96.43.96.96-.43.96-.96.96"/></svg>',
    facebook: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.25h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07"/></svg>',
    whatsapp: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.21-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.01-1.04 2.47s1.06 2.86 1.21 3.06c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.62.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.42-.07-.13-.27-.2-.57-.35M12.05 21.8h-.02a9.8 9.8 0 0 1-4.99-1.37l-.36-.21-3.71.97.99-3.62-.23-.37a9.8 9.8 0 0 1-1.5-5.22c0-5.42 4.42-9.83 9.85-9.83a9.8 9.8 0 0 1 6.96 2.89 9.75 9.75 0 0 1 2.88 6.95c0 5.42-4.42 9.83-9.85 9.83M20.52 3.45A11.8 11.8 0 0 0 12.05 0C5.5 0 .16 5.33.16 11.88c0 2.09.55 4.14 1.58 5.95L.06 24l6.33-1.66a11.9 11.9 0 0 0 5.66 1.44h.01c6.55 0 11.89-5.33 11.89-11.88 0-3.17-1.24-6.16-3.48-8.4"/></svg>',
    telegram: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M11.94 0C5.35 0 0 5.35 0 11.94c0 6.6 5.35 11.94 11.94 11.94s11.94-5.35 11.94-11.94C23.88 5.35 18.53 0 11.94 0m5.53 8.19-1.85 8.72c-.14.62-.5.77-1.02.48l-2.82-2.08-1.36 1.31c-.15.15-.28.28-.57.28l.2-2.87 5.23-4.72c.23-.2-.05-.32-.35-.12L8.94 13.5l-2.79-.87c-.61-.19-.62-.61.13-.9l10.9-4.2c.5-.19.95.12.79.86"/></svg>',
  };

  function renderNetworks(list) {
    els.networks.innerHTML = "";
    shareTargets(list).forEach((t) => {
      const btn = document.createElement("button");
      btn.className = "sc-net sc-net--" + t.key;
      btn.type = "button";
      btn.innerHTML = `${NET_ICONS[t.key] || ""}<span>${t.label}</span>`;
      btn.addEventListener("click", async () => {
        if (t.copyFirst) {
          const copied = await copyImage();
          toast(copied
            ? `Image copied — paste it (Ctrl/⌘V) into your ${t.label} post`
            : `${t.label} opened — attach the downloaded image`);
        }
        window.open(t.href, "_blank", "noopener");
      });
      els.networks.appendChild(btn);
    });
  }

  async function nativeShare() {
    if (!current.blob) return;
    const file = new File([current.blob], "qafizz-ranking.png", { type: "image/png" });
    const text = tweetText(current.list, true);
    try {
      await navigator.share({ files: [file], text, title: current.list.title });
    } catch (e) {
      /* user cancelled or share failed — nothing to do */
    }
  }

  function hide() {
    if (els) els.overlay.hidden = true;
    document.body.style.overflow = "";
    if (current.url) {
      URL.revokeObjectURL(current.url);
      current.url = null;
    }
  }

  /* entries: [{ tier, item, share }] already sorted best→worst (Detail.entriesFor). */
  function open(list, entries) {
    if (!list || !Array.isArray(entries) || !entries.length) return;
    if (!els) build();

    const canvas = draw(list, entries);
    current.list = list;
    els.img.src = canvas.toDataURL("image/png");
    renderNetworks(list);

    canvas.toBlob((blob) => {
      if (current.url) URL.revokeObjectURL(current.url);
      current.blob = blob;
      current.url = blob ? URL.createObjectURL(blob) : null;
      /* Push the card to Supabase Storage as <id>.png so the Worker's /r/<id>
         page can point og:image at it. Upsert + a per-session guard keep it to
         one upload per ranking. A failure is non-fatal: the Worker falls back
         to the generic card, so sharing still works, just without the per-list
         preview image. */
      if (blob && window.Backend && Backend.uploadCard && !uploaded.has(String(list.id))) {
        uploaded.add(String(list.id));
        Backend.uploadCard(list.id, blob).then((r) => {
          if (r && r.error) {
            uploaded.delete(String(list.id));
            console.warn("[share] card upload failed:", r.error);
          }
        });
      }
    }, "image/png");

    // Native file share is the clean path on mobile (attaches to the X app).
    const canFiles = navigator.canShare && (() => {
      try { return navigator.canShare({ files: [new File([new Blob()], "x.png", { type: "image/png" })] }); }
      catch (e) { return false; }
    })();
    els.native.hidden = !canFiles;

    els.overlay.hidden = false;
    document.body.style.overflow = "hidden";
  }

  return { open, draw, xIntentUrl };
})();
