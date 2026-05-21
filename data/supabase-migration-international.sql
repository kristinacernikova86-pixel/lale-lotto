-- =========================================================
-- Lale Lotto — migrate to international winners (+ country)
-- =========================================================
-- Run this ONCE on an existing project that was created with the older
-- (Turkey-only) data. Supabase → SQL Editor → New query → paste → RUN.
-- It is safe to run more than once.
-- =========================================================

-- 1. Add the country column (no-op if it already exists)
alter table public.players add column if not exists country text;

-- 2. Replace the players with the international set
delete from public.players;
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
  ('U-1010','Olga Ivanova', 'Moscow',    'Russia',         'olga.ivanova@example.com', 'LALE-4PV2-7HG1', 1283, '{10,11,12,13,14,15}',        0, null);

-- 3. Rebuild the access functions so they also return country
drop function if exists public.winners_board();
create function public.winners_board()
returns table (
  id text, name text, city text, country text, draw_id integer,
  numbers integer[], prize bigint, payout text
)
language sql stable security definer set search_path = public
as $$
  select id, name, city, country, draw_id, numbers, prize, payout
  from public.players order by prize desc, id;
$$;

drop function if exists public.check_entry(text, text);
create function public.check_entry(p_email text, p_code text)
returns table (
  id text, name text, city text, country text, email text, code text,
  draw_id integer, numbers integer[], prize bigint, payout text
)
language sql stable security definer set search_path = public
as $$
  select id, name, city, country, email, code, draw_id, numbers, prize, payout
  from public.players
  where lower(email) = lower(p_email) and lower(code) = lower(p_code)
  limit 1;
$$;

grant execute on function public.winners_board()         to anon, authenticated;
grant execute on function public.check_entry(text, text) to anon, authenticated;
