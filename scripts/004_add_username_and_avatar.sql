-- Add username and avatar_url columns to profiles table
alter table public.profiles
  add column if not exists username text unique,
  add column if not exists avatar_url text;

-- Create index on username for faster lookups
create index if not exists profiles_username_idx on public.profiles(username);

-- Update the handle_new_user function to include username generation
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name, username)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;

  return new;
end;
$$;
