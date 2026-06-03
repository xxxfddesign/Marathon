-- Выполни этот SQL в Supabase → SQL Editor

create table if not exists participants (
  id            bigserial primary key,
  user_id       text,
  first_name    text not null,
  last_name     text not null,
  email         text,
  phone         text,
  birth_date    date,
  country       text,
  gender        text default 'm',
  role          text default 'Runner',
  bmi           numeric(5,2),
  bmi_category  text,
  created_at    timestamptz default now()
);

-- Отключи RLS (Row Level Security) для простоты, или настрой политики
alter table participants disable row level security;
