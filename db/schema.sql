create extension if not exists pgcrypto;

create table if not exists candidates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text unique not null,
  role text not null,
  status text not null default 'scheduled'
    check (status in ('scheduled', 'in_progress', 'hired', 'rejected')),
  created_at timestamptz not null default now()
);

create table if not exists interviews (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references candidates(id) on delete cascade,
  interviewer text not null,
  scheduled_at timestamptz not null,
  status text not null default 'scheduled'
    check (status in ('scheduled', 'completed', 'cancelled')),
  created_at timestamptz not null default now()
);

create table if not exists feedback (
  id uuid primary key default gen_random_uuid(),
  interview_id uuid not null references interviews(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  strengths text,
  concerns text,
  recommendation text not null
    check (recommendation in ('hire', 'no_hire', 'maybe')),
  created_at timestamptz not null default now()
);

create index if not exists interviews_candidate_id_idx
  on interviews(candidate_id);

create index if not exists feedback_interview_id_idx
  on feedback(interview_id);
