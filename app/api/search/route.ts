import { NextRequest } from 'next/server';

import { handleApiError } from '@/lib/api/errors';
import { jsonSuccess } from '@/lib/api/response';
import { getRequestContext } from '@/lib/api/context';
import { searchSchema } from '@/lib/validation/search';
import { searchWorkspace } from '@/lib/services/search';

export async function GET(request: NextRequest) {
  try {
    const { client, auth } = await getRequestContext();
    const q = searchSchema.parse({ q: request.nextUrl.searchParams.get('q') ?? '' }).q;
    const data = await searchWorkspace(client, auth.workspaceId, q);
    return jsonSuccess({ data });
  } catch (error) {
    return handleApiError(error);
  }
}