create table if not exists public.user_progress (
  user_id uuid references auth.users(id) on delete cascade primary key,
  verbs jsonb not null default '{}'::jsonb,
  vocabulary jsonb not null default '{}'::jsonb,
  prepositions jsonb not null default '{}'::jsonb,
  articles jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.user_progress enable row level security;

drop policy if exists "Users can read their own progress" on public.user_progress;
create policy "Users can read their own progress"
on public.user_progress for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert their own progress" on public.user_progress;
create policy "Users can insert their own progress"
on public.user_progress for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update their own progress" on public.user_progress;
create policy "Users can update their own progress"
on public.user_progress for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- ============================================================
-- Subscriptions (manually managed by the admin)
-- ============================================================

create table if not exists public.user_subscriptions (
  user_id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  status text not null default 'free' check (status in ('free', 'trial', 'active', 'expired', 'cancelled')),
  renews_at date,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_subscriptions enable row level security;

drop policy if exists "Users can read their own subscription" on public.user_subscriptions;
create policy "Users can read their own subscription"
on public.user_subscriptions for select
using (auth.uid() = user_id);

drop policy if exists "Admin can read all subscriptions" on public.user_subscriptions;
create policy "Admin can read all subscriptions"
on public.user_subscriptions for select
using (lower(auth.jwt() ->> 'email') = 'linconbond007@gmail.com');

drop policy if exists "Admin can update all subscriptions" on public.user_subscriptions;
create policy "Admin can update all subscriptions"
on public.user_subscriptions for update
using (lower(auth.jwt() ->> 'email') = 'linconbond007@gmail.com')
with check (lower(auth.jwt() ->> 'email') = 'linconbond007@gmail.com');

drop policy if exists "Admin can insert subscriptions" on public.user_subscriptions;
create policy "Admin can insert subscriptions"
on public.user_subscriptions for insert
with check (lower(auth.jwt() ->> 'email') = 'linconbond007@gmail.com');

-- Auto-create a default row for every new signup so the admin only
-- ever has to edit status, never manually add rows.
create or replace function public.handle_new_user_subscription()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_subscriptions (user_id, email)
  values (new.id, new.email)
  on conflict (user_id) do nothing;
  return new;
exception when others then
  -- Never let this feature block a signup; just log and continue.
  raise warning 'handle_new_user_subscription failed for %: %', new.id, sqlerrm;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_subscription on auth.users;
create trigger on_auth_user_created_subscription
after insert on auth.users
for each row execute function public.handle_new_user_subscription();

-- Backfill rows for users who signed up before this table existed.
-- Safe to re-run any time.
insert into public.user_subscriptions (user_id, email)
select id, email from auth.users
on conflict (user_id) do nothing;
