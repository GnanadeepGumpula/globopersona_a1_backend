import type { SupabaseClient } from '@supabase/supabase-js';

import type { ActivityRecord } from '@/lib/types';

export async function listActivities(client: SupabaseClient, workspaceId: string, limit = 50) {
  const { data, error } = await client
    .from('activity_events')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return (data ?? []) as ActivityRecord[];
}