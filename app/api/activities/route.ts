import { NextRequest } from 'next/server';

import { handleApiError } from '@/lib/api/errors';
import { jsonSuccess } from '@/lib/api/response';
import { getRequestContext } from '@/lib/api/context';
import { listActivities } from '@/lib/services/activities';

export async function GET(request: NextRequest) {
  try {
    const { client, auth } = await getRequestContext();
    const limit = Number(request.nextUrl.searchParams.get('limit') ?? 50);
    const data = await listActivities(client, auth.workspaceId, Number.isFinite(limit) ? limit : 50);
    return jsonSuccess({ data });
  } catch (error) {
    return handleApiError(error);
  }
}