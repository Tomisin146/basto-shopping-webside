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

## 2. Create the admin account

In Supabase, open **Authentication → Users** and create a user with the same email address used in the SQL policies. Use the password for this account on the Basto admin sign-in page. Do not enable public sign-ups.

## 3. Connect the website

In **Project Settings → API**, copy the Project URL and the publishable (anon) key into `supabase-config.js`. The publishable/anon key is intended for browser use; never put a `service_role` key in this website.

Deploy the updated website over HTTPS, or open it through Live Server. All devices must use the same deployed website and the same Supabase project configuration.

## 4. Import products saved on the phone

Once the Supabase setup is complete and the updated site is available on the phone, sign in to Admin there once. If the cloud inventory is empty, the admin page imports the products saved in that phone browser. After that, all product changes are stored in Supabase. If your products are only on another device, sign into Admin on that device first while the cloud inventory is empty.