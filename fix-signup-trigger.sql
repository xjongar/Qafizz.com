-- Qafizz — the only change needed: handle_new_user()
--
-- profiles.username is UNIQUE, but the old trigger only guarded
-- `on conflict (id)`. A username that was already taken raised 23505 inside
-- the trigger, which aborted the whole signup transaction: Supabase returned
-- a bare 500 and no account was created at all.
--
-- Safe to run repeatedly. Touches no tables, policies or data.

create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public as $$
declare
  base      text;
  candidate text;
  n         int := 0;
begin
  base := coalesce(
    nullif(new.raw_user_meta_data ->> 'username', ''),
    split_part(new.email, '@', 1)
  );
  candidate := base;

  while exists (select 1 from public.profiles where username = candidate) loop
    n := n + 1;
    candidate := base || '_' || n::text;
    if n > 50 then
      candidate := base || '_' || substr(new.id::text, 1, 6);
      exit;
    end if;
  end loop;

  insert into public.profiles (id, username)
  values (new.id, candidate)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
