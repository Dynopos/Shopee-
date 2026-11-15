-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- users (mirrors auth.users, auto-populated by trigger)
-- ============================================================
create table public.users (
  id   uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  created_at timestamptz default now() not null
);

alter table public.users enable row level security;

create policy "users_select_own" on public.users
  for select using (auth.uid() = id);

create policy "users_update_own" on public.users
  for update using (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- shopee_accounts
-- ============================================================
create table public.shopee_accounts (
  id               uuid default uuid_generate_v4() primary key,
  user_id          uuid references public.users(id) on delete cascade not null,
  shop_id          bigint not null,
  shop_name        text not null,
  access_token     text not null,
  refresh_token    text not null,
  token_expires_at timestamptz not null,
  created_at       timestamptz default now() not null,
  updated_at       timestamptz default now() not null,
  unique (user_id, shop_id)
);

alter table public.shopee_accounts enable row level security;

create policy "shopee_accounts_own" on public.shopee_accounts
  for all using (auth.uid() = user_id);

-- ============================================================
-- products
-- ============================================================
create table public.products (
  id                uuid default uuid_generate_v4() primary key,
  user_id           uuid references public.users(id) on delete cascade not null,
  shopee_account_id uuid references public.shopee_accounts(id) on delete set null,
  shopee_item_id    bigint,
  title             text not null,
  description       text,
  price             numeric(12, 2) not null default 0,
  stock             integer not null default 0,
  category_id       integer,
  image_url         text,
  shopee_image_id   text,
  status            text not null default 'draft'
                    check (status in ('draft', 'uploading', 'live', 'failed')),
  created_at        timestamptz default now() not null,
  updated_at        timestamptz default now() not null
);

alter table public.products enable row level security;

create policy "products_own" on public.products
  for all using (auth.uid() = user_id);

-- ============================================================
-- ai_generated_listings
-- ============================================================
create table public.ai_generated_listings (
  id              uuid default uuid_generate_v4() primary key,
  user_id         uuid references public.users(id) on delete cascade not null,
  product_id      uuid references public.products(id) on delete set null,
  image_url       text not null,
  title           text not null,
  description     text not null,
  keywords        text[]  default '{}',
  category        text,
  suggested_price numeric(12, 2),
  stock_quantity  integer default 100,
  highlights      text[]  default '{}',
  raw_response    jsonb,
  created_at      timestamptz default now() not null
);

alter table public.ai_generated_listings enable row level security;

create policy "ai_listings_own" on public.ai_generated_listings
  for all using (auth.uid() = user_id);

-- ============================================================
-- upload_logs
-- ============================================================
create table public.upload_logs (
  id               uuid default uuid_generate_v4() primary key,
  user_id          uuid references public.users(id) on delete cascade not null,
  product_id       uuid references public.products(id) on delete set null,
  action           text not null,
  status           text not null check (status in ('success', 'failed')),
  request_payload  jsonb,
  response_payload jsonb,
  error_message    text,
  created_at       timestamptz default now() not null
);

alter table public.upload_logs enable row level security;

create policy "upload_logs_select_own" on public.upload_logs
  for select using (auth.uid() = user_id);

-- ============================================================
-- Storage bucket for product images
-- ============================================================
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

create policy "storage_insert_own" on storage.objects
  for insert with check (
    bucket_id = 'product-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "storage_select_public" on storage.objects
  for select using (bucket_id = 'product-images');
