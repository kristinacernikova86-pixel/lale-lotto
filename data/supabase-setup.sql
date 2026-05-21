-- =========================================================
-- Lale Lotto — Supabase database setup
-- =========================================================
-- HOW TO USE
--   1. Create a free project at https://supabase.com
--   2. Open the project → SQL Editor → "New query"
--   3. Paste this whole file and press RUN
--   4. Project Settings → API → copy the "Project URL" and the
--      "anon public" key into data/supabase-config.js
--
--   ALREADY set up an older version? Don't re-run this file (it skips
--   existing rows). Use data/supabase-migration-international.sql instead.
--
-- WHAT THIS DOES
--   • Creates two tables: draws and players
--   • Loads the sample data (replace it later with your real entries)
--   • Locks the data down with Row Level Security so the public key can ONLY:
--       - read the winners board (no emails / codes exposed), and
--       - look up one entry by exact email + code (for the "check winnings" form)
--     It can never list everyone's email or code, or change anything.
--   You edit data through the Supabase dashboard (Table editor), which uses your
--   privileged login and bypasses these rules.
-- =========================================================


-- 1. Tables ------------------------------------------------------------------
create table if not exists public.draws (
  id      integer primary key,
  date    text      not null,
  winning integer[] not null,
  bonus   integer,
  jackpot bigint
);

create table if not exists public.players (
  id      text primary key,
  name    text not null,
  city    text,
  country text,                   -- Lale Lotto is online: winners come from many countries
  email   text not null,
  code    text not null,
  draw_id integer references public.draws(id),
  numbers integer[] not null,
  prize   bigint default 0,       -- amount in $ (0 = no prize)
  payout  text                    -- 'paid' | 'pending' | null (no prize)
);


-- 2. Sample data (replace with your real entries) ----------------------------
insert into public.draws (id, date, winning, bonus, jackpot) values
  (1284, 'Sat 16 May 2026', '{4,11,23,28,37,45}',   7, 41200000),
  (1283, 'Wed 13 May 2026', '{2,9,17,31,40,48}',   22, 33800000),
  (1282, 'Sat 9 May 2026',  '{6,14,19,25,33,42}',  11, 27500000),
  (1281, 'Wed 6 May 2026',  '{1,12,20,29,38,44}',   5, 22100000),
  (1280, 'Sat 2 May 2026',  '{8,15,21,27,36,49}',  18, 19400000)
on conflict (id) do nothing;

insert into public.players (id, name, city, country, email, code, draw_id, numbers, prize, payout) values
  ('U-1001','Sophie Dubois','Paris',     'France',         'sophie.dubois@example.com','LALE-7H2K-9QX4', 1284, '{4,11,23,28,37,45}',  41200000, 'paid'),
  ('U-1002','Marco Rossi',  'Milan',     'Italy',          'marco.rossi@example.com',  'LALE-3F8M-2KP7', 1283, '{2,9,17,31,40,22}',     850000, 'paid'),
  ('U-1003','Aylin Kaya',   'Istanbul',  'Turkey',        'aylin.kaya@example.com',   'LALE-9QW1-6RT5', 1284, '{4,11,23,28,37,12}',     95000, 'pending'),
  ('U-1004','James Carter', 'Manchester','United Kingdom', 'james.carter@example.com', 'LALE-5H2N-8LV3', 1282, '{6,14,33,42,1,2}',        2400, 'paid'),
  ('U-1005','Yuki Tanaka',  'Osaka',     'Japan',          'yuki.tanaka@example.com',  'LALE-2BX9-4MD6', 1282, '{6,14,19,25,40,41}',      2400, 'paid'),
  ('U-1006','Lena Schmidt', 'Berlin',    'Germany',        'lena.schmidt@example.com', 'LALE-8KL4-1QP2', 1281, '{1,12,20,7,8,9}',          120, 'paid'),
  ('U-1007','Carlos Silva', 'Sao Paulo', 'Brazil',         'carlos.silva@example.com', 'LALE-6RT3-9WX8', 1280, '{8,15,21,3,5,7}',          120, 'pending'),
  ('U-1008','Mehmet Demir', 'Ankara',    'Turkey',        'mehmet.demir@example.com', 'LALE-7DF5-2NB4', 1280, '{8,15,36,49,2,4}',        2400, 'pending'),
  ('U-1009','Emma Johnson', 'Toronto',   'Canada',         'emma.johnson@example.com', 'LALE-1MN7-3KD9', 1284, '{4,2,3,1,5,6}',              0, null),
  ('U-1010','Olga Ivanova', 'Moscow',    'Russia',         'olga.ivanova@example.com', 'LALE-4PV2-7HG1', 1283, '{10,11,12,13,14,15}',        0, null)
on conflict (id) do nothing;


-- 3. Row Level Security ------------------------------------------------------
alter table public.draws   enable row level security;
alter table public.players enable row level security;

-- Draws hold no personal data, so they can be read by anyone.
drop policy if exists "Public read draws" on public.draws;
create policy "Public read draws"
  on public.draws for select
  to anon, authenticated
  using (true);

-- players has NO select policy on purpose: with RLS on and no policy, the public
-- anon key cannot read the table directly. Access goes only through the two
-- security-definer functions below.


-- 4. Safe access functions ---------------------------------------------------

-- The public winners board: safe columns only — no email, no code.
drop function if exists public.winners_board();
create function public.winners_board()
returns table (
  id text, name text, city text, country text, draw_id integer,
  numbers integer[], prize bigint, payout text
)
language sql
stable
security definer
set search_path = public
as $$
  select id, name, city, country, draw_id, numbers, prize, payout
  from public.players
  order by prize desc, id;
$$;

-- The "check winnings" lookup: returns one entry only when BOTH the email and
-- the code match. Without the secret code, nothing comes back.
drop function if exists public.check_entry(text, text);
create function public.check_entry(p_email text, p_code text)
returns table (
  id text, name text, city text, country text, email text, code text,
  draw_id integer, numbers integer[], prize bigint, payout text
)
language sql
stable
security definer
set search_path = public
as $$
  select id, name, city, country, email, code, draw_id, numbers, prize, payout
  from public.players
  where lower(email) = lower(p_email)
    and lower(code)  = lower(p_code)
  limit 1;
$$;

grant execute on function public.winners_board()         to anon, authenticated;
grant execute on function public.check_entry(text, text) to anon, authenticated;
