import type { SupabaseClient, User } from '@supabase/supabase-js';

import { AppError } from '@/lib/api/errors';
import { env } from '@/lib/env';

export type WorkspaceRole = 'owner' | 'admin' | 'member' | 'viewer';

export type WorkspaceProfile = {
  id: string;
  workspace_id: string;
  role: WorkspaceRole;
  full_name: string | null;
  email: string;
};

export type AuthContext = {
  user: User;
  profile: WorkspaceProfile;
  workspaceId: string;
  role: WorkspaceRole;
};

export async function requireAuthContext(client: SupabaseClient) {
  const {
    data: { user },
    error: userError
  } = await client.auth.getUser();

  if (userError) {
    throw new AppError(userError.message, 401);
  }

  if (!user) {
    throw new AppError('Unauthorized', 401);
  }

  const { data: profile, error } = await client
    .from('profiles')
    .select('id, workspace_id, role, full_name, email')
    .eq('id', user.id)
    .maybeSingle();

  if (error) {
    throw new AppError(error.message, 500);
  }

  if (!profile) {
    throw new AppError('Workspace membership not found', 403);
  }

  return {
    user,
    profile: profile as WorkspaceProfile,
    workspaceId: profile.workspace_id,
    role: profile.role
  } satisfies AuthContext;
}

export async function createDemoAuthContext(client: SupabaseClient) {
  const { data: profile, error } = await client
    .from('profiles')
    .select('id, workspace_id, role, full_name, email')
    .eq('workspace_id', env.NEXT_PUBLIC_WORKSPACE_ID)
    .maybeSingle();

  if (error) {
    throw new AppError(error.message, 500);
  }

  if (!profile) {
    throw new AppError('Demo workspace membership not found', 500);
  }

  const user = {
    id: profile.id,
    email: profile.email,
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: new Date().toISOString()
  } as User;

  return {
    user,
    profile: profile as WorkspaceProfile,
    workspaceId: profile.workspace_id,
    role: profile.role
  } satisfies AuthContext;
}

export function assertRole(role: WorkspaceRole, allowedRoles: WorkspaceRole[]) {
  if (!allowedRoles.includes(role)) {
    throw new AppError('Forbidden', 403);
  }
}