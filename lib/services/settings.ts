import type { SupabaseClient } from '@supabase/supabase-js';

import { AppError } from '@/lib/api/errors';
import type { WorkspaceSettings } from '@/lib/types';
import { settingsUpdateSchema } from '@/lib/validation/settings';
import { appendActivity } from '@/lib/services/shared';

export async function getWorkspaceSettings(client: SupabaseClient, workspaceId: string) {
  const { data, error } = await client
    .from('workspace_settings')
    .select('*')
    .eq('workspace_id', workspaceId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (data) {
    return data as WorkspaceSettings;
  }

  const { data: inserted, error: insertError } = await client
    .from('workspace_settings')
    .insert({
      workspace_id: workspaceId,
      company_name: 'Globopersona',
      reply_to_email: 'hello@globopersona.com',
      default_sender_name: 'Globopersona Team',
      sending_domain: 'mail.globopersona.com',
      timezone: 'UTC',
      logo_url: null,
      preferences: {}
    })
    .select('*')
    .single();

  if (insertError) {
    throw insertError;
  }

  return inserted as WorkspaceSettings;
}

export async function updateWorkspaceSettings(client: SupabaseClient, workspaceId: string, actorUserId: string, input: unknown) {
  const data = settingsUpdateSchema.parse(input);
  const existing = await getWorkspaceSettings(client, workspaceId);

  const { data: updated, error } = await client
    .from('workspace_settings')
    .upsert(
      {
        id: existing.id,
        workspace_id: workspaceId,
        company_name: data.companyName ?? existing.company_name,
        reply_to_email: data.replyToEmail ?? existing.reply_to_email,
        default_sender_name: data.defaultSenderName ?? existing.default_sender_name,
        sending_domain: data.sendingDomain === undefined ? existing.sending_domain : data.sendingDomain,
        timezone: data.timezone ?? existing.timezone,
        logo_url: data.logoUrl === undefined ? existing.logo_url : data.logoUrl,
        preferences: data.preferences ?? existing.preferences
      },
      { onConflict: 'workspace_id' }
    )
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  await appendActivity(client, {
    workspaceId,
    actorUserId,
    entityType: 'settings',
    entityId: updated.id,
    type: 'settings.updated',
    title: 'Workspace settings updated',
    details: { workspaceId }
  });

  return updated as WorkspaceSettings;
}