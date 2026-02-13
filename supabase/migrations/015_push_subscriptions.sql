-- Push notification subscriptions for PWA
create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null,
  keys jsonb not null,
  subscribed_at timestamptz not null default now(),
  unique(user_id)
);

-- RLS
alter table push_subscriptions enable row level security;

-- Users can manage their own subscriptions
create policy "Users can insert own push subscription"
  on push_subscriptions for insert
  with check (auth.uid() = user_id);

create policy "Users can update own push subscription"
  on push_subscriptions for update
  using (auth.uid() = user_id);

create policy "Users can delete own push subscription"
  on push_subscriptions for delete
  using (auth.uid() = user_id);

-- Service role can read all (for sending push from server)
create policy "Service role can read all push subscriptions"
  on push_subscriptions for select
  using (true);
