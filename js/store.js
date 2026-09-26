/* ==========================================================================
   QAFIZZ - store (header, cart drawer, home, shop, product page)
   Products come from /products.json and settings from js/config.js.
   You should not need to edit this file.
   ========================================================================== */
(function () {
  "use strict";

  var CONFIG = window.QAFIZZ_CONFIG || {};
  var EMAIL = CONFIG.supportEmail || "qafizz@qafizz.com";
  var CART_KEY = "qafizz_cart_v2";
  var TINTS = ["#F6E1D3", "#F3E6DA", "#EFDCCB", "#F8E8DE", "#F1DED5"];
  var PRODUCTS = [];

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function esc(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function money(n) { return "$" + (Math.round(n * 100) / 100).toFixed(2); }
  function round2(n) { return Math.round(n * 100) / 100; }
  function tintFor(id) { var h = 0; for (var i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0; return TINTS[h % TINTS.length]; }
  function productUrl(p) { return "product.html?id=" + encodeURIComponent(p.id); }
  function findProduct(id) { return PRODUCTS.filter(function (p) { return p.id === id; })[0]; }
  function percentOff(was, now) { return was && was > now ? Math.round((1 - now / was) * 100) : 0; }

  /* ---------------- packs + pricing (the checkout worker uses the same maths) ---------------- */
  function packsOf(p) { return p.packs && p.packs.length ? p.packs : [{ qty: 1, label: "" }]; }
  function packPrice(p, i) { var k = packsOf(p)[i] || packsOf(p)[0]; return round2(p.price * k.qty * (1 - (k.off || 0) / 100)); }
  function packWas(p, i) { var k = packsOf(p)[i] || packsOf(p)[0]; return round2((p.was || p.price) * k.qty); }
  function nounFor(p, qty) { var n = p.packNoun || ["item", "items"]; return qty + " " + (qty === 1 ? n[0] : n[1]); }

  /* ---------------- icons ---------------- */
  var I = {
    user: '<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4.5 21c1-4.2 3.8-6.3 7.5-6.3s6.5 2.1 7.5 6.3"/></svg>',
    search: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
    bag: '<svg viewBox="0 0 24 24"><path d="M5 8h14l-1 13H6z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>',
    close: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg>',
    left: '<svg viewBox="0 0 24 24"><path d="m15 5-7 7 7 7"/></svg>',
    right: '<svg viewBox="0 0 24 24"><path d="m9 5 7 7-7 7"/></svg>',
    down: '<svg viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg>',
    lock: '<svg viewBox="0 0 24 24"><rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>',
    sparkle: '<svg viewBox="0 0 24 24"><path class="fill" d="M12 2c.6 4.6 2.4 7.4 8 10-5.6 2.6-7.4 5.4-8 10-.6-4.6-2.4-7.4-8-10 5.6-2.6 7.4-5.4 8-10z"/></svg>',
    menu: '<svg viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
    trash: '<svg viewBox="0 0 24 24"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></svg>'
  };
  function icon(n, cls) { return '<span class="ic ' + (cls || "") + '" aria-hidden="true">' + I[n] + "</span>"; }
  var CHECK = '<span class="tick" aria-hidden="true"><svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="9"/><path d="m6 10.5 2.6 2.6L14.5 7"/></svg></span>';

  /* ---------------- visuals ---------------- */
  function placeholder(p, big) {
    return '<div class="ph' + (big ? " ph-big" : "") + '" style="--tint:' + tintFor(p.id) + '" role="img" aria-label="' + esc(p.name) + ', photo coming soon">' +
      '<span class="ph-name">' + esc(p.name) + "</span><span class=\"ph-note\">Photo coming soon</span></div>";
  }
  function img(p, i, big) {
    var src = (p.images || [])[i || 0];
    return src ? '<img src="' + esc(src) + '" alt="' + esc(p.name) + '" loading="lazy" />' : placeholder(p, big);
  }
  function reviewStats(p) {
    var r = p.reviews || [];
    if (!r.length) return null;
    return { count: r.length, avg: r.reduce(function (a, x) { return a + Number(x.stars || 0); }, 0) / r.length };
  }
  function stars(n) {
    var s = "";
    for (var i = 1; i <= 5; i++) s += i <= Math.round(n) ? "★" : "☆";
    return '<span class="stars" role="img" aria-label="' + Number(n).toFixed(1) + ' out of 5 stars">' + s + "</span>";
  }
  function stamp() {
    return '<svg class="stamp" viewBox="0 0 120 120" aria-hidden="true"><defs><path id="stampCircle" d="M60 60m-42 0a42 42 0 1 1 84 0a42 42 0 1 1-84 0"/></defs>' +
      '<circle cx="60" cy="60" r="56" class="stamp-ring"/><circle cx="60" cy="60" r="52" class="stamp-ring thin"/>' +
      '<text><textPath href="#stampCircle" startOffset="0">QAFIZZ PICK · FREE SHIPPING · QAFIZZ PICK ·</textPath></text>' +
      '<path class="stamp-star" d="M60 40c1.2 9 4.8 14.6 16 20-11.2 5.4-14.8 11-16 20-1.2-9-4.8-14.6-16-20 11.2-5.4 14.8-11 16-20z"/></svg>';
  }
  function wave(cls) {
    return '<svg class="wave ' + cls + '" viewBox="0 0 1440 60" preserveAspectRatio="none" aria-hidden="true"><path d="M0 30 C 120 0 240 0 360 30 S 600 60 720 30 S 960 0 1080 30 S 1320 60 1440 30 V 60 H 0 Z"/></svg>';
  }

  /* ---------------- dates ---------------- */
  function addBusinessDays(d, n) {
    var x = new Date(d);
    while (n > 0) { x.setDate(x.getDate() + 1); if (x.getDay() !== 0 && x.getDay() !== 6) n--; }
    return x;
  }
  function longDate(d) { return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }); }

  /* ---------------- toast ---------------- */
  var toastTimer;
  function toast(msg) {
    var t = $("#toast");
    if (!t) return;
    t.textContent = msg; t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.hidden = true; }, 2600);
  }

  /* ---------------- cart ---------------- */
  var cart = (function () { try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; } catch (e) { return []; } })();
  function saveCart() {
    try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch (e) { /* private mode */ }
    renderCart();
  }
  function lines() {
    return cart.map(function (l, i) { var p = findProduct(l.id); return p ? { l: l, p: p, i: i } : null; }).filter(Boolean);
  }
  function lineTotal(x) { return packPrice(x.p, x.l.pack) * x.l.qty; }
  function addToCart(id, style, pack, qty) {
    var hit = cart.filter(function (l) { return l.id === id && l.style === style && l.pack === pack; })[0];
    if (hit) hit.qty = Math.min(20, hit.qty + qty); else cart.unshift({ id: id, style: style, pack: pack, qty: qty });
    saveCart();
  }

  function renderCart() {
    var d = $("#cartDrawer");
    if (!d) return;
    var ls = lines();
    var count = ls.reduce(function (a, x) { return a + x.l.qty; }, 0);
    $all(".bag-count").forEach(function (el) { el.textContent = count; });
    var total = ls.reduce(function (a, x) { return a + lineTotal(x); }, 0);
    d.innerHTML =
      '<div class="drawer-head"><h2>Your cart</h2><button type="button" class="icon-btn" id="cartClose" aria-label="Close cart">' + icon("close") + "</button></div>" +
      '<p class="drawer-free">' + CHECK + " Free shipping on every order</p>" +
      (ls.length ? '<div class="drawer-items">' + ls.map(function (x) {
        var k = packsOf(x.p)[x.l.pack] || packsOf(x.p)[0];
        var meta = [x.l.style, x.p.packs && x.p.packs.length ? nounFor(x.p, k.qty) : ""].filter(Boolean).join(" · ");
        return '<div class="ditem"><a class="ditem-img" href="' + productUrl(x.p) + '">' + img(x.p, 0) + "</a>" +
          '<div class="ditem-info"><a class="ditem-name" href="' + productUrl(x.p) + '">' + esc(x.p.name) + "</a>" +
          (meta ? '<span class="ditem-meta">' + esc(meta) + "</span>" : "") +
          '<div class="ditem-row"><div class="stepper small" data-line="' + x.i + '"><button type="button" data-step="-1" aria-label="Less">&minus;</button><span>' + x.l.qty + '</span><button type="button" data-step="1" aria-label="More">+</button></div>' +
          '<span class="ditem-price">' + money(lineTotal(x)) + "</span></div>" +
          '<button type="button" class="ditem-remove" data-remove="' + x.i + '">Remove</button></div></div>';
      }).join("") + "</div>" : '<p class="drawer-empty">Your cart is empty.</p><a class="pill-link" href="shop.html">Shop all finds &rarr;</a>') +
      (ls.length ? '<div class="drawer-foot"><div class="drawer-total"><span>Subtotal</span><strong>' + money(total) + "</strong></div>" +
        '<p class="drawer-note">Taxes, if any, are calculated at checkout.</p>' +
        '<button type="button" class="btn-main" id="checkoutBtn">Checkout</button><p class="drawer-msg" id="cartMsg" hidden></p></div>' : "");
  }
  function openCart() { document.body.classList.add("cart-open"); }
  function closeCart() { document.body.classList.remove("cart-open"); }

  function checkout() {
    var msg = $("#cartMsg"), btn = $("#checkoutBtn"), ls = lines();
    if (!ls.length) return;
    if (!CONFIG.checkoutUrl) {
      msg.hidden = false;
      msg.innerHTML = "Online checkout opens very soon. To order now, email <strong>" + esc(EMAIL) + "</strong>.";
      return;
    }
    btn.disabled = true; btn.textContent = "Opening checkout...";
    fetch(CONFIG.checkoutUrl.replace(/\/$/, "") + "/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: ls.map(function (x) { return { id: x.l.id, style: x.l.style, pack: x.l.pack, qty: x.l.qty }; }) })
    }).then(function (r) { return r.json(); }).then(function (data) {
      if (data && data.url) { location.href = data.url; return; }
      throw new Error("no url");
    }).catch(function () {
      btn.disabled = false; btn.textContent = "Checkout";
      msg.hidden = false; msg.textContent = "Checkout didn't open. Check your connection and try again.";
    });
  }

  /* ---------------- site chrome ---------------- */
  function renderChrome() {
    var top = $("#siteTop");
    if (top) {
      top.outerHTML =
        '<div class="announce" id="announce">Fall Sale: Up to 27% Off &amp; Free Shipping on Every Order</div>' +
        '<header class="header" id="header"><div class="wrap header-inner">' +
          '<button type="button" class="icon-btn menu-btn" id="menuBtn" aria-label="Menu">' + icon("menu") + "</button>" +
          '<nav class="nav" id="nav" aria-label="Main"><a href="./">Home</a><a href="shop.html">Shop</a><a href="./#story">Our Story</a><a href="policies.html#contact">Contact</a></nav>' +
          '<a class="logo" href="./">QAFIZZ</a>' +
          '<div class="header-icons">' +
            '<a class="icon-btn" href="policies.html#contact" aria-label="Contact">' + icon("user") + "</a>" +
            '<button type="button" class="icon-btn" id="searchBtn" aria-label="Search">' + icon("search") + "</button>" +
            '<button type="button" class="icon-btn bag" id="cartOpen" aria-label="Cart">' + icon("bag") + '<span class="bag-count">0</span></button>' +
          "</div>" +
        "</div>" +
        '<form class="searchbar" id="searchbar" action="shop.html" role="search" hidden><div class="wrap"><label class="sr-only" for="q">Search</label>' +
          '<input id="q" name="q" type="search" placeholder="Search for a product" autocomplete="off" /><button type="submit" class="icon-btn" aria-label="Search">' + icon("search") + "</button></div></form>" +
        "</header>";
    }
    var bottom = $("#siteBottom");
    if (bottom) {
      bottom.outerHTML =
        '<footer class="footer">' + wave("wave-footer") +
          '<div class="footer-body"><div class="wrap footer-grid">' +
            '<div class="footer-brand"><a class="logo logo-footer" href="./">QAFIZZ</a><p>The finds you keep seeing on TikTok, picked because they work. Shipped free across Canada and the US.</p></div>' +
            '<div><h3>Shop</h3><a href="shop.html">All products</a><a href="./#featured">Bestseller</a></div>' +
            '<div><h3>Help</h3><a href="policies.html#shipping">Shipping</a><a href="policies.html#returns">Returns &amp; refunds</a><a href="policies.html#contact">Contact</a></div>' +
            '<div><h3>Legal</h3><a href="policies.html#privacy">Privacy</a><a href="policies.html#terms">Terms</a></div>' +
          "</div>" +
          '<div class="wrap footer-base"><span>&copy; ' + new Date().getFullYear() + " Qafizz &middot; " + esc(EMAIL) + "</span>" + payBadges() + "</div></div>" +
        "</footer>" +
        '<div class="scrim" id="scrim"></div><aside class="drawer" id="cartDrawer" aria-label="Cart"></aside>' +
        '<div class="toast" id="toast" role="status" aria-live="polite" hidden></div>';
    }
  }

  function payBadges() {
    return '<div class="pay-badges" aria-label="Payment methods">' +
      '<span class="pb pb-amex">AMEX</span><span class="pb pb-apple"> Pay</span><span class="pb pb-gpay"><b>G</b> Pay</span>' +
      '<span class="pb pb-mc"><i></i><i></i></span><span class="pb pb-visa">VISA</span></div>';
  }

  /* ---------------- product module (home featured + product page) ---------------- */
  function productModule(p, headingTag) {
    var images = p.images || [];
    var packs = packsOf(p);
    var hasPacks = p.packs && p.packs.length > 1;
    var styles = p.styles || [];
    var stats = reviewStats(p);
    var eta = longDate(addBusinessDays(new Date(), 18));

    var thumbs = images.length > 1 ? '<div class="thumbs">' + images.map(function (src, i) {
      return '<button type="button" class="thumb' + (i === 0 ? " is-on" : "") + '" data-i="' + i + '" aria-label="Photo ' + (i + 1) + '"><img src="' + esc(src) + '" alt="" /></button>';
    }).join("") + "</div>" : "";

    var packHtml = hasPacks ? '<div class="packs-h">' + icon("sparkle", "spark") + " Choose your pack</div>" +
      '<div class="packs" role="radiogroup" aria-label="Pack size">' + packs.map(function (k, i) {
        var off = percentOff(packWas(p, i), packPrice(p, i));
        var flag = k.label ? '<span class="pack-flag">' + esc(k.label) + (off ? " " + off + "%" : "") + "</span>" : (off ? '<span class="pack-flag plain">-' + off + "%</span>" : "");
        var pics = images.length ? Array.apply(null, Array(Math.min(k.qty, 4))).map(function () { return '<img src="' + esc(images[0]) + '" alt="" />'; }).join("") : '<span class="pack-count">' + k.qty + "&times;</span>";
        return '<label class="pack"><input type="radio" name="pack" value="' + i + '"' + (i === 0 ? " checked" : "") + " />" +
          '<span class="pack-card">' + flag + '<span class="pack-pics n' + Math.min(k.qty, 4) + '">' + pics + "</span>" +
          '<span class="pack-name">' + esc(nounFor(p, k.qty)) + "</span>" +
          '<span class="pack-price">' + (packWas(p, i) > packPrice(p, i) ? "<s>" + money(packWas(p, i)) + "</s> " : "") + "<b>" + money(packPrice(p, i)) + "</b></span></span></label>";
      }).join("") + "</div>" : "";

    var styleHtml = styles.length ? '<div class="opt-h">Style: <span id="styleLabel">' + esc(styles[0]) + "</span></div>" +
      '<div class="style-row" role="radiogroup" aria-label="Style">' + styles.map(function (s, i) {
        return '<label class="style-opt"><input type="radio" name="style" value="' + esc(s) + '"' + (i === 0 ? " checked" : "") + " /><span>" + esc(s) + "</span></label>";
      }).join("") + "</div>" : "";

    var reviewSlider = stats ? '<div class="rslider" id="rslider"><button type="button" class="round-btn" data-r="-1" aria-label="Previous review">' + icon("left") + '</button><div class="rslide" id="rslide"></div><button type="button" class="round-btn" data-r="1" aria-label="Next review">' + icon("right") + "</button></div>" : "";

    return '<div class="pm" data-id="' + esc(p.id) + '">' +
      '<div class="pm-media">' + stamp() +
        '<div class="stage">' + (images.length ? '<img id="stageImg" src="' + esc(images[0]) + '" alt="' + esc(p.name) + '" />' : placeholder(p, true)) +
          (headingTag === "h3" ? '<a class="stage-link" href="' + productUrl(p) + '">See full details &rarr;</a>' : "") + "</div>" +
        thumbs +
      "</div>" +
      '<div class="pm-info">' +
        (headingTag === "h1" ? "<h1 class=\"pm-title\">" + esc(p.name) + "</h1>" + (p.tagline ? '<p class="pm-tag">' + esc(p.tagline) + "</p>" : "") : "") +
        (stats ? '<a class="pm-rating" href="#reviews">' + stars(stats.avg) + " " + stats.avg.toFixed(1) + " &middot; " + stats.count + " review" + (stats.count === 1 ? "" : "s") + "</a>" : "") +
        '<ul class="bullets">' + (p.bullets || []).map(function (b) { return "<li>" + CHECK + esc(b) + "</li>"; }).join("") + "</ul>" +
        '<div class="pm-price" id="pmPrice"></div>' +
        styleHtml + packHtml +
        '<div class="buy-row"><div class="stepper" id="qtyStepper"><button type="button" data-step="-1" aria-label="Less">&minus;</button><span id="qtyVal">1</span><button type="button" data-step="1" aria-label="More">+</button></div>' +
          '<button type="button" class="btn-main btn-add" id="addBtn"></button></div>' +
        '<div class="stock-row">' + (p.stock != null && p.stock > 0 && p.stock <= 20 ? '<span class="low"><i></i>Only ' + Number(p.stock) + " left in stock</span>" : '<span class="instock"><i></i>In stock, ships in 1 to 3 business days</span>') +
          '<span class="eta">Estimated delivery by <strong>' + esc(eta) + "</strong></span></div>" +
        '<p class="secure">' + icon("lock") + " Secure checkout &middot; <a href=\"policies.html#returns\">30-day returns</a></p>" +
        payBadges() +
        reviewSlider +
        '<div class="accordion">' +
          (p.specs ? "<details><summary>Details and specifications" + icon("down") + "</summary><p>" + esc(p.specs) + "</p></details>" : "") +
          (p.howToUse ? "<details><summary>How and who can use it?" + icon("down") + "</summary><p>" + esc(p.howToUse) + "</p></details>" : "") +
          "<details><summary>Shipping and returns" + icon("down") + "</summary><p>Free shipping to Canada and the US. Orders ship in 1 to 3 business days and arrive in about 7 to 15. Damaged or wrong item? Email us within 30 days for a replacement or refund. <a href=\"policies.html#returns\">Full policy</a></p></details>" +
        "</div>" +
      "</div></div>";
  }

  function wireModule(root, p) {
    var images = p.images || [];
    var qty = 1, rIndex = 0;
    function current() {
      var pk = $('input[name="pack"]:checked', root);
      var st = $('input[name="style"]:checked', root);
      return { pack: pk ? Number(pk.value) : 0, style: st ? st.value : "" };
    }
    function draw() {
      var c = current();
      var now = packPrice(p, c.pack), was = packWas(p, c.pack);
      $("#pmPrice", root).innerHTML = (was > now ? "<s>" + money(was) + "</s> " : "") + "<strong>" + money(now) + "</strong>" + (p.badge ? ' <span class="sale-pill">' + esc(p.badge) + "</span>" : "");
      $("#addBtn", root).innerHTML = "Add to cart <i></i> " + money(now * qty) + (was > now ? " <s>" + money(was * qty) + "</s>" : "");
      $("#qtyVal", root).textContent = qty;
      var sl = $("#styleLabel", root); if (sl) sl.textContent = c.style;
    }
    function drawReview() {
      var box = $("#rslide", root);
      if (!box) return;
      var r = p.reviews[rIndex];
      box.innerHTML = '<span class="rs-avatar" style="--tint:' + tintFor(r.name || "x") + '">' + (r.photo ? '<img src="' + esc(r.photo) + '" alt="" />' : esc((r.name || "?").charAt(0))) + "</span>" +
        '<span class="rs-body"><strong>' + esc(r.name) + "</strong> " + stars(r.stars || 5) + '<span class="rs-text">&ldquo;' + esc(r.text) + "&rdquo;</span></span>";
    }
    root.addEventListener("change", draw);
    root.addEventListener("click", function (e) {
      var t = e.target.closest(".thumb");
      if (t) { $("#stageImg", root).src = images[Number(t.dataset.i)]; $all(".thumb", root).forEach(function (b) { b.classList.toggle("is-on", b === t); }); }
      var s = e.target.closest("#qtyStepper [data-step]");
      if (s) { qty = Math.max(1, Math.min(20, qty + Number(s.dataset.step))); draw(); }
      var r = e.target.closest("[data-r]");
      if (r) { rIndex = (rIndex + Number(r.dataset.r) + p.reviews.length) % p.reviews.length; drawReview(); }
      if (e.target.closest("#addBtn")) {
        var c = current();
        addToCart(p.id, c.style, c.pack, qty);
        openCart();
      }
    });
    draw();
    if (p.reviews && p.reviews.length) drawReview();
  }

  /* ---------------- shared sections ---------------- */
  function clipsSection(p) {
    var clips = p.clips || [];
    if (!clips.length) return "";
    return '<section class="section clips"><div class="wrap"><h2 class="display">Seen on your For You page</h2><p class="sub">Drag to explore. Every clip is the same ' + esc(p.name.toLowerCase()) + ".</p></div>" +
      '<div class="clip-row wrap">' + clips.map(function (c) {
        var isVid = /\.(mp4|webm|mov)(\?|$)/i.test(c.src || "");
        return '<figure class="clip">' + (isVid ? '<video src="' + esc(c.src) + '" muted loop playsinline preload="metadata"></video>' : '<img src="' + esc(c.src) + '" alt="" loading="lazy" />') +
          (c.caption ? "<figcaption>" + esc(c.caption) + "</figcaption>" : "") + "</figure>";
      }).join("") + "</div></section>";
  }

  function reviewsSection(list) {
    if (!list.length) return "";
    return '<section class="section reviews-band" id="reviews">' + wave("wave-top") + '<div class="band-body"><div class="wrap"><h2 class="display">Don&rsquo;t just listen to us</h2></div>' +
      '<div class="rcards wrap">' + list.map(function (r) {
        return '<article class="rcard">' + (r.photo ? '<img class="rcard-img" src="' + esc(r.photo) + '" alt="Photo from ' + esc(r.name) + '" loading="lazy" />' : "") +
          stars(r.stars || 5) + '<p class="rcard-text">&ldquo;' + esc(r.text) + '&rdquo;</p><p class="rcard-name">' + esc(r.name) + "</p>" +
          (r.product ? '<a class="rcard-link" href="product.html?id=' + encodeURIComponent(r.product.id) + '">' + esc(r.product.name) + "</a>" : "") + "</article>";
      }).join("") + "</div></div>" + wave("wave-bottom") + "</section>";
  }

  function allReviews() {
    var out = [];
    PRODUCTS.forEach(function (p) { (p.reviews || []).forEach(function (r) { out.push(Object.assign({ product: p }, r)); }); });
    return out.sort(function (a, b) { return String(b.date || "").localeCompare(String(a.date || "")); });
  }

  function card(p) {
    var off = percentOff(p.was, p.price);
    return '<a class="card" href="' + productUrl(p) + '"><div class="card-img">' + img(p, 0) + (p.badge ? '<span class="card-pill">' + esc(p.badge) + "</span>" : "") + "</div>" +
      '<h3 class="card-name">' + esc(p.name) + "</h3>" +
      '<p class="card-price">' + (off ? "<s>" + money(p.was) + "</s> " : "") + "<strong>" + money(p.price) + "</strong></p></a>";
  }

  /* ---------------- pages ---------------- */
  function renderHome() {
    var page = $("#homePage");
    if (!page) return;
    var feat = PRODUCTS.filter(function (p) { return p.featured; })[0] || PRODUCTS[0];
    var others = PRODUCTS.filter(function (p) { return p !== feat; });
    page.innerHTML =
      '<section class="hero"><div class="wrap hero-inner">' +
        '<h1 class="display hero-h">Viral finds, actually worth it</h1>' +
        '<p class="hero-p">The things you keep seeing on TikTok, picked because they work, priced fairly and shipped free across Canada and the US.</p>' +
        '<a class="btn-cream" href="#featured">Shop the bestseller</a>' +
      "</div>" + wave("wave-hero") + "</section>" +
      (feat ? '<section class="section featured" id="featured"><div class="wrap"><h2 class="display">The one you came for</h2><p class="sub">' + esc(feat.tagline || "") + "</p>" + productModule(feat, "h3") + "</div></section>" + clipsSection(feat) : "") +
      reviewsSection(allReviews()) +
      (others.length ? '<section class="section more"><div class="wrap"><h2 class="display">More finds you&rsquo;ll love</h2><p class="sub">Free shipping on every one.</p><div class="grid">' + others.map(card).join("") + '</div><div class="center"><a class="btn-outline" href="shop.html">Shop all</a></div></div></section>' : "") +
      '<section class="section story" id="story"><div class="wrap story-inner"><h2 class="display">Our story</h2>' +
        "<p>Qafizz started in Canada with a simple frustration: the products going viral on TikTok were hard to get here, or came with surprise fees and weeks of silence. So we pick a small number of finds, check that they actually do what the videos say, and ship them free to Canada and the US with tracking on every order.</p>" +
        '<p>Got a question before you buy? Email <strong>' + esc(EMAIL) + "</strong> and a real person answers within 1 to 2 business days.</p></div></section>";
    if (feat) wireModule($(".pm", page), feat);
  }

  function renderShop() {
    var page = $("#shopPage");
    if (!page) return;
    var q = (new URLSearchParams(location.search).get("q") || "").trim().toLowerCase();
    var list = PRODUCTS.filter(function (p) { return !q || (p.name + " " + (p.tagline || "") + " " + (p.bullets || []).join(" ")).toLowerCase().indexOf(q) !== -1; });
    page.innerHTML = '<section class="section shop-page"><div class="wrap"><h1 class="display">' + (q ? "Results for &ldquo;" + esc(q) + "&rdquo;" : "Shop all") + '</h1><p class="sub">' + list.length + " product" + (list.length === 1 ? "" : "s") + " &middot; free shipping on every order</p>" +
      (list.length ? '<div class="grid">' + list.map(card).join("") + "</div>" : '<p class="center muted">Nothing matches that search yet. <a href="shop.html">See everything</a></p>') + "</div></section>";
  }

  function renderProduct() {
    var page = $("#productPage");
    if (!page) return;
    var p = findProduct(new URLSearchParams(location.search).get("id"));
    if (!p) {
      page.innerHTML = '<section class="section"><div class="wrap center"><h1 class="display">We couldn&rsquo;t find that product</h1><p class="sub">It may have sold out, or the link has a typo.</p><a class="btn-main inline" href="shop.html">Shop all</a></div></section>';
      return;
    }
    document.title = p.name + " | Qafizz";
    var revs = (p.reviews || []).map(function (r) { return Object.assign({}, r); });
    page.innerHTML = '<section class="section product-top"><div class="wrap"><nav class="crumbs" aria-label="Breadcrumb"><a href="./">Home</a> / <a href="shop.html">Shop</a> / <span>' + esc(p.name) + "</span></nav>" + productModule(p, "h1") + "</div></section>" +
      clipsSection(p) + reviewsSection(revs) +
      (revs.length ? "" : '<section class="section"><div class="wrap center"><h2 class="display small">No reviews yet</h2><p class="sub">Bought this? Email your review and a photo to <strong>' + esc(EMAIL) + "</strong> and we will share it here.</p></div></section>");
    wireModule($(".pm", page), p);
  }

  /* ---------------- boot ---------------- */
  renderChrome();

  document.addEventListener("click", function (e) {
    if (e.target.closest("#cartOpen")) openCart();
    if (e.target.closest("#cartClose") || e.target.closest("#scrim")) closeCart();
    if (e.target.closest("#checkoutBtn")) checkout();
    if (e.target.closest("#menuBtn")) document.body.classList.toggle("nav-open");
    if (e.target.closest("#searchBtn")) { var sb = $("#searchbar"); sb.hidden = !sb.hidden; if (!sb.hidden) $("#q").focus(); }
    var st = e.target.closest(".stepper.small [data-step]");
    if (st) {
      var line = cart[Number(st.parentNode.dataset.line)];
      if (line) { line.qty += Number(st.dataset.step); if (line.qty < 1) cart.splice(Number(st.parentNode.dataset.line), 1); saveCart(); }
    }
    var rm = e.target.closest("[data-remove]");
    if (rm) { cart.splice(Number(rm.dataset.remove), 1); saveCart(); }
  });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") { closeCart(); document.body.classList.remove("nav-open"); } });
  window.addEventListener("scroll", function () { var h = $("#header"); if (h) h.classList.toggle("is-scrolled", window.scrollY > 40); }, { passive: true });

  if ($("#thanksPage")) { cart = []; try { localStorage.removeItem(CART_KEY); } catch (e) { /* ignore */ } }

  fetch("products.json?v=" + Math.floor(Date.now() / 300000))
    .then(function (r) { return r.json(); })
    .then(function (list) { PRODUCTS = Array.isArray(list) ? list : []; })
    .catch(function () { PRODUCTS = []; })
    .then(function () {
      cart = cart.filter(function (l) { return findProduct(l.id); });
      renderCart(); renderHome(); renderShop(); renderProduct();
      // Clip videos play while on screen.
      if ("IntersectionObserver" in window) {
        var io = new IntersectionObserver(function (es) { es.forEach(function (x) { if (x.isIntersecting) x.target.play().catch(function () {}); else x.target.pause(); }); });
        $all(".clip video").forEach(function (v) { io.observe(v); });
      }
    });
})();
