/* ==========================================================================
   TRUST ME BRO — backend.js
   Talks to Supabase: accounts, shared votes, user-created lists, comments.

   Inert until CONFIG below is filled in. With it empty the site behaves exactly
   as it did before — local-only votes, fake sign-up — so the page still works
   over file:// and never hangs waiting on a network call that can't succeed.

   The seeded topics are deliberately NOT stored server-side: their vote counts
   are generated in the browser from the list id, so what you see is the seeded
   base plus real votes stacked on top. Only genuinely shared state lives here.

   The anon key is meant to be public. Every table has row-level security, so
   the key alone grants nothing beyond reading public rows and writing rows that
   belong to the signed-in user. Never put the service_role key in this file.
   Plain script, no modules.
   ========================================================================== */

window.Backend = (() => {
  /* Supabase → Project Settings → Data API. URL and the anon/publishable key. */
  const CONFIG = {
    url: "https://penlvacldoriiegbusjz.supabase.co",
    anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlbmx2YWNsZG9yaWllZ2J1c2p6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ0MTI5MzgsImV4cCI6MjA5OTk4ODkzOH0.J2vs3qzRvoY_Ak0NqNqtMMfXyz9qBLNzJiCHmr3kxes",
  };

  const configured = Boolean(CONFIG.url && CONFIG.anonKey);
  let client = null;
  let profile = null;              // { id, username } once signed in
  const listeners = new Set();     // notified whenever auth state changes

  function ready() {
    return Boolean(client);
  }

  function init() {
    if (!configured) return false;
    if (!window.supabase || !window.supabase.createClient) {
      console.warn("[backend] supabase-js failed to load — staying local-only");
      return false;
    }
    client = window.supabase.createClient(CONFIG.url, CONFIG.anonKey);

    client.auth.onAuthStateChange(async (_event, session) => {
      profile = session ? await fetchProfile(session.user.id) : null;
      listeners.forEach((fn) => fn(profile));
    });

    // Restore an existing session on load.
    client.auth.getSession().then(async ({ data }) => {
      if (data && data.session) {
        profile = await fetchProfile(data.session.user.id);
        listeners.forEach((fn) => fn(profile));
      }
    });
    return true;
  }

  function onAuthChange(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  }

  async function fetchProfile(userId) {
    const { data, error } = await client
      .from("profiles")
      .select("id, username")
      .eq("id", userId)
      .maybeSingle();
    if (error) {
      console.warn("[backend] profile lookup failed:", error.message);
      return null;
    }
    return data;
  }

  /* ---------- AUTH ---------- */

  /** Sign up with email + password. The profile row is created by a DB trigger. */
  async function signUp(email, password, username) {
    if (!ready()) return { error: "Backend not configured" };
    const { error } = await client.auth.signUp({
      email,
      password,
      options: { data: { username } },
    });
    return { error: error ? error.message : null };
  }

  async function signIn(email, password) {
    if (!ready()) return { error: "Backend not configured" };
    const { error } = await client.auth.signInWithPassword({ email, password });
    return { error: error ? error.message : null };
  }

  async function signOut() {
    if (!ready()) return;
    await client.auth.signOut();
    profile = null;
    listeners.forEach((fn) => fn(null));
  }

  function currentUser() {
    return profile;
  }

  /* ---------- VOTES ---------- */

  /** Real vote tallies for a batch of target keys: { key: score }. */
  async function tallies(keys) {
    if (!ready() || !keys.length) return {};
    const { data, error } = await client.rpc("tallies_for", { keys });
    if (error) {
      console.warn("[backend] tally fetch failed:", error.message);
      return {};
    }
    const out = {};
    data.forEach((row) => (out[row.target_key] = row.score));
    return out;
  }

  /** What the signed-in user voted on these targets: { key: 1 | -1 }. */
  async function myVotes(keys) {
    if (!ready() || !profile || !keys.length) return {};
    const { data, error } = await client
      .from("votes")
      .select("target_key, direction")
      .eq("user_id", profile.id)
      .in("target_key", keys);
    if (error) {
      console.warn("[backend] own-vote fetch failed:", error.message);
      return {};
    }
    const out = {};
    data.forEach((row) => (out[row.target_key] = row.direction));
    return out;
  }

  /**
   * Cast, switch, or clear a vote. `direction` is 1 or -1; passing the same
   * direction the user already holds clears it, matching the local behaviour.
   * Returns the resulting state (1, -1, or 0).
   */
  async function vote(targetKey, direction, previous) {
    if (!ready()) return { error: "Backend not configured", state: previous };
    if (!profile) return { error: "Sign in to vote", state: previous };

    const next = previous === direction ? 0 : direction;

    if (next === 0) {
      const { error } = await client
        .from("votes")
        .delete()
        .eq("user_id", profile.id)
        .eq("target_key", targetKey);
      return { error: error ? error.message : null, state: error ? previous : 0 };
    }

    const { error } = await client
      .from("votes")
      .upsert(
        { user_id: profile.id, target_key: targetKey, direction: next },
        { onConflict: "user_id,target_key" }
      );
    return { error: error ? error.message : null, state: error ? previous : next };
  }

  /* ---------- LISTS ---------- */

  /** Lists created by real users, newest first. */
  async function fetchLists(limit = 60) {
    if (!ready()) return [];
    const { data, error } = await client
      .from("lists")
      .select("id, title, category, items, created_at, profiles(username)")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) {
      console.warn("[backend] list fetch failed:", error.message);
      return [];
    }
    return data.map((row) => ({
      id: row.id,
      title: row.title,
      category: row.category,
      author: row.profiles ? row.profiles.username : "someone",
      items: row.items,
      createdAt: row.created_at,
      userCreated: true,
    }));
  }

  async function createList(title, category, items) {
    if (!ready()) return { error: "Backend not configured" };
    if (!profile) return { error: "Sign in to publish a list" };
    const { data, error } = await client
      .from("lists")
      .insert({ title, category, items, author_id: profile.id })
      .select("id")
      .single();
    return { error: error ? error.message : null, id: data ? data.id : null };
  }

  /* ---------- COMMENTS ---------- */

  async function fetchComments(listId) {
    if (!ready()) return [];
    const { data, error } = await client
      .from("comments")
      .select("id, parent_id, body, created_at, profiles(username)")
      .eq("list_id", String(listId))
      .order("created_at", { ascending: true });
    if (error) {
      console.warn("[backend] comment fetch failed:", error.message);
      return [];
    }
    return data.map((row) => ({
      id: row.id,
      parentId: row.parent_id,
      body: row.body,
      author: row.profiles ? row.profiles.username : "someone",
      createdAt: row.created_at,
    }));
  }

  async function postComment(listId, body, parentId) {
    if (!ready()) return { error: "Backend not configured" };
    if (!profile) return { error: "Sign in to comment" };
    const { error } = await client.from("comments").insert({
      list_id: String(listId),
      body,
      parent_id: parentId || null,
      author_id: profile.id,
    });
    return { error: error ? error.message : null };
  }

  /* ---------- ADMIN READS ----------
     Everything below is already publicly readable — the feed needs vote counts,
     so these queries expose nothing new. They exist to back the dashboard. */

  async function allVotes(limit = 500) {
    if (!ready()) return [];
    const { data, error } = await client
      .from("votes")
      .select("target_key, direction, created_at, profiles(username)")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) {
      console.warn("[backend] vote list failed:", error.message);
      return [];
    }
    return data.map((r) => ({ ...r, username: r.profiles ? r.profiles.username : null }));
  }

  async function allComments(limit = 200) {
    if (!ready()) return [];
    const { data, error } = await client
      .from("comments")
      .select("id, list_id, body, created_at, profiles(username)")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) {
      console.warn("[backend] comment list failed:", error.message);
      return [];
    }
    return data.map((r) => ({ ...r, username: r.profiles ? r.profiles.username : null }));
  }

  async function allProfiles(limit = 200) {
    if (!ready()) return [];
    const { data, error } = await client
      .from("profiles")
      .select("id, username, created_at")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) {
      console.warn("[backend] profile list failed:", error.message);
      return [];
    }
    return data;
  }

  /* Connect immediately: auth.js and app.js both check Backend.ready() during
     their own init, which runs after this script has been evaluated.

     Guarded because a corrupt or expired session in localStorage can make
     supabase-js throw right here. Unguarded, that throw escapes the IIFE,
     window.Backend never gets assigned, and the whole site silently drops to
     local-only — no sign-in, no saved comments, no published lists, and no
     visible reason why. Failing to local-only is survivable; failing invisibly
     is not, so say so in the console. */
  try {
    init();
  } catch (err) {
    console.error("[backend] init failed — clearing the stored session:", err);
    try {
      Object.keys(localStorage)
        .filter((k) => k.startsWith("sb-"))
        .forEach((k) => localStorage.removeItem(k));
      init(); // second chance with the bad token gone
    } catch (retryErr) {
      console.error("[backend] still down after clearing session:", retryErr);
    }
  }

  return {
    init, ready, configured, onAuthChange,
    allVotes, allComments, allProfiles,
    signUp, signIn, signOut, currentUser,
    tallies, myVotes, vote,
    fetchLists, createList,
    fetchComments, postComment,
  };
})();
