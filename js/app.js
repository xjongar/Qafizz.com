/* ==========================================================================
   TRUST ME BRO — app.js
   Modules: Theme, MockAPI (swap for real backend), Votes, Feed, Detail,
   Comments, Search, Create, Nav, Sidebar, MobileNav
   ========================================================================== */

"use strict";

/* Hand-drawn brush triangle (pointing up) — curved sides, uneven rounded corners */
const BRUSH_TRI =
  "M11.4 3.3 C11.9 2.8 12.8 2.9 13.3 3.7 C15.9 7.8 18.4 12.1 20.8 16.5 " +
  "C21.4 17.7 20.8 18.9 19.5 19.1 C14.7 19.8 9.1 19.8 4.3 19.2 " +
  "C3 19 2.5 17.8 3.1 16.6 C5.6 12.1 8.2 7.7 10.9 3.9 C11 3.7 11.2 3.4 11.4 3.3 Z";

/* ---------- THEME ---------- */
const Theme = (() => {
  const STORAGE_KEY = "tmb-theme";
  const root = document.documentElement;
  const toggle = document.getElementById("themeToggle");

  function apply(theme) {
    root.setAttribute("data-theme", theme);
    toggle.setAttribute("aria-checked", String(theme === "dark"));
    localStorage.setItem(STORAGE_KEY, theme);
  }

  function init() {
    /* Dark is the brand, so it is the default for everyone regardless of what
       the OS asks for. This used to follow prefers-color-scheme, which meant
       anyone on a light desktop landed on the light theme having never chosen
       it. A saved choice still wins — the toggle is what decides, not the OS. */
    const saved = localStorage.getItem(STORAGE_KEY);
    apply(saved === "light" || saved === "dark" ? saved : "dark");

    toggle.addEventListener("click", () => {
      apply(root.getAttribute("data-theme") === "dark" ? "light" : "dark");
    });
  }

  return { init };
})();

/* ---------- MOCK API ----------
   Replace these functions with real fetch() calls when the backend lands.
   `hoursAgo` powers the sort logic; a real API would return timestamps. */
const MockAPI = (() => {
  const TIERS = ["S", "A", "B", "C", "D"];

  const page1 = [
    {
      id: 1, title: "World Cup Favorites",
      category: "World Cup", author: "footyoracle", time: "34m ago", hoursAgo: 0.5,
      votes: 994, comments: 134,
      tiers: {
        S: ["France", "Spain"],
        A: ["Argentina", "England"],
        B: ["Brazil", "Portugal"],
        C: ["Germany", "USA"],
        D: ["Canada"],
      },
    },
    {
      id: 2, title: "Best Football Players",
      category: "World Cup", author: "xgmerchant", time: "1h ago", hoursAgo: 1,
      votes: 921, comments: 112,
      tiers: {
        S: ["Messi", "Mbappé"],
        A: ["Haaland", "Bellingham"],
        B: ["Vinícius Jr", "Lamine Yamal"],
        C: ["Kane"],
        D: ["Neymar"],
      },
    },
    {
      id: 3, title: "National Team Kits",
      category: "World Cup", author: "kitcollector", time: "3h ago", hoursAgo: 3,
      votes: 838, comments: 76,
      tiers: {
        S: ["Nigeria", "Japan"],
        A: ["Mexico", "France"],
        B: ["USA", "Argentina"],
        C: ["England"],
        D: ["Germany"],
      },
    },
    {
      id: 4, title: "World Cup Winners",
      category: "World Cup", author: "tearscollector", time: "6h ago", hoursAgo: 6,
      votes: 796, comments: 115,
      tiers: {
        S: ["Brazil", "Germany"],
        A: ["Argentina", "Italy"],
        B: ["France", "Uruguay"],
        C: ["Spain"],
        D: ["England"],
      },
    },
    {
      id: 5, title: "Fast Food Brands",
      category: "Fast Food", author: "burgerlord", time: "2h ago", hoursAgo: 2,
      votes: 817, comments: 58,
      tiers: {
        S: ["McDonald's", "Chick-fil-A"],
        A: ["Wendy's", "Five Guys"],
        B: ["Popeyes", "Burger King"],
        C: ["KFC"],
        D: ["Subway"],
      },
    },
    {
      id: 6, title: "Zelda Games",
      category: "Games", author: "hyrulehater", time: "5h ago", hoursAgo: 5,
      votes: 764, comments: 102,
      tiers: {
        S: ["Breath of the Wild", "Tears of the Kingdom"],
        A: ["Ocarina of Time", "Wind Waker"],
        B: ["Majora's Mask", "Link's Awakening"],
        C: ["Skyward Sword"],
        D: ["Zelda II"],
      },
    },
    {
      id: 7, title: "Anime Series",
      category: "Anime", author: "sakugasan", time: "8h ago", hoursAgo: 8,
      votes: 703, comments: 57,
      tiers: {
        S: ["Fullmetal Alchemist", "Attack on Titan"],
        A: ["One Piece", "Death Note"],
        B: ["Jujutsu Kaisen", "Naruto"],
        C: ["Bleach"],
        D: ["Sword Art Online"],
      },
    },
    {
      id: 8, title: "Programming Languages",
      category: "Tech", author: "segfaultsally", time: "12h ago", hoursAgo: 12,
      votes: 671, comments: 164,
      tiers: {
        S: ["Python", "TypeScript"],
        A: ["Rust", "Go"],
        B: ["C#", "Kotlin"],
        C: ["Java", "C++"],
        D: ["PHP"],
      },
    },
    {
      id: 9, title: "Sneaker Brands",
      category: "Fashion", author: "griptape", time: "14h ago", hoursAgo: 14,
      votes: 588, comments: 46,
      tiers: {
        S: ["Nike", "Jordan"],
        A: ["Adidas", "New Balance"],
        B: ["Puma", "Converse"],
        C: ["Reebok"],
        D: ["Skechers"],
      },
    },
    {
      id: 10, title: "Movie Trilogies",
      category: "Movies", author: "reelcritic", time: "19h ago", hoursAgo: 19,
      votes: 542, comments: 75,
      tiers: {
        S: ["Lord of the Rings", "Toy Story"],
        A: ["Back to the Future", "The Dark Knight"],
        B: ["Star Wars", "Spider-Man"],
        C: ["The Matrix"],
        D: ["The Hangover"],
      },
    },
    {
      id: 11, title: "Social Media Apps",
      category: "Memes", author: "milkfirst", time: "1d ago", hoursAgo: 24,
      votes: 487, comments: 40,
      tiers: {
        S: ["YouTube"],
        A: ["Instagram", "TikTok"],
        B: ["Reddit"],
        C: ["X"],
        D: ["LinkedIn"],
      },
    },
    {
      id: 12, title: "Gym Exercises",
      category: "Sports", author: "dumbbelldave", time: "1d ago", hoursAgo: 26,
      votes: 431, comments: 53,
      tiers: {
        S: ["Bench Press", "Deadlift"],
        A: ["Squats", "Pull-ups"],
        B: ["Rows", "Lat Pulldown"],
        C: ["Leg Press"],
        D: ["Burpees"],
      },
    },
  ];

  /* 1000 seed topics live in js/topics.js (loaded first). Items are ordered
     best → worst; toTiers() distributes them across the five ranks. */
  const TRENDY_TOPICS = window.TRENDY_TOPICS || [];

  const AUTHOR_POOL = [
    "footyoracle", "xgmerchant", "kitcollector", "auxgoblin", "bloxxed",
    "cordcutter", "promptlord", "gatec12", "postcredits", "sakugasan",
    "burgerlord", "segfaultsally", "griptape", "reelcritic", "milkfirst",
    "dumbbelldave", "tearscollector", "hyrulehater", "casualenjoyer", "lurker_supreme",
    "offsidetrap", "boxtoboxer", "penaltyfraud", "groupstagegoblin", "hattrickhank",
    "backpagebella", "cleatchaser", "vartherapist", "stoppagetime", "kitmanjim",
    "framedataphil", "respawnqueen", "loreaccurate", "speedrunsteve", "achievementhunted",
    "patchnotesguy", "lootboxlarry", "couchcoopkid", "endgamespoiler", "modmenace",
    "nullpointerpam", "gitblamegary", "regexwizard", "prodpusher", "sudoapologist",
    "tabsnotspaces", "yamlyeller", "legacycodelou", "standupskipper", "rubberduckrick",
    "finalcutfran", "boxofficebrad", "letterboxdlurker", "practicalfxpaul", "midcreditsmia",
    "arthousealan", "trailerspoiler", "cinemachad", "runtimerealist", "b_movie_betty",
    "bingebot", "showrunnerstan", "pilotepisodepat", "spinoffskeptic", "recapqueen",
    "laughtracklee", "streamsurfer", "cliffhangercarl", "subtitlesteve", "autoplayvictim",
    "vinylvictor", "auxdefender", "onehitwonder", "bridgeenjoyer", "featureverse",
    "bpmbandit", "encoreenemy", "playlistpirate", "shufflehater", "moshpitmom",
    "sakugasnob", "subsoverdubs", "arcenjoyer", "openingskipper", "powerscaler",
    "mangareader", "fillerhater", "waifucommittee", "shonenscholar", "seinenserious",
    "chronicallyonline", "screentimedenier", "ratiodealer", "replyguyretired", "algofodder",
    "doomscroller", "touchgrasser", "screenshotsaver", "quotetweeter", "lurkmode",
    "fryconnoisseur", "saucepacket", "leftoverlogic", "brunchskeptic", "hotsaucehank",
    "snackarchitect", "cerealcriminal", "drivethrudan", "mealprepmartyr", "buffetbandit",
    "benchpressbrenda", "boxscorebilly", "fantasyfraud", "pitlanepete", "clutchgene",
    "reracker", "statpadder", "courtsidecarla", "overtimeowen", "gymfloorghost",
    "thriftedthea", "solequeen", "layeringlogic", "fitcheckfred", "denimdisciple",
    "torqueterry", "manualonly", "beatercarbob", "roadtripryan", "parkinglotpro",
    "commutecomrade", "inboxzeroliar", "mondaymourner", "choreavoider", "adultingbadly",
    "layoverlarry", "middleseatmark", "passportpanic", "carryonchris", "jetlagjen",
    "capybaracult", "goosewitness", "vetbillvictim", "crowfriend", "petnameparent",
  ];

  /* Deterministic per-post metrics: same id always yields the same numbers,
     so votes/times don't reshuffle on every reload. */
  function hash32(n) {
    let x = n | 0;
    x = Math.imul(x ^ (x >>> 16), 2246822507);
    x = Math.imul(x ^ (x >>> 13), 3266489909);
    return (x ^ (x >>> 16)) >>> 0;
  }

  function rand(seed, salt) {
    return hash32(seed * 2654435761 + salt) / 4294967296;
  }

  function timeLabel(h) {
    if (h < 1) return Math.round(h * 60) + "m ago";
    if (h < 24) return Math.round(h) + "h ago";
    return Math.round(h / 24) + "d ago";
  }

  function toTiers(items) {
    const tiers = {};
    items.forEach((item, i) => {
      const tier = TIERS[Math.min(4, Math.floor((i * 5) / items.length))];
      (tiers[tier] = tiers[tier] || []).push(item);
    });
    return tiers;
  }

  const trendy = TRENDY_TOPICS.map((topic, i) => {
    const id = 100 + i;
    // Skewed curves: most posts are recent and mid-sized, a few are old or huge.
    // Votes are capped at 1000 — 40 floor + 960 spread hits the ceiling exactly.
    const hoursAgo = +(0.2 + Math.pow(rand(id, 1), 2.2) * 700).toFixed(1);
    const votes = Math.round(40 + Math.pow(rand(id, 2), 3) * 960);
    return {
      id,
      title: topic.t,
      category: topic.c,
      author: AUTHOR_POOL[hash32(id * 7 + 3) % AUTHOR_POOL.length],
      time: timeLabel(hoursAgo),
      hoursAgo,
      votes,
      comments: Math.max(3, Math.round(votes / (5 + rand(id, 3) * 14))),
      tiers: toTiers(topic.i),
    };
  });

  const PAGE_SIZE = 12;

  /* Shared thread pool — each post draws a few threads from it. `text` is a
     function of the post context, so threads name the list's real picks rather
     than talking around them. Authors, votes and times are NOT stored here:
     they're derived per post in personalize(), so the same thread never renders
     twice the same way. Flags: `op` = the list's author replying, `self` = the
     thread's original commenter coming back, `spicy` = starts downvoted. */
  const COMMENT_POOL = [
    {
      id: "c1",
      text: (x) => `Putting ${x.s} in S tier is the bravest thing I've seen on this site.`,
      replies: [
        {
          id: "c1-1", op: true,
          text: (x) => `Brave AND correct. ${x.s} carries the entire ${x.cat} conversation. Trust me bro.`,
          replies: [
            { id: "c1-1-1", self: true, text: "…ok that's fair actually.", replies: [] },
          ],
        },
      ],
    },
    {
      id: "c2", spicy: true,
      text: "This entire list is wrong and I will not be elaborating.",
      replies: [
        { id: "c2-1", text: "The comment section delivering as always 🍿", replies: [] },
      ],
    },
    {
      id: "c3",
      text: (x) => `First time commenting in 4 years. ${x.s} at the top moved me.`,
      replies: [],
    },
    {
      id: "c4",
      text: "Genuine question: what's the methodology here, or did you just vibe it?",
      replies: [
        { id: "c4-1", op: true, text: "Vibes, but rigorous vibes.", replies: [] },
      ],
    },
    {
      id: "c5",
      text: (x) => `${x.d} in D tier is carrying this entire list and you know it.`,
      replies: [
        { id: "c5-1", text: "Someone had to say it. D tier is the real S tier.", replies: [] },
      ],
    },
    {
      id: "c6",
      text: (x) => `Came here to get mad about ${x.d}. Left mildly educated. Mixed feelings.`,
      replies: [],
    },
    {
      id: "c7",
      text: "You forgot the obvious one and now I don't trust any of the rest.",
      replies: [
        {
          id: "c7-1", op: true, text: "It didn't make the cut. That IS the take.",
          replies: [
            { id: "c7-1-1", self: true, text: "Bold. Wrong, but bold.", replies: [] },
          ],
        },
      ],
    },
    {
      id: "c8",
      text: (x) => `Sending this to the group chat to end a 3-week argument about ${x.s}. Wish me luck.`,
      replies: [],
    },
    {
      id: "c9",
      text: (x) => `Everyone in here is arguing about ${x.d} and nobody has upvoted the list. Fix that.`,
      replies: [],
    },
    {
      id: "c10",
      text: (x) => `${x.b} in B tier is where the honest opinions live. S tier is just marketing.`,
      replies: [
        { id: "c10-1", text: "B tier truther spotted in the wild.", replies: [] },
      ],
    },
    {
      id: "c11",
      text: (x) => `${x.a} over ${x.b} is defensible if you squint. I'm squinting. Still no.`,
      replies: [],
    },
    {
      id: "c12", spicy: true,
      text: "Wrong on every level, and I mean that with love.",
      replies: [
        { id: "c12-1", op: true, text: "The love is received. The criticism is not.", replies: [] },
      ],
    },
    {
      id: "c13",
      text: (x) => `The ordering within S tier is a whole separate list and you know it. ${x.s} first? Discuss.`,
      replies: [],
    },
    {
      id: "c14",
      text: "Been staring at this for ten minutes. I have nothing to add. Perfect list.",
      replies: [],
    },
    {
      id: "c15",
      text: (x) => `Finally a ${x.cat} list that isn't just the same five things in a different order.`,
      replies: [
        { id: "c15-1", text: "It is literally that, but ok.", replies: [] },
      ],
    },
    {
      id: "c16",
      text: (x) => `Saved this. Will return in six months to be angry about ${x.d} again.`,
      replies: [],
    },
    {
      id: "c17",
      text: (x) => `Swap ${x.s} and ${x.a} and this is flawless. Otherwise, respect.`,
      replies: [
        { id: "c17-1", op: true, text: "Swapping the top two is the whole disagreement, bro.", replies: [] },
      ],
    },
    {
      id: "c18",
      text: "The algorithm fed me this at 3am and honestly? Correct call.",
      replies: [],
    },
    {
      id: "c19",
      text: (x) => `${x.d} slander. In THIS economy.`,
      replies: [
        { id: "c19-1", text: (x) => `${x.d} has been through enough, genuinely.`, replies: [] },
      ],
    },
    {
      id: "c20",
      text: (x) => `${x.c} sitting in C tier is the most controversial thing here and nobody's talking about it.`,
      replies: [],
    },
    {
      id: "c21",
      text: (x) => `I scrolled straight to D tier. ${x.d}. Yeah, that tracks.`,
      replies: [],
    },
    {
      id: "c22",
      text: (x) => `${x.s} is S tier and everything else on here is a rounding error.`,
      replies: [
        { id: "c22-1", text: "Reductive. Correct, but reductive.", replies: [] },
      ],
    },
    {
      id: "c23", spicy: true,
      text: (x) => `${x.a} in A tier? That's a paddlin'.`,
      replies: [],
    },
    {
      id: "c24",
      text: (x) => `New to ${x.cat}, is this a good list? Everyone's fighting so I'm assuming yes.`,
      replies: [
        { id: "c24-1", op: true, text: "Fighting means it's working. Welcome.", replies: [] },
      ],
    },
    {
      id: "c25",
      text: (x) => `The ${x.b} placement is going to age like milk.`,
      replies: [
        { id: "c25-1", text: "RemindMe! 6 months", replies: [] },
      ],
    },
    {
      id: "c26",
      text: (x) => `Tell me you've never actually dealt with ${x.d} without telling me.`,
      replies: [
        { id: "c26-1", op: true, text: (x) => `I have. Extensively. That's precisely why ${x.d} is in D.`, replies: [] },
      ],
    },
    {
      id: "c27",
      text: (x) => `${x.s} > ${x.a} is the correct order and I'm tired of pretending it isn't.`,
      replies: [],
    },
    {
      id: "c28",
      text: (x) => `Nobody: … absolutely nobody: … this list: ${x.d} in D tier.`,
      replies: [],
    },
    {
      id: "c29",
      text: (x) => `Solid list, but ${x.c} deserves better than C tier.`,
      replies: [
        { id: "c29-1", text: "C tier IS better. It's the middle. That's the entire point of the middle.", replies: [] },
      ],
    },
    {
      id: "c30",
      text: "Screenshotted for the inevitable deletion.",
      replies: [],
    },
    {
      id: "c31",
      text: (x) => `${x.a} fans are going to find this thread and they will not be kind.`,
      replies: [
        { id: "c31-1", text: "We're already here.", replies: [] },
      ],
    },
    {
      id: "c32",
      text: (x) => `Genuinely cannot tell if ${x.d} in D is a hot take or a war crime.`,
      replies: [],
    },
    {
      id: "c33",
      text: (x) => `Upvoted for ${x.s}, downvoted for ${x.d}, net zero, see you in the next one.`,
      replies: [],
    },
    {
      id: "c34",
      text: (x) => `This is the ${x.cat} discourse I signed up for. Chaos. Beautiful.`,
      replies: [],
    },
    {
      id: "c35", spicy: true,
      text: (x) => `Ratio incoming for the ${x.b} take.`,
      replies: [
        { id: "c35-1", text: "It's been four hours. The ratio is not coming.", replies: [] },
      ],
    },
    {
      id: "c36",
      text: (x) => `${x.s} in S: uncontroversial. ${x.d} in D: fighting words. Bold range.`,
      replies: [],
    },
    {
      id: "c37",
      text: "My hot take: the entire A tier is just S tier with commitment issues.",
      replies: [
        { id: "c37-1", text: "This is the smartest thing anyone has said in this thread.", replies: [] },
      ],
    },
    {
      id: "c38",
      text: (x) => `Bookmarking so I can lose my mind about ${x.b} later.`,
      replies: [],
    },
  ];

  /* Per-post overrides — anything not listed draws from COMMENT_POOL. */
  const comments = {};

  function findList(id) {
    return page1.find((l) => l.id === id) || trendy.find((l) => l.id === id) || null;
  }

  /* String hash, so a thread's id can seed its own numbers. */
  function hashStr(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  /* Name a real entry from the post. Falls back through the other tiers so a
     template never renders "undefined" on a list with a sparse tier. */
  function tierPick(list, tier, fromEnd) {
    const order = [tier, "S", "A", "B", "C", "D"];
    for (const t of order) {
      const arr = list && list.tiers && list.tiers[t];
      if (arr && arr.length) return fromEnd ? arr[arr.length - 1] : arr[0];
    }
    return "that pick";
  }

  function postContext(list) {
    return {
      s: tierPick(list, "S"),
      a: tierPick(list, "A"),
      b: tierPick(list, "B"),
      c: tierPick(list, "C"),
      d: tierPick(list, "D", true), // the worst entry, not just D's first
      cat: list ? list.category : "this",
      title: list ? list.title : "this list",
    };
  }

  /* A commenter who isn't the OP and hasn't already spoken on this post. */
  function authorFor(seed, taken) {
    let idx = hash32(seed) % AUTHOR_POOL.length;
    for (let i = 0; i < AUTHOR_POOL.length; i++) {
      const name = AUTHOR_POOL[(idx + i) % AUTHOR_POOL.length];
      if (!taken.has(name)) return name;
    }
    return AUTHOR_POOL[idx];
  }

  /* Skewed low: most comments sit in the double digits, a few break 500.
     Capped under 1000 to match the lists. Spicy threads open in the negative. */
  function commentVotes(seed, spicy) {
    if (spicy) return -(3 + Math.floor(rand(seed, 61) * 60));
    return Math.round(4 + Math.pow(rand(seed, 62), 2.4) * 880);
  }

  /* Measured against the PARENT's age, not the post's — a reply always lands
     between whatever it answers and now, so no thread reads out of order.
     Top-level threads spread across the post's whole life. */
  function commentHours(parentHours, seed, depth) {
    const frac = depth === 0
      ? 0.08 + rand(seed, 63) * 0.84
      : 0.25 + rand(seed, 63) * 0.60;
    return Math.max(0.02, parentHours * frac);
  }

  /* Clone so per-post derivation never mutates the pool. Everything a reader
     sees — author, text, votes, time — is a function of (post, thread node). */
  function personalize(node, ctx, state, depth, parentHours) {
    const seed = (state.listId * 131 + hashStr(node.id)) | 0;

    let author;
    if (node.op && state.opAuthor) {
      author = state.opAuthor;
    } else if (node.self && state.rootAuthor) {
      author = state.rootAuthor;
    } else {
      author = authorFor(seed * 3 + 7, state.taken);
      state.taken.add(author);
    }
    if (depth === 0) state.rootAuthor = author;

    const hours = commentHours(parentHours, seed, depth);
    return {
      id: state.listId + "-" + node.id,
      author,
      op: !!(node.op && state.opAuthor),
      time: timeLabel(hours),
      text: typeof node.text === "function" ? node.text(ctx) : node.text,
      votes: commentVotes(seed, node.spicy),
      replies: (node.replies || []).map((r) => personalize(r, ctx, state, depth + 1, hours)),
    };
  }

  function threadsFor(listId) {
    const list = findList(listId);
    const ctx = postContext(list);
    const opAuthor = list ? list.author : null;
    const state = {
      listId,
      opAuthor,
      rootAuthor: null,
      taken: new Set(opAuthor ? [opAuthor] : []),
      hours: list ? list.hoursAgo : 6,
    };
    const count = 2 + Math.floor(rand(listId, 11) * 4); // 2–5 threads
    const used = new Set();
    const out = [];
    for (let k = 0; k < count; k++) {
      let idx = Math.floor(rand(listId, 20 + k) * COMMENT_POOL.length);
      while (used.has(idx)) idx = (idx + 1) % COMMENT_POOL.length;
      used.add(idx);
      out.push(personalize(COMMENT_POOL[idx], ctx, state, 0, state.hours));
    }
    return out;
  }

  const leaderboard = [
    { name: "footyoracle", points: "18.2k" },
    { name: "sakugasan", points: "12.4k" },
    { name: "burgerlord", points: "9.8k" },
    { name: "segfaultsally", points: "8.1k" },
    { name: "reelcritic", points: "6.7k" },
  ];

  return {
    TIERS,
    getLists: async (page = 1) =>
      page === 1 ? page1 : trendy.slice((page - 2) * PAGE_SIZE, (page - 1) * PAGE_SIZE),
    // Whole corpus — search and category filters run against this, not just
    // the pages the user has clicked through.
    getAll: async () => page1.concat(trendy),
    getComments: async (listId) => comments[listId] || threadsFor(listId),
    getLeaderboard: async () => leaderboard,
    // Username availability — every seed author counts as taken.
    isNameTaken: async (name) => AUTHOR_POOL.indexOf(String(name).toLowerCase()) !== -1,
    // POST stubs — wire to backend later
    submitVote: async (listId, direction) => ({ ok: true, listId, direction }),
    submitComment: async (listId, text, parentId = null) =>
      ({ ok: true, id: "c" + Math.random().toString(36).slice(2, 8), listId, text, parentId }),
  };
})();

/* ---------- VOTES (shared by cards, items, comments) ---------- */
const Votes = (() => {
  /* userVotes[id] = 1 | -1 — mirrors what the backend would track per-user, and
     persists to localStorage so a refresh doesn't wipe what you voted on. Zeroed
     entries are deleted rather than stored so the blob stays small. */
  const STORAGE_KEY = "tmb-votes";
  let userVotes = {};

  try {
    userVotes = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch (e) {
    userVotes = {}; // corrupt or unavailable storage — start clean rather than throw
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userVotes));
    } catch (e) {
      // Quota or private mode: votes still work for this session, just don't persist.
    }
  }

  /* Everyone's votes, keyed the same way: { targetKey: netScore }. Populated from
     the database for whatever is currently on screen. Seeded lists have no rows
     until someone actually votes, so a missing key just means zero. */
  const serverScores = {};
  const repaints = new Map(); // targetKey -> Set of callbacks to re-run on sync

  const live = () => Boolean(window.Backend && Backend.ready());

  function format(n) {
    const abs = Math.abs(n);
    if (abs >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "k";
    return String(n);
  }

  /** How the user voted on `id`: 1, -1, or 0. */
  function stateOf(id) {
    return userVotes[id] || 0;
  }

  /** Everyone's net score for `id` — 0 until the sync lands. */
  function scoreOf(id) {
    return serverScores[id] || 0;
  }

  /** Register a callback to re-run when `id`'s score arrives from the server. */
  function onSync(id, fn) {
    if (!repaints.has(id)) repaints.set(id, new Set());
    repaints.get(id).add(fn);
  }

  function flush(keys) {
    keys.forEach((k) => {
      const set = repaints.get(k);
      if (set) set.forEach((fn) => fn());
    });
  }

  /* Pull real tallies (and this user's own votes) for a batch of targets, then
     repaint whatever registered an interest. Called per feed page and per detail
     open, so one round trip covers everything on screen. */
  async function sync(keys) {
    if (!live() || !keys.length) return;
    const [scores, mine] = await Promise.all([
      Backend.tallies(keys),
      Backend.myVotes(keys),
    ]);
    keys.forEach((k) => (serverScores[k] = scores[k] || 0));
    keys.forEach((k) => {
      if (mine[k]) userVotes[k] = mine[k];
      else delete userVotes[k];
    });
    save();
    flush(keys);
  }

  /**
   * Toggle/switch a vote. Writes through to the database when signed in;
   * falls back to local-only when there's no backend configured.
   * Returns the user's new vote state.
   */
  function cast(id, baseVotes, direction) {
    const prev = stateOf(id);
    const next = prev === direction ? 0 : direction; // clicking again removes the vote

    // Optimistic: move the number now, reconcile if the server disagrees.
    if (next) userVotes[id] = next;
    else delete userVotes[id];
    serverScores[id] = scoreOf(id) - prev + next;
    save();

    if (live()) {
      Backend.vote(id, direction, prev).then((res) => {
        if (!res.error) return;
        // Roll back so the UI never claims a vote the database refused.
        if (prev) userVotes[id] = prev;
        else delete userVotes[id];
        serverScores[id] = scoreOf(id) + prev - next;
        save();
        flush([id]);
        console.warn("[votes] rejected:", res.error);
      });
    }

    return { total: baseVotes + next, state: next };
  }

  /* Forget what this device remembers about who voted on what. The blob is
     keyed per-browser, not per-account, so signing out has to drop it: without
     this the next person to sign in on the same machine inherits the previous
     account's highlighted arrows and cannot clear them from the UI. The shared
     tallies in serverScores are everyone's, not one account's, so they stay. */
  function clearLocal() {
    Object.keys(userVotes).forEach((k) => delete userVotes[k]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {}
    flush(Object.keys(serverScores)); // repaint anything currently on screen
  }

  return { cast, format, stateOf, scoreOf, sync, onSync, clearLocal };
})();

/* ---------- FEED ---------- */
const Feed = (() => {
  const grid = document.getElementById("feedGrid");
  const template = document.getElementById("tierCardTemplate");
  const titleEl = document.getElementById("feedTitle");
  const loadMoreBtn = document.getElementById("loadMoreBtn");
  const BAR_WIDTHS = { S: 100, A: 84, B: 66, C: 48, D: 30 };

  let all = [];      // what the user has paged into the feed so far
  let corpus = [];   // every list that exists — searched/filtered directly
  let nextPage = 2;
  let pendingDeepLink = null; // a /?list=<id> waiting on user lists to load
  const state = { sort: "hot", category: null, query: "" };

  /* In-feed density ramps with scroll depth: lighter up top so the first screen
     still reads as a feed, heavier once someone has committed to scrolling.
     Returns how many cards to run between ads. */
  function adGapAt(index) {
    if (index < 12) return 4;
    if (index < 28) return 3;
    return 2;
  }

  /* Alternating formats — a full-width banner and a native unit that sits in a
     single grid cell like a card. At this density a single repeated format
     reads as a wall of identical grey boxes; mixing them doesn't. */
  const AD_FORMATS = [
    { cls: "ad-banner--infeed", label: "Advertisement", text: "Responsive In-Feed Unit" },
    { cls: "ad-banner--native", label: "Sponsored", text: "Native Card Unit" },
  ];

  function buildAdCard(index, seq) {
    const fmt = AD_FORMATS[seq % AD_FORMATS.length];
    const ad = document.createElement("div");
    ad.className = "ad-banner " + fmt.cls;
    ad.dataset.adSlot = "infeed-" + index;
    ad.innerHTML =
      `<span class="ad-label">${fmt.label}</span>` +
      `<div class="ad-placeholder">${fmt.text}</div>`;
    // Hand it to the filler so it lazy-loads once it nears the viewport.
    if (window.Ads) window.Ads.register(ad);
    return ad;
  }

  function buildPreview(tiers) {
    const frag = document.createDocumentFragment();
    MockAPI.TIERS.forEach((tier) => {
      if (!(tiers[tier] || []).length) return;
      const row = document.createElement("div");
      row.className = "tier-preview-row";
      row.innerHTML =
        `<span class="tier-preview-bar" style="width:${BAR_WIDTHS[tier]}%;` +
        `background:var(--tier-${tier.toLowerCase()})"></span>`;
      frag.appendChild(row);
    });
    return frag;
  }

  function buildCard(list, index) {
    const card = template.content.cloneNode(true).firstElementChild;
    card.style.animationDelay = `${(index % 8) * 40}ms`;
    card.dataset.listId = list.id;

    card.querySelector(".tier-card-category").textContent = list.category;
    card.querySelector(".tier-card-time").textContent = list.time;
    card.querySelector(".tier-card-link").textContent = list.title;
    card.querySelector(".tier-card-author").innerHTML = `by <b>@${list.author}</b>`;
    card.querySelector(".comment-num").textContent = Votes.format(list.comments);
    card.querySelector(".tier-preview").appendChild(buildPreview(list.tiers));

    // Voting
    const countEl = card.querySelector(".vote-count");
    const upBtn = card.querySelector(".vote-btn--up");
    const downBtn = card.querySelector(".vote-btn--down");

    const voteKey = "list:" + list.id;

    /* Displayed total = the list's seeded base + everyone's real votes. Paints
       the user's own state too, so a reload looks like they left it. */
    function paint() {
      const voteState = Votes.stateOf(voteKey);
      countEl.textContent = Votes.format(list.votes + Votes.scoreOf(voteKey));
      countEl.classList.toggle("is-up", voteState === 1);
      countEl.classList.toggle("is-down", voteState === -1);
      upBtn.classList.toggle("is-voted", voteState === 1);
      downBtn.classList.toggle("is-voted", voteState === -1);
    }
    paint();
    Votes.onSync(voteKey, paint); // repaint when the real tally arrives

    function onVote(direction) {
      // Voting is for account holders — the gate re-runs the click after sign-up.
      Auth.require("Sign up to vote — it takes about ten seconds.", () => {
        Votes.cast(voteKey, list.votes, direction);
        paint();
        MockAPI.submitVote(list.id, direction);
      });
    }
    upBtn.addEventListener("click", () => onVote(1));
    downBtn.addEventListener("click", () => onVote(-1));

    // Clicking anywhere on the card body opens the detail view (vote rail is separate)
    card.querySelector(".tier-card-main").addEventListener("click", () => Detail.open(list));

    // Share straight from the card — the highest-traffic surface for the loop.
    const shareBtn = card.querySelector(".tier-card-share");
    if (shareBtn) {
      shareBtn.addEventListener("click", (e) => {
        e.stopPropagation(); // don't also open the detail view
        if (window.ShareCard) ShareCard.open(list, Detail.entriesFor(list));
      });
    }

    return card;
  }

  function currentTitle() {
    if (state.query) return `Search: "${state.query}"`;
    if (state.category) return `${state.category} Tier Lists`;
    switch (state.sort) {
      case "fresh": return "Fresh Tier Lists";
      case "top": return "Top Tier Lists Today";
      case "controversial": return "Controversial Tier Lists";
      default: return "Trending Tier Lists";
    }
  }

  /* Title, category, and the picks themselves — searching "Tony the Tiger"
     should find the list he's ranked on, not just lists with him in the title. */
  function matches(list, q) {
    if (list.title.toLowerCase().includes(q)) return true;
    if (list.category.toLowerCase().includes(q)) return true;
    return MockAPI.TIERS.some((tier) =>
      (list.tiers[tier] || []).some((item) => item.toLowerCase().includes(q))
    );
  }

  function applyState() {
    // Browsing shows the paged feed; searching or filtering reaches everything.
    let out = [...(state.query || state.category ? corpus : all)];
    if (state.category) out = out.filter((l) => l.category === state.category);
    if (state.query) {
      const q = state.query.toLowerCase();
      out = out.filter((l) => matches(l, q));
    }
    switch (state.sort) {
      case "fresh":
        out.sort((a, b) => a.hoursAgo - b.hoursAgo);
        break;
      case "top":
        out = out.filter((l) => l.hoursAgo <= 24).sort((a, b) => b.votes - a.votes);
        break;
      case "controversial":
        out.sort((a, b) => b.comments - a.comments);
        break;
      default: // hot — votes decayed by age
        out.sort((a, b) => b.votes / (b.hoursAgo + 2) - a.votes / (a.hoursAgo + 2));
    }
    return out;
  }

  let lastCount = 0;

  function render() {
    const lists = applyState();
    lastCount = lists.length; // what the search bar reports, no second pass
    titleEl.textContent = currentTitle();
    // A filtered view already shows every match, so there's nothing left to page in.
    loadMoreBtn.parentElement.hidden = Boolean(state.query || state.category);
    grid.innerHTML = "";
    if (!lists.length) {
      const empty = document.createElement("p");
      empty.className = "feed-empty";
      empty.textContent = "No tier lists here (yet). Make the first one, bro.";
      grid.appendChild(empty);
      return;
    }
    let sinceAd = 0, adSeq = 0;
    lists.forEach((list, i) => {
      grid.appendChild(buildCard(list, i));
      // In-feed ads, tightening as the feed gets deeper.
      if (++sinceAd >= adGapAt(i)) {
        grid.appendChild(buildAdCard(i, adSeq++));
        sinceAd = 0;
      }
    });
    /* One round trip for everything now on screen; each card repaints itself
       when its real tally lands. */
    Votes.sync(lists.map((l) => "list:" + l.id));
  }

  function syncChips() {
    const chipFor = { hot: "hot", top: "top", controversial: "controversial", fresh: "new" };
    document.querySelectorAll(".feed-filters .chip").forEach((c) => {
      const active = c.dataset.filter === chipFor[state.sort] && !state.query && !state.category;
      c.classList.toggle("is-active", active);
      c.setAttribute("aria-selected", String(active));
    });
  }

  function setSort(sort) {
    state.sort = sort;
    state.query = "";
    syncChips();
    render();
  }

  function setCategory(category) {
    state.category = category;
    state.query = "";
    syncChips();
    render();
  }

  function setQuery(query) {
    state.query = query.trim();
    syncChips();
    render();
  }

  function reset() {
    state.sort = "hot";
    state.category = null;
    state.query = "";
    syncChips();
    render();
  }

  function addList(list) {
    all.unshift(list);
    corpus.unshift(list);
    reset();
  }

  /* Ids are numbers on seeded lists and uuids on user ones; compare as strings
     so a /?list= value from the URL matches either. corpus holds everything
     (user lists included once they load), so search it first. */
  function findAny(id) {
    const s = String(id);
    return corpus.find((l) => String(l.id) === s) || all.find((l) => String(l.id) === s) || null;
  }

  function openById(id) {
    const list = findAny(id);
    if (list) { Detail.open(list); return true; }
    return false;
  }

  /* Deep link from a shared /r/<id> card (Worker redirects to /?list=<id>).
     A seeded id opens immediately; a user-list id may not be in corpus until
     loadUserLists resolves, so it's parked in pendingDeepLink and retried. */
  function openFromUrl() {
    const wanted = new URLSearchParams(location.search).get("list");
    if (!wanted) return;
    if (!openById(wanted)) pendingDeepLink = wanted;
  }

  async function loadMore() {
    const extra = await MockAPI.getLists(nextPage);
    if (!extra.length) return;
    all = all.concat(extra);
    nextPage++;
    render();
    // Peek ahead — disable the button once the well is dry
    const peek = await MockAPI.getLists(nextPage);
    if (!peek.length) {
      loadMoreBtn.textContent = "That's all of them, bro 🤝";
      loadMoreBtn.disabled = true;
      loadMoreBtn.style.opacity = ".55";
    }
  }

  /* Lists real people published, mapped into the same shape as the seeded ones.
     Items arrive unranked — tiers get earned from vote share, so they all start
     in the D bucket as a container. */
  async function loadUserLists() {
    if (!window.Backend || !Backend.ready()) return [];
    const rows = await Backend.fetchLists(60);
    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      category: row.category,
      author: row.author,
      time: relativeTime(row.createdAt),
      hoursAgo: hoursSince(row.createdAt),
      votes: 0,
      comments: 0,
      tiers: { D: row.items },
      userCreated: true,
    }));
  }

  const hoursSince = (iso) => Math.max(0, (Date.now() - new Date(iso).getTime()) / 36e5);

  function relativeTime(iso) {
    const h = hoursSince(iso);
    if (h < 1) return "just now";
    if (h < 24) return `${Math.floor(h)}h ago`;
    const d = Math.floor(h / 24);
    return d === 1 ? "1d ago" : `${d}d ago`;
  }

  async function init() {
    all = await MockAPI.getLists(1);
    corpus = await MockAPI.getAll();

    /* Paint the seeded feed before touching the network. What the server adds
       is additive, so it must never be able to leave the page empty: a stale
       session token used to make this call throw, and the throw took render()
       with it — every poll on the site gone because one fetch failed. */
    render();

    // A shared card may be pointing at a specific list — open it once the feed
    // exists. Seeded ids resolve now; user-list ids wait for the fetch below.
    openFromUrl();

    // Real lists go to the front — they're the newest thing on the site.
    loadUserLists()
      .then((mine) => {
        if (!mine.length) return;
        all = mine.concat(all);
        corpus = mine.concat(corpus);
        render();
        if (pendingDeepLink && openById(pendingDeepLink)) pendingDeepLink = null;
      })
      .catch((err) => {
        console.warn("[feed] user lists unavailable, showing seeded only:", err);
      });

    const sortFor = { hot: "hot", top: "top", controversial: "controversial", new: "fresh" };
    document.querySelectorAll(".feed-filters .chip").forEach((chip) => {
      chip.addEventListener("click", () => {
        state.category = null;
        setSort(sortFor[chip.dataset.filter] || "hot");
      });
    });

    loadMoreBtn.addEventListener("click", loadMore);
  }

  return { init, setSort, setCategory, setQuery, reset, addList, openById, matchCount: () => lastCount };
})();

/* ---------- DETAIL VIEW (full tier list + comments) ---------- */
const Detail = (() => {
  const overlay = document.getElementById("detailOverlay");
  const titleEl = document.getElementById("detailTitle");
  const metaEl = document.getElementById("detailMeta");
  const tiersEl = document.getElementById("detailTiers");
  let currentList = null;

  /* Vote-share model: each item holds a running vote count, and shares are that
     count as a percentage of the list total. Seeded lists get a synthetic starting
     count (tier sets the ballpark, the item name nudges it) so they read as
     established. Lists you create start every item at zero — nothing is ranked
     until someone votes, so the first vote cast puts that item at 100%.

     Your own votes are folded in on top, which is what makes the bars move when
     you click and stay moved after a reload. */
  const SEED_BASE = { S: 95, A: 70, B: 48, C: 30, D: 16 };

  /* Vote keys are shared with the database, so they have to be stable and
     identical for every visitor — id plus the item text, nothing per-session. */
  const itemKey = (list, item) => `item:${list ? list.id : ""}:${item}`;

  function tierForShare(share, hasVotes) {
    if (!hasVotes) return "D";  // nothing voted yet — flat grey
    if (share >= 40) return "S";
    if (share >= 25) return "A";
    if (share >= 15) return "B";
    if (share >= 7) return "C";
    return "D";
  }

  function itemShares(tiers, list) {
    const fresh = Boolean(list && list.userCreated);
    const entries = [];

    MockAPI.TIERS.forEach((tier) => {
      (tiers[tier] || []).forEach((item) => {
        let base = 0;
        if (!fresh) {
          let hash = 0;
          for (let i = 0; i < item.length; i++) hash = (hash * 31 + item.charCodeAt(i)) % 97;
          base = SEED_BASE[tier] + (hash % 9) - 4;
        }
        /* Seeded base + everyone's real votes. A downvote can't push an item
           below zero, so a fresh list can't go negative on its first click. */
        const key = itemKey(list, item);
        entries.push({
          tier,
          item,
          votes: Math.max(0, base + Votes.scoreOf(key)),
          mine: Votes.stateOf(key),
        });
      });
    });

    const total = entries.reduce((sum, e) => sum + e.votes, 0);
    if (!total) {
      // Brand-new list, nobody has voted: everything sits at a true 0%.
      entries.forEach((e) => { e.share = 0; e.tier = fresh ? "D" : e.tier; });
      return entries;
    }

    entries.forEach((e) => (e.share = Math.round((e.votes / total) * 1000) / 10));
    // Absorb rounding drift into the biggest share so it sums to exactly 100.0
    const drift = Math.round((100 - entries.reduce((s, e) => s + e.share, 0)) * 10) / 10;
    entries.sort((a, b) => b.share - a.share);
    entries[0].share = Math.round((entries[0].share + drift) * 10) / 10;

    // On lists you made, the tier badge is earned by vote share rather than by
    // whatever order the items happened to be typed in.
    if (fresh) entries.forEach((e) => (e.tier = tierForShare(e.share, e.votes > 0)));
    return entries;
  }

  function renderTiers(tiers) {
    tiersEl.innerHTML = "";
    // One row per item, benchmark-chart style: bar length = share of the vote
    const entries = itemShares(tiers, currentList);
    const maxShare = entries[0] ? entries[0].share : 0;
    entries.forEach(({ tier, item, share }) => {
      {
        // Bars are scaled against the leader, so the top item always fills the
        // track. With no votes anywhere, every bar is empty.
        const width = maxShare > 0 ? (share / maxShare) * 100 : 0;
        const row = document.createElement("div");
        row.className = "tier-row";
        row.innerHTML =
          `<div class="tier-row-label" title="${item}">${item}</div>` +
          `<div class="tier-row-track">` +
          `<div class="tier-row-bar" style="width:${width}%;background:var(--tier-${tier.toLowerCase()})"></div>` +
          `<span class="tier-row-pct">${share.toFixed(1)}%</span>` +
          `</div>` +
          `<div class="item-votes">` +
          `<button class="item-vote item-vote--up" aria-label="Upvote ${item}">` +
          `<svg viewBox="0 0 24 24" width="21" height="21" fill="currentColor"><path d="${BRUSH_TRI}"/></svg></button>` +
          `<button class="item-vote item-vote--down" aria-label="Downvote ${item}">` +
          `<svg viewBox="0 0 24 24" width="21" height="21" fill="currentColor"><path d="${BRUSH_TRI}" transform="rotate(180 12 11.2)"/></svg></button>` +
          `</div>`;

        const upBtn = row.querySelector(".item-vote--up");
        const downBtn = row.querySelector(".item-vote--down");
        const voteKey = itemKey(currentList, item);
        const mine = Votes.stateOf(voteKey);
        upBtn.classList.toggle("is-on", mine === 1);
        downBtn.classList.toggle("is-on", mine === -1);

        function onItemVote(direction) {
          Auth.require("Sign up to vote on items.", () => {
            Votes.cast(voteKey, 0, direction);
            /* Shares are relative, so one vote changes every row — re-render the
               whole set rather than patching this one. */
            renderTiers(tiers);
          });
        }
        upBtn.addEventListener("click", () => onItemVote(1));
        downBtn.addEventListener("click", () => onItemVote(-1));

        tiersEl.appendChild(row);
      }
    });
  }

  async function open(list) {
    currentList = list;
    titleEl.textContent = list.title;
    metaEl.textContent = `${list.category} · by @${list.author} · ${list.time} · ${Votes.format(list.votes)} votes`;
    renderTiers(list.tiers);
    /* Pull the real per-item tallies, then redraw with everyone's votes folded
       in. Painting twice beats holding the panel closed on a network round trip. */
    const keys = MockAPI.TIERS.flatMap((t) => (list.tiers[t] || []).map((i) => itemKey(list, i)));
    Votes.sync(keys)
      .then(() => {
        if (currentList === list) renderTiers(list.tiers);
      })
      .catch((err) => console.warn("[detail] tally sync failed:", err));

    /* Show the panel before fetching anything. Comments used to be awaited
       here, back when they came from memory and could not fail; once they came
       from the database, a slow or rejected request meant the click opened
       nothing at all. Nothing over the network gets to gate the UI. */
    overlay.hidden = false;
    document.body.style.overflow = "hidden";

    Comments.load(list.id).catch((err) =>
      console.warn("[detail] comments unavailable:", err)
    );
  }

  function close() {
    overlay.hidden = true;
    document.body.style.overflow = "";
    currentList = null;
  }

  function init() {
    document.getElementById("detailClose").addEventListener("click", close);
    overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !overlay.hidden) close();
    });
    const shareBtn = document.getElementById("detailShare");
    if (shareBtn) {
      shareBtn.addEventListener("click", () => {
        if (currentList && window.ShareCard) {
          ShareCard.open(currentList, itemShares(currentList.tiers, currentList));
        }
      });
    }
  }

  /* Shares for any list, computed with the same seed + vote model the detail
     view uses. Lets the feed cards open the share card without opening detail. */
  function entriesFor(list) {
    return itemShares(list.tiers, list);
  }

  return { init, open, entriesFor, getCurrentId: () => currentList?.id };
})();

/* ---------- COMMENTS (nested thread) ---------- */
const Comments = (() => {
  const thread = document.getElementById("commentThread");
  const countEl = document.getElementById("commentsCount");
  const composer = document.getElementById("commentComposer");
  const input = document.getElementById("commentInput");

  function countAll(list) {
    return list.reduce((n, c) => n + 1 + countAll(c.replies || []), 0);
  }

  /* Seeded threads carry ids like "c2-1"; real ones are uuids from the database.
     Only a uuid can be a parent_id, so replying to filler posts at top level. */
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  function relTime(iso) {
    const h = (Date.now() - new Date(iso).getTime()) / 36e5;
    if (h < 1) return "just now";
    if (h < 24) return `${Math.floor(h)}h ago`;
    const d = Math.floor(h / 24);
    return d === 1 ? "1d ago" : `${d}d ago`;
  }

  /* The database returns a flat list with parent_id; buildComment wants a tree. */
  function toTree(rows) {
    const byId = new Map();
    rows.forEach((r) =>
      byId.set(r.id, {
        id: r.id,
        author: r.author,
        op: false,
        time: relTime(r.createdAt),
        text: r.body,
        votes: 1,
        replies: [],
      })
    );
    const roots = [];
    rows.forEach((r) => {
      const node = byId.get(r.id);
      const parent = r.parentId ? byId.get(r.parentId) : null;
      if (parent) parent.replies.push(node);
      else roots.push(node);
    });
    return roots;
  }

  /* Write the comment through to the server. If that fails the optimistic node
     is pulled back out — a comment that looks posted but silently disappears on
     refresh is exactly the bug this replaces. */
  async function persist(listId, text, parentId, node) {
    if (!window.Backend || !Backend.ready()) return;
    const parent = UUID_RE.test(String(parentId || "")) ? parentId : null;
    const res = await Backend.postComment(listId, text, parent);
    if (res && res.error) {
      node.remove();
      bumpCount(-1);
      window.alert("Couldn't post that comment: " + res.error);
    }
  }

  function buildComment(c, depth = 0) {
    const el = document.createElement("div");
    el.className = "comment";
    el.dataset.commentId = c.id;

    const initial = c.author[0].toUpperCase();
    el.innerHTML = `
      <div class="avatar" aria-hidden="true">${initial}</div>
      <div class="comment-body">
        <div class="comment-head">
          <span class="comment-author ${c.op ? "is-op" : ""}">@${c.author}${c.op ? " · OP" : ""}</span>
          <span class="comment-time">${c.time}</span>
        </div>
        <p class="comment-text"></p>
        <div class="comment-actions">
          <button class="comment-vote">
            <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><path d="${BRUSH_TRI}"/></svg>
            <span class="comment-vote-count">${Votes.format(c.votes)}</span>
          </button>
          ${depth < 3 ? '<button class="comment-reply-btn">Reply</button>' : ""}
        </div>
      </div>`;

    // textContent, not innerHTML — comment text is user input
    el.querySelector(".comment-text").textContent = c.text;

    // Comment voting
    const voteBtn = el.querySelector(".comment-vote");
    const voteCount = el.querySelector(".comment-vote-count");
    voteBtn.addEventListener("click", () => {
      const { total, state } = Votes.cast("comment-" + c.id, c.votes, 1);
      voteCount.textContent = Votes.format(total);
      voteBtn.classList.toggle("is-voted", state === 1);
    });

    // Inline reply composer
    const replyBtn = el.querySelector(".comment-reply-btn");
    if (replyBtn) {
      replyBtn.addEventListener("click", () => {
        const body = el.querySelector(".comment-body");
        const existing = body.querySelector(".reply-composer");
        if (existing) { existing.remove(); return; }

        const form = document.createElement("form");
        form.className = "reply-composer";
        form.innerHTML = `
          <input type="text" class="comment-input" placeholder="Reply to @${c.author}…" maxlength="500" />
          <button type="submit" class="btn btn-primary btn-sm">Reply</button>`;
        form.addEventListener("submit", (e) => {
          e.preventDefault();
          const text = form.querySelector("input").value.trim();
          if (!text) return;
          // Gate on submit, not on opening the box — their draft survives signup.
          Auth.require("Sign up to reply to @" + c.author + ".", () => {
            addReply(el, text, depth + 1, c.id);
            form.remove();
          });
        });
        body.appendChild(form);
        form.querySelector("input").focus();
      });
    }

    // Nested replies
    if (c.replies?.length) {
      const children = document.createElement("div");
      children.className = "comment-children";
      c.replies.forEach((r) => children.appendChild(buildComment(r, depth + 1)));
      el.querySelector(".comment-body").appendChild(children);
    }

    return el;
  }

  function makeLocalComment(text) {
    return {
      id: "local-" + Date.now(),
      author: Auth.user() || "you",
      op: false, time: "just now", text, votes: 1, replies: [],
    };
  }

  async function addReply(parentEl, text, depth, parentId) {
    const body = parentEl.querySelector(":scope > .comment-body");
    let children = body.querySelector(":scope > .comment-children");
    if (!children) {
      children = document.createElement("div");
      children.className = "comment-children";
      body.appendChild(children);
    }
    const node = buildComment(makeLocalComment(text), depth);
    children.appendChild(node);
    bumpCount(1);
    await persist(Detail.getCurrentId(), text, parentId, node);
  }

  let total = 0;
  function bumpCount(delta) {
    total += delta;
    countEl.textContent = `(${total})`;
  }

  function paint(comments) {
    thread.innerHTML = "";
    comments.forEach((c) => thread.appendChild(buildComment(c)));
    total = countAll(comments);
    countEl.textContent = `(${total})`;
  }

  /* A hung request is not a failed one: it never rejects, so try/catch never
     fires and an `await` on it waits forever. Give the network a deadline of
     its own so it can only ever be late, never terminal. */
  function withTimeout(promise, ms, label) {
    return Promise.race([
      promise,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error(label + " timed out after " + ms + "ms")), ms)
      ),
    ]);
  }

  /* Which list the thread currently belongs to. A slow response that lands
     after the reader has opened something else must not paint into it. */
  let token = 0;

  /* Seeded filler paints FIRST and synchronously — it comes from memory and
     cannot fail, so nothing over the network is allowed to gate it. Real
     comments are folded in on top when they arrive.

     This used to await the fetch before painting anything. A rejected fetch
     was handled, but a wedged one (the supabase-js auth lock deadlock) never
     settled, so the render below never ran and EVERY list — seeded ones
     included — showed an empty thread with no error anywhere. */
  async function load(listId) {
    const mine = ++token;
    const seeded = await MockAPI.getComments(listId);
    paint(seeded);

    if (!(window.Backend && Backend.ready())) return;

    try {
      const rows = await withTimeout(Backend.fetchComments(listId), 6000, "comment fetch");
      if (mine !== token) return;            // reader moved to another list
      if (!rows || !rows.length) return;     // nothing real to add
      paint(toTree(rows).concat(seeded));
    } catch (err) {
      console.warn("[comments] live fetch unavailable, showing seeded only:", err);
    }
  }

  function init() {
    composer.addEventListener("submit", (e) => {
      e.preventDefault();
      const text = input.value.trim();
      if (!text) return;
      Auth.require("Sign up to post a comment.", async () => {
        const node = buildComment(makeLocalComment(text));
        thread.prepend(node);
        bumpCount(1);
        input.value = "";
        await persist(Detail.getCurrentId(), text, null, node);
      });
    });

    // The composer shows who you're posting as — or that you're nobody yet.
    const youAvatar = composer.querySelector(".avatar--you");
    Auth.onChange((u) => {
      if (youAvatar) youAvatar.textContent = u ? u[0].toUpperCase() : "?";
      input.placeholder = u ? "Drop your (correct) opinion…" : "Sign up to comment…";
    });
  }

  return { init, load };
})();

/* ---------- SEARCH ---------- */
const Search = (() => {
  function init() {
    const input = document.getElementById("searchInput");
    const clearBtn = document.getElementById("searchClear");
    const countEl = document.getElementById("searchCount");

    function apply() {
      const q = input.value.trim();
      clearBtn.hidden = !q;
      Feed.setQuery(q); // re-renders, which is what sets the count
      if (!q) {
        countEl.hidden = true;
        return;
      }
      const n = Feed.matchCount();
      countEl.hidden = false;
      countEl.textContent =
        n === 0 ? `Nothing matches “${q}” — try a topic, a category, or a pick.`
        : n === 1 ? `1 tier list matches “${q}”`
        : `${n.toLocaleString()} tier lists match “${q}”`;
    }

    input.addEventListener("input", apply);
    clearBtn.addEventListener("click", () => {
      input.value = "";
      apply();
      input.focus();
    });
    input.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && input.value) {
        input.value = "";
        apply();
      }
    });

    // The header magnifier now jumps to the bar rather than toggling it away.
    document.getElementById("searchBtn").addEventListener("click", () => {
      input.scrollIntoView({ block: "center", behavior: "smooth" });
      input.focus();
      input.select();
    });

    // "/" to focus search — but not while typing somewhere else.
    document.addEventListener("keydown", (e) => {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      e.preventDefault();
      input.focus();
      input.select();
    });
  }
  return { init };
})();

/* ---------- CREATE TIER LIST ---------- */
const Create = (() => {
  const overlay = document.getElementById("createOverlay");
  const form = document.getElementById("createForm");
  const titleInput = document.getElementById("createTitle");
  const categoryInput = document.getElementById("createCategory");
  const itemsList = document.getElementById("createItemsList");
  const addItemBtn = document.getElementById("createAddItem");
  const MIN_ROWS = 4;

  /* One input per item rather than a textarea: it makes the count obvious, lets
     rows be removed individually, and stops people typing a ranked list when
     ranking is the community's job. */
  function addRow(focus) {
    const row = document.createElement("div");
    row.className = "create-item";
    row.innerHTML =
      `<input type="text" class="create-item-input" maxlength="80" placeholder="Add something to rank" />` +
      `<button type="button" class="create-item-remove" aria-label="Remove item">&times;</button>`;
    row.querySelector(".create-item-remove").addEventListener("click", () => {
      row.remove();
      if (!itemsList.children.length) addRow(true); // never leave the panel empty
      renumber();
    });
    // Typing in the last row spawns the next one, so you never hunt for the button.
    const input = row.querySelector(".create-item-input");
    input.addEventListener("input", () => {
      if (input.value.trim() && row === itemsList.lastElementChild) addRow(false);
    });
    itemsList.appendChild(row);
    renumber();
    if (focus) input.focus();
    return row;
  }

  function renumber() {
    [...itemsList.children].forEach((row, i) => {
      row.querySelector(".create-item-input").placeholder =
        i === 0 ? "Add something to rank" : `Item ${i + 1}`;
    });
  }

  function reset() {
    itemsList.innerHTML = "";
    for (let i = 0; i < MIN_ROWS; i++) addRow(false);
  }

  function open() {
    overlay.hidden = false;
    document.body.style.overflow = "hidden";
    titleInput.focus();
  }

  function close() {
    overlay.hidden = true;
    document.body.style.overflow = "";
    form.reset();
    reset();
  }

  function init() {
    document.querySelectorAll(".btn-create").forEach((btn) =>
      btn.addEventListener("click", () =>
        Auth.require("Sign up to publish a tier list.", open)
      )
    );
    document.getElementById("createCancel").addEventListener("click", close);
    addItemBtn.addEventListener("click", () => addRow(true));
    reset();
    overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !overlay.hidden) close();
    });

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const seen = new Set();
      const lines = [...itemsList.querySelectorAll(".create-item-input")]
        .map((input) => input.value.trim())
        .filter((v) => v && !seen.has(v.toLowerCase()) && seen.add(v.toLowerCase()));
      if (!lines.length || !titleInput.value.trim()) return;

      /* Everything lands unranked. Tiers here are just a container — the detail
         view derives the real tier from vote share, so nothing is pre-ranked by
         the order it was typed. */
      const tiers = { D: lines };

      const title = titleInput.value.trim();
      const category = categoryInput.value.trim() || "Random";

      /* Publish server-side so everyone sees it. The database id becomes the
         list id, which is what vote keys are built from — a local id would mean
         nobody else's votes could ever match yours. */
      let id = "local-" + Math.random().toString(36).slice(2, 8);
      if (window.Backend && Backend.ready()) {
        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        const res = await Backend.createList(title, category, lines);
        submitBtn.disabled = false;
        if (res.error) {
          window.alert("Couldn't publish: " + res.error);
          return; // keep the form open with their work in it
        }
        id = res.id;
      }

      const list = {
        id,
        title,
        category,
        author: Auth.user() || "you", time: "just now", hoursAgo: 0,
        votes: 0, comments: 0, tiers, userCreated: true,
      };
      close();
      Feed.addList(list);
      Detail.open(list);
    });
  }

  return { init };
})();

/* ---------- NAV (desktop + mobile links) ---------- */
const Nav = (() => {
  function init() {
    document.querySelectorAll("[data-nav]").forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const action = link.dataset.nav;
        document.querySelectorAll("[data-nav]").forEach((l) =>
          l.classList.toggle("is-active", l.dataset.nav === action)
        );
        MobileNav.closeMenu();

        if (action === "trending") Feed.reset();
        if (action === "new") { Feed.setCategory(null); Feed.setSort("fresh"); }
        if (action === "categories")
          document.querySelector(".tag-cloud").scrollIntoView({ behavior: "smooth", block: "center" });
        if (action === "leaderboard")
          document.getElementById("miniLeaderboard").scrollIntoView({ behavior: "smooth", block: "center" });
      });
    });

    // Sidebar category tags filter the feed
    document.querySelectorAll(".tag").forEach((tag) => {
      tag.addEventListener("click", (e) => {
        e.preventDefault();
        Feed.setCategory(tag.textContent.trim());
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    });

    // Logo goes home
    document.querySelector(".logo").addEventListener("click", (e) => {
      e.preventDefault();
      Feed.reset();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }
  return { init };
})();

/* ---------- SIDEBAR WIDGETS ---------- */
const Sidebar = (() => {
  async function init() {
    const ol = document.getElementById("miniLeaderboard");
    const board = await MockAPI.getLeaderboard();
    ol.innerHTML = board
      .map(
        (u, i) => `
        <li>
          <span class="rank ${i === 0 ? "rank--gold" : ""}">${i + 1}</span>
          <span class="avatar" aria-hidden="true">${u.name[0].toUpperCase()}</span>
          <span>@${u.name}</span>
          <span class="points">${u.points}</span>
        </li>`
      )
      .join("");
  }
  return { init };
})();

/* ---------- MOBILE NAV ---------- */
const MobileNav = (() => {
  let btn, nav;
  function closeMenu() {
    if (!nav) return;
    nav.classList.remove("is-open");
    btn.setAttribute("aria-expanded", "false");
  }
  function init() {
    btn = document.getElementById("mobileMenuBtn");
    nav = document.getElementById("mobileNav");
    btn.addEventListener("click", () => {
      const open = nav.classList.toggle("is-open");
      btn.setAttribute("aria-expanded", String(open));
    });
  }
  return { init, closeMenu };
})();

/* ---------- BOOT ---------- */
document.addEventListener("DOMContentLoaded", () => {
  Theme.init();
  Feed.init();
  Detail.init();
  Comments.init();
  Search.init();
  Create.init();
  Nav.init();
  Sidebar.init();
  MobileNav.init();
});
