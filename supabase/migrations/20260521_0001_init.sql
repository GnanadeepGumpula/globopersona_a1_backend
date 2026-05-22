begin;

create extension if not exists "pgcrypto";
create extension if not exists "pg_trgm";

create type public.workspace_role as enum ('owner', 'admin', 'member', 'viewer');
create type public.campaign_status as enum ('draft', 'scheduled', 'live', 'archived');
create type public.contact_status as enum ('engaged', 'nurture', 'active');
create type public.activity_entity_type as enum ('campaign', 'contact', 'segment', 'settings', 'notification');
create type public.activity_type as enum (
  'campaign.created',
  'campaign.updated',
  'campaign.deleted',
  'campaign.scheduled',
  'campaign.sent',
  'contact.created',
  'contact.updated',
  'contact.deleted',
  'segment.created',
  'settings.updated',
  'notification.read'
);

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  role public.workspace_role not null default 'member',
  full_name text,
  email text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workspace_settings (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null unique references public.workspaces (id) on delete cascade,
  company_name text not null,
  reply_to_email text not null,
  default_sender_name text not null,
  sending_domain text,
  timezone text not null default 'UTC',
  logo_url text,
  preferences jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.audience_segments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  name text not null,
  description text,
  rules jsonb not null default '{}'::jsonb,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  name text not null,
  subject text not null,
  preview_text text,
  content jsonb not null default '{}'::jsonb,
  status public.campaign_status not null default 'draft',
  scheduled_at timestamptz,
  sent_at timestamptz,
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  email text not null,
  first_name text,
  last_name text,
  status public.contact_status not null default 'nurture',
  segment_id uuid references public.audience_segments (id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint contacts_workspace_email_unique unique (workspace_id, email)
);

create table if not exists public.activity_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  actor_user_id uuid references public.profiles (id) on delete set null,
  entity_type public.activity_entity_type not null,
  entity_id uuid,
  type public.activity_type not null,
  title text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  body text,
  is_read boolean not null default false,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.dashboard_metric_snapshots (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  metric_key text not null,
  metric_value numeric not null,
  period_start timestamptz,
  period_end timestamptz,
  computed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create or replace view public.dashboard_metrics as
select distinct on (workspace_id, metric_key)
  id,
  workspace_id,
  metric_key,
  metric_value,
  period_start,
  period_end,
  computed_at
from public.dashboard_metric_snapshots
order by workspace_id, metric_key, computed_at desc;

create index if not exists workspaces_slug_idx on public.workspaces using btree (slug);
create index if not exists profiles_workspace_idx on public.profiles using btree (workspace_id);
create index if not exists settings_workspace_idx on public.workspace_settings using btree (workspace_id);
create index if not exists segments_workspace_idx on public.audience_segments using btree (workspace_id);
create index if not exists segments_deleted_idx on public.audience_segments using btree (deleted_at);
create index if not exists campaigns_workspace_status_idx on public.campaigns using btree (workspace_id, status);
create index if not exists campaigns_deleted_idx on public.campaigns using btree (deleted_at);
create index if not exists campaigns_name_trgm_idx on public.campaigns using gin (name gin_trgm_ops);
create index if not exists campaigns_subject_trgm_idx on public.campaigns using gin (subject gin_trgm_ops);
create index if not exists campaigns_created_at_idx on public.campaigns using btree (created_at desc);
create index if not exists contacts_workspace_status_idx on public.contacts using btree (workspace_id, status);
create index if not exists contacts_deleted_idx on public.contacts using btree (deleted_at);
create index if not exists contacts_email_trgm_idx on public.contacts using gin (email gin_trgm_ops);
create index if not exists contacts_name_trgm_idx on public.contacts using gin ((coalesce(first_name, '') || ' ' || coalesce(last_name, '')) gin_trgm_ops);
create index if not exists contacts_segment_idx on public.contacts using btree (segment_id);
create index if not exists activity_workspace_created_idx on public.activity_events using btree (workspace_id, created_at desc);
create index if not exists notifications_workspace_user_idx on public.notifications using btree (workspace_id, user_id, is_read, created_at desc);
create index if not exists notifications_unread_idx on public.notifications using btree (user_id, is_read);
create index if not exists dashboard_metric_workspace_key_idx on public.dashboard_metric_snapshots using btree (workspace_id, metric_key, computed_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.is_workspace_member(target_workspace_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.workspace_id = target_workspace_id
  );
$$;

create or replace function public.has_workspace_role(target_workspace_id uuid, allowed_roles public.workspace_role[])
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.workspace_id = target_workspace_id
      and p.role = any (allowed_roles)
  );
$$;

create trigger workspaces_set_updated_at
before update on public.workspaces
for each row execute function public.set_updated_at();

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger settings_set_updated_at
before update on public.workspace_settings
for each row execute function public.set_updated_at();

create trigger segments_set_updated_at
before update on public.audience_segments
for each row execute function public.set_updated_at();

create trigger campaigns_set_updated_at
before update on public.campaigns
for each row execute function public.set_updated_at();

create trigger contacts_set_updated_at
before update on public.contacts
for each row execute function public.set_updated_at();

create trigger notifications_set_updated_at
before update on public.notifications
for each row execute function public.set_updated_at();

alter table public.workspaces enable row level security;
alter table public.profiles enable row level security;
alter table public.workspace_settings enable row level security;
alter table public.audience_segments enable row level security;
alter table public.campaigns enable row level security;
alter table public.contacts enable row level security;
alter table public.activity_events enable row level security;
alter table public.notifications enable row level security;
alter table public.dashboard_metric_snapshots enable row level security;

create policy "workspace members can read workspaces"
on public.workspaces
for select
using (public.is_workspace_member(id));

create policy "users can read their profile"
on public.profiles
for select
using (id = auth.uid());

create policy "users can update their profile"
on public.profiles
for update
using (id = auth.uid())
with check (id = auth.uid());

create policy "workspace members can read settings"
on public.workspace_settings
for select
using (public.is_workspace_member(workspace_id));

create policy "workspace managers can manage settings"
on public.workspace_settings
for insert
with check (public.has_workspace_role(workspace_id, array['owner', 'admin']::public.workspace_role[]));

create policy "workspace managers can update settings"
on public.workspace_settings
for update
using (public.has_workspace_role(workspace_id, array['owner', 'admin']::public.workspace_role[]))
with check (public.has_workspace_role(workspace_id, array['owner', 'admin']::public.workspace_role[]));

create policy "workspace members can read segments"
on public.audience_segments
for select
using (public.is_workspace_member(workspace_id));

create policy "workspace managers can manage segments"
on public.audience_segments
for all
using (public.has_workspace_role(workspace_id, array['owner', 'admin']::public.workspace_role[]))
with check (public.has_workspace_role(workspace_id, array['owner', 'admin']::public.workspace_role[]));

create policy "workspace members can read campaigns"
on public.campaigns
for select
using (public.is_workspace_member(workspace_id));

create policy "workspace managers can manage campaigns"
on public.campaigns
for all
using (public.has_workspace_role(workspace_id, array['owner', 'admin']::public.workspace_role[]))
with check (public.has_workspace_role(workspace_id, array['owner', 'admin']::public.workspace_role[]));

create policy "workspace members can read contacts"
on public.contacts
for select
using (public.is_workspace_member(workspace_id));

create policy "workspace managers can manage contacts"
on public.contacts
for all
using (public.has_workspace_role(workspace_id, array['owner', 'admin']::public.workspace_role[]))
with check (public.has_workspace_role(workspace_id, array['owner', 'admin']::public.workspace_role[]));

create policy "workspace members can read activities"
on public.activity_events
for select
using (public.is_workspace_member(workspace_id));

create policy "workspace members can append activities"
on public.activity_events
for insert
with check (public.is_workspace_member(workspace_id));

create policy "users can read own notifications"
on public.notifications
for select
using (user_id = auth.uid());

create policy "users can update own notifications"
on public.notifications
for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "workspace managers can read dashboard snapshots"
on public.dashboard_metric_snapshots
for select
using (public.is_workspace_member(workspace_id));

create policy "workspace managers can write dashboard snapshots"
on public.dashboard_metric_snapshots
for all
using (public.has_workspace_role(workspace_id, array['owner', 'admin']::public.workspace_role[]))
with check (public.has_workspace_role(workspace_id, array['owner', 'admin']::public.workspace_role[]));

create or replace function public.dashboard_summary(target_workspace_id uuid)
returns table (
  total_campaigns bigint,
  draft_campaigns bigint,
  scheduled_campaigns bigint,
  live_campaigns bigint,
  archived_campaigns bigint,
  total_contacts bigint,
  engaged_contacts bigint,
  nurture_contacts bigint,
  active_contacts bigint,
  total_segments bigint,
  unread_notifications bigint,
  activity_count bigint,
  sent_campaigns bigint
)
language sql
stable
as $$
  select
    count(*) filter (where c.deleted_at is null) as total_campaigns,
    count(*) filter (where c.deleted_at is null and c.status = 'draft') as draft_campaigns,
    count(*) filter (where c.deleted_at is null and c.status = 'scheduled') as scheduled_campaigns,
    count(*) filter (where c.deleted_at is null and c.status = 'live') as live_campaigns,
    count(*) filter (where c.deleted_at is null and c.status = 'archived') as archived_campaigns,
    count(*) filter (where ct.deleted_at is null) as total_contacts,
    count(*) filter (where ct.deleted_at is null and ct.status = 'engaged') as engaged_contacts,
    count(*) filter (where ct.deleted_at is null and ct.status = 'nurture') as nurture_contacts,
    count(*) filter (where ct.deleted_at is null and ct.status = 'active') as active_contacts,
    (select count(*) from public.audience_segments s where s.workspace_id = target_workspace_id and s.deleted_at is null) as total_segments,
    (select count(*) from public.notifications n where n.workspace_id = target_workspace_id and n.is_read = false) as unread_notifications,
    (select count(*) from public.activity_events a where a.workspace_id = target_workspace_id) as activity_count,
    count(*) filter (where c.deleted_at is null and c.sent_at is not null) as sent_campaigns
  from public.campaigns c
  left join public.contacts ct on ct.workspace_id = c.workspace_id and ct.deleted_at is null
  where c.workspace_id = target_workspace_id;
$$;

commit;
