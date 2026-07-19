/* ==========================================================================
   TRUST ME BRO — slots.js
   Named for the slots it fills, not for ads: content blockers drop any script
   whose URL matches /ads.js by filename alone, which took the whole file out
   before a line of it ran.
   Fills the .ad-banner slots. Inert until PUBLISHER_ID is set: every slot keeps
   its reserved height and placeholder, nothing external loads, and the site
   still works over file://. Set PUBLISHER_ID + SLOT_IDS once AdSense approves
   the domain and the same slots go live with no layout change — the reserved
   heights in css/styles.css are what keep the creative from shifting content.

   Slots fill lazily as they near the viewport: AdSense counts an impression
   when a unit fills, so filling offscreen slots burns inventory and drags
   viewability down. Plain script, no modules.
   ========================================================================== */

window.Ads = (() => {
  /* From AdSense → Account → Settings. Empty = every slot stays a placeholder. */
  const PUBLISHER_ID = "ca-pub-6047624815480207";

  /* Per-unit slot ids from AdSense → Ads → By ad unit. Every in-feed unit
     shares one id; `infeed` is the fallback for the infeed-N slots app.js
     generates as you scroll. */
  const SLOT_IDS = {
    "top-leaderboard": "",
    "sidebar-top": "",
    "sidebar-sticky": "",
    "detail-mid": "",
    "mobile-anchor": "",
    infeed: "",
  };

  const isLive = () => Boolean(PUBLISHER_ID);

  function slotIdFor(name) {
    if (SLOT_IDS[name]) return SLOT_IDS[name];
    if (/^infeed-/.test(name)) return SLOT_IDS.infeed;
    return "";
  }

  function loadSdk() {
    if (!isLive() || document.getElementById("adsbygoogle-sdk")) return;
    const s = document.createElement("script");
    s.id = "adsbygoogle-sdk";
    s.async = true;
    s.crossOrigin = "anonymous";
    s.src =
      "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=" +
      encodeURIComponent(PUBLISHER_ID);
    document.head.appendChild(s);
  }

  /* Nothing to show: collapse the slot entirely rather than leaving a grey
     placeholder box on a live page. Reserved height only helps when a creative
     is actually coming. */
  function collapse(el) {
    el.classList.add("is-empty");
    el.style.display = "none";
  }

  function mount(el) {
    if (el.dataset.adMounted) return;
    el.dataset.adMounted = "1";
    if (!isLive()) return collapse(el);

    const slotId = slotIdFor(el.dataset.adSlot || "");
    if (!slotId) return collapse(el); // no unit configured yet

    const ins = document.createElement("ins");
    ins.className = "adsbygoogle";
    ins.style.display = "block";
    ins.style.width = "100%";
    ins.style.height = "100%";
    ins.setAttribute("data-ad-client", PUBLISHER_ID);
    ins.setAttribute("data-ad-slot", slotId);
    ins.setAttribute("data-ad-format", el.dataset.adFormat || "auto");
    ins.setAttribute("data-full-width-responsive", "true");
    el.appendChild(ins);
    el.classList.add("is-filled");

    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
      // Blocked or SDK missing — collapse rather than show an empty frame.
      ins.remove();
      el.classList.remove("is-filled");
      collapse(el);
    }
  }

  const io =
    "IntersectionObserver" in window
      ? new IntersectionObserver(
          (entries) => {
            entries.forEach((e) => {
              if (!e.isIntersecting) return;
              io.unobserve(e.target);
              mount(e.target);
            });
          },
          { rootMargin: "300px 0px" } // fill just before it's seen
        )
      : null;

  /* app.js calls this for in-feed slots it builds during scroll. */
  function register(el) {
    if (!el || !el.dataset || el.dataset.adSlot === undefined) return;
    /* No unit behind this slot: collapse now instead of waiting for it to near
       the viewport, so no placeholder is ever visible. */
    if (!isLive() || !slotIdFor(el.dataset.adSlot || "")) {
      el.dataset.adMounted = "1";
      return collapse(el);
    }
    if (io) io.observe(el);
    else mount(el);
  }

  function init() {
    loadSdk();
    document.querySelectorAll(".ad-banner[data-ad-slot]").forEach(register);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  return { register, mount, isLive };
})();
