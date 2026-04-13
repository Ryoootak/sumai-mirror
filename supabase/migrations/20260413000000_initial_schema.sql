-- ============================================================
-- SUMAI MIRROR — Initial Schema
-- ============================================================

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ============================================================
-- ENUMS
-- ============================================================

create type project_status as enum ('active', 'completed', 'paused');
create type project_role as enum ('owner', 'partner');
create type partner_reaction as enum ('great', 'good', 'neutral', 'bad', 'unknown');
create type analysis_type as enum ('priority', 'alignment', 'timeline');
create type analysis_feedback as enum ('up', 'down');

-- ============================================================
-- TABLES
-- ============================================================

-- users_profile: extends Supabase Auth users
create table public.users_profile (
  id          uuid primary key references auth.users (id) on delete cascade,
  name        text,
  preferences jsonb default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

-- projects: home search projects
create table public.projects (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  status     project_status not null default 'active',
  created_at timestamptz not null default now()
);

-- project_members: users ↔ projects (owner or partner)
create table public.project_members (
  project_id uuid not null references public.projects (id) on delete cascade,
  user_id    uuid not null references auth.users (id) on delete cascade,
  role       project_role not null default 'owner',
  primary key (project_id, user_id)
);

-- property_logs: reaction logs for properties
create table public.property_logs (
  id               uuid primary key default gen_random_uuid(),
  project_id       uuid not null references public.projects (id) on delete cascade,
  user_id          uuid not null references auth.users (id) on delete cascade,
  url              text,
  title            text,
  price            text,
  score            integer not null check (score between 1 and 5),
  tags_good        text[] not null default '{}',
  tags_bad         text[] not null default '{}',
  memo             text,
  partner_reaction partner_reaction not null default 'unknown',
  created_at       timestamptz not null default now()
);

-- analyses: AI analysis results
create table public.analyses (
  id         uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  user_id    uuid not null references auth.users (id) on delete cascade,
  type       analysis_type not null,
  result     jsonb not null default '{}'::jsonb,
  feedback   analysis_feedback,
  created_at timestamptz not null default now()
);

-- ============================================================
-- INDEXES
-- ============================================================

create index on public.project_members (user_id);
create index on public.property_logs (project_id, created_at desc);
create index on public.property_logs (user_id);
create index on public.analyses (project_id, created_at desc);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.users_profile  enable row level security;
alter table public.projects        enable row level security;
alter table public.project_members enable row level security;
alter table public.property_logs   enable row level security;
alter table public.analyses        enable row level security;

-- Helper: is the current user a member of the given project?
create or replace function public.is_project_member(p_project_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1
    from public.project_members
    where project_id = p_project_id
      and user_id    = auth.uid()
  )
$$;

-- users_profile: own row only
create policy "users_profile: select own"
  on public.users_profile for select
  using (id = auth.uid());

create policy "users_profile: insert own"
  on public.users_profile for insert
  with check (id = auth.uid());

create policy "users_profile: update own"
  on public.users_profile for update
  using (id = auth.uid());

-- projects: members can read; owners can insert/update
create policy "projects: select for members"
  on public.projects for select
  using (public.is_project_member(id));

create policy "projects: insert"
  on public.projects for insert
  with check (true); -- actual member row created immediately after

create policy "projects: update for members"
  on public.projects for update
  using (public.is_project_member(id));

-- project_members: members can see their project's membership
create policy "project_members: select for members"
  on public.project_members for select
  using (public.is_project_member(project_id));

create policy "project_members: insert own"
  on public.project_members for insert
  with check (user_id = auth.uid());

create policy "project_members: delete own"
  on public.project_members for delete
  using (user_id = auth.uid());

-- property_logs: project members only
create policy "property_logs: select for members"
  on public.property_logs for select
  using (public.is_project_member(project_id));

create policy "property_logs: insert for members"
  on public.property_logs for insert
  with check (
    public.is_project_member(project_id)
    and user_id = auth.uid()
  );

create policy "property_logs: update own"
  on public.property_logs for update
  using (user_id = auth.uid() and public.is_project_member(project_id));

create policy "property_logs: delete own"
  on public.property_logs for delete
  using (user_id = auth.uid() and public.is_project_member(project_id));

-- analyses: project members only
create policy "analyses: select for members"
  on public.analyses for select
  using (public.is_project_member(project_id));

create policy "analyses: insert for members"
  on public.analyses for insert
  with check (
    public.is_project_member(project_id)
    and user_id = auth.uid()
  );

create policy "analyses: update own"
  on public.analyses for update
  using (user_id = auth.uid() and public.is_project_member(project_id));

-- ============================================================
-- AUTO-CREATE users_profile ON SIGN UP
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.users_profile (id, name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
