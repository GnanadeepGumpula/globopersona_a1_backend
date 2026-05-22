import { AppError } from '@/lib/api/errors';
import { createDemoAuthContext, requireAuthContext } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';

export async function getRequestContext() {
  const client = createSupabaseServiceClient();

  try {
    const authClient = await createSupabaseServerClient();
    const auth = await requireAuthContext(authClient);
    return { client, auth };
  } catch (error) {
    if (error instanceof AppError && error.status === 401) {
      const auth = await createDemoAuthContext(client);
      return { client, auth };
    }

    throw error;
  }
}