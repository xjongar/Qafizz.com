-- ===========================================================================
-- TRUST ME BRO — Supabase schema
-- Run this once in the Supabase dashboard: SQL Editor -> New query -> Run.
--
-- Design note: the ~1,132 seeded topics are NOT stored here. Their vote counts
-- are generated deterministically in the browser from the list id, so they cost
-- nothing to keep client-side. This database holds only what has to be shared:
-- accounts, real votes, lists people create, and comments. What a visitor sees
-- is the seeded base plus the real votes stacked on top.
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- PROFILES — public identity attached to an auth user
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users on delete cascade,
  username    text unique not null check (char_length(username) between 3 and 24),
  created_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles are readable by everyone" on public.profiles;
create policy "profiles are readable by everyone"
  on public.profiles for select using (true);

drop policy if exists "users insert their own profile" on public.profiles;
create policy "users insert their own profile"
  on public.profiles for insert with check (auth.uid() = id);

drop policy if exists "users update their own profile" on public.profiles;
create policy "users update their own profile"
  on public.profiles for update using (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- LISTS — tier lists created by real users
-- Seeded topics never appear here; they live in the client bundle.
-- `items` is a plain text array: order carries no ranking meaning, because
-- tiers are earned from vote share.
-- ---------------------------------------------------------------------------
create table if not exists public.lists (
  id          uuid primary key default gen_random_uuid(),
  title       text not null check (char_length(title) between 1 and 90),
  category    text not null default 'Random' check (char_length(category) <= 24),
  items       text[] not null check (array_length(items, 1) between 1 and 100),
  author_id   uuid not null references public.profiles(id) on delete cascade,
  created_at  timestamptz not null default now()
);

create index if not exists lists_created_at_idx on public.lists (created_at desc);
create index if not exists lists_category_idx   on public.lists (category);

alter table public.lists enable row level security;

drop policy if exists "lists are readable by everyone" on public.lists;
create policy "lists are readable by everyone"
  on public.lists for select using (true);

drop policy if exists "signed-in users create lists as themselves" on public.lists;
create policy "signed-in users create lists as themselves"
  on public.lists for insert with check (auth.uid() = author_id);

drop policy if exists "authors delete their own lists" on public.lists;
create policy "authors delete their own lists"
  on public.lists for delete using (auth.uid() = author_id);

-- ---------------------------------------------------------------------------
-- VOTES — one row per (user, target). The primary key is what enforces
-- one-person-one-vote; changing your mind is an upsert, un-voting is a delete.
--
-- target_key is a string rather than a foreign key because votes point at three
-- different things, including seeded lists that have no database row:
--   list:<list_id>            a whole tier list
--   item:<list_id>:<item>     one item within a list
--   comment:<comment_id>      a comment
-- ---------------------------------------------------------------------------
create table if not exists public.votes (
  user_id     uuid not null references public.profiles(id) on delete cascade,
  target_key  text not null check (char_length(target_key) <= 300),
  direction   smallint not null check (direction in (-1, 1)),
  created_at  timestamptz not null default now(),
  primary key (user_id, target_key)
);

create index if not exists votes_target_idx on public.votes (target_key);

alter table public.votes enable row level security;

drop policy if exists "votes are readable by everyone" on public.votes;
create policy "votes are readable by everyone"
  on public.votes for select using (true);

drop policy if exists "users cast their own votes" on public.votes;
create policy "users cast their own votes"
  on public.votes for insert with check (auth.uid() = user_id);

drop policy if exists "users change their own votes" on public.votes;
create policy "users change their own votes"
  on public.votes for update using (auth.uid() = user_id);

drop policy if exists "users remove their own votes" on public.votes;
create policy "users remove their own votes"
  on public.votes for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- COMMENTS — threaded, one level of nesting per parent_id
-- ---------------------------------------------------------------------------
create table if not exists public.comments (
  id          uuid primary key default gen_random_uuid(),
  list_id     text not null,                      -- seeded ids are text, so this is too
  parent_id   uuid references public.comments(id) on delete cascade,
  author_id   uuid not null references public.profiles(id) on delete cascade,
  body        text not null check (char_length(body) between 1 and 4000),
  created_at  timestamptz not null default now()
);

create index if not exists comments_list_idx on public.comments (list_id, created_at);

alter table public.comments enable row level security;

drop policy if exists "comments are readable by everyone" on public.comments;
create policy "comments are readable by everyone"
  on public.comments for select using (true);

drop policy if exists "signed-in users post as themselves" on public.comments;
create policy "signed-in users post as themselves"
  on public.comments for insert with check (auth.uid() = author_id);

drop policy if exists "authors delete their own comments" on public.comments;
create policy "authors delete their own comments"
  on public.comments for delete using (auth.uid() = author_id);

-- ---------------------------------------------------------------------------
-- VOTE TALLIES — aggregate so the client fetches one row per target instead of
-- every individual vote. Security invoker keeps the caller's RLS in force.
-- ---------------------------------------------------------------------------
create or replace view public.vote_tallies
with (security_invoker = true) as
  select
    target_key,
    sum(direction)::int                        as score,
    count(*) filter (where direction = 1)::int as upvotes,
    count(*) filter (where direction = -1)::int as downvotes
  from public.votes
  group by target_key;

-- ---------------------------------------------------------------------------
-- Fetch tallies for a batch of targets in one round trip.
-- ---------------------------------------------------------------------------
create or replace function public.tallies_for(keys text[])
returns table (target_key text, score int, upvotes int, downvotes int)
language sql stable security invoker as $$
  select target_key, score, upvotes, downvotes
  from public.vote_tallies
  where target_key = any(keys);
$$;

-- ---------------------------------------------------------------------------
-- Create the profile row automatically when someone signs up. The username
-- comes from sign-up metadata, falling back to a slug of the email.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'username', ''),
      split_part(new.email, '@', 1) || '_' || substr(new.id::text, 1, 4)
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
