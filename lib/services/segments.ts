import type { SupabaseClient } from '@supabase/supabase-js';

import type { SegmentRecord } from '@/lib/types';

export async function listSegments(client: SupabaseClient, workspaceId: string) {
  const { data, error } = await client
    .from('audience_segments')
    .select('*')
    .eq('workspace_id', workspaceId)
    .is('deleted_at', null)
    .order('name', { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []) as SegmentRecord[];
}