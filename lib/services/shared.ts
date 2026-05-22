import type { SupabaseClient } from '@supabase/supabase-js';

import type { ActivityEntityType, ActivityRecord, ActivityType } from '@/lib/types';

export function escapeLike(value: string) {
  return value.replaceAll('\\', '\\\\').replaceAll('%', '\\%').replaceAll('_', '\\_');
}

export function paginationOffset(page: number, limit: number) {
  return Math.max(page - 1, 0) * limit;
}

export async function appendActivity(
  client: SupabaseClient,
  payload: {
    workspaceId: string;
    actorUserId?: string | null;
    entityType: ActivityEntityType;
    entityId?: string | null;
    type: ActivityType;
    title: string;
    details?: Record<string, unknown>;
  }
) {
  const { error } = await client.from('activity_events').insert({
    workspace_id: payload.workspaceId,
    actor_user_id: payload.actorUserId ?? null,
    entity_type: payload.entityType,
    entity_id: payload.entityId ?? null,
    type: payload.type,
    title: payload.title,
    details: payload.details ?? {}
  });

  if (error) {
    throw error;
  }
}

export function toDayKey(value: string) {
  return value.slice(0, 10);
}

export function sortByCreatedAtDesc<T extends { created_at: string }>(items: T[]) {
  return [...items].sort((left, right) => right.created_at.localeCompare(left.created_at));
}
