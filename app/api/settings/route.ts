import { NextRequest } from 'next/server';

import { handleApiError } from '@/lib/api/errors';
import { jsonSuccess } from '@/lib/api/response';
import { getRequestContext } from '@/lib/api/context';
import { getWorkspaceSettings, updateWorkspaceSettings } from '@/lib/services/settings';

export async function GET() {
  try {
    const { client, auth } = await getRequestContext();
    const data = await getWorkspaceSettings(client, auth.workspaceId);
    return jsonSuccess({ data });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { client, auth } = await getRequestContext();
    const body = await request.json();
    const data = await updateWorkspaceSettings(client, auth.workspaceId, auth.user.id, body);
    return jsonSuccess({ data });
  } catch (error) {
    return handleApiError(error);
  }
}