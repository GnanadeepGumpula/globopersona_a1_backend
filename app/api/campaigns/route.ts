import { NextRequest } from 'next/server';

import { handleApiError } from '@/lib/api/errors';
import { jsonSuccess } from '@/lib/api/response';
import { parseLimit, parsePage } from '@/lib/api/request';
import { getRequestContext } from '@/lib/api/context';
import { createCampaign, listCampaigns } from '@/lib/services/campaigns';

export async function GET(request: NextRequest) {
  try {
    const { client, auth } = await getRequestContext();
    const searchParams = request.nextUrl.searchParams;
    const data = await listCampaigns(client, auth.workspaceId, {
      q: searchParams.get('q') ?? undefined,
      status: (searchParams.get('status') as never) ?? undefined,
      page: parsePage(searchParams),
      limit: parseLimit(searchParams)
    });

    return jsonSuccess({ data });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { client, auth } = await getRequestContext();
    const body = await request.json();
    const data = await createCampaign(client, auth.workspaceId, auth.user.id, body);
    return jsonSuccess({ data }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}