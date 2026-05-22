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

insert into public.audience_segments (id, workspace_id, name, description, rules)
values
  ('22222222-2222-2222-2222-222222222221', '00000000-0000-0000-0000-000000000001', 'High Intent', 'Recent visitors and engaged leads', '{"score": {"gte": 80}}'::jsonb),
  ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000001', 'New Subscribers', 'First week nurture flow', '{"tags": ["new"]}'::jsonb),
  ('22222222-2222-2222-2222-222222222223', '00000000-0000-0000-0000-000000000001', 'VIP Customers', 'Top repeat customers', '{"lifetime_value": {"gte": 5000}}'::jsonb)
on conflict (id) do nothing;

insert into public.campaigns (id, workspace_id, name, subject, preview_text, content, status, scheduled_at, sent_at, created_by, updated_by)
values
  ('33333333-3333-3333-3333-333333333331', '00000000-0000-0000-0000-000000000001', 'Welcome Sequence', 'Welcome to Globopersona', 'Start the journey with a warm intro', '{"headline": "Welcome aboard", "cta": "Explore the dashboard"}'::jsonb, 'live', now() - interval '2 days', now() - interval '2 days', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111'),
  ('33333333-3333-3333-3333-333333333332', '00000000-0000-0000-0000-000000000001', 'Spring Launch', 'Your sneak peek is ready', 'Big launch messaging for the season', '{"headline": "Launch week", "cta": "Learn more"}'::jsonb, 'scheduled', now() + interval '3 days', null, '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111'),
  ('33333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000001', 'Reactivation Drive', 'We miss you at Globopersona', 'Bring dormant contacts back', '{"headline": "Come back for a look", "cta": "View update"}'::jsonb, 'draft', null, null, '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111'),
  ('33333333-3333-3333-3333-333333333334', '00000000-0000-0000-0000-000000000001', 'Referral Boost', 'Share Globopersona with a friend', 'Reward your best customers', '{"headline": "Invite and earn", "cta": "Get referral link"}'::jsonb, 'archived', null, now() - interval '12 days', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111')
on conflict (id) do nothing;

insert into public.contacts (id, workspace_id, email, first_name, last_name, status, segment_id, metadata)
values
  ('44444444-4444-4444-4444-444444444441', '00000000-0000-0000-0000-000000000001', 'maya@northstar.com', 'Maya', 'Chen', 'engaged', '22222222-2222-2222-2222-222222222221', '{"company": "Northstar", "role": "Growth Lead"}'::jsonb),
  ('44444444-4444-4444-4444-444444444442', '00000000-0000-0000-0000-000000000001', 'leo@brightlabs.com', 'Leo', 'Patel', 'nurture', '22222222-2222-2222-2222-222222222222', '{"company": "Bright Labs", "role": "Ops Manager"}'::jsonb),
  ('44444444-4444-4444-4444-444444444443', '00000000-0000-0000-0000-000000000001', 'sofia@studioforge.com', 'Sofia', 'Rivera', 'active', '22222222-2222-2222-2222-222222222223', '{"company": "Studio Forge", "role": "Founder"}'::jsonb),
  ('44444444-4444-4444-4444-444444444444', '00000000-0000-0000-0000-000000000001', 'noah@orbitpath.com', 'Noah', 'Kim', 'engaged', '22222222-2222-2222-2222-222222222221', '{"company": "Orbit Path", "role": "Marketing Lead"}'::jsonb)
on conflict (id) do nothing;

insert into public.notifications (id, workspace_id, user_id, title, body, is_read)
values
  ('55555555-5555-5555-5555-555555555551', '00000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Campaign ready for review', 'Spring Launch is scheduled for delivery.', false),
  ('55555555-5555-5555-5555-555555555552', '00000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Audience segment updated', 'VIP Customers now includes 14 new contacts.', true)
on conflict (id) do nothing;

insert into public.activity_events (id, workspace_id, actor_user_id, entity_type, entity_id, type, title, details, created_at)
values
  ('66666666-6666-6666-6666-666666666661', '00000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'campaign', '33333333-3333-3333-3333-333333333331', 'campaign.sent', 'Welcome Sequence sent', '{"campaignId": "33333333-3333-3333-3333-333333333331"}'::jsonb, now() - interval '2 days'),
  ('66666666-6666-6666-6666-666666666662', '00000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'contact', '44444444-4444-4444-4444-444444444441', 'contact.created', 'Contact added: maya@northstar.com', '{"contactId": "44444444-4444-4444-4444-444444444441"}'::jsonb, now() - interval '1 day'),
  ('66666666-6666-6666-6666-666666666663', '00000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'settings', '00000000-0000-0000-0000-000000000001', 'settings.updated', 'Workspace settings updated', '{"workspaceId": "00000000-0000-0000-0000-000000000001"}'::jsonb, now() - interval '3 hours')
on conflict (id) do nothing;

insert into public.dashboard_metric_snapshots (workspace_id, metric_key, metric_value, period_start, period_end, computed_at)
values
  ('00000000-0000-0000-0000-000000000001', 'total_campaigns', 4, now() - interval '30 days', now(), now()),
  ('00000000-0000-0000-0000-000000000001', 'total_contacts', 4, now() - interval '30 days', now(), now()),
  ('00000000-0000-0000-0000-000000000001', 'unread_notifications', 1, now() - interval '30 days', now(), now())
on conflict do nothing;

commit;
