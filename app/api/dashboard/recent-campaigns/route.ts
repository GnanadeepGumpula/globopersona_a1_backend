import { NextRequest } from 'next/server';

import { handleApiError } from '@/lib/api/errors';
import { jsonSuccess } from '@/lib/api/response';
import { getRequestContext } from '@/lib/api/context';
import { getRecentCampaigns } from '@/lib/services/dashboard';

export async function GET(request: NextRequest) {
  try {
    const { client, auth } = await getRequestContext();
    const limit = Number(request.nextUrl.searchParams.get('limit') ?? 5);
    const data = await getRecentCampaigns(client, auth.workspaceId, Number.isFinite(limit) ? limit : 5);
    return jsonSuccess({ data });
  } catch (error) {
    return handleApiError(error);
  }
}