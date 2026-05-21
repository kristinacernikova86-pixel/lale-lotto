/* =========================================================
   Lale Lotto — player database (local fallback / seed)
   =========================================================
   This file is the LOCAL data store. The site uses it whenever Supabase is
   not configured (data/supabase-config.js still has the "YOUR-..." placeholders)
   — handy for local testing and as offline seed data. Once you fill in your
   Supabase keys, winners.html and check.html read from the cloud instead and
   this file is only the fallback. The seed data here matches data/supabase-setup.sql.

   It is loaded as a plain script (before js/main.js) and exposed as
   `window.LALE_DB`, so it works whether you open the pages directly (file://)
   or serve the folder — no fetch / CORS issues.

   It powers two things:
     • winners.html  — the public players & winners board
     • check.html    — the "check my entry" form looks players up here

   Shape:
     draws[]   one record per draw (winning numbers + bonus ball)
     players[] one record per entry. `matches` is NOT stored — it is
               computed against the matching draw, so the data stays
               in one place. `prize` is an integer in $ (0 = no prize);
               `payout` is "paid" | "pending" | null (null = no prize).

   To go live with a real backend, replace this file with a script
   that fetches your API and assigns the same shape to window.LALE_DB,
   or have the pages read from your endpoint instead.
   ========================================================= */

window.LALE_DB = {
  meta: {
    name: "Lale Lotto — player database",
    updated: "21 May 2026",
    note: "Informational record only. You cannot play or pay on this site.",
  },

  // Winning numbers per draw (mirrors results.html).
  draws: [
    { id: 1284, date: "Sat 16 May 2026", winning: [4, 11, 23, 28, 37, 45], bonus: 7,  jackpot: 41200000 },
    { id: 1283, date: "Wed 13 May 2026", winning: [2, 9, 17, 31, 40, 48], bonus: 22, jackpot: 33800000 },
    { id: 1282, date: "Sat 9 May 2026",  winning: [6, 14, 19, 25, 33, 42], bonus: 11, jackpot: 27500000 },
    { id: 1281, date: "Wed 6 May 2026",  winning: [1, 12, 20, 29, 38, 44], bonus: 5,  jackpot: 22100000 },
    { id: 1280, date: "Sat 2 May 2026",  winning: [8, 15, 21, 27, 36, 49], bonus: 18, jackpot: 19400000 },
  ],

  // Players and their entries. prize is in $ (0 = no prize).
  // Lale Lotto is played online, so winners come from many countries.
  players: [
    { id: "U-1001", name: "Sophie Dubois", city: "Paris",      country: "France",         email: "sophie.dubois@example.com", code: "LALE-7H2K-9QX4", drawId: 1284, numbers: [4, 11, 23, 28, 37, 45], prize: 41200000, payout: "paid" },
    { id: "U-1002", name: "Marco Rossi",   city: "Milan",      country: "Italy",          email: "marco.rossi@example.com",   code: "LALE-3F8M-2KP7", drawId: 1283, numbers: [2, 9, 17, 31, 40, 22], prize: 850000,   payout: "paid" },
    { id: "U-1003", name: "Aylin Kaya",    city: "Istanbul",   country: "Turkey",        email: "aylin.kaya@example.com",    code: "LALE-9QW1-6RT5", drawId: 1284, numbers: [4, 11, 23, 28, 37, 12], prize: 95000,    payout: "pending" },
    { id: "U-1004", name: "James Carter",  city: "Manchester", country: "United Kingdom", email: "james.carter@example.com",  code: "LALE-5H2N-8LV3", drawId: 1282, numbers: [6, 14, 33, 42, 1, 2],  prize: 2400,     payout: "paid" },
    { id: "U-1005", name: "Yuki Tanaka",   city: "Osaka",      country: "Japan",          email: "yuki.tanaka@example.com",   code: "LALE-2BX9-4MD6", drawId: 1282, numbers: [6, 14, 19, 25, 40, 41], prize: 2400,     payout: "paid" },
    { id: "U-1006", name: "Lena Schmidt",  city: "Berlin",     country: "Germany",        email: "lena.schmidt@example.com",  code: "LALE-8KL4-1QP2", drawId: 1281, numbers: [1, 12, 20, 7, 8, 9],   prize: 120,      payout: "paid" },
    { id: "U-1007", name: "Carlos Silva",  city: "Sao Paulo",  country: "Brazil",         email: "carlos.silva@example.com",  code: "LALE-6RT3-9WX8", drawId: 1280, numbers: [8, 15, 21, 3, 5, 7],   prize: 120,      payout: "pending" },
    { id: "U-1008", name: "Mehmet Demir",  city: "Ankara",     country: "Turkey",        email: "mehmet.demir@example.com",  code: "LALE-7DF5-2NB4", drawId: 1280, numbers: [8, 15, 36, 49, 2, 4],  prize: 2400,     payout: "pending" },
    { id: "U-1009", name: "Emma Johnson",  city: "Toronto",    country: "Canada",         email: "emma.johnson@example.com",  code: "LALE-1MN7-3KD9", drawId: 1284, numbers: [4, 2, 3, 1, 5, 6],    prize: 0,        payout: null },
    { id: "U-1010", name: "Olga Ivanova",  city: "Moscow",     country: "Russia",         email: "olga.ivanova@example.com",  code: "LALE-4PV2-7HG1", drawId: 1283, numbers: [10, 11, 12, 13, 14, 15], prize: 0,       payout: null },
  ],
};
