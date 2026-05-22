import type { SupabaseClient } from '@supabase/supabase-js';

import { AppError } from '@/lib/api/errors';
import type { ContactRecord, ContactStatus } from '@/lib/types';
import { contactCreateSchema, contactUpdateSchema } from '@/lib/validation/contact';
import { appendActivity, escapeLike, paginationOffset } from '@/lib/services/shared';

export async function listContacts(
  client: SupabaseClient,
  workspaceId: string,
  options: {
    q?: string;
    status?: ContactStatus;
    segmentId?: string;
    page: number;
    limit: number;
  }
) {
  let query = client
    .from('contacts')
    .select('*', { count: 'exact' })
    .eq('workspace_id', workspaceId)
    .is('deleted_at', null)
    .order('updated_at', { ascending: false })
    .range(paginationOffset(options.page, options.limit), paginationOffset(options.page, options.limit) + options.limit - 1);

  if (options.status) {
    query = query.eq('status', options.status);
  }

  if (options.segmentId) {
    query = query.eq('segment_id', options.segmentId);
  }

  if (options.q) {
    const q = escapeLike(options.q);
    query = query.or(`email.ilike.%${q}%,first_name.ilike.%${q}%,last_name.ilike.%${q}%`);
  }

  const { data, count, error } = await query;

  if (error) {
    throw error;
  }

  return {
    data: (data ?? []) as ContactRecord[],
    total: count ?? 0,
    page: options.page,
    limit: options.limit
  };
}

export async function getContactById(client: SupabaseClient, workspaceId: string, id: string) {
  const { data, error } = await client
    .from('contacts')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data ?? null) as ContactRecord | null;
}

export async function createContact(client: SupabaseClient, workspaceId: string, actorUserId: string, input: unknown) {
  const data = contactCreateSchema.parse(input);

  const { data: inserted, error } = await client
    .from('contacts')
    .insert({
      workspace_id: workspaceId,
      email: data.email,
      first_name: data.firstName ?? null,
      last_name: data.lastName ?? null,
      status: data.status,
      segment_id: data.segmentId ?? null,
      metadata: data.metadata
    })
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  await appendActivity(client, {
    workspaceId,
    actorUserId,
    entityType: 'contact',
    entityId: inserted.id,
    type: 'contact.created',
    title: `Contact created: ${inserted.email}`,
    details: { contactId: inserted.id, status: inserted.status, segmentId: inserted.segment_id }
  });

  return inserted as ContactRecord;
}

export async function updateContact(client: SupabaseClient, workspaceId: string, actorUserId: string, id: string, input: unknown) {
  const data = contactUpdateSchema.parse(input);
  const existing = await getContactById(client, workspaceId, id);

  if (!existing) {
    throw new AppError('Contact not found', 404);
  }

  const { data: updated, error } = await client
    .from('contacts')
    .update({
      ...(data.email === undefined ? {} : { email: data.email }),
      ...(data.firstName === undefined ? {} : { first_name: data.firstName }),
      ...(data.lastName === undefined ? {} : { last_name: data.lastName }),
      ...(data.status === undefined ? {} : { status: data.status }),
      ...(data.segmentId === undefined ? {} : { segment_id: data.segmentId }),
      ...(data.metadata === undefined ? {} : { metadata: data.metadata })
    })
    .eq('workspace_id', workspaceId)
    .eq('id', id)
    .is('deleted_at', null)
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  await appendActivity(client, {
    workspaceId,
    actorUserId,
    entityType: 'contact',
    entityId: id,
    type: 'contact.updated',
    title: `Contact updated: ${updated.email}`,
    details: {
      contactId: id,
      previousStatus: existing.status,
      currentStatus: updated.status,
      unsubscribed: Boolean((updated.metadata ?? {}).unsubscribed)
    }
  });

  return updated as ContactRecord;
}

export async function deleteContact(client: SupabaseClient, workspaceId: string, actorUserId: string, id: string) {
  const existing = await getContactById(client, workspaceId, id);

  if (!existing) {
    throw new AppError('Contact not found', 404);
  }

  const { error } = await client
    .from('contacts')
    .update({ deleted_at: new Date().toISOString() })
    .eq('workspace_id', workspaceId)
    .eq('id', id)
    .is('deleted_at', null);

  if (error) {
    throw error;
  }

  await appendActivity(client, {
    workspaceId,
    actorUserId,
    entityType: 'contact',
    entityId: id,
    type: 'contact.deleted',
    title: `Contact archived: ${existing.email}`,
    details: { contactId: id }
  });
}