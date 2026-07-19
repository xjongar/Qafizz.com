/* ==========================================================================
   TRUST ME BRO — auth.js
   Signup: email + username + password, with a Google option.

   READ THIS BEFORE TRUSTING ANY OF IT: there is no backend yet, so none of this
   is authentication. It is a form with validation in front of a localStorage
   record. A browser cannot keep a secret or arbitrate a namespace — everything
   here is per-device, and anyone at the keyboard can edit or clear it. The
   password is deliberately never persisted (see signUpRequest): storing it,
   hashed or not, would only look like security.

   When the backend lands, signUpRequest() is the single function to rewire —
   it must hash the password server-side, enforce username uniqueness in a real
   table, and own the session. Every caller (Auth.require) stays as-is.

   Loaded before app.js so window.Auth exists when the feed wires itself up.
   Plain script, no modules — keeps working over file://.
   ========================================================================== */

window.Auth = (() => {
  const KEY = "tmb-user";        // who's signed in on this device
  const USERS_KEY = "tmb-users"; // stand-in for the users table
  const NAME_RULE = /^[a-z0-9_]{3,20}$/;
  const EMAIL_RULE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  /* Names that would let someone speak as the site itself. `admin` is NOT here
     — the owner wants it claimable. Nothing stops a second visitor claiming it
     too until a real users table exists. */
  const RESERVED = ["mod", "moderator", "op", "staff", "support", "trustmebro"];

  /* From Google Cloud console → Credentials → OAuth 2.0 Client ID. Google
     requires a real https origin; it cannot work from file:// or an unlisted
     domain, so this stays empty until the site is hosted. */
  const GOOGLE_CLIENT_ID = "";

  let current = null;
  let pending = null; // what to run once they're through the modal
  const listeners = [];
  let overlay, form, nameInput, emailInput, passInput, errorEl, reasonEl, submitBtn;

  /* Read at parse time, not on DOMContentLoaded: app.js asks who's signed in
     while it builds the first render. */
  (function load() {
    try {
      const saved = localStorage.getItem(KEY);
      current = saved && NAME_RULE.test(saved) ? saved : null;
    } catch (err) {
      current = null; // private mode, or file:// with storage blocked
    }
  })();

  const user = () => current;
  const isSignedIn = () => Boolean(current);

  function emit() {
    listeners.forEach((fn) => fn(current));
  }

  /* Fires immediately with the current state, so callers render once on wire-up. */
  function onChange(fn) {
    listeners.push(fn);
    fn(current);
  }

  /* Survives sign-out on purpose: it's what tells the modal to open on sign-in
     rather than sign-up next time, so logging out doesn't strand a returning
     user on a form that rejects the email they already registered. */
  const SEEN_KEY = "tmb-returning";

  function isReturning() {
    try {
      return localStorage.getItem(SEEN_KEY) === "1";
    } catch (err) {
      return false;
    }
  }

  function save(name) {
    current = name;
    try {
      localStorage.setItem(KEY, name);
      localStorage.setItem(SEEN_KEY, "1");
    } catch (err) {
      /* Session-only if storage is unavailable — still signed in for this tab. */
    }
    emit();
  }

  function signOut() {
    current = null;
    try {
      localStorage.removeItem(KEY);
    } catch (err) {}
    /* Vote state is stored per-browser rather than per-account, so it has to be
       dropped here as well. Left behind, the next account to sign in on this
       machine shows the previous one's votes as its own. Votes is a top-level
       const in app.js, so it lives in the global lexical scope and is reached
       by name, not off window — same as MockAPI above. */
    try {
      if (typeof Votes !== "undefined" && Votes.clearLocal) Votes.clearLocal();
    } catch (err) {}
    // Drop the server session too, or a reload would silently sign you back in.
    if (window.Backend && Backend.ready()) Backend.signOut();
    emit();
  }

  /* ---- local users "table" ---- */

  function readUsers() {
    try {
      const raw = localStorage.getItem(USERS_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      return [];
    }
  }

  function addUser(record) {
    const list = readUsers();
    list.push(record);
    try {
      localStorage.setItem(USERS_KEY, JSON.stringify(list));
    } catch (err) {}
  }

  /* MockAPI is a top-level `const` in app.js, so it lives in the global lexical
     scope and is NOT a property of window — reach it by name, not off window. */
  async function seedAuthorTaken(name) {
    try {
      if (typeof MockAPI === "undefined" || !MockAPI.isNameTaken) return false;
      return await MockAPI.isNameTaken(name);
    } catch (err) {
      return false; // never block signup on a broken lookup
    }
  }

  async function taken(name) {
    if (readUsers().some((u) => u.username === name)) return true;
    return seedAuthorTaken(name);
  }

  /* ---- validation ---- */

  function validateName(name) {
    if (!name) return "Pick a username first.";
    if (name.length < 3) return "Username is too short — 3 characters minimum.";
    if (name.length > 20) return "Username is too long — 20 characters maximum.";
    if (!NAME_RULE.test(name)) return "Username: letters, numbers and underscores only.";
    if (RESERVED.indexOf(name) !== -1) return "That username is reserved. Pick another.";
    return null;
  }

  function validateEmail(email) {
    if (!email) return "Enter an email address.";
    if (!EMAIL_RULE.test(email)) return "That doesn't look like an email address.";
    return null;
  }

  function validatePassword(pw) {
    if (!pw) return "Pick a password.";
    if (pw.length < 8) return "Password needs at least 8 characters.";
    if (!/[a-z]/i.test(pw) || !/[0-9]/.test(pw)) return "Password needs at least one letter and one number.";
    return null;
  }

  /* ---- the seam a real backend replaces ---- */

  const backendLive = () => Boolean(window.Backend && Backend.ready());

  async function signUpRequest(payload) {
    const { username, email, password } = payload;

    /* Real accounts when Supabase is configured. Passwords go straight to
       Supabase Auth, which hashes them server-side — nothing sensitive is
       kept here. The profiles row is created by a database trigger. */
    if (backendLive()) {
      /* Ask before claiming. A name that is already on a profile row makes the
         signup trigger raise 23505, which rolls the whole transaction back —
         the response is a bare 500 and no account exists afterwards. Checking
         first turns that into a sentence the person can act on. */
      if (await Backend.usernameTaken(username)) {
        return { ok: false, error: "@" + username + " is taken. Try another." };
      }
      const { error } = await Backend.signUp(email, password, username);
      if (error) return { ok: false, error: friendlyAuthError(error) };
      // With email confirmation on, there's no session yet — say so plainly.
      if (!Backend.currentUser()) {
        return { ok: false, error: "Check your email to confirm your account, then sign in." };
      }
      return { ok: true, username: Backend.currentUser().username };
    }

    if (await taken(username)) {
      return { ok: false, error: "@" + username + " is taken. Try another." };
    }
    /* payload.password is intentionally dropped here rather than stored. A real
       POST /signup hashes it server-side (argon2/bcrypt) and returns a session.
       Persisting it in the browser would be worse than useless. */
    addUser({ username, email, createdAt: new Date().toISOString(), provider: "password" });
    return { ok: true, username };
  }

  async function signInRequest({ email, password }) {
    if (!backendLive()) {
      return { ok: false, error: "Sign-in needs the server. Create an account instead." };
    }
    const { error } = await Backend.signIn(email, password);
    if (error) return { ok: false, error: friendlyAuthError(error) };
    const u = Backend.currentUser();
    return { ok: true, username: u ? u.username : email.split("@")[0] };
  }

  /* Supabase messages are accurate but terse; these are the ones users hit. */
  function friendlyAuthError(msg) {
    const m = String(msg).toLowerCase();
    if (m.includes("already registered") || m.includes("already been registered"))
      return "That email already has an account. Try signing in.";
    if (m.includes("invalid login")) return "Wrong email or password.";
    if (m.includes("email not confirmed")) return "Confirm your email first — check your inbox.";
    if (m.includes("duplicate key") && m.includes("username"))
      return "That username is taken. Try another.";
    /* What a username collision looks like from the other side of the trigger:
       Supabase reports the failed transaction, not the constraint behind it. */
    if (m.includes("database error saving new user") || m.includes("23505"))
      return "That username is taken. Try another.";
    if (m.includes("rate limit") || m.includes("too many"))
      return "Too many attempts. Wait a minute and try again.";
    return msg;
  }

  /* ---- google ---- */

  const googleAvailable = () => Boolean(GOOGLE_CLIENT_ID);

  function onGoogleClick() {
    if (!googleAvailable()) {
      showError(
        "Google sign-in isn't configured. It needs an OAuth client ID and a hosted https origin — it can't run from a local file."
      );
      return;
    }
    /* Real flow, once hosted and configured:
       1. load https://accounts.google.com/gsi/client
       2. google.accounts.id.initialize({ client_id: GOOGLE_CLIENT_ID, callback })
       3. POST the returned credential (a JWT) to the backend, which verifies the
          signature with Google's keys, then creates/links the account.
       The username picker still runs afterwards — Google gives an email, not a
       handle. */
  }

  /* ---- modal ---- */

  /* Mirrored to the console on purpose. Putting auth failures only in the modal
     made the console look clean while signup was failing every time, so the one
     place anybody thinks to check reported nothing at all. */
  function showError(msg) {
    errorEl.textContent = msg || "";
    errorEl.hidden = !msg;
    if (msg) console.warn("[auth] " + msg);
  }

  /* The modal does double duty: "signup" asks for a handle, "signin" just takes
     credentials for an account that already exists. */
  let mode = "signup";
  let switchBtn, switchText, headingEl, nameField, nameHint, passHint;

  function setMode(next) {
    mode = next;
    const signin = mode === "signin";
    if (headingEl) headingEl.textContent = signin ? "Welcome back" : "Create your account";
    if (nameField) nameField.hidden = signin;
    if (nameHint) nameHint.hidden = signin;
    if (passHint) passHint.hidden = signin;
    if (nameInput) nameInput.required = !signin;
    if (submitBtn) submitBtn.textContent = signin ? "Sign in" : "Create account";
    if (switchText) switchText.textContent = signin ? "New here?" : "Already have an account?";
    if (switchBtn) switchBtn.textContent = signin ? "Create an account" : "Sign in";
    if (passInput) passInput.setAttribute("autocomplete", signin ? "current-password" : "new-password");
    showError("");
    (signin ? emailInput : nameInput).focus();
  }

  function open(reason, cb) {
    pending = cb || null;
    reasonEl.textContent = reason || "You need an account to join in.";
    showError("");
    form.reset();
    /* First-timers get sign-up; anyone who has held an account on this device
       gets sign-in. The toggle is one click away either way. */
    setMode(isReturning() && backendLive() ? "signin" : "signup");
    overlay.hidden = false;
    document.body.style.overflow = "hidden";
  }

  function close() {
    overlay.hidden = true;
    document.body.style.overflow = "";
    pending = null;
  }

  /* The gate. Signed in → run it now. Signed out → sign up, then run it, so
     the click that triggered the prompt isn't lost. */
  function require(reason, cb) {
    if (isSignedIn()) {
      cb();
      return;
    }
    open(reason, cb);
  }

  async function submit(e) {
    e.preventDefault();
    showError(""); // clear the last attempt, so nothing stale outlives this one

    const username = nameInput.value.trim().toLowerCase();
    const email = emailInput.value.trim();
    const password = passInput.value;

    /* Signing in only needs credentials — the username field is hidden and the
       rules that govern picking one don't apply to an account that exists. */
    const err = mode === "signin"
      ? validateEmail(email) || (password ? null : "Enter your password.")
      : validateName(username) || validateEmail(email) || validatePassword(password);
    if (err) {
      showError(err);
      return;
    }

    /* Traced end to end. A submit that produced no visible change and no log at
       all left nothing to tell "the call is hanging" apart from "the handler
       never ran" — the two failures look identical from outside and need
       opposite fixes. */
    console.info("[auth] " + mode + " submitting as @" + (username || email));
    submitBtn.disabled = true;
    let res;
    try {
      res = mode === "signin"
        ? await signInRequest({ email, password })
        : await signUpRequest({ username, email, password });
    } catch (err) {
      console.error("[auth] " + mode + " threw:", err);
      submitBtn.disabled = false;
      showError("Something broke on our end: " + (err && err.message ? err.message : err));
      return;
    }
    console.info("[auth] " + mode + " result:", res);
    submitBtn.disabled = false;
    if (!res.ok) {
      showError(res.error);
      nameInput.select();
      return;
    }

    const next = pending;
    save(res.username);
    close();
    if (next) next();
  }

  function init() {
    /* Printed unconditionally so a silent console can be told apart from stale
       cached JS. No banner on load means the browser is still serving an old
       auth.js and nothing below this line is running at all. */
    console.info("[auth] build 2026-07-19c — username pre-check, traced submit");
    overlay = document.getElementById("authOverlay");
    if (!overlay) {
      console.error("[auth] #authOverlay missing — sign-up cannot open");
      return;
    }
    form = document.getElementById("authForm");
    nameInput = document.getElementById("authUsername");
    emailInput = document.getElementById("authEmail");
    passInput = document.getElementById("authPassword");
    errorEl = document.getElementById("authError");
    reasonEl = document.getElementById("authReason");
    submitBtn = document.getElementById("authSubmit");

    form.addEventListener("submit", submit);
    document.getElementById("authCancel").addEventListener("click", close);
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) close();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !overlay.hidden) close();
    });
    [nameInput, emailInput, passInput].forEach((el) =>
      el.addEventListener("input", () => showError(""))
    );

    const googleBtn = document.getElementById("authGoogle");
    if (googleBtn) {
      googleBtn.addEventListener("click", onGoogleClick);
      // Say so up front rather than letting it look broken on click.
      if (!googleAvailable()) googleBtn.classList.add("is-unconfigured");
    }

    switchBtn = document.getElementById("authSwitch");
    switchText = document.getElementById("authSwitchText");
    headingEl = document.getElementById("authHeading");
    nameField = nameInput.closest(".auth-field");
    nameHint = document.getElementById("authHint");
    passHint = document.getElementById("authPassHint");
    if (switchBtn) {
      switchBtn.addEventListener("click", () => setMode(mode === "signin" ? "signup" : "signin"));
      /* The toggle stays visible even when the backend is down. Hiding it used
         to leave anyone with an existing account stranded on a sign-up form
         that rejects their email, with no way back — sign-in then reports the
         real problem instead of the route simply vanishing. */
    }

    /* Supabase restores sessions asynchronously, so adopt whoever comes back. */
    if (window.Backend && Backend.onAuthChange) {
      Backend.onAuthChange((p) => {
        if (p && p.username !== current) save(p.username);
        else if (!p && backendLive() && current) signOut();
      });
    }

    /* The listener above only fires if the restore actually completes. When it
       hangs — a wedged Web Lock, a token the server never answers on — nothing
       fires, and the header goes on showing a name the server has no session
       for. Every vote, comment and publish is then refused with "Sign in to
       vote" while the UI insists you are signed in, which is unexplainable from
       the outside. Treat a restore that never lands as signed out: reading is
       public, so the only thing lost is a claim that was never true. */
    if (backendLive() && current) {
      setTimeout(() => {
        if (current && !Backend.currentUser()) {
          console.warn("[auth] no server session behind @" + current + " — signing out locally");
          signOut();
        }
      }, 5000);
    }

    const btn = document.getElementById("authBtn");
    if (btn) {
      btn.addEventListener("click", () => {
        if (isSignedIn()) {
          if (window.confirm("Sign out of @" + current + "?")) signOut();
        } else {
          open("Make an account — it takes about ten seconds.", null);
        }
      });
      onChange((u) => {
        btn.textContent = u ? "@" + u : "Sign up";
        btn.classList.toggle("is-user", Boolean(u));
        btn.setAttribute("aria-label", u ? "Signed in as @" + u + " — sign out" : "Sign up");
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  return { user, isSignedIn, onChange, require, signOut, open, readUsers };
})();
