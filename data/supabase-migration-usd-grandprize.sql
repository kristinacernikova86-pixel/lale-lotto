-- =========================================================
-- Lale Lotto — convert amounts to USD + add the annual grand prize
-- =========================================================
-- Run ONCE on the existing project. Supabase -> SQL Editor -> paste -> RUN.
-- Safe to run more than once.
-- Amounts converted from the original lira figures at ~45.6 TRY/USD (May 2026).
-- =========================================================

-- 1. Draw jackpots -> USD
update public.draws set jackpot = 900000 where id = 1284;
update public.draws set jackpot = 740000 where id = 1283;
update public.draws set jackpot = 600000 where id = 1282;
update public.draws set jackpot = 480000 where id = 1281;
update public.draws set jackpot = 430000 where id = 1280;

-- 2. Player prizes -> USD
update public.players set prize = 900000 where id = 'U-1001';
update public.players set prize = 18600  where id = 'U-1002';
update public.players set prize = 2080   where id = 'U-1003';
update public.players set prize = 50     where id = 'U-1004';
update public.players set prize = 50     where id = 'U-1005';
update public.players set prize = 3      where id = 'U-1006';
update public.players set prize = 3      where id = 'U-1007';
update public.players set prize = 50     where id = 'U-1008';

-- 3. Annual grand prize (single row, no winner yet)
create table if not exists public.grand_prize (
  id        integer primary key default 1,
  title     text not null,
  amount    bigint not null,
  cadence   text,
  next_draw text,
  winner    text,
  note      text
);

insert into public.grand_prize (id, title, amount, cadence, next_draw, winner, note) values
  (1, 'Annual Grand Prize', 10000000, 'Drawn once a year', '31 December 2026', null,
      'The single biggest Lale Lotto prize. One winner is drawn at the end of each year from all entries.')
on conflict (id) do update set
  title = excluded.title, amount = excluded.amount, cadence = excluded.cadence,
  next_draw = excluded.next_draw, note = excluded.note;

alter table public.grand_prize enable row level security;
drop policy if exists "Public read grand_prize" on public.grand_prize;
create policy "Public read grand_prize"
  on public.grand_prize for select to anon, authenticated using (true);
