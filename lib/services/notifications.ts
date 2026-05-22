import type { SupabaseClient } from '@supabase/supabase-js';

import type { NotificationRecord } from '@/lib/types';

export async function listNotifications(client: SupabaseClient, workspaceId: string, userId: string) {
  const { data, error } = await client
    .from('notifications')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as NotificationRecord[];
}

export async function markAllNotificationsRead(client: SupabaseClient, workspaceId: string, userId: string) {
  const now = new Date().toISOString();

  const { error } = await client
    .from('notifications')
    .update({ is_read: true, read_at: now })
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)
    .eq('is_read', false);

  if (error) {
    throw error;
  }

  return { success: true, readAt: now };
}