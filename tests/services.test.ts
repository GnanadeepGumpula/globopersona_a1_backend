import { describe, expect, it } from 'vitest';

import { createCampaign, deleteCampaign, scheduleCampaign } from '@/lib/services/campaigns';
import { createContact } from '@/lib/services/contacts';
import { getDashboardSummary } from '@/lib/services/dashboard';
import { createSupabaseMock } from './helpers/supabaseMock';

describe('dashboard aggregation', () => {
  it('derives summary metrics from real query results', async () => {
    const supabase = createSupabaseMock({
      campaigns: [
        {
          data: [
            { status: 'draft', sent_at: null },
            { status: 'scheduled', sent_at: null },
            { status: 'live', sent_at: '2026-05-20T10:00:00.000Z' },
            { status: 'archived', sent_at: '2026-05-18T10:00:00.000Z' }
          ],
          count: 4,
          error: null
        },
        {
          data: [
            { status: 'draft', sent_at: null },
            { status: 'scheduled', sent_at: null },
            { status: 'live', sent_at: '2026-05-20T10:00:00.000Z' },
            { status: 'archived', sent_at: '2026-05-18T10:00:00.000Z' }
          ],
          count: 4,
          error: null
        }
      ],
      contacts: [
        {
          data: [
            { status: 'engaged' },
            { status: 'nurture' },
            { status: 'active' }
          ],
          count: 3,
          error: null
        },
        {
          data: [
            { status: 'engaged' },
            { status: 'nurture' },
            { status: 'active' }
          ],
          count: 3,
          error: null
        }
      ],
      audience_segments: [{ data: [], count: 2, error: null }],
      notifications: [{ data: [], count: 1, error: null }],
      activity_events: [{ data: [], count: 5, error: null }],
      workspace_settings: [{ data: [{ id: 'settings-1' }], count: 1, error: null }]
    });

    const summary = await getDashboardSummary(supabase as never, 'workspace-1');

    expect(summary.campaigns.total).toBe(4);
    expect(summary.campaigns.live).toBe(1);
    expect(summary.contacts.engaged).toBe(1);
    expect(summary.segments).toBe(2);
    expect(summary.unreadNotifications).toBe(1);
    expect(summary.settingsConfigured).toBe(true);
  });
});

describe('campaign flows', () => {
  it('creates campaigns and appends activity', async () => {
    const supabase = createSupabaseMock({
      campaigns: [{ data: { id: 'campaign-1', name: 'Launch' }, count: 1, error: null }],
      activity_events: [{ data: null, count: 1, error: null }]
    });

    const campaign = await createCampaign(supabase as never, 'workspace-1', 'user-1', {
      name: 'Launch',
      subject: 'Launch week is here',
      previewText: 'A quick teaser',
      status: 'draft',
      content: { body: 'Hello' }
    });

    expect(campaign.id).toBe('campaign-1');
    expect(supabase.from).toHaveBeenCalledWith('campaigns');
    expect(supabase.from).toHaveBeenCalledWith('activity_events');
  });

  it('schedules and deletes campaigns through soft delete', async () => {
    const supabase = createSupabaseMock({
      campaigns: [
        { data: { id: 'campaign-2', name: 'Spring Launch', status: 'draft', scheduled_at: null }, count: 1, error: null },
        { data: { id: 'campaign-2', name: 'Spring Launch', status: 'scheduled', scheduled_at: '2026-05-21T12:00:00.000Z' }, count: 1, error: null },
        { data: { id: 'campaign-2', name: 'Spring Launch', status: 'scheduled', scheduled_at: '2026-05-21T12:00:00.000Z' }, count: 1, error: null }
      ],
      activity_events: [{ data: null, count: 1, error: null }, { data: null, count: 1, error: null }]
    });

    const scheduled = await scheduleCampaign(supabase as never, 'workspace-1', 'user-1', 'campaign-2', {
      scheduledAt: '2026-05-21T12:00:00.000Z'
    });

    expect(scheduled.status).toBe('scheduled');

    await deleteCampaign(supabase as never, 'workspace-1', 'user-1', 'campaign-2');

    expect(supabase.from).toHaveBeenCalledWith('campaigns');
  });
});

describe('contact flows', () => {
  it('creates contacts with workspace scope', async () => {
    const supabase = createSupabaseMock({
      contacts: [{ data: { id: 'contact-1', email: 'maya@example.com' }, count: 1, error: null }],
      activity_events: [{ data: null, count: 1, error: null }]
    });

    const contact = await createContact(supabase as never, 'workspace-1', 'user-1', {
      email: 'maya@example.com',
      firstName: 'Maya',
      lastName: 'Chen',
      status: 'engaged'
    });

    expect(contact.email).toBe('maya@example.com');
    expect(supabase.from).toHaveBeenCalledWith('contacts');
  });
});