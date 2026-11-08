-- Promote a YumGo account to administrator.
--
-- 1. Create the account normally from /signup and confirm the email.
-- 2. Replace the email below with that account's email.
-- 3. Run this in the Supabase SQL Editor.
--
-- The app reads public.profiles.role, so the change takes effect the next time
-- the account signs in (or refreshes the page).

update public.profiles
set role = 'admin',
    status = 'active'
where email = 'you@example.com';

-- Verify the result.
select id, email, name, role, status
from public.profiles
where role = 'admin'
order by created_at;
