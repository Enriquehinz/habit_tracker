create extension if not exists "pgcrypto";

create table if not exists habits (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  name text not null,
  created_at timestamptz not null default now(),
  constraint habits_user_name_key unique (user_id, name)
);

create table if not exists habit_entries (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  habit_id uuid not null references habits(id) on delete cascade,
  date date not null,
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint habit_entries_user_habit_date_key unique (user_id, habit_id, date)
);

create index if not exists habits_user_id_idx on habits (user_id);
create index if not exists habit_entries_user_id_date_idx on habit_entries (user_id, date desc);
create index if not exists habit_entries_habit_id_date_idx on habit_entries (habit_id, date desc);

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists habit_entries_set_updated_at on habit_entries;

create trigger habit_entries_set_updated_at
before update on habit_entries
for each row
execute function set_updated_at();
