-- YumGo demo data cleanup
--
-- Run this once in the Supabase SQL Editor before launch.
--
-- It removes:
--   * every order (all existing orders were created during demo/testing)
--   * every review and promotion
--   * demo auth accounts (emails ending in @yumgo.demo)
--
-- It keeps restaurants, menu categories and menu items as the initial catalog.
--
-- WARNING: this deletes ALL orders, reviews and promotions in the project.
-- Only run it on the YumGo project while it still contains demo data.

begin;

delete from public.orders;
delete from public.reviews;
delete from public.promotions;

-- Demo auth users. Profiles, addresses and favorites cascade from auth.users.
delete from auth.users
where email ilike '%@yumgo.demo';

-- Optional: the seed also referenced these example.com demo reviewers.
-- They are not created by the seed, but delete them if they exist.
-- delete from auth.users
-- where email in (
--   'su.myat@example.com',
--   'min.khant@example.com',
--   'thiri.aung@example.com',
--   'nay.lin@example.com',
--   'ei.phyu@example.com',
--   'kyaw.zin@example.com',
--   'hnin.wai@example.com',
--   'zaw.min@example.com'
-- );

-- Verification: these should all return 0.
select
  (select count(*) from public.orders) as orders,
  (select count(*) from public.reviews) as reviews,
  (select count(*) from public.promotions) as promotions,
  (select count(*) from public.profiles where email ilike '%@yumgo.demo') as demo_profiles;

commit;
