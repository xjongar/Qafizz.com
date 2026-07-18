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

  function save(name) {
    current = name;
    try {
      localStorage.setItem(KEY, name);
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

  function showError(msg) {
    errorEl.textContent = msg || "";
    errorEl.hidden = !msg;
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
    setMode("signup"); // always start on sign-up; the toggle is one click away
    overlay.hidden = false;
    document.body.style.overflow = "hidden";
    nameInput.focus();
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

    submitBtn.disabled = true;
    const res = mode === "signin"
      ? await signInRequest({ email, password })
      : await signUpRequest({ username, email, password });
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
    overlay = document.getElementById("authOverlay");
    if (!overlay) return;
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
      // Signing in requires the server; without it, only local sign-up exists.
      if (!backendLive()) switchBtn.closest(".auth-switch").hidden = true;
    }

    /* Supabase restores sessions asynchronously, so adopt whoever comes back. */
    if (window.Backend && Backend.onAuthChange) {
      Backend.onAuthChange((p) => {
        if (p && p.username !== current) save(p.username);
        else if (!p && backendLive() && current) signOut();
      });
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
