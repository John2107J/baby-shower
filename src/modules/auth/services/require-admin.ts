import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { ADMIN_LOGIN_PATH, auth } from "@/modules/auth/auth";
import { findAdminSessionVersion } from "@/modules/auth/repositories/admin-user-repository";

/**
 * Must be called by every admin page, server action and route handler:
 * layouts alone do not protect server actions. A session opened before the
 * last password change (or for a deleted account) is rejected.
 */
export async function requireAdmin(): Promise<{ id: string; email: string }> {
  const session = await auth();
  const user = session?.user;
  if (!user?.id || !user.email) redirect(ADMIN_LOGIN_PATH);
  const currentVersion = await findAdminSessionVersion(getDb(), user.id);
  if (currentVersion === null || currentVersion !== user.sessionVersion)
    redirect(ADMIN_LOGIN_PATH);
  return { id: user.id, email: user.email };
}
