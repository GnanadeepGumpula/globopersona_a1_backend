import { handleApiError } from '@/lib/api/errors';
import { jsonSuccess } from '@/lib/api/response';
import { getRequestContext } from '@/lib/api/context';
import { listNotifications } from '@/lib/services/notifications';

export async function GET() {
  try {
    const { client, auth } = await getRequestContext();
    const data = await listNotifications(client, auth.workspaceId, auth.user.id);
    return jsonSuccess({ data });
  } catch (error) {
    return handleApiError(error);
  }
}