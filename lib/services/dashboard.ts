import type { SupabaseClient } from '@supabase/supabase-js';

import type { CampaignRecord, ContactRecord } from '@/lib/types';
import { toDayKey } from '@/lib/services/shared';

export async function getDashboardSummary(client: SupabaseClient, workspaceId: string) {
  const [campaigns, contacts, segments, notifications, activities, settings] = await Promise.all([
    client.from('campaigns').select('status', { count: 'exact' }).eq('workspace_id', workspaceId).is('deleted_at', null),
    client.from('contacts').select('status', { count: 'exact' }).eq('workspace_id', workspaceId).is('deleted_at', null),
    client.from('audience_segments').select('id', { count: 'exact' }).eq('workspace_id', workspaceId).is('deleted_at', null),
    client.from('notifications').select('id', { count: 'exact' }).eq('workspace_id', workspaceId).eq('is_read', false),
    client.from('activity_events').select('id', { count: 'exact' }).eq('workspace_id', workspaceId),
    client.from('workspace_settings').select('id').eq('workspace_id', workspaceId).limit(1)
  ]);

  if (campaigns.error) throw campaigns.error;
  if (contacts.error) throw contacts.error;
  if (segments.error) throw segments.error;
  if (notifications.error) throw notifications.error;
  if (activities.error) throw activities.error;
  if (settings.error) throw settings.error;

  const campaignRows = (await client
    .from('campaigns')
    .select('status, sent_at')
    .eq('workspace_id', workspaceId)
    .is('deleted_at', null)).data ?? [];

  const contactRows = (await client
    .from('contacts')
    .select('status')
    .eq('workspace_id', workspaceId)
    .is('deleted_at', null)).data ?? [];

  const sentCampaigns = (campaignRows as CampaignRecord[]).filter((item) => item.sent_at !== null).length;
  const engagedContacts = (contactRows as ContactRecord[]).filter((item) => item.status === 'engaged').length;
  const totalCampaigns = campaigns.count ?? 0;
  const totalContacts = contacts.count ?? 0;
  const campaignVelocity = totalCampaigns ? Math.round((sentCampaigns / totalCampaigns) * 100) : 0;
  const engagementRate = totalContacts ? Math.round((engagedContacts / totalContacts) * 100) : 0;
  const workflowCoverage = Math.min(100, Math.round(((segments.count ?? 0) + (settings.data ?? []).length) * 10));
  const trackingScore = Math.round((campaignVelocity * 0.4) + (engagementRate * 0.4) + (workflowCoverage * 0.2));

  return {
    campaigns: {
      total: campaigns.count ?? 0,
      draft: (campaignRows as CampaignRecord[]).filter((item) => item.status === 'draft').length,
      scheduled: (campaignRows as CampaignRecord[]).filter((item) => item.status === 'scheduled').length,
      live: (campaignRows as CampaignRecord[]).filter((item) => item.status === 'live').length,
      archived: (campaignRows as CampaignRecord[]).filter((item) => item.status === 'archived').length,
      sent: sentCampaigns
    },
    contacts: {
      total: contacts.count ?? 0,
      engaged: engagedContacts,
      nurture: (contactRows as ContactRecord[]).filter((item) => item.status === 'nurture').length,
      active: (contactRows as ContactRecord[]).filter((item) => item.status === 'active').length
    },
    segments: segments.count ?? 0,
    unreadNotifications: notifications.count ?? 0,
    activityCount: activities.count ?? 0,
    settingsConfigured: (settings.data ?? []).length > 0,
    trackingScores: {
      campaignVelocity,
      engagementRate,
      workflowCoverage,
      trackingScore
    }
  };
}

export async function getDashboardPerformance(client: SupabaseClient, workspaceId: string, days = 30) {
  const since = new Date();
  since.setDate(since.getDate() - Math.max(days - 1, 1));

  const [sentCampaigns, createdContacts] = await Promise.all([
    client
      .from('campaigns')
      .select('sent_at')
      .eq('workspace_id', workspaceId)
      .not('sent_at', 'is', null)
      .gte('sent_at', since.toISOString())
      .is('deleted_at', null),
    client
      .from('contacts')
      .select('created_at')
      .eq('workspace_id', workspaceId)
      .gte('created_at', since.toISOString())
      .is('deleted_at', null)
  ]);

  if (sentCampaigns.error) throw sentCampaigns.error;
  if (createdContacts.error) throw createdContacts.error;

  const seriesMap = new Map<string, { date: string; campaignsSent: number; contactsCreated: number }>();

  for (let day = 0; day < days; day += 1) {
    const date = new Date(since);
    date.setDate(since.getDate() + day);
    const key = toDayKey(date.toISOString());
    seriesMap.set(key, { date: key, campaignsSent: 0, contactsCreated: 0 });
  }

  for (const item of (sentCampaigns.data ?? []) as { sent_at: string | null }[]) {
    if (!item.sent_at) continue;
    const key = toDayKey(item.sent_at);
    const entry = seriesMap.get(key);
    if (entry) entry.campaignsSent += 1;
  }

  for (const item of (createdContacts.data ?? []) as { created_at: string }[]) {
    const key = toDayKey(item.created_at);
    const entry = seriesMap.get(key);
    if (entry) entry.contactsCreated += 1;
  }

  return {
    series: Array.from(seriesMap.values())
  };
}

export async function getRecentCampaigns(client: SupabaseClient, workspaceId: string, limit = 5) {
  const { data, error } = await client
    .from('campaigns')
    .select('id, name, subject, status, scheduled_at, sent_at, updated_at')
    .eq('workspace_id', workspaceId)
    .is('deleted_at', null)
    .order('updated_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return data ?? [];
}