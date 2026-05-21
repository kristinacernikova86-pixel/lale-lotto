/* =========================================================
   Lale Lotto — site interactions
   - Next-draw countdown (Wed & Sat, 21:00 Europe/Istanbul)
   - Mobile nav toggle
   - Players & winners database (winners page)
   - Winnings checker — looks entries up in the local database

   This is an information-only site: there is no play or payment.
   All player data lives in data/database.js (window.LALE_DB).
   ========================================================= */

(function () {
  "use strict";

  /* ---------- Mobile nav ---------- */
  const toggle = document.querySelector(".nav-toggle");
  const links = document.querySelector(".nav-links");
  if (toggle && links) {
    toggle.addEventListener("click", () => links.classList.toggle("open"));
  }

  /* ---------- Toast helper ---------- */
  function toast(message) {
    let el = document.querySelector(".toast");
    if (!el) {
      el = document.createElement("div");
      el.className = "toast";
      document.body.appendChild(el);
    }
    el.textContent = message;
    el.classList.add("show");
    clearTimeout(el._t);
    el._t = setTimeout(() => el.classList.remove("show"), 2600);
  }

  /* ---------- Next draw date (Wed = 3, Sat = 6) at 21:00 ---------- */
  function nextDraw() {
    const now = new Date();
    const drawDays = [3, 6]; // Wed, Sat
    for (let add = 0; add < 8; add++) {
      const d = new Date(now);
      d.setDate(now.getDate() + add);
      d.setHours(21, 0, 0, 0);
      if (drawDays.includes(d.getDay()) && d > now) return d;
    }
    return new Date(now.getTime() + 86400000);
  }

  /* ---------- Countdown ---------- */
  const cd = document.querySelector("[data-countdown]");
  if (cd) {
    const target = nextDraw();
    const dateLabel = document.querySelector("[data-draw-date]");
    if (dateLabel) {
      dateLabel.textContent = target.toLocaleDateString("en-GB", {
        weekday: "long", day: "numeric", month: "long",
      }) + " · 21:00";
    }
    const fields = {
      d: cd.querySelector("[data-d]"),
      h: cd.querySelector("[data-h]"),
      m: cd.querySelector("[data-m]"),
      s: cd.querySelector("[data-s]"),
    };
    const pad = (n) => String(n).padStart(2, "0");
    function tick() {
      let diff = Math.max(0, target - new Date());
      const days = Math.floor(diff / 86400000); diff -= days * 86400000;
      const hrs = Math.floor(diff / 3600000);  diff -= hrs * 3600000;
      const min = Math.floor(diff / 60000);    diff -= min * 60000;
      const sec = Math.floor(diff / 1000);
      if (fields.d) fields.d.textContent = pad(days);
      if (fields.h) fields.h.textContent = pad(hrs);
      if (fields.m) fields.m.textContent = pad(min);
      if (fields.s) fields.s.textContent = pad(sec);
    }
    tick();
    setInterval(tick, 1000);
  }

  /* ---------- Data layer (Supabase, with local fallback) ----------
     Reads from Supabase when data/supabase-config.js is filled in; otherwise
     falls back to the local seed file data/database.js (window.LALE_DB).
     Schema + security: data/supabase-setup.sql. */
  const pad = (n) => String(n).padStart(2, "0");

  function supaClient() {
    const c = window.LALE_SUPABASE;
    if (!c || !c.url || !c.anonKey) return null;
    if (/YOUR-/.test(c.url) || /YOUR-/.test(c.anonKey)) return null;       // still placeholders
    if (!window.supabase || !window.supabase.createClient) return null;    // SDK not loaded
    if (!supaClient._c) supaClient._c = window.supabase.createClient(c.url, c.anonKey);
    return supaClient._c;
  }

  const normDraw = (d) => ({ id: d.id, date: d.date, winning: d.winning || [], bonus: d.bonus, jackpot: d.jackpot });
  const normPlayer = (p) => ({
    id: p.id, name: p.name, city: p.city, country: p.country, email: p.email, code: p.code,
    drawId: p.draw_id != null ? p.draw_id : p.drawId,
    numbers: p.numbers || [], prize: p.prize || 0, payout: p.payout || null,
  });

  // Draws + all players for the winners board (Supabase: no emails/codes).
  async function loadBoardData() {
    const client = supaClient();
    if (client) {
      const [draws, players] = await Promise.all([
        client.from("draws").select("*").order("id", { ascending: false }),
        client.rpc("winners_board"),
      ]);
      if (draws.error) throw draws.error;
      if (players.error) throw players.error;
      return { draws: (draws.data || []).map(normDraw), players: (players.data || []).map(normPlayer) };
    }
    const db = window.LALE_DB || {};
    return { draws: db.draws || [], players: db.players || [] };
  }

  // One entry, looked up by exact email + code (secret lookup for the checker).
  async function checkEntry(email, code) {
    const client = supaClient();
    if (client) {
      const { data, error } = await client.rpc("check_entry", { p_email: email, p_code: code });
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      return row ? normPlayer(row) : null;
    }
    const db = window.LALE_DB;
    if (!db || !db.players) throw new Error("no-database");
    return db.players.find(
      (p) => p.email.toLowerCase() === email.toLowerCase() &&
             p.code.toLowerCase() === code.toLowerCase()
    ) || null;
  }

  async function getDrawById(drawId) {
    const client = supaClient();
    if (client) {
      const { data, error } = await client.from("draws").select("*").eq("id", drawId).maybeSingle();
      if (error || !data) return null;
      return normDraw(data);
    }
    const db = window.LALE_DB;
    return db && db.draws ? db.draws.find((d) => d.id === drawId) || null : null;
  }

  // How many of `numbers` are in the draw's main winning set.
  function countMatches(numbers, draw) {
    if (!draw) return 0;
    const win = new Set(draw.winning.map(Number));
    return numbers.filter((n) => win.has(Number(n))).length;
  }

  function hasBonus(numbers, draw) {
    return !!(draw && numbers.map(Number).includes(Number(draw.bonus)));
  }

  function formatTRY(amount) {
    return "₺" + Number(amount || 0).toLocaleString("en-US");
  }

  function maskEmail(email) {
    const [user, domain] = String(email).split("@");
    if (!domain) return email;
    const head = user.slice(0, 1);
    return `${head}${"•".repeat(Math.max(3, user.length - 1))}@${domain}`;
  }

  function maskCode(code) {
    // LALE-7H2K-9QX4 -> LALE-••••-9QX4 (keep the last group)
    const parts = String(code).split("-");
    if (parts.length < 3) return code;
    return `${parts[0]}-••••-${parts[parts.length - 1]}`;
  }

  // Status of an entry, derived from prize + payout.
  function entryStatus(player) {
    if (!player.prize) return { key: "none", label: "No prize", cls: "is-none" };
    if (player.payout === "paid") return { key: "paid", label: "Paid", cls: "is-paid" };
    return { key: "pending", label: "Awaiting payout", cls: "is-pending" };
  }

  /* ---------- Players & winners board (winners page) ---------- */
  async function initWinnersBoard() {
    const dbRows = document.querySelector("[data-db-rows]");
    if (!dbRows) return;

    let data;
    try {
      data = await loadBoardData();
    } catch (err) {
      console.error("Lale Lotto: couldn't load board data —", err);
      dbRows.innerHTML = `<tr><td colspan="6" class="db-empty">Couldn't load the player database. Check your settings in data/supabase-config.js.</td></tr>`;
      return;
    }

    const drawById = (id) => data.draws.find((d) => d.id === id) || null;
    const players = data.players.map((p) => {
      const draw = drawById(p.drawId);
      return { ...p, draw, matches: countMatches(p.numbers, draw), bonus: hasBonus(p.numbers, draw) };
    });

    // --- Stats ---
    const winners = players.filter((p) => p.prize > 0);
    const paidTotal = players.filter((p) => p.payout === "paid").reduce((s, p) => s + p.prize, 0);
    const pendingCount = players.filter((p) => p.payout === "pending").length;
    const setStat = (sel, val) => {
      const el = document.querySelector(sel);
      if (el) el.textContent = val;
    };
    setStat("[data-stat-players]", players.length);
    setStat("[data-stat-winners]", winners.length);
    setStat("[data-stat-paid]", formatTRY(paidTotal));
    setStat("[data-stat-pending]", pendingCount);

    // --- Row rendering ---
    function ballsHtml(numbers, draw) {
      const win = new Set(draw ? draw.winning.map(Number) : []);
      return numbers
        .map((n) => `<div class="ball${win.has(Number(n)) ? "" : " miss"}">${pad(n)}</div>`)
        .join("");
    }

    // City + masked email/code are only shown when present (Supabase board
    // deliberately omits email/code; the local file includes them).
    function subLines(p) {
      const loc = [p.city, p.country].filter(Boolean).join(", ");
      const bits = [loc].filter(Boolean);
      if (p.email) bits.push(maskEmail(p.email));
      const line1 = bits.length ? `<div class="db-sub">${bits.join(" · ")}</div>` : "";
      const line2 = p.code ? `<div class="db-sub db-code">${maskCode(p.code)}</div>` : "";
      return line1 + line2;
    }

    function rowHtml(p) {
      const st = entryStatus(p);
      const drawLabel = p.draw ? `#${p.draw.id}` : "—";
      const drawDate = p.draw ? p.draw.date : "";
      const matchLabel = `${p.matches}/6${p.bonus ? " +B" : ""}`;
      return `<tr>
        <td>
          <div class="db-player">${p.name}</div>
          ${subLines(p)}
        </td>
        <td><div class="db-player">${drawLabel}</div><div class="db-sub">${drawDate}</div></td>
        <td><div class="balls db-balls">${ballsHtml(p.numbers, p.draw)}</div></td>
        <td class="num-col"><b class="${p.matches >= 3 ? "gold" : "muted"}">${matchLabel}</b></td>
        <td>${p.prize ? `<b class="db-prize">${formatTRY(p.prize)}</b>` : '<span class="muted">—</span>'}</td>
        <td><span class="db-badge ${st.cls}">${st.label}</span></td>
      </tr>`;
    }

    const search = document.querySelector("[data-db-search]");
    const filtersEl = document.querySelector("[data-db-filters]");
    let activeFilter = "all";

    function matchesFilter(p) {
      switch (activeFilter) {
        case "winners": return p.prize > 0;
        case "paid":    return p.payout === "paid";
        case "pending": return p.payout === "pending";
        case "none":    return !p.prize;
        default:        return true;
      }
    }

    function matchesSearch(p, q) {
      if (!q) return true;
      return [p.name, p.city, p.country, p.code, p.id].filter(Boolean).join(" ").toLowerCase().includes(q);
    }

    function renderTable() {
      const q = (search && search.value.trim().toLowerCase()) || "";
      const rows = players.filter((p) => matchesFilter(p) && matchesSearch(p, q));
      dbRows.innerHTML = rows.length
        ? rows.map(rowHtml).join("")
        : `<tr><td colspan="6" class="db-empty">No players match that.</td></tr>`;
    }

    if (search) search.addEventListener("input", renderTable);
    if (filtersEl) {
      filtersEl.addEventListener("click", (e) => {
        const btn = e.target.closest(".db-filter");
        if (!btn) return;
        activeFilter = btn.dataset.filter;
        filtersEl.querySelectorAll(".db-filter").forEach((b) => b.classList.toggle("is-active", b === btn));
        renderTable();
      });
    }

    renderTable();
  }
  initWinnersBoard();

  /* ---------- Winnings checker (check page) ----------
     Players don't sign in — they check an entry with the email they played
     with plus the unique code from their Lale Lotto email. We look the entry
     up in the local database (window.LALE_DB, see data/database.js) and show
     the result. To go live, swap this lookup for a call to your backend that
     returns the same { status, numbers, winning, bonus, prize } shape. */
  const checkForm = document.querySelector("[data-check-form]");
  if (checkForm) {
    const resultEl = document.querySelector("[data-check-result]");
    const submitBtn = checkForm.querySelector("[data-check-submit]");

    function ballsRow(numbers, winningSet) {
      return [...numbers]
        .map((n) => {
          const hit = winningSet && winningSet.has(Number(n));
          return `<div class="ball${hit ? "" : " miss"}">${pad(n)}</div>`;
        })
        .join("");
    }

    function show(html, stateClass) {
      resultEl.innerHTML = `<div class="res-card ${stateClass}">${html}</div>`;
      resultEl.hidden = false;
      resultEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }

    function renderLoading() {
      show(
        `<div class="spinner" role="status" aria-label="Checking"></div>
         <h3>Checking your entry…</h3>
         <p class="muted" style="margin:0;">Looking your code up in the player database.</p>`,
        "is-info"
      );
    }

    function renderResult(data) {
      const winningSet = new Set((data.winning || []).map(Number));
      const matches =
        typeof data.matches === "number"
          ? data.matches
          : (data.numbers || []).filter((n) => winningSet.has(Number(n))).length;

      const drawLine = [data.draw, data.date].filter(Boolean).join(" · ");
      const drawHtml = drawLine
        ? `<p class="muted" style="margin:0 0 14px;font-size:.88rem;">${drawLine}</p>`
        : "";

      const winningHtml = (data.winning && data.winning.length)
        ? `<div class="res-row">
             <p class="res-label">Winning numbers</p>
             <div class="balls">${ballsRow(data.winning)}${
               data.bonus ? `<div class="ball bonus">${pad(data.bonus)}</div>` : ""
             }</div>
           </div>`
        : "";

      const yourHtml = (data.numbers && data.numbers.length)
        ? `<div class="res-row">
             <p class="res-label">Your numbers</p>
             <div class="balls">${ballsRow(data.numbers, winningSet)}</div>
             <p class="res-matches">Matched <b>${matches}</b> of 6</p>
           </div>`
        : "";

      if (data.status === "win") {
        show(
          `<span class="res-badge">✓ Winning entry</span>
           <h3>Congratulations — you won!</h3>
           ${data.prize ? `<div class="res-prize">${data.prize}</div>` : ""}
           ${drawHtml}${winningHtml}${yourHtml}
           <p class="muted" style="margin:14px 0 0;font-size:.88rem;">Your prize is credited automatically — there's nothing to pay and no password to share to release it.</p>`,
          "is-win"
        );
      } else if (data.status === "entered") {
        show(
          `<span class="res-badge">Entry confirmed</span>
           <h3>You were in this draw</h3>
           ${drawHtml}${winningHtml}${yourHtml}
           <p class="muted" style="margin:14px 0 0;font-size:.88rem;">No prize this time. Your numbers were valid for the draw above.</p>
           <a class="btn btn-primary" href="winners.html">See all winners →</a>`,
          "is-entered"
        );
      } else {
        show(
          `<span class="res-badge">Not found</span>
           <h3>We couldn't match that</h3>
           <p class="muted" style="margin:0;">Check the email address and code against your Lale Lotto email — codes look like <b>LALE-XXXX-XXXX</b>. If it still won't match, contact support.</p>`,
          "is-none"
        );
      }
    }

    function renderError(message) {
      show(
        `<span class="res-badge">Service unavailable</span>
         <h3>Couldn't check right now</h3>
         <p class="muted" style="margin:0;">${message}</p>`,
        "is-error"
      );
    }

    checkForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = checkForm.email.value.trim();
      const code = checkForm.code.value.trim();

      if (!email || !code) { toast("Enter both your email and your code."); return; }
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { toast("That email address doesn't look right."); return; }

      renderLoading();
      submitBtn.disabled = true;

      try {
        const player = await checkEntry(email, code);
        if (!player) { renderResult({ status: "not_found" }); return; }

        const draw = await getDrawById(player.drawId);
        renderResult({
          status: player.prize > 0 ? "win" : "entered",
          draw: draw ? `Lale 6/49 · Draw #${draw.id}` : "Lale 6/49",
          date: draw ? draw.date : "",
          numbers: player.numbers,
          winning: draw ? draw.winning : [],
          bonus: draw ? draw.bonus : undefined,
          matches: countMatches(player.numbers, draw),
          prize: player.prize ? formatTRY(player.prize) : "",
        });
      } catch (err) {
        console.error("Lale Lotto: check failed —", err);
        renderError("We couldn't reach the player database. Please try again in a moment.");
      } finally {
        submitBtn.disabled = false;
      }
    });
  }

  /* ---------- Footer year ---------- */
  const yr = document.querySelector("[data-year]");
  if (yr) yr.textContent = new Date().getFullYear();
})();
