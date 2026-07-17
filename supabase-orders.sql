create extension if not exists pgcrypto;

create table if not exists public.orders (
  id uuid default gen_random_uuid() primary key,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  product_image_url text,
  unit_price integer not null,
  quantity integer not null default 1 check (quantity > 0),
  total_price integer not null,
  customer_name text not null,
  phone text not null,
  wilaya text,
  address text,
  note text,
  status text not null default 'nouvelle',
  created_at timestamptz not null default now()
);

-- `create table if not exists` does not add columns to an older table.
alter table public.orders
  add column if not exists product_image_url text;

alter table public.orders
  add column if not exists unit_price integer;

update public.orders
set unit_price = greatest(
  0,
  total_price / greatest(quantity, 1)
)
where unit_price is null;

alter table public.orders
  alter column unit_price set not null;

alter table public.orders
  drop constraint if exists orders_status_check;

alter table public.orders
  add constraint orders_status_check check (
    status in (
      'nouvelle',
      'confirmee',
      'en_preparation',
      'expediee',
      'livree',
      'annulee'
    )
  );

alter table public.orders
  drop constraint if exists orders_total_price_check;

alter table public.orders
  add constraint orders_total_price_check check (
    unit_price >= 0 and total_price = unit_price * quantity
  );

create index if not exists orders_created_at_idx
  on public.orders (created_at desc);

create index if not exists orders_status_idx
  on public.orders (status);

create or replace function public.prepare_order_snapshot()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  ordered_product public.products%rowtype;
begin
  if new.product_id is not null then
    select *
    into ordered_product
    from public.products
    where id = new.product_id;

    if not found then
      raise exception 'Product not found';
    end if;

    new.product_name := ordered_product.name;
    new.product_image_url := ordered_product.image_url;
    new.unit_price := ordered_product.price;
  else
    new.product_name := trim(new.product_name);
    new.product_image_url := nullif(trim(new.product_image_url), '');
    new.unit_price := greatest(0, new.unit_price);
  end if;

  new.quantity := least(99, greatest(1, new.quantity));
  new.total_price := new.unit_price * new.quantity;
  new.status := 'nouvelle';

  return new;
end;
$$;

drop trigger if exists prepare_order_snapshot_trigger on public.orders;
create trigger prepare_order_snapshot_trigger
  before insert on public.orders
  for each row
  execute function public.prepare_order_snapshot();

alter table public.orders enable row level security;

drop policy if exists "Public can create orders" on public.orders;
create policy "Public can create orders"
  on public.orders
  for insert
  to anon
  with check (
    status = 'nouvelle'
    and char_length(trim(customer_name)) >= 2
    and char_length(trim(phone)) between 8 and 30
    and quantity between 1 and 99
    and total_price >= 0
  );

drop policy if exists "Admin can read orders" on public.orders;
create policy "Admin can read orders"
  on public.orders
  for select
  to authenticated
  using ((auth.jwt() ->> 'email') = 'admin@clairoptique.com');

drop policy if exists "Admin can update orders" on public.orders;
create policy "Admin can update orders"
  on public.orders
  for update
  to authenticated
  using ((auth.jwt() ->> 'email') = 'admin@clairoptique.com')
  with check ((auth.jwt() ->> 'email') = 'admin@clairoptique.com');

revoke all privileges on table public.orders from public;
revoke all privileges on table public.orders from anon;
revoke all privileges on table public.orders from authenticated;

grant insert on table public.orders to anon;
grant select, update on table public.orders to authenticated;

notify pgrst, 'reload schema';
