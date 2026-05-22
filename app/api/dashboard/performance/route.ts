import { NextRequest } from 'next/server';

import { handleApiError } from '@/lib/api/errors';
import { jsonSuccess } from '@/lib/api/response';
import { getRequestContext } from '@/lib/api/context';
import { getDashboardPerformance } from '@/lib/services/dashboard';

export async function GET(request: NextRequest) {
  try {
    const { client, auth } = await getRequestContext();
    const days = Number(request.nextUrl.searchParams.get('days') ?? 30);
    const data = await getDashboardPerformance(client, auth.workspaceId, Number.isFinite(days) ? days : 30);
    return jsonSuccess(data);
  } catch (error) {
    return handleApiError(error);
  }
}