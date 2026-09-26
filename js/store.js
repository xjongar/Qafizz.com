/* ==========================================================================
   QAFIZZ - store rendering (home grid + product page)
   Products come from js/products.js. You should not need to edit this file.
   ========================================================================== */
(function () {
  "use strict";

  var PRODUCTS = window.QAFIZZ_PRODUCTS || [];
  var TINTS = ["#DCE3FF", "#FFE0EA", "#D8F3E7", "#FFF0C2", "#EADFFF", "#D6F1FA"];

  function $(sel) { return document.querySelector(sel); }

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function money(n) {
    return "$" + Number(n).toFixed(2);
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

  function productUrl(p) {
    return "product.html?id=" + encodeURIComponent(p.id);
  }

  // Shown until real photos are added to a product's images list.
  function placeholder(p, big) {
    var initials = p.name.split(/\s+/).filter(function (w) { return /^[A-Za-z]/.test(w); })
      .slice(0, 2).map(function (w) { return w[0]; }).join("").toUpperCase();
    return '<div class="ph' + (big ? " ph-big" : "") + '" style="--tint:' + tintFor(p.id) + '" role="img" aria-label="' + esc(p.name) + ' (photo coming soon)">' +
      '<svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="44" cy="74" r="30"/><circle cx="84" cy="36" r="17"/><circle cx="90" cy="84" r="9"/></svg>' +
      '<span>' + esc(initials) + "</span></div>";
  }

  function mainImage(p, big) {
    if (p.images && p.images.length) {
      return '<img src="' + esc(p.images[0]) + '" alt="' + esc(p.name) + '" loading="lazy" />';
    }
    return placeholder(p, big);
  }

  function priceHtml(p) {
    var off = percentOff(p);
    return '<span class="price">' + money(p.price) + "</span>" +
      (off ? ' <s class="was">' + money(p.was) + '</s> <span class="off">-' + off + "%</span>" : "");
  }

  function reviewStats(p) {
    var r = p.reviews || [];
    if (!r.length) return null;
    var sum = r.reduce(function (a, x) { return a + Number(x.stars || 0); }, 0);
    return { count: r.length, avg: sum / r.length };
  }

  function starsHtml(value) {
    var out = "";
    for (var i = 1; i <= 5; i++) {
      var fill = Math.max(0, Math.min(1, value - (i - 1)));
      out += '<span class="star" style="--fill:' + Math.round(fill * 100) + '%" aria-hidden="true"></span>';
    }
    return '<span class="stars" role="img" aria-label="' + value.toFixed(1) + ' out of 5 stars">' + out + "</span>";
  }

  var toastTimer;
  function toast(msg) {
    var t = $("#toast");
    if (!t) return;
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.hidden = true; }, 2400);
  }

  function copyLink(url) {
    function fallback() { toast("Copy this link: " + url); }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(function () { toast("Link copied"); }, fallback);
    } else {
      fallback();
    }
  }

  /* ---------------- Home page ---------------- */

  function card(p) {
    var stats = reviewStats(p);
    return '<a class="card" href="' + productUrl(p) + '">' +
      '<div class="card-media">' + mainImage(p, false) +
      (p.badge ? '<span class="badge">' + esc(p.badge) + "</span>" : "") + "</div>" +
      '<div class="card-body">' +
      "<h3>" + esc(p.name) + "</h3>" +
      '<p class="tagline">' + esc(p.tagline) + "</p>" +
      (stats ? '<p class="card-rating">' + starsHtml(stats.avg) + " <span>" + stats.count + "</span></p>" : "") +
      '<p class="card-price">' + priceHtml(p) + "</p>" +
      "</div></a>";
  }

  function renderHome() {
    var grid = $("#grid");
    if (!grid) return;

    var feature = PRODUCTS.filter(function (p) { return p.badge; })[0] || PRODUCTS[0];
    var hero = $("#heroFeature");
    if (hero && feature) {
      hero.innerHTML = '<a class="feature" href="' + productUrl(feature) + '">' +
        '<div class="feature-media">' + mainImage(feature, true) + "</div>" +
        '<div class="feature-info"><span class="feature-label">Trending now</span>' +
        "<strong>" + esc(feature.name) + "</strong>" +
        '<span class="feature-price">' + priceHtml(feature) + "</span></div></a>";
    }

    var search = $("#search");
    function draw() {
      var q = (search && search.value || "").trim().toLowerCase();
      var list = PRODUCTS.filter(function (p) {
        return !q || (p.name + " " + p.tagline + " " + (p.details || []).join(" ")).toLowerCase().indexOf(q) !== -1;
      });
      grid.innerHTML = list.map(card).join("");
      $("#empty").hidden = list.length > 0;
    }
    if (search) {
      search.addEventListener("input", draw);
      search.addEventListener("keydown", function (e) {
        if (e.key === "Enter") { var s = $("#shop"); if (s) s.scrollIntoView({ behavior: "smooth" }); }
      });
    }
    draw();
  }

  /* ---------------- Product page ---------------- */

  function checkoutUrl(p, style) {
    if (style && style.stripe) return style.stripe;
    if (!p.stripe) return "";
    if (!style) return p.stripe;
    // Tells you which option was picked: shows as the payment's reference in Stripe.
    var ref = (p.id + "_" + style.name).replace(/[^A-Za-z0-9_-]/g, "-").slice(0, 200);
    return p.stripe + (p.stripe.indexOf("?") === -1 ? "?" : "&") + "client_reference_id=" + encodeURIComponent(ref);
  }

  function renderReviews(p) {
    var stats = reviewStats(p);
    if (!stats) {
      return '<section class="reviews" id="reviews"><div class="reviews-head"><h2>Reviews</h2></div>' +
        '<div class="reviews-empty"><p><strong>No reviews yet.</strong> Got this item? Email <a href="mailto:qafizz@qafizz.com">qafizz@qafizz.com</a> with your review and a photo and we will post it here.</p></div></section>';
    }
    var items = p.reviews.map(function (r) {
      var initial = esc((r.name || "?").trim()[0] || "?").toUpperCase();
      var date = r.date ? new Date(r.date + "T12:00:00").toLocaleDateString("en-CA", { year: "numeric", month: "short", day: "numeric" }) : "";
      return '<article class="review">' +
        '<header><span class="avatar" style="--tint:' + tintFor(r.name || "x") + '">' + initial + "</span>" +
        "<div><strong>" + esc(r.name) + "</strong>" +
        '<span class="review-meta">' + [esc(r.place), esc(date)].filter(Boolean).join(" · ") + "</span></div></header>" +
        starsHtml(Number(r.stars || 0)) +
        "<p>" + esc(r.text) + "</p></article>";
    }).join("");
    return '<section class="reviews" id="reviews"><div class="reviews-head"><h2>' + stats.count + " review" + (stats.count === 1 ? "" : "s") + "</h2>" +
      '<span class="reviews-avg">' + stats.avg.toFixed(1) + " " + starsHtml(stats.avg) + "</span></div>" +
      '<div class="review-list">' + items + "</div></section>";
  }

  function renderProduct() {
    var page = $("#productPage");
    if (!page) return;

    var id = new URLSearchParams(location.search).get("id");
    var p = PRODUCTS.filter(function (x) { return x.id === id; })[0];
    if (!p) {
      page.innerHTML = '<div class="not-found"><h1>We couldn\'t find that product</h1><p>It may have sold out or the link has a typo.</p><a class="btn-shop" href="./#shop">See everything in the shop</a></div>';
      return;
    }

    document.title = p.name + " | Qafizz";
    var desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute("content", p.tagline);

    var images = (p.images || []).slice();
    var styles = p.styles || [];
    var stats = reviewStats(p);
    var off = percentOff(p);

    var thumbs = images.length > 1 ? '<div class="thumbs" role="tablist" aria-label="Photos">' + images.map(function (src, i) {
      return '<button type="button" class="thumb' + (i === 0 ? " is-on" : "") + '" data-i="' + i + '" aria-label="Photo ' + (i + 1) + '"><img src="' + esc(src) + '" alt="" /></button>';
    }).join("") + "</div>" : "";

    var styleHtml = styles.length ? '<fieldset class="options"><legend>Style: <span id="styleName">' + esc(styles[0].name) + "</span></legend><div class=\"option-row\">" +
      styles.map(function (s, i) {
        return '<label class="option"><input type="radio" name="style" value="' + i + '"' + (i === 0 ? " checked" : "") + " /><span>" + esc(s.name) + "</span></label>";
      }).join("") + "</div></fieldset>" : "";

    page.innerHTML =
      '<nav class="crumbs" aria-label="Breadcrumb"><a href="./">Home</a><span aria-hidden="true">›</span><a href="./#shop">Shop</a><span aria-hidden="true">›</span><span>' + esc(p.name) + "</span></nav>" +
      '<div class="pdp">' +
        '<div class="gallery' + (thumbs ? " has-thumbs" : "") + '">' + thumbs +
          '<div class="stage" id="stage">' + (images.length ? '<img id="stageImg" src="' + esc(images[0]) + '" alt="' + esc(p.name) + '" />' : placeholder(p, true)) +
          (p.badge ? '<span class="badge">' + esc(p.badge) + "</span>" : "") + "</div>" +
        "</div>" +
        '<div class="buybox">' +
          '<div class="deal-bar"><span class="deal-tag">' + (off ? off + "% off" : "Qafizz pick") + '</span><span>Free shipping</span><span>Tracking included</span></div>' +
          '<div class="title-row"><h1>' + esc(p.name) + '</h1><button type="button" class="share" id="share" aria-label="Copy link to this product"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12M7 8l5-5 5 5M5 13v7h14v-7"/></svg></button></div>' +
          (stats ? '<a class="rating-line" href="#reviews">' + stats.avg.toFixed(1) + " " + starsHtml(stats.avg) + " <span>" + stats.count + " review" + (stats.count === 1 ? "" : "s") + "</span></a>" : "") +
          '<p class="pdp-price">' + priceHtml(p) + ' <span class="cad">CAD</span></p>' +
          styleHtml +
          '<div id="buyWrap"></div>' +
          '<ul class="assurances">' +
            "<li><strong>Free shipping</strong> to Canada and the US. Ships in 1 to 3 business days, arrives in about 7 to 15.</li>" +
            "<li><strong>Safe payment</strong> through Stripe: card, Apple Pay or Google Pay. We never see your card number.</li>" +
            '<li><strong>Order guarantee</strong> <span class="chips-row"><span>Refund if damaged</span><span>30-day returns</span><span>Tracking on every order</span></span></li>' +
          "</ul>" +
          '<div class="about"><h2>About this item</h2><ul>' + (p.details || []).map(function (d) { return "<li>" + esc(d) + "</li>"; }).join("") + "</ul></div>" +
        "</div>" +
      "</div>" +
      renderReviews(p);

    function currentStyle() {
      var on = page.querySelector('input[name="style"]:checked');
      return on ? styles[Number(on.value)] : null;
    }

    function drawBuy() {
      var url = checkoutUrl(p, currentStyle());
      var wrap = $("#buyWrap");
      wrap.innerHTML = url
        ? '<a class="btn-buy" href="' + esc(url) + '" rel="noopener">' + (off ? "-" + off + "% now! " : "") + "Buy now<small>Secure checkout. You can change the quantity at checkout.</small></a>"
        : '<button class="btn-buy is-soon" type="button" disabled>Coming soon<small>Checkout for this item opens shortly</small></button>';
    }

    page.addEventListener("change", function (e) {
      if (e.target.name === "style") {
        $("#styleName").textContent = currentStyle().name;
        drawBuy();
      }
    });

    page.addEventListener("click", function (e) {
      var t = e.target.closest(".thumb");
      if (t) {
        var img = $("#stageImg");
        img.src = images[Number(t.dataset.i)];
        page.querySelectorAll(".thumb").forEach(function (b) { b.classList.toggle("is-on", b === t); });
      }
      if (e.target.closest("#share")) copyLink(location.origin + location.pathname + "?id=" + encodeURIComponent(p.id));
    });

    drawBuy();
  }

  var y = $("#year");
  if (y) y.textContent = new Date().getFullYear();

  renderHome();
  renderProduct();
})();
