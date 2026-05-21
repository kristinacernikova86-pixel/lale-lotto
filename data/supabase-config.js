/* =========================================================
   Lale Lotto — Supabase connection
   =========================================================
   Paste your project's URL and PUBLIC anon key below to make the site read
   from your cloud database. Find both in the Supabase dashboard:
       Project Settings → API → "Project URL" and "Project API keys → anon public"

   • The anon key is SAFE to publish in a static site — it can only do what your
     Row Level Security rules allow (here: read the winners board, and look up a
     single entry by email + code). See data/supabase-setup.sql.
   • NEVER put the "service_role" key here — it bypasses all security.

   Leave the placeholders (the "YOUR-..." values) untouched to keep running on
   the local data/database.js file instead — handy for local testing. */

window.LALE_SUPABASE = {
  url: "https://qquwyvxysxlfyiebirpt.supabase.co",
  anonKey: "sb_publishable_-NdCDGl_wW3R4d78Lyopww_oQ3qimOe",
};
