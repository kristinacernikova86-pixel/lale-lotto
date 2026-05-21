# Lale Lotto 🌷

A static, **information-only** front-end for a Turkish-style **6/49 lottery**, in English.
It is *not* a place to play or pay — it publishes draw results and a public database of
players and winners. Brand, website, logo and email templates — all in one package.

> **Information site.** There is no number picker, no checkout and no payments anywhere on
> the site, so no one can spend money here. Data comes from a **Supabase** cloud database
> (see [Real database: Supabase](#real-database-supabase-recommended)); until you connect it,
> the site runs on the local `data/database.js` seed file. See also
> [Before you go live](#before-you-go-live).

---

## Brand

| | |
|---|---|
| **Name** | Lale Lotto — *lale* (🌷 tulip) is a historic symbol of Türkiye; reads well in English. |
| **Tagline** | *Pick your fortune.* |
| **Flagship game** | Lale 6/49 — pick six numbers from 1–49, draws Wed & Sat 21:00. |
| **Logo** | Stylised tulip mark + wordmark. See `assets/logo.svg` / `assets/favicon.svg`. |

### Colours

| Token | Hex | Use |
|-------|-----|-----|
| Indigo (bg) | `#120A2A` | Page background |
| Surface | `#221652` | Cards, header |
| **Gold** | `#FFC83D` → `#FF9E2C` | Luck, jackpot, primary buttons, main balls |
| **Tulip red** | `#E23E57` → `#C8102E` | Accent, bonus ball |
| Text | `#F4F1FF` | Headings & body |
| Muted | `#B3A9DC` | Secondary text |

### Fonts
- **Sora** (700/800) — headings & numbers
- **Inter** (400–600) — body
Loaded from Google Fonts; swap for self-hosted files if you need to work offline.

---

## What's in the box

```
lale-lotto/
├─ index.html            Landing: hero, jackpot + live countdown, how-it-works, latest result
├─ results.html          Past-draw results table
├─ winners.html          Players & winners database — stats, search, filters, table
├─ check.html            Winnings checker — verify an entry by email + unique code (no login)
├─ responsible.html      Responsible-play guidance & commitments
├─ data/database.js          Local fallback / seed data (window.LALE_DB): draws + players
├─ data/supabase-config.js   Your Supabase URL + public anon key go here
├─ data/supabase-setup.sql   Run this in Supabase to create the tables + security
├─ data/supabase-migration-international.sql  One-off: switch existing DB to int'l winners
├─ css/styles.css        Whole design system (one file)
├─ js/main.js            Countdown, mobile nav, winners database, winnings checker
├─ assets/logo.svg       Full logo lockup
├─ assets/favicon.svg    App icon / favicon
└─ emails/
   ├─ 01-welcome.html              Welcome / onboarding
   ├─ 02-ticket-confirmation.html  Entry-confirmation template (optional)
   └─ 03-draw-results.html         Post-draw results notice
```

## Run it

It's plain HTML/CSS/JS — just open `index.html` in a browser, or serve the folder:

```powershell
# from inside the lale-lotto folder
python -m http.server 8000
# then open http://localhost:8000
```

## The player database

`data/database.js` is the site's data store. It is loaded as a plain `<script>` (so it works
even when you open the files directly — no server, no CORS) and exposed as `window.LALE_DB`:

```js
window.LALE_DB = {
  draws:   [ { id, date, winning: [/* 6 */], bonus, jackpot }, … ],
  players: [ { id, name, city, country, email, code, drawId, numbers: [/* 6 */], prize, payout }, … ],
};
```

`prize` is an integer in ₺ (`0` = no prize) and `payout` is `"paid" | "pending" | null`. A
player's **matches** are *computed* against their draw, so winning numbers live in one place only.

This file is the **fallback / seed**: the site uses it only while Supabase is not configured (see
below). It's handy for editing/testing offline. `winners.html` reads it and renders the **players &
winners board** — totals (players, winners, prizes paid, awaiting payout), a search box, status
filters and a table.

## Real database: Supabase (recommended)

The site can read live data from a free **[Supabase](https://supabase.com)** project (a hosted
PostgreSQL database). This works on plain static hosting — no server of your own — because the
browser talks to Supabase directly over its API.

**Set it up once:**

1. Create a free project at <https://supabase.com>.
2. In the project, open **SQL Editor → New query**, paste the whole of
   [`data/supabase-setup.sql`](data/supabase-setup.sql), and press **Run**. This creates the
   `draws` and `players` tables, loads the sample data, and sets the security rules.
3. Open **Project Settings → API** and copy the **Project URL** and the **`anon` public** key.
4. Paste both into [`data/supabase-config.js`](data/supabase-config.js):
   ```js
   window.LALE_SUPABASE = {
     url: "https://abcd1234.supabase.co",
     anonKey: "eyJhbGciOi…",   // the "anon public" key
   };
   ```
5. Upload the site to your static host. Done — `winners.html` and `check.html` now read from Supabase.

**Managing the data:** use the Supabase dashboard → **Table editor** → `players` / `draws`. Add a
row to add a player; edit `prize` / `payout` to mark a winner paid. Changes show on the site on
the next page load — no redeploy needed.

**Security — important:**

- The **`anon` public key is safe** to ship in the site. Row Level Security (in the SQL file) means
  it can only *read the winners board* (names, city, numbers, prize, status — **no emails or
  codes**) and *look up one entry by exact email + code*. It cannot list everyone's email/code or
  change anything.
- **Never** put the **`service_role`** key in the site — it bypasses all security. It's only for
  trusted server-side use.
- Leaving the `YOUR-…` placeholders in `supabase-config.js` keeps the site on the local
  `data/database.js` file, so everything still works before you connect Supabase.

> Want a different backend (your own Node/PHP API, Firebase, etc.)? The data layer lives in one
> place — `loadBoardData()` / `checkEntry()` / `getDrawById()` near the top of `js/main.js`. Swap
> those three functions and the rest of the site is unchanged.

## Checking winnings (no login)

There's no player account or password. Every entry has a **unique code**. On `check.html` a player
enters **their email + that code**, and the page shows their line, the winning numbers and any
prize. With Supabase connected this goes through the secure `check_entry` function (the code never
travels to the public board); without it, the lookup runs against the local `data/database.js`.
Try it with a sample row — e.g. `sophie.dubois@example.com` + `LALE-7H2K-9QX4` (a jackpot winner) or
`olga.ivanova@example.com` + `LALE-4PV2-7HG1` (entered, no prize).

The codes are `{{check_code}}` in the emails (e.g. `LALE-XXXX-XXXX`) and `{{check_url}}` points at
the hosted `check.html`. Keep the "no fee, no password to claim" wording — that's what protects
players from lottery scams.

## Emails

Table-based HTML with inline styles for broad client support (Gmail, Outlook, Apple Mail).
Personalisation uses `{{merge_tags}}` — map these to your ESP (Mailchimp, SendGrid, etc.).
Entry-confirmation and results emails carry the player's `{{check_code}}` and a `{{check_url}}`
link to the winnings checker (replacing the old account links).
Each template lists its tags in a comment at the top. Test with **Litmus** or **Email on Acid**
before sending to real lists.

The results email is deliberately written as a **neutral results notice**: prizes are paid out
automatically, and it never asks the player to pay a fee or share a password to "claim" a win.
Please keep it that way — that pattern is exactly what lottery scams imitate, and it protects both
your client and their customers.

---

## Before you go live

This build is **information-only** — it never takes a bet or a payment, which sidesteps most of
the risk. The moment anyone adds real-money play (here or anywhere it links to), every item below
applies — flag it to the client:

- [ ] **Licensing.** Online lotteries in Türkiye are a state monopoly (Millî Piyango); private
      operators are illegal and get blocked by the BTK. Confirm in writing that the operator holds
      a valid licence (in Türkiye, or in whatever jurisdiction they actually operate from / target).
- [ ] **Age & identity (KYC) verification** — 18+ checks before any deposit or play.
- [ ] **Payments / PSP** — a gambling-approved payment provider; PCI-DSS handled by the PSP.
- [ ] **Provably fair / certified draw** — RNG certification and tamper-evident draw records.
- [ ] **Responsible gambling** — wire up the real limits, self-exclusion, and a local helpline on
      `responsible.html` (the UI is ready, the actions are placeholders).
- [ ] **Legal pages** — real Terms, Privacy (KVKK/GDPR), and game rules behind the footer links.
- [ ] **Footer licence text** — replace `[Operator Legal Name]`, `[LICENCE NUMBER]`, `[REGULATOR]`
      in every page footer and email.

I'd get the licensing point confirmed *before* committing engineering time — it determines whether
the project can legally ship at all.
```
