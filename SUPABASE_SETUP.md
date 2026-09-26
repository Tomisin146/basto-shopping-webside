# Shared inventory setup

The storefront reads products from Supabase. Admin changes are shared across browsers and devices after the site is configured with a Supabase project.

## 1. Create the products table

Create a Supabase project, open **SQL Editor**, and run this SQL. Replace `admin@example.com` with the email address you will use to sign in to the store admin.

```sql
create table public.products (
  id text primary key,
  name text not null,
  category text not null,
  description text not null default '',
  sizes text[] not null default '{}',
  colors text not null default '',
  price numeric not null default 0,
  stock integer not null default 0,
  sold integer not null default 0,
  image text not null default '',
  available boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.products enable row level security;

create policy "Anyone can view products"
on public.products for select
to anon, authenticated
using (true);

create policy "Store admin can add products"
on public.products for insert
to authenticated
with check ((select auth.jwt() ->> 'email') = 'admin@example.com');

create policy "Store admin can update products"
on public.products for update
to authenticated
using ((select auth.jwt() ->> 'email') = 'admin@example.com')
with check ((select auth.jwt() ->> 'email') = 'admin@example.com');

create policy "Store admin can delete products"
on public.products for delete
to authenticated
using ((select auth.jwt() ->> 'email') = 'admin@example.com');
```

If the admin page reports a row-level security error when marking an item sold out, update the existing update policy to use the exact email address used to sign in to Admin:

```sql
alter policy "Store admin can update products"
on public.products
using ((select auth.jwt() ->> 'email') = 'admin@example.com')
with check ((select auth.jwt() ->> 'email') = 'admin@example.com');
```

Replace both instances of `admin@example.com` with the Admin sign-in email before running this in the Supabase SQL Editor.

## 2. Create the admin account

In Supabase, open **Authentication → Users** and create a user with the same email address used in the SQL policies. Use the password for this account on the Basto admin sign-in page. Do not enable public sign-ups.

## 3. Connect the website

In **Project Settings → API**, copy the Project URL and the publishable (anon) key into `supabase-config.js`. The publishable/anon key is intended for browser use; never put a `service_role` key in this website.

Deploy the updated website over HTTPS, or open it through Live Server. All devices must use the same deployed website and the same Supabase project configuration.

## 4. Import products saved on the phone

Once the Supabase setup is complete and the updated site is available on the phone, sign in to Admin there once. If the cloud inventory is empty, the admin page imports the products saved in that phone browser. After that, all product changes are stored in Supabase. If your products are only on another device, sign into Admin on that device first while the cloud inventory is empty.

## 5. Enable order management

In the same Supabase project, open **SQL Editor → New query** and run this once. Replace `admin@example.com` with the exact email used to sign in to Basto Admin. Customers can submit orders but cannot read them; only the admin account can view or change order statuses.

```sql
create table if not exists public.orders (
  id text primary key,
  customer_name text not null,
  phone text not null,
  address text not null,
  items jsonb not null default '[]'::jsonb,
  total numeric not null check (total >= 0),
  status text not null default 'New' check (status in ('New', 'Confirmed', 'Paid', 'Shipped', 'Completed', 'Cancelled')),
  created_at timestamptz not null default now()
);

create index if not exists orders_created_at_idx on public.orders (created_at desc);
alter table public.orders enable row level security;
grant insert on public.orders to anon, authenticated;
grant select, update on public.orders to authenticated;

drop policy if exists "Customers can place orders" on public.orders;
create policy "Customers can place orders"
on public.orders for insert
to anon, authenticated
with check (status = 'New');

drop policy if exists "Store admin can view orders" on public.orders;
create policy "Store admin can view orders"
on public.orders for select
to authenticated
using ((select auth.jwt() ->> 'email') = 'admin@example.com');

drop policy if exists "Store admin can update orders" on public.orders;
create policy "Store admin can update orders"
on public.orders for update
to authenticated
using ((select auth.jwt() ->> 'email') = 'admin@example.com')
with check ((select auth.jwt() ->> 'email') = 'admin@example.com');
```

New orders appear in **Admin → Orders** after checkout is saved. Update the status there as you confirm, receive payment, ship, or complete each order. The customer is then directed to WhatsApp with the order reference and details.

## 6. Enable payment receipts

Run this in **SQL Editor → New query** in the same project. It adds payment details to existing orders, creates a private receipt bucket limited to 5 MB images/PDFs, and allows customers to upload files while keeping receipt viewing restricted to the Admin email.

```sql
alter table public.orders
  add column if not exists payment_method text not null default 'Bank transfer',
  add column if not exists receipt_path text not null default '';

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'payment-receipts',
  'payment-receipts',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
on conflict (id) do update set
  public = false,
  file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

grant insert on storage.objects to anon, authenticated;
grant select on storage.objects to authenticated;

drop policy if exists "Customers can upload payment receipts" on storage.objects;
create policy "Customers can upload payment receipts"
on storage.objects for insert
to anon, authenticated
with check (
  bucket_id = 'payment-receipts'
  and name ~ '^BST-[A-Z0-9-]+/[A-Za-z0-9-]+[.](jpg|png|webp|pdf)$'
);

drop policy if exists "Store admin can view payment receipts" on storage.objects;
create policy "Store admin can view payment receipts"
on storage.objects for select
to authenticated
using (
  bucket_id = 'payment-receipts'
  and (select auth.jwt() ->> 'email') = 'mrbabalola146@gmail.com'
);
```

After it succeeds, refresh the storefront and Admin. Customers choose Union Bank or OPay, make the transfer, and attach an image/PDF receipt at checkout. In Admin, open **View receipt** on the order to verify it, then update the order status to **Paid** after confirming the transfer.