-- Create profiles table for user information
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text not null,
  created_at timestamp with time zone default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_all"
  on public.profiles for select
  using (true);

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

-- Create transactions table for tracking expenses
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  payer_id uuid not null references public.profiles(id) on delete cascade,
  description text not null,
  total_amount numeric(10, 2) not null,
  created_at timestamp with time zone default now()
);

alter table public.transactions enable row level security;

create policy "transactions_select_all"
  on public.transactions for select
  using (true);

create policy "transactions_insert_authenticated"
  on public.transactions for insert
  with check (auth.uid() = payer_id);

create policy "transactions_update_own"
  on public.transactions for update
  using (auth.uid() = payer_id);

create policy "transactions_delete_own"
  on public.transactions for delete
  using (auth.uid() = payer_id);

-- Create transaction_splits table for tracking who owes what
create table if not exists public.transaction_splits (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references public.transactions(id) on delete cascade,
  debtor_id uuid not null references public.profiles(id) on delete cascade,
  amount numeric(10, 2) not null,
  is_settled boolean default false,
  settled_at timestamp with time zone,
  created_at timestamp with time zone default now()
);

alter table public.transaction_splits enable row level security;

create policy "splits_select_all"
  on public.transaction_splits for select
  using (true);

create policy "splits_insert_authenticated"
  on public.transaction_splits for insert
  with check (
    exists (
      select 1 from public.transactions
      where id = transaction_id and payer_id = auth.uid()
    )
  );

create policy "splits_update_involved"
  on public.transaction_splits for update
  using (
    auth.uid() = debtor_id or
    exists (
      select 1 from public.transactions
      where id = transaction_id and payer_id = auth.uid()
    )
  );

create policy "splits_delete_payer"
  on public.transaction_splits for delete
  using (
    exists (
      select 1 from public.transactions
      where id = transaction_id and payer_id = auth.uid()
    )
  );

-- Create function to automatically create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
