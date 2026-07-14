create extension if not exists pgcrypto;

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  brand text,
  category text,
  gender text,
  price integer not null,
  color text,
  frame_size text,
  description text,
  image_url text,
  stock boolean default true,
  created_at timestamp with time zone default now()
);

alter table products
drop constraint if exists products_name_unique;
