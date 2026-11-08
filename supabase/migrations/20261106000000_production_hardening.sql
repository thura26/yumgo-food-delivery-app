-- YumGo production hardening
-- Applies to databases created from 20261104000000_init.sql.
-- Safe to run more than once.

begin;

-- ---------------------------------------------------------------------------
-- Signup always creates a customer. Admins are promoted explicitly with
-- supabase/promote-admin.sql (or from the Supabase dashboard).
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, email, phone, role)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data->>'full_name', ''),
      nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
      'YumGo User'
    ),
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'phone', ''),
    'customer'::public.user_role
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Orders are COD-only and always belong to the signed-in customer.
-- ---------------------------------------------------------------------------
update public.orders
set payment_method = 'cod'
where payment_method <> 'cod';

alter table public.orders
  drop constraint if exists orders_cod_only;

alter table public.orders
  add constraint orders_cod_only check (payment_method = 'cod');

drop policy if exists "Customers can create their own orders" on public.orders;
create policy "Customers can create their own orders"
  on public.orders for insert
  to authenticated
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Customers may advance only their own auto-advance orders, one step at a
-- time. The function runs as the owner so it can bypass the admin-only UPDATE
-- policy, while still validating ownership and the allowed transition.
-- ---------------------------------------------------------------------------
create or replace function public.advance_order_status(p_order_id text)
returns public.order_status
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_next public.order_status;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select *
    into v_order
    from public.orders
   where id = p_order_id
     for update;

  if not found then
    raise exception 'Order not found';
  end if;

  if v_order.user_id is distinct from auth.uid() then
    raise exception 'Not allowed';
  end if;

  if not v_order.auto_advance then
    raise exception 'Order is not set to auto-advance';
  end if;

  v_next := case v_order.status
    when 'pending_payment' then 'confirmed'::public.order_status
    when 'confirmed' then 'preparing'::public.order_status
    when 'preparing' then 'on_the_way'::public.order_status
    when 'on_the_way' then 'delivered'::public.order_status
    else null
  end;

  if v_next is null then
    return null;
  end if;

  update public.orders
     set status = v_next,
         events = coalesce(events, '[]'::jsonb)
           || jsonb_build_array(
                jsonb_build_object('status', v_next, 'at', now())
              ),
         payment_status = case
           when v_next = 'delivered' and payment_method = 'cod'
             then 'paid'::public.payment_status
           else payment_status
         end,
         auto_advance = case
           when v_next = 'delivered' then false
           else auto_advance
         end,
         updated_at = now()
   where id = p_order_id;

  return v_next;
end;
$$;

revoke all on function public.advance_order_status(text) from public;
revoke all on function public.advance_order_status(text) from anon;
grant execute on function public.advance_order_status(text) to authenticated;

-- ---------------------------------------------------------------------------
-- Realtime for admin data used by the dashboard.
-- ---------------------------------------------------------------------------
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'promotions'
    ) then
      execute 'alter publication supabase_realtime add table public.promotions';
    end if;

    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'profiles'
    ) then
      execute 'alter publication supabase_realtime add table public.profiles';
    end if;
  end if;
end $$;

commit;
