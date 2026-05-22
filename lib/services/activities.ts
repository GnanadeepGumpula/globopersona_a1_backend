import type { SupabaseClient } from '@supabase/supabase-js';

import type { ActivityRecord } from '@/lib/types';

export async function listActivities(client: SupabaseClient, workspaceId: string, options: { limit?: number; entityType?: string; entityId?: string } = {}) {
  let query = client
    .from('activity_events')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })
    .limit(options.limit ?? 50);

  if (options.entityType) {
    query = query.eq('entity_type', options.entityType);
  }

  if (options.entityId) {
    query = query.eq('entity_id', options.entityId);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return (data ?? []) as ActivityRecord[];
}