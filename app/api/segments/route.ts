import { handleApiError } from '@/lib/api/errors';
import { jsonSuccess } from '@/lib/api/response';
import { getRequestContext } from '@/lib/api/context';
import { listSegments } from '@/lib/services/segments';

export async function GET() {
  try {
    const { client, auth } = await getRequestContext();
    const data = await listSegments(client, auth.workspaceId);
    return jsonSuccess({ data });
  } catch (error) {
    return handleApiError(error);
  }
}