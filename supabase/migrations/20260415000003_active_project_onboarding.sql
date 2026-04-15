alter table public.users_profile
  add column if not exists active_project_id uuid references public.projects (id) on delete set null;

create index if not exists users_profile_active_project_idx
  on public.users_profile (active_project_id);

update public.users_profile up
set active_project_id = chosen.project_id
from (
  select
    profile.id as user_id,
    coalesce(
      (
        select pm.project_id
        from public.project_members pm
        where pm.user_id = profile.id
          and pm.role = 'owner'
        order by pm.project_id
        limit 1
      ),
      (
        select pm.project_id
        from public.project_members pm
        where pm.user_id = profile.id
        order by pm.project_id
        limit 1
      )
    ) as project_id
  from public.users_profile profile
) as chosen
where up.id = chosen.user_id
  and up.active_project_id is null
  and chosen.project_id is not null;
