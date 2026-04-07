create table if not exists users (
  id text primary key,
  email text not null unique,
  default_habits_seeded boolean not null default false,
  created_at timestamptz not null default now()
);

create unique index if not exists habits_user_id_lower_name_key
on habits (user_id, lower(name));
