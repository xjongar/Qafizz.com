/* ==========================================================================
   TRUST ME BRO — admin.js
   Read-only view of what's actually in the database: real lists, real votes,
   real comments, real accounts.

   Honest about what this is: every table here is publicly readable by design
   (the feed needs vote counts), so this page shows nothing a determined visitor
   couldn't already query with the anon key. The admin check below decides who
   sees a convenient dashboard — it is NOT a security boundary. Anything that
   must actually be restricted has to be enforced by row-level security in the
   database, not by this file.
   ========================================================================== */

(() => {
  const ADMINS = ["admin"]; // usernames that get the dashboard

  const whoEl = document.getElementById("adminWho");
  const gateEl = document.getElementById("adminGate");
  const bodyEl = document.getElementById("adminBody");
  const statsEl = document.getElementById("adminStats");

  const esc = (s) =>
    String(s == null ? "" : s).replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
    );

  const when = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  };

  function table(el, columns, rows, emptyMsg) {
    if (!rows.length) {
      el.innerHTML = `<tbody><tr><td class="admin-empty">${esc(emptyMsg)}</td></tr></tbody>`;
      return;
    }
    el.innerHTML =
      "<thead><tr>" + columns.map((c) => `<th>${esc(c.label)}</th>`).join("") + "</tr></thead>" +
      "<tbody>" +
      rows.map((r) => "<tr>" + columns.map((c) => `<td>${c.cell(r)}</td>`).join("") + "</tr>").join("") +
      "</tbody>";
  }

  function stats(items) {
    statsEl.innerHTML = items
      .map(
        (s) =>
          `<div class="admin-stat"><span class="admin-stat-num">${esc(s.value)}</span>` +
          `<span class="admin-stat-label">${esc(s.label)}</span></div>`
      )
      .join("");
  }

  /* The vote target_key encodes what was voted on: list:<id> or item:<id>:<text> */
  function describeTarget(key) {
    const s = String(key);
    if (s.startsWith("item:")) {
      const rest = s.slice(5);
      const idx = rest.indexOf(":");
      return idx === -1
        ? `item — ${esc(rest)}`
        : `item <b>${esc(rest.slice(idx + 1))}</b><br><span class="admin-dim">on list ${esc(rest.slice(0, idx))}</span>`;
    }
    if (s.startsWith("list:")) return `whole list <span class="admin-dim">${esc(s.slice(5))}</span>`;
    if (s.startsWith("comment:")) return `comment <span class="admin-dim">${esc(s.slice(8))}</span>`;
    return esc(s);
  }

  async function load() {
    const [lists, votes, comments, users] = await Promise.all([
      Backend.fetchLists(200),
      Backend.allVotes(500),
      Backend.allComments(200),
      Backend.allProfiles(200),
    ]);

    stats([
      { value: users.length, label: "accounts" },
      { value: lists.length, label: "lists created" },
      { value: votes.length, label: "votes cast" },
      { value: comments.length, label: "comments" },
    ]);

    table(
      document.getElementById("listsTable"),
      [
        { label: "Title", cell: (r) => `<b>${esc(r.title)}</b>` },
        { label: "Category", cell: (r) => esc(r.category) },
        { label: "By", cell: (r) => "@" + esc(r.author) },
        { label: "Items", cell: (r) => (r.items || []).length },
        { label: "Created", cell: (r) => `<span class="admin-dim">${esc(when(r.createdAt))}</span>` },
      ],
      lists,
      "Nobody has created a tier list yet."
    );

    table(
      document.getElementById("votesTable"),
      [
        { label: "Voter", cell: (r) => "@" + esc(r.username || "unknown") },
        { label: "Voted on", cell: (r) => describeTarget(r.target_key) },
        { label: "Direction", cell: (r) => (r.direction === 1 ? "▲ up" : "▼ down") },
        { label: "When", cell: (r) => `<span class="admin-dim">${esc(when(r.created_at))}</span>` },
      ],
      votes,
      "No real votes yet. Vote on the site while signed in and it lands here."
    );

    table(
      document.getElementById("commentsTable"),
      [
        { label: "Author", cell: (r) => "@" + esc(r.username || "unknown") },
        { label: "Comment", cell: (r) => esc(r.body) },
        { label: "On list", cell: (r) => `<span class="admin-dim">${esc(r.list_id)}</span>` },
        { label: "When", cell: (r) => `<span class="admin-dim">${esc(when(r.created_at))}</span>` },
      ],
      comments,
      "No real comments yet — the ones on tier lists are still generated client-side."
    );

    table(
      document.getElementById("usersTable"),
      [
        { label: "Username", cell: (r) => "@" + esc(r.username) },
        { label: "Joined", cell: (r) => `<span class="admin-dim">${esc(when(r.created_at))}</span>` },
        { label: "User id", cell: (r) => `<span class="admin-dim">${esc(r.id)}</span>` },
      ],
      users,
      "No accounts yet."
    );
  }

  function apply(profile) {
    const ok = profile && ADMINS.includes(profile.username);
    whoEl.textContent = profile
      ? ok
        ? `Signed in as @${profile.username}.`
        : `Signed in as @${profile.username} — not an admin account.`
      : "Not signed in.";
    gateEl.hidden = Boolean(ok);
    bodyEl.hidden = !ok;
    if (ok) load();
  }

  function init() {
    if (!window.Backend || !Backend.ready()) {
      whoEl.textContent = "Backend isn't configured — nothing to show.";
      gateEl.hidden = false;
      return;
    }
    Backend.onAuthChange(apply);
    apply(Backend.currentUser());
    document.getElementById("refreshBtn").addEventListener("click", () => {
      if (!bodyEl.hidden) load();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
