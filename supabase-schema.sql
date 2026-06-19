-- GradeScope Supabase Schema
-- Paste this into your Supabase SQL Editor and run it.

create table if not exists classes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  grade_level text not null default '',
  subject text not null default 'Science',
  created_at timestamptz default now()
);

create table if not exists students (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  class_id uuid references classes(id) on delete set null,
  student_code text not null default '',
  created_at timestamptz default now()
);

create table if not exists assignments (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subject text not null default 'Science',
  description text default '',
  rubric jsonb not null default '[]',
  max_marks integer not null default 0,
  class_id uuid references classes(id) on delete set null,
  source_url text not null default '',
  created_at timestamptz default now()
);

create table if not exists submissions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references students(id) on delete cascade,
  assignment_id uuid references assignments(id) on delete cascade,
  grade integer not null default 0,
  percentage integer not null default 0,
  rubric_scores jsonb not null default '[]',
  ai_feedback text default '',
  conceptual_notes text default '',
  strengths text default '',
  areas_for_improvement text default '',
  image_url text default '',
  marked_at timestamptz default now()
);

-- Allow public read/write (no auth for simplicity — lock down if sharing publicly)
alter table classes enable row level security;
alter table students enable row level security;
alter table assignments enable row level security;
alter table submissions enable row level security;

create policy "Allow all" on classes for all using (true) with check (true);
create policy "Allow all" on students for all using (true) with check (true);
create policy "Allow all" on assignments for all using (true) with check (true);
create policy "Allow all" on submissions for all using (true) with check (true);
