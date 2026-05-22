import { handleApiError } from '@/lib/api/errors';
import { jsonSuccess } from '@/lib/api/response';
import { getRequestContext } from '@/lib/api/context';
import { markAllNotificationsRead } from '@/lib/services/notifications';

export async function POST() {
  try {
    const { client, auth } = await getRequestContext();
    const data = await markAllNotificationsRead(client, auth.workspaceId, auth.user.id);
    return jsonSuccess(data);
  } catch (error) {
    return handleApiError(error);
  }
}