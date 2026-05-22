import { NextRequest } from 'next/server';

import { handleApiError } from '@/lib/api/errors';
import { jsonSuccess } from '@/lib/api/response';
import { getRequestContext } from '@/lib/api/context';
import { deleteCampaign, getCampaignById, updateCampaign } from '@/lib/services/campaigns';

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { client, auth } = await getRequestContext();
    const { id } = await context.params;
    const data = await getCampaignById(client, auth.workspaceId, id);
    return jsonSuccess({ data });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { client, auth } = await getRequestContext();
    const { id } = await context.params;
    const body = await request.json();
    const data = await updateCampaign(client, auth.workspaceId, auth.user.id, id, body);
    return jsonSuccess({ data });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { client, auth } = await getRequestContext();
    const { id } = await context.params;
    await deleteCampaign(client, auth.workspaceId, auth.user.id, id);
    return jsonSuccess({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}