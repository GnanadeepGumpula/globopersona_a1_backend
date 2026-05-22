import type { SupabaseClient } from '@supabase/supabase-js';

function matchesQuery(value: string | null | undefined, query: string) {
  return (value ?? '').toLowerCase().includes(query.toLowerCase());
}

export async function searchWorkspace(client: SupabaseClient, workspaceId: string, query: string) {
  const [campaigns, contacts, activities, settings] = await Promise.all([
    client
      .from('campaigns')
      .select('id, name, subject, status, updated_at')
      .eq('workspace_id', workspaceId)
      .is('deleted_at', null)
      .order('updated_at', { ascending: false })
      .limit(25),
    client
      .from('contacts')
      .select('id, email, first_name, last_name, status, updated_at')
      .eq('workspace_id', workspaceId)
      .is('deleted_at', null)
      .order('updated_at', { ascending: false })
      .limit(25),
    client
      .from('activity_events')
      .select('id, title, type, created_at')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })
      .limit(25),
    client
      .from('workspace_settings')
      .select('id, company_name, reply_to_email, default_sender_name, timezone')
      .eq('workspace_id', workspaceId)
      .limit(5)
  ]);

  if (campaigns.error) throw campaigns.error;
  if (contacts.error) throw contacts.error;
  if (activities.error) throw activities.error;
  if (settings.error) throw settings.error;

  const normalizedQuery = query.trim().toLowerCase();

  const filteredCampaigns = (campaigns.data ?? []).filter((campaign) =>
    matchesQuery(campaign.name, normalizedQuery) || matchesQuery(campaign.subject, normalizedQuery)
  );

  const filteredContacts = (contacts.data ?? []).filter((contact) =>
    matchesQuery(contact.email, normalizedQuery) || matchesQuery(contact.first_name, normalizedQuery) || matchesQuery(contact.last_name, normalizedQuery)
  );

  const filteredActivities = (activities.data ?? []).filter((activity) =>
    matchesQuery(activity.title, normalizedQuery) || matchesQuery(activity.type, normalizedQuery)
  );

  const filteredSettings = (settings.data ?? []).filter((setting) =>
    matchesQuery(setting.company_name, normalizedQuery) ||
    matchesQuery(setting.reply_to_email, normalizedQuery) ||
    matchesQuery(setting.default_sender_name, normalizedQuery) ||
    matchesQuery(setting.timezone, normalizedQuery)
  );

  return {
    campaigns: filteredCampaigns,
    contacts: filteredContacts,
    activities: filteredActivities,
    settings: filteredSettings
  };
}