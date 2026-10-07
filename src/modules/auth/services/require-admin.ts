import { redirect } from "next/navigation";
import { ADMIN_LOGIN_PATH, auth } from "@/modules/auth/auth";

/**
 * Must be called by every admin page, server action and route handler:
 * layouts alone do not protect server actions.
 */
export async function requireAdmin(): Promise<{ id: string; email: string }> {
  const session = await auth();
  const user = session?.user;
  if (!user?.id || !user.email) redirect(ADMIN_LOGIN_PATH);
  return { id: user.id, email: user.email };
}
