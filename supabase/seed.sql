begin;

insert into public.workspaces (id, slug, name)
values ('00000000-0000-0000-0000-000000000001', 'globopersona', 'Globopersona')
on conflict (id) do nothing;

insert into public.profiles (id, workspace_id, role, full_name, email)
values
  ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000001', 'owner', 'Ava Director', 'ava@globopersona.com')
on conflict (id) do update set workspace_id = excluded.workspace_id, role = excluded.role, full_name = excluded.full_name, email = excluded.email;

insert into public.workspace_settings (workspace_id, company_name, reply_to_email, default_sender_name, sending_domain, timezone, logo_url, preferences)
values (
  '00000000-0000-0000-0000-000000000001',
  'Globopersona',
  'hello@globopersona.com',
  'Globopersona Team',
  'mail.globopersona.com',
  'UTC',
  null,
  '{"weeklyReport": true, "brandTone": "confident"}'::jsonb
)
on conflict (workspace_id) do update
set company_name = excluded.company_name,
    reply_to_email = excluded.reply_to_email,
    default_sender_name = excluded.default_sender_name,
    sending_domain = excluded.sending_domain,
    timezone = excluded.timezone,
    logo_url = excluded.logo_url,
    preferences = excluded.preferences;

insert into public.audience_segments (workspace_id, name, description, rules)
select
  '00000000-0000-0000-0000-000000000001'::uuid,
  format('Audience Segment %s', index),
  format('Seeded segment %s for demo outreach', index),
  jsonb_build_object('score', jsonb_build_object('gte', 60 + index))
from generate_series(1, 10) as index;

insert into public.campaigns (workspace_id, name, subject, preview_text, content, status, scheduled_at, sent_at, created_by, updated_by)
select
  '00000000-0000-0000-0000-000000000001'::uuid,
  format('Campaign %s', index),
  format('Subject line for campaign %s', index),
  format('Preview text for campaign %s', index),
  jsonb_build_object('headline', format('Heading %s', index), 'cta', format('Read campaign %s', index))::jsonb,
  case
    when index % 4 = 0 then 'draft'
    when index % 4 = 1 then 'scheduled'
    when index % 4 = 2 then 'live'
    else 'archived'
  end,
  case when index % 4 = 1 then now() + interval '1 day' * index else null end,
  case when index % 4 = 2 then now() - interval '1 day' * index else null end,
  '11111111-1111-1111-1111-111111111111'::uuid,
  '11111111-1111-1111-1111-111111111111'::uuid
from generate_series(1, 10) as index;

insert into public.contacts (workspace_id, email, first_name, last_name, status, segment_id, metadata)
select
  '00000000-0000-0000-0000-000000000001'::uuid,
  format('contact%s@example.com', index),
  format('Contact%s', index),
  'Demo',
  case
    when index % 3 = 0 then 'active'
    when index % 3 = 1 then 'engaged'
    else 'nurture'
  end,
  (select id from public.audience_segments where workspace_id = '00000000-0000-0000-0000-000000000001'::uuid order by created_at limit 1 offset ((index - 1) % 10)),
  jsonb_build_object('company', format('Company %s', index), 'role', format('Role %s', index))
from generate_series(1, 10) as index;

insert into public.notifications (workspace_id, user_id, title, body, is_read)
select
  '00000000-0000-0000-0000-000000000001'::uuid,
  '11111111-1111-1111-1111-111111111111'::uuid,
  format('Notification %s', index),
  format('Seeded notification %s for the workspace dashboard', index),
  index % 2 = 0
from generate_series(1, 10) as index;

insert into public.activity_events (workspace_id, actor_user_id, entity_type, entity_id, type, title, details, created_at)
select
  '00000000-0000-0000-0000-000000000001'::uuid,
  '11111111-1111-1111-1111-111111111111'::uuid,
  case index % 4
    when 0 then 'settings'
    when 1 then 'campaign'
    when 2 then 'contact'
    else 'segment'
  end,
  null,
  case index % 4
    when 0 then 'settings.updated'
    when 1 then 'campaign.created'
    when 2 then 'contact.created'
    else 'segment.created'
  end,
  format('Seeded activity %s', index),
  jsonb_build_object('index', index),
  now() - interval '1 day' * index
from generate_series(1, 10) as index;

insert into public.dashboard_metric_snapshots (workspace_id, metric_key, metric_value, period_start, period_end, computed_at)
select
  '00000000-0000-0000-0000-000000000001'::uuid,
  case index % 5
    when 0 then 'engagement_rate'
    when 1 then 'deliverability'
    when 2 then 'audience_freshness'
    when 3 then 'tracking_score'
    else 'contact_growth'
  end,
  60 + index,
  now() - interval '30 days',
  now(),
  now() - interval '1 hour' * index
from generate_series(1, 10) as index;

commit;
