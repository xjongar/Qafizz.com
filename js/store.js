/* ==========================================================================
   QAFIZZ - store (header, cart, home page, product page)
   Products come from /products.json and settings from js/config.js.
   You should not need to edit this file.
   ========================================================================== */
(function () {
  "use strict";

  var CONFIG = window.QAFIZZ_CONFIG || {};
  var EMAIL = CONFIG.supportEmail || "qafizz@qafizz.com";
  var TINTS = ["#E9E4F5", "#FCE3D6", "#DDF0E4", "#FFF1C7", "#DDE7FA", "#F7DDE6"];
  var CART_KEY = "qafizz_cart_v1";
  var PRODUCTS = [];

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function money(n) { return "$" + Number(n).toFixed(2); }

  // "$39.99" with small cents, the way deal sites print prices.
  function bigPrice(n) {
    var parts = Number(n).toFixed(2).split(".");
    return '<span class="p-dollar">$</span><span class="p-whole">' + parts[0] + '</span><span class="p-cents">.' + parts[1] + "</span>";
  }

  function percentOff(p) {
    if (!p.was || p.was <= p.price) return 0;
    return Math.round((1 - p.price / p.was) * 100);
  }

  function tintFor(id) {
    var h = 0;
    for (var i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
    return TINTS[h % TINTS.length];
  }

  function hasTag(p, t) { return (p.tags || []).indexOf(t) !== -1; }
  function productUrl(p) { return "product.html?id=" + encodeURIComponent(p.id); }
  function findProduct(id) { return PRODUCTS.filter(function (p) { return p.id === id; })[0]; }
  function shortName(p) { return p.short || p.name; }

  /* ---------------- icons ---------------- */
  var I = {
    truck: '<svg viewBox="0 0 24 24"><path d="M2 6h11v9H2zM13 9h4l4 4v2h-8z"/><circle cx="6" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>',
    guarantee: '<svg viewBox="0 0 24 24"><path d="M3 5h18v10H3z"/><path d="m8 10 2.5 2.5L16 7"/><path d="M7 19h10"/></svg>',
    lock: '<svg viewBox="0 0 24 24"><rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>',
    card: '<svg viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18M7 15h4"/></svg>',
    box: '<svg viewBox="0 0 24 24"><path d="M3 7l9-4 9 4v10l-9 4-9-4z"/><path d="M3 7l9 4 9-4M12 11v10"/></svg>',
    shield: '<svg viewBox="0 0 24 24"><path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/><path d="m8.5 12 2.5 2.5 4.5-5"/></svg>',
    bell: '<svg viewBox="0 0 24 24"><path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4z"/><path d="M10 20a2 2 0 0 0 4 0"/></svg>',
    thumb: '<svg viewBox="0 0 24 24"><path d="M7 10v10H3V10zM7 10l4-7c1.5 0 2.5 1 2.5 2.5L13 9h6a2 2 0 0 1 2 2.3l-1.2 6.8A2 2 0 0 1 17.8 20H7"/></svg>',
    star: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="16" rx="3"/><path d="m12 6.5 1.6 3.3 3.6.5-2.6 2.5.6 3.6-3.2-1.7-3.2 1.7.6-3.6-2.6-2.5 3.6-.5z" class="fill"/></svg>',
    support: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M8 13a4 4 0 0 0 8 0M9 9.5h.01M15 9.5h.01"/></svg>',
    cart: '<svg viewBox="0 0 24 24"><path d="M2 3h3l2.5 12h11L21 7H6.2"/><circle cx="9" cy="19.5" r="1.5"/><circle cx="17" cy="19.5" r="1.5"/></svg>',
    search: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
    bolt: '<svg viewBox="0 0 24 24"><path d="M13 2 4 14h7l-1 8 9-12h-7z" class="fill"/></svg>',
    chev: '<svg viewBox="0 0 24 24"><path d="m9 5 7 7-7 7"/></svg>',
    down: '<svg viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg>',
    share: '<svg viewBox="0 0 24 24"><path d="M12 3v12M7 8l5-5 5 5M5 13v7h14v-7"/></svg>',
    check: '<svg viewBox="0 0 24 24"><path d="m5 12 4.5 4.5L19 7"/></svg>',
    close: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg>',
    trash: '<svg viewBox="0 0 24 24"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></svg>',
    user: '<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21c1-4.5 4-6.5 8-6.5s7 2 8 6.5"/></svg>'
  };
  function icon(name, cls) { return '<span class="ic ' + (cls || "") + '" aria-hidden="true">' + I[name] + "</span>"; }

  var FLAG_CA = '<svg class="flag" viewBox="0 0 30 20" aria-label="Canada" role="img"><rect width="30" height="20" fill="#fff"/><rect width="7.5" height="20" fill="#D52B1E"/><rect x="22.5" width="7.5" height="20" fill="#D52B1E"/><path d="M15 4l1.1 2.3 1.6-.6-.5 3.3 1.8-1.4.4 1.2 2-.3-.8 2 .8.4-3.2 2.3.3 1.2-3-.4v2.6h-.9v-2.6l-3 .4.3-1.2-3.2-2.3.8-.4-.8-2 2 .3.4-1.2 1.8 1.4-.5-3.3 1.6.6z" fill="#D52B1E"/></svg>';
  var FLAG_US = '<svg class="flag" viewBox="0 0 30 20" aria-label="United States" role="img"><rect width="30" height="20" fill="#B22234"/><path d="M0 3h30M0 6h30M0 9h30M0 12h30M0 15h30M0 18h30" stroke="#fff" stroke-width="1.5"/><rect width="13" height="10.5" fill="#3C3B6E"/></svg>';

  /* ---------------- product visuals ---------------- */
  function placeholder(p, big) {
    var initials = shortName(p).split(/\s+/).filter(function (w) { return /^[A-Za-z]/.test(w); })
      .slice(0, 2).map(function (w) { return w[0]; }).join("").toUpperCase();
    return '<div class="ph' + (big ? " ph-big" : "") + '" style="--tint:' + tintFor(p.id) + '" role="img" aria-label="' + esc(shortName(p)) + ', photo coming soon">' +
      '<svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="44" cy="74" r="30"/><circle cx="84" cy="36" r="17"/><circle cx="90" cy="84" r="9"/></svg>' +
      "<span>" + esc(initials) + "</span></div>";
  }
  function mainImage(p, big) {
    if (p.images && p.images.length) return '<img src="' + esc(p.images[0]) + '" alt="' + esc(shortName(p)) + '" loading="lazy" />';
    return placeholder(p, big);
  }

  function reviewStats(p) {
    var r = p.reviews || [];
    if (!r.length) return null;
    var sum = r.reduce(function (a, x) { return a + Number(x.stars || 0); }, 0);
    return { count: r.length, avg: sum / r.length };
  }
  function starsHtml(value, cls) {
    var out = "";
    for (var i = 1; i <= 5; i++) {
      var fill = Math.max(0, Math.min(1, value - (i - 1)));
      out += '<span class="star" style="--fill:' + Math.round(fill * 100) + '%"></span>';
    }
    return '<span class="stars ' + (cls || "") + '" role="img" aria-label="' + value.toFixed(1) + ' out of 5 stars">' + out + "</span>";
  }

  /* ---------------- toast ---------------- */
  var toastTimer;
  function toast(msg) {
    var t = $("#toast");
    if (!t) return;
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.hidden = true; }, 2600);
  }

  /* ---------------- cart ---------------- */
  function readCart() {
    try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; } catch (e) { return []; }
  }
  var cart = readCart();
  function saveCart() {
    try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch (e) { /* private mode: cart lives for this page only */ }
    renderCart();
  }
  function cartLines() {
    return cart.map(function (line) {
      var p = findProduct(line.id);
      return p ? { line: line, p: p } : null;
    }).filter(Boolean);
  }
  function cartCount() { return cartLines().reduce(function (a, x) { return a + x.line.qty; }, 0); }
  function cartTotal() { return cartLines().reduce(function (a, x) { return a + x.line.qty * x.p.price; }, 0); }

  function addToCart(id, style, qty) {
    var existing = cart.filter(function (l) { return l.id === id && l.style === style; })[0];
    if (existing) existing.qty = Math.min(99, existing.qty + qty);
    else cart.unshift({ id: id, style: style, qty: qty });
    saveCart();
  }

  function qtySelect(value, attrs) {
    var opts = "";
    for (var i = 1; i <= 10; i++) opts += '<option value="' + i + '"' + (i === value ? " selected" : "") + ">" + i + "</option>";
    if (value > 10) opts += '<option value="' + value + '" selected>' + value + "</option>";
    return '<select ' + attrs + ">" + opts + "</select>";
  }

  function renderCart() {
    var panel = $("#cartPanel");
    if (!panel) return;
    var lines = cartLines();
    var count = cartCount();
    $all(".cart-count").forEach(function (el) { el.textContent = count; el.hidden = count === 0; });
    document.body.classList.toggle("has-cart", lines.length > 0);

    var items = lines.map(function (x, i) {
      return '<div class="cart-item">' +
        '<a class="cart-thumb" href="' + productUrl(x.p) + '">' + mainImage(x.p, false) + "</a>" +
        '<div class="cart-item-info">' +
          '<a class="cart-name" href="' + productUrl(x.p) + '">' + esc(shortName(x.p)) + "</a>" +
          (x.line.style ? '<span class="cart-style">' + esc(x.line.style) + "</span>" : "") +
          '<span class="cart-price">' + money(x.p.price) + "</span>" +
          '<div class="cart-row">' + qtySelect(x.line.qty, 'class="qty-select" data-line="' + i + '" aria-label="Quantity"') +
          '<button type="button" class="cart-remove" data-line="' + i + '" aria-label="Remove">' + icon("trash") + "</button></div>" +
        "</div></div>";
    }).join("");

    panel.innerHTML =
      '<div class="cart-head"><span class="cart-sub">' + icon("cart") + " Subtotal</span>" +
        '<button type="button" class="cart-close" id="cartClose" aria-label="Close cart">' + icon("close") + "</button></div>" +
      '<div class="cart-total">' + money(cartTotal()) + "</div>" +
      '<div class="cart-free">' + icon("check") + " Free shipping</div>" +
      '<button type="button" class="btn-orange cart-checkout" id="checkoutBtn"' + (lines.length ? "" : " disabled") + ">Checkout</button>" +
      '<p class="cart-msg" id="cartMsg" hidden></p>' +
      (lines.length ? '<div class="cart-items">' + items + "</div>" : '<p class="cart-empty">Your cart is empty.</p>');
  }

  function openCart() { document.body.classList.add("cart-open"); }
  function closeCart() { document.body.classList.remove("cart-open"); }

  function checkout() {
    var msg = $("#cartMsg");
    var btn = $("#checkoutBtn");
    var lines = cartLines();
    if (!lines.length) return;
    if (!CONFIG.checkoutUrl) {
      msg.hidden = false;
      msg.innerHTML = "Online checkout opens very soon. To order now, email <strong>" + esc(EMAIL) + "</strong>.";
      return;
    }
    btn.disabled = true;
    btn.textContent = "Opening checkout...";
    fetch(CONFIG.checkoutUrl.replace(/\/$/, "") + "/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: lines.map(function (x) { return { id: x.line.id, style: x.line.style, qty: x.line.qty }; }) })
    }).then(function (r) { return r.json(); }).then(function (data) {
      if (data && data.url) { location.href = data.url; return; }
      throw new Error(data && data.error || "Checkout failed");
    }).catch(function () {
      btn.disabled = false;
      btn.textContent = "Checkout";
      msg.hidden = false;
      msg.textContent = "Checkout didn't open. Check your connection and try again.";
    });
  }

  /* ---------------- site chrome ---------------- */
  function renderChrome(isHome) {
    var top = $("#siteTop");
    if (top) {
      var q = new URLSearchParams(location.search).get("q") || "";
      top.outerHTML =
        '<div class="topbar"><div class="shell topbar-inner">' +
          '<a class="tb-item" href="policies.html#shipping">' + icon("truck", "tb-ic tb-green") + '<span><strong>Free shipping</strong><small>On every order</small></span>' + icon("chev", "tb-chev") + "</a>" +
          '<span class="tb-sep" aria-hidden="true"></span>' +
          '<a class="tb-item" href="policies.html#returns">' + icon("guarantee", "tb-ic tb-yellow") + '<span><strong>Delivery guarantee</strong><small>Refund for any issues</small></span></a>' +
          '<span class="tb-sep" aria-hidden="true"></span>' +
          '<a class="tb-item" href="policies.html#privacy">' + icon("lock", "tb-ic tb-yellow") + '<span><strong>Secure checkout</strong><small>Card, Apple Pay, Google Pay</small></span></a>' +
          '<div class="tb-promo"><span>Shipping to<br />Canada &amp; the US</span><span class="tb-flags">' + FLAG_CA + FLAG_US + "</span></div>" +
        "</div></div>" +
        '<header class="header' + (isHome ? " header-home" : "") + '"><div class="shell header-inner">' +
          '<a class="logo" href="./" aria-label="Qafizz home"><span class="logo-bubbles"><i></i><i></i><i></i></span><span class="logo-word">qafizz</span></a>' +
          '<nav class="hnav" aria-label="Shop">' +
            '<a href="./?f=bestseller#explore">' + icon("thumb") + "Best-Selling Items</a>" +
            '<a href="./?f=fivestar#explore">' + icon("star") + "5-Star Rated</a>" +
            '<a href="./?f=new#explore">New In</a>' +
          "</nav>" +
          '<form class="hsearch" action="./" role="search"><label class="sr-only" for="q">Search</label>' +
            '<input id="q" name="q" type="search" placeholder="cordless hair straightener brush" value="' + esc(q) + '" autocomplete="off" />' +
            '<button type="submit" aria-label="Search">' + icon("search") + "</button></form>" +
          '<div class="hright">' +
            '<a class="hlink" href="policies.html#contact">' + icon("support") + "<span>Support</span></a>" +
            '<span class="hlink hlang">' + FLAG_CA + "<span>English</span></span>" +
            '<button type="button" class="hcart" id="cartOpen" aria-label="Cart">' + icon("cart") + '<span class="cart-count" hidden>0</span></button>' +
          "</div>" +
        "</div></header>";
    }

    var bottom = $("#siteBottom");
    if (bottom) {
      bottom.outerHTML =
        '<footer class="footer"><div class="shell">' +
          '<div class="footer-cols">' +
            '<div><h3>Company info</h3><a href="policies.html#contact">About Qafizz</a><a href="policies.html#contact">Contact us</a></div>' +
            '<div><h3>Customer service</h3><a href="policies.html#shipping">Shipping info</a><a href="policies.html#returns">Return and refund policy</a><a href="policies.html#returns">Report a problem</a></div>' +
            '<div><h3>Help</h3><a href="policies.html#privacy">Privacy policy</a><a href="policies.html#terms">Terms of use</a><a href="./#explore">Shop all</a></div>' +
            '<div><h3>Questions?</h3><p>Email us any time</p><p class="footer-mail">' + esc(EMAIL) + "</p><p>We reply within 1 to 2 business days.</p></div>" +
          "</div>" +
          '<div class="footer-pay"><span>We accept</span><span class="pay">VISA</span><span class="pay">Mastercard</span><span class="pay">AMEX</span><span class="pay">Apple Pay</span><span class="pay">Google Pay</span><span class="footer-secure">' + icon("lock") + " Payments secured by Stripe</span></div>" +
          '<p class="footer-copy">&copy; ' + new Date().getFullYear() + " Qafizz. All rights reserved.</p>" +
        "</div></footer>" +
        '<aside class="cart-panel" id="cartPanel" aria-label="Shopping cart"></aside>' +
        '<div class="cart-scrim" id="cartScrim"></div>' +
        '<div class="toast" id="toast" role="status" aria-live="polite" hidden></div>';
    }
  }

  /* ---------------- product card ---------------- */
  function card(p, opts) {
    opts = opts || {};
    var stats = reviewStats(p);
    var off = percentOff(p);
    return '<a class="pcard" href="' + productUrl(p) + '">' +
      '<div class="pcard-img">' + mainImage(p, false) +
        (off ? '<span class="pcard-off">-' + off + "%</span>" : "") +
      "</div>" +
      (opts.noName ? "" : '<div class="pcard-name">' + esc(p.name) + "</div>") +
      '<div class="pcard-price"><span class="price-orange">' + bigPrice(p.price) + "</span>" +
        (p.was ? ' <s class="pcard-was">' + money(p.was) + "</s>" : "") + "</div>" +
      (stats ? '<div class="pcard-stars">' + starsHtml(stats.avg) + '<span class="pcard-count">' + stats.count + "</span></div>" : "") +
      "</a>";
  }

  /* ---------------- home page ---------------- */
  var FILTERS = [
    { key: "all", label: "Recommended", test: function () { return true; } },
    { key: "bestseller", label: "Best-Selling Items", test: function (p) { return hasTag(p, "bestseller"); } },
    { key: "fivestar", label: "5-Star Rated", test: function (p) { var s = reviewStats(p); return s && s.avg >= 4.5; } },
    { key: "new", label: "New In", test: function (p) { return hasTag(p, "new"); } },
    { key: "deals", label: "On Sale", test: function (p) { return percentOff(p) > 0; } },
    { key: "under30", label: "Under $30", test: function (p) { return p.price < 30; } },
    { key: "under50", label: "Under $50", test: function (p) { return p.price < 50; } }
  ];

  function renderHome() {
    var page = $("#homePage");
    if (!page) return;
    var params = new URLSearchParams(location.search);
    var q = (params.get("q") || "").trim().toLowerCase();
    var current = params.get("f") || "all";

    function dealRow(tag, fallback) {
      var list = PRODUCTS.filter(function (p) { return hasTag(p, tag); });
      if (!list.length) list = PRODUCTS.filter(fallback);
      return list.slice(0, 3).map(function (p) { return card(p, { noName: true }); }).join("");
    }

    page.innerHTML =
      '<div class="shell">' +
        '<section class="why">' +
          '<div class="why-top"><span class="why-title">' + icon("shield") + " Why choose Qafizz?</span>" +
            '<span class="why-items"><a href="policies.html#privacy">' + icon("lock") + ' Secure privacy</a><i></i><a href="policies.html#privacy">' + icon("card") + ' Safe payments</a><i></i><a href="policies.html#returns">' + icon("box") + " Delivery guarantee " + icon("chev") + "</a></span></div>" +
          '<div class="why-bottom">' + icon("bell") + " Security reminder: Qafizz will never ask you for extra fees by text message or email.</div>" +
        "</section>" +
        '<div class="deals">' +
          '<section class="deal-col"><h2 class="deal-h orange"><a href="./?f=deals#explore">Lightning deals ' + icon("chev") + "</a></h2>" +
            '<div class="deal-row">' + dealRow("lightning", function (p) { return percentOff(p) > 0; }) + "</div></section>" +
          '<section class="deal-col"><h2 class="deal-h red"><a href="./?f=all#explore">Unbeatable deals ' + icon("chev") + "</a></h2>" +
            '<div class="deal-row">' + dealRow("unbeatable", function () { return true; }) + "</div></section>" +
        "</div>" +
        '<div class="paybanner"><em>Shop now, pay your way with</em><span class="pay">VISA</span><span class="pay">Mastercard</span><span class="pay pay-dark">Apple Pay</span><span class="pay pay-blue">Google Pay</span></div>' +
        '<section class="explore" id="explore">' +
          '<p class="explore-kicker">' + (q ? "Search results" : "Qafizz deals") + "</p>" +
          '<h2 class="explore-h">' + (q ? "Results for &ldquo;" + esc(q) + "&rdquo;" : "Explore your interests") + "</h2>" +
          '<div class="chips" id="chips">' + FILTERS.map(function (f) {
            return '<button type="button" class="chip' + (f.key === current ? " is-on" : "") + '" data-f="' + f.key + '">' + f.label + "</button>";
          }).join("") + "</div>" +
          '<div class="pgrid" id="pgrid"></div>' +
          '<p class="pgrid-empty" id="pgridEmpty" hidden></p>' +
        "</section>" +
      "</div>";

    function draw(key) {
      var f = FILTERS.filter(function (x) { return x.key === key; })[0] || FILTERS[0];
      var list = PRODUCTS.filter(f.test).filter(function (p) {
        return !q || (p.name + " " + (p.details || []).join(" ")).toLowerCase().indexOf(q) !== -1;
      });
      $("#pgrid").innerHTML = list.map(function (p) { return card(p); }).join("");
      var empty = $("#pgridEmpty");
      empty.hidden = list.length > 0;
      empty.textContent = key === "fivestar" && !q ? "No 5-star rated items yet. Ratings show up here as customers review their orders." : "Nothing here yet. Try another search or pick Recommended.";
      $all(".chip", page).forEach(function (c) { c.classList.toggle("is-on", c.dataset.f === f.key); });
    }

    $("#chips").addEventListener("click", function (e) {
      var c = e.target.closest(".chip");
      if (!c) return;
      draw(c.dataset.f);
      var url = new URL(location.href);
      if (c.dataset.f === "all") url.searchParams.delete("f"); else url.searchParams.set("f", c.dataset.f);
      history.replaceState(null, "", url.pathname + url.search + "#explore");
    });
    draw(current);
    if (q || params.get("f")) { var ex = $("#explore"); if (ex) ex.scrollIntoView(); }
  }

  /* ---------------- product page ---------------- */
  var RATING_WORD = { 5: "Excellent", 4: "Good", 3: "Okay", 2: "Poor", 1: "Bad" };

  function renderReviews(p) {
    var stats = reviewStats(p);
    var head = '<div class="rv-head"><h2>' + (stats ? stats.count + " review" + (stats.count === 1 ? "" : "s") : "0 reviews") + "</h2>" +
      (stats ? '<span class="rv-sep"></span><span class="rv-avg">' + stats.avg.toFixed(1) + starsHtml(stats.avg, "stars-lg") + "</span>" : "") +
      '<span class="rv-badge">' + icon("shield") + " Reviews from real Qafizz customers</span></div>";
    if (!stats) {
      return '<section class="reviews" id="reviews">' + head +
        '<p class="rv-empty">No reviews yet. Bought this item? Email your review and a photo to <strong>' + esc(EMAIL) + "</strong> and we will add it here.</p></section>";
    }
    var list = p.reviews.map(function (r) {
      var n = Math.round(Number(r.stars || 0));
      var date = r.date ? new Date(r.date + "T12:00:00").toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "";
      var flag = r.country === "US" ? FLAG_US : r.country === "CA" ? FLAG_CA : "";
      return '<article class="rv">' +
        '<div class="rv-who"><span class="rv-avatar" style="--tint:' + tintFor(r.name || "x") + '">' + esc((r.name || "?").trim().charAt(0).toUpperCase()) + "</span>" +
          "<span><strong>" + esc(r.name) + "</strong>" + (flag ? " in " + flag : "") + (date ? " on " + esc(date) : "") + "</span></div>" +
        '<div class="rv-stars">' + starsHtml(n, "stars-lg") + ' <span class="rv-word">' + (RATING_WORD[n] || "") + "</span></div>" +
        '<p class="rv-text">' + esc(r.text) + "</p></article>";
    }).join("");
    return '<section class="reviews" id="reviews">' + head + '<div class="rv-list">' + list + "</div></section>";
  }

  function renderProduct() {
    var page = $("#productPage");
    if (!page) return;
    var id = new URLSearchParams(location.search).get("id");
    var p = findProduct(id);
    if (!p) {
      page.innerHTML = '<div class="shell notfound"><h1>We couldn\'t find that item</h1><p>It may have sold out, or the link has a typo.</p><a class="btn-orange" href="./">Shop all deals</a></div>';
      return;
    }
    document.title = shortName(p) + " | Qafizz";

    var images = (p.images || []).slice();
    var styles = p.styles || [];
    var stats = reviewStats(p);
    var off = percentOff(p);

    var thumbs = images.length > 1 ? '<div class="thumbs">' + images.map(function (src, i) {
      return '<button type="button" class="thumb' + (i === 0 ? " is-on" : "") + '" data-i="' + i + '" aria-label="Photo ' + (i + 1) + '"><img src="' + esc(src) + '" alt="" /></button>';
    }).join("") + "</div>" : "";

    page.innerHTML =
      '<div class="shell">' +
        '<nav class="crumbs" aria-label="Breadcrumb"><a href="./">Home</a>' + icon("chev") + '<a href="./#explore">Shop</a>' + icon("chev") + "<span>" + esc(shortName(p)) + "</span></nav>" +
        '<div class="pdp">' +
          '<div class="pdp-left">' +
            '<div class="gallery' + (thumbs ? " has-thumbs" : "") + '">' + thumbs +
              '<div class="stage">' + (images.length ? '<img id="stageImg" src="' + esc(images[0]) + '" alt="' + esc(shortName(p)) + '" />' : placeholder(p, true)) + "</div>" +
            "</div>" +
            renderReviews(p) +
          "</div>" +
          '<div class="pdp-right">' +
            '<div class="dealbar"><span class="dealbar-tag">Qafizz<br />Deal</span>' +
              '<span class="dealbar-items">' + icon("check") + " Free shipping <i></i> " + icon("check") + ' Refund if damaged <span class="dealbar-chev">' + icon("chev") + "</span></span></div>" +
            '<div class="ptitle"><h1><span class="fast">' + icon("bolt") + " Ships in 1 to 3 business days</span> " + esc(p.name) + "</h1>" +
              '<button type="button" class="pshare" id="share" aria-label="Copy link to this item">' + icon("share") + "</button></div>" +
            '<a class="storebar" href="policies.html#contact">' + icon("shield") + " Qafizz Official Store &middot; Canadian-owned shop " + icon("chev", "storebar-chev") + "</a>" +
            '<div class="pmeta">' +
              (hasTag(p, "bestseller") ? '<span class="best">' + icon("thumb") + " BEST-SELLING ITEM <b>in our shop</b></span>" : '<span class="soldby">Sold and shipped by Qafizz</span>') +
              (stats ? '<a class="pmeta-rating" href="#reviews">' + stats.avg.toFixed(1) + " " + starsHtml(stats.avg, "stars-md") + "</a>" : "") +
            "</div>" +
            '<div class="pprice"><span class="price-orange price-xl">' + bigPrice(p.price) + "</span>" +
              (p.was ? ' <span class="pwas">Was: <s>' + money(p.was) + "</s></span>" : "") +
              (off ? ' <span class="poff">' + off + "% OFF</span>" : "") +
              ' <span class="pcad">CAD</span></div>' +
            '<div class="superdeal"><div class="superdeal-h"><em>SUPER DEAL</em>' + icon("chev") + "</div>" +
              '<div class="superdeal-body">' +
                (styles.length ? '<fieldset class="styles"><legend>Style</legend><div class="style-row">' + styles.map(function (s, i) {
                  return '<label class="style-opt"><input type="radio" name="style" value="' + esc(s) + '"' + (i === 0 ? " checked" : "") + " /><span>" + esc(s) + "</span></label>";
                }).join("") + "</div></fieldset>" : "") +
                '<label class="qty"><span>Qty</span>' + qtySelect(1, 'id="qty"') + "</label>" +
              "</div></div>" +
            '<button type="button" class="btn-orange btn-add" id="addBtn">' + (off ? "-" + off + "% now! " : "") + "Add to cart!<small>Ships in 1 to 3 business days</small></button>" +
            '<div class="perks">' +
              '<div class="perk"><div class="perk-h"><span class="tag-green">' + icon("truck") + ' Free shipping</span> for this item <a href="policies.html#shipping">' + icon("chev") + "</a></div>" +
                '<p>Delivery in 7 to 15 business days. Ships <b class="green">within 1 to 3 business days</b> with tracking.</p></div>' +
              '<div class="perk"><div class="perk-h">' + icon("shield", "ic-green") + ' Safe payments &middot; Secure privacy <a href="policies.html#privacy">' + icon("chev") + "</a></div></div>" +
              '<div class="perk"><div class="perk-h">' + icon("guarantee", "ic-green") + ' Order guarantee <a href="policies.html#returns">' + icon("chev") + "</a></div>" +
                '<div class="gchips"><span>Free shipping</span><span>Refund if item damaged</span><span>Refund if package lost</span><span>30-day returns</span><span>Tracking on every order</span></div></div>' +
            "</div>" +
            '<div class="about"><h2>About this item</h2><ul>' + (p.details || []).map(function (d) { return "<li>" + esc(d) + "</li>"; }).join("") + "</ul></div>" +
          "</div>" +
        "</div>" +
      "</div>";

    page.addEventListener("click", function (e) {
      var t = e.target.closest(".thumb");
      if (t) {
        $("#stageImg").src = images[Number(t.dataset.i)];
        $all(".thumb", page).forEach(function (b) { b.classList.toggle("is-on", b === t); });
      }
      if (e.target.closest("#share")) {
        var url = location.origin + location.pathname + "?id=" + encodeURIComponent(p.id);
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(url).then(function () { toast("Link copied"); }, function () { toast(url); });
        } else toast(url);
      }
      if (e.target.closest("#addBtn")) {
        var st = $('input[name="style"]:checked', page);
        addToCart(p.id, st ? st.value : "", Number($("#qty").value) || 1);
        toast("Added to cart");
        if (window.innerWidth < 1200) openCart();
      }
    });
  }

  /* ---------------- boot ---------------- */
  function wireCart() {
    document.addEventListener("click", function (e) {
      if (e.target.closest("#cartOpen")) { if (document.body.classList.contains("cart-open")) closeCart(); else openCart(); }
      if (e.target.closest("#cartClose") || e.target.closest("#cartScrim")) closeCart();
      if (e.target.closest("#checkoutBtn")) checkout();
      var rm = e.target.closest(".cart-remove");
      if (rm) { cart.splice(Number(rm.dataset.line), 1); saveCart(); }
    });
    document.addEventListener("change", function (e) {
      if (e.target.classList.contains("qty-select") && e.target.dataset.line != null) {
        var line = cart[Number(e.target.dataset.line)];
        if (line) { line.qty = Number(e.target.value); saveCart(); }
      }
    });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeCart(); });
  }

  renderChrome(!!$("#homePage"));
  wireCart();

  if ($("#thanksPage")) { cart = []; saveCart(); }

  fetch("products.json?v=" + Math.floor(Date.now() / 300000))
    .then(function (r) { return r.json(); })
    .then(function (list) { PRODUCTS = Array.isArray(list) ? list : []; })
    .catch(function () { PRODUCTS = []; })
    .then(function () {
      cart = cart.filter(function (l) { return findProduct(l.id); });
      renderCart();
      renderHome();
      renderProduct();
    });
})();
