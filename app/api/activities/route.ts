import { NextRequest } from 'next/server';

import { handleApiError } from '@/lib/api/errors';
import { jsonSuccess } from '@/lib/api/response';
import { getRequestContext } from '@/lib/api/context';
import { listActivities } from '@/lib/services/activities';

export async function GET(request: NextRequest) {
  try {
    const { client, auth } = await getRequestContext();
    const searchParams = request.nextUrl.searchParams;
    const limit = Number(searchParams.get('limit') ?? 50);
    const data = await listActivities(client, auth.workspaceId, {
      limit: Number.isFinite(limit) ? limit : 50,
      entityId: searchParams.get('entityId') ?? undefined,
      entityType: searchParams.get('entityType') ?? undefined
    });
    return jsonSuccess({ data });
  } catch (error) {
    return handleApiError(error);
  }
}