import type { SupabaseClient } from '@supabase/supabase-js';

import { AppError } from '@/lib/api/errors';
import type { CampaignRecord, CampaignStatus } from '@/lib/types';
import { campaignCreateSchema, campaignScheduleSchema, campaignSendSchema, campaignUpdateSchema } from '@/lib/validation/campaign';
import { appendActivity, escapeLike, paginationOffset } from '@/lib/services/shared';

export async function listCampaigns(
  client: SupabaseClient,
  workspaceId: string,
  options: {
    q?: string;
    status?: CampaignStatus;
    page: number;
    limit: number;
  }
) {
  let query = client
    .from('campaigns')
    .select('*', { count: 'exact' })
    .eq('workspace_id', workspaceId)
    .is('deleted_at', null)
    .order('updated_at', { ascending: false })
    .range(paginationOffset(options.page, options.limit), paginationOffset(options.page, options.limit) + options.limit - 1);

  if (options.status) {
    query = query.eq('status', options.status);
  }

  if (options.q) {
    const q = escapeLike(options.q);
    query = query.or(`name.ilike.%${q}%,subject.ilike.%${q}%`);
  }

  const { data, count, error } = await query;

  if (error) {
    throw error;
  }

  return {
    data: (data ?? []) as CampaignRecord[],
    total: count ?? 0,
    page: options.page,
    limit: options.limit
  };
}

export async function getCampaignById(client: SupabaseClient, workspaceId: string, id: string) {
  const { data, error } = await client
    .from('campaigns')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data ?? null) as CampaignRecord | null;
}

export async function createCampaign(
  client: SupabaseClient,
  workspaceId: string,
  actorUserId: string,
  input: unknown
) {
  const data = campaignCreateSchema.parse(input);

  const { data: inserted, error } = await client
    .from('campaigns')
    .insert({
      workspace_id: workspaceId,
      name: data.name,
      subject: data.subject,
      preview_text: data.previewText ?? null,
      content: data.content,
      status: data.status,
      scheduled_at: data.scheduledAt ?? null,
      created_by: actorUserId,
      updated_by: actorUserId
    })
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  await appendActivity(client, {
    workspaceId,
    actorUserId,
    entityType: 'campaign',
    entityId: inserted.id,
    type: 'campaign.created',
    title: `Campaign created: ${inserted.name}`,
    details: { campaignId: inserted.id }
  });

  return inserted as CampaignRecord;
}

export async function updateCampaign(
  client: SupabaseClient,
  workspaceId: string,
  actorUserId: string,
  id: string,
  input: unknown
) {
  const data = campaignUpdateSchema.parse(input);
  const existing = await getCampaignById(client, workspaceId, id);

  if (!existing) {
    throw new AppError('Campaign not found', 404);
  }

  const { data: updated, error } = await client
    .from('campaigns')
    .update({
      ...(data.name === undefined ? {} : { name: data.name }),
      ...(data.subject === undefined ? {} : { subject: data.subject }),
      ...(data.previewText === undefined ? {} : { preview_text: data.previewText }),
      ...(data.content === undefined ? {} : { content: data.content }),
      ...(data.status === undefined ? {} : { status: data.status }),
      ...(data.scheduledAt === undefined ? {} : { scheduled_at: data.scheduledAt }),
      updated_by: actorUserId
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
    entityType: 'campaign',
    entityId: updated.id,
    type: 'campaign.updated',
    title: `Campaign updated: ${updated.name}`,
    details: { campaignId: updated.id }
  });

  return updated as CampaignRecord;
}

export async function deleteCampaign(client: SupabaseClient, workspaceId: string, actorUserId: string, id: string) {
  const existing = await getCampaignById(client, workspaceId, id);

  if (!existing) {
    throw new AppError('Campaign not found', 404);
  }

  const { error } = await client
    .from('campaigns')
    .update({ deleted_at: new Date().toISOString(), status: 'archived', updated_by: actorUserId })
    .eq('workspace_id', workspaceId)
    .eq('id', id)
    .is('deleted_at', null);

  if (error) {
    throw error;
  }

  await appendActivity(client, {
    workspaceId,
    actorUserId,
    entityType: 'campaign',
    entityId: id,
    type: 'campaign.deleted',
    title: `Campaign archived: ${existing.name}`,
    details: { campaignId: id }
  });
}

export async function scheduleCampaign(
  client: SupabaseClient,
  workspaceId: string,
  actorUserId: string,
  id: string,
  input: unknown
) {
  const data = campaignScheduleSchema.parse(input);
  const existing = await getCampaignById(client, workspaceId, id);

  if (!existing) {
    throw new AppError('Campaign not found', 404);
  }

  if (existing.status === 'archived') {
    throw new AppError('Archived campaigns cannot be scheduled', 409);
  }

  const { data: updated, error } = await client
    .from('campaigns')
    .update({
      status: 'scheduled',
      scheduled_at: data.scheduledAt,
      updated_by: actorUserId
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
    entityType: 'campaign',
    entityId: id,
    type: 'campaign.scheduled',
    title: `Campaign scheduled: ${updated.name}`,
    details: { campaignId: id, scheduledAt: data.scheduledAt }
  });

  return updated as CampaignRecord;
}

export async function sendCampaign(
  client: SupabaseClient,
  workspaceId: string,
  actorUserId: string,
  id: string,
  input: unknown
) {
  campaignSendSchema.parse(input);
  const existing = await getCampaignById(client, workspaceId, id);

  if (!existing) {
    throw new AppError('Campaign not found', 404);
  }

  if (existing.status === 'archived') {
    throw new AppError('Archived campaigns cannot be sent', 409);
  }

  const sentAt = new Date().toISOString();

  const { data: updated, error } = await client
    .from('campaigns')
    .update({
      status: 'live',
      sent_at: sentAt,
      scheduled_at: existing.scheduled_at ?? sentAt,
      updated_by: actorUserId
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
    entityType: 'campaign',
    entityId: id,
    type: 'campaign.sent',
    title: `Campaign sent: ${updated.name}`,
    details: { campaignId: id, sentAt }
  });

  return updated as CampaignRecord;
}