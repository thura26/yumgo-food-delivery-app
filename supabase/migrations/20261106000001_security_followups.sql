-- YumGo security follow-ups
-- Safe to run more than once.

begin;

-- Pin the search path on the shared updated_at trigger so it cannot resolve
-- objects from a caller-controlled schema.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

commit;
