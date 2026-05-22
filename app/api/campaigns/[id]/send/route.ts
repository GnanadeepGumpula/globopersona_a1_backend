import { NextRequest } from 'next/server';

import { handleApiError } from '@/lib/api/errors';
import { jsonSuccess } from '@/lib/api/response';
import { getRequestContext } from '@/lib/api/context';
import { sendCampaign } from '@/lib/services/campaigns';

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { client, auth } = await getRequestContext();
    const { id } = await context.params;
    const body = await request.json();
    const data = await sendCampaign(client, auth.workspaceId, auth.user.id, id, body);
    return jsonSuccess({ data });
  } catch (error) {
    return handleApiError(error);
  }
}