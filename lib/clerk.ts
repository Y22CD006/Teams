import { getSession } from "./auth";

export async function getAuthUserId(): Promise<string | null> {
  const session = await getSession();
  return session?.userId || null;
}

export function requireAuth(userId: string | null): asserts userId is string {
  if (!userId) throw new Error("Unauthorized");
}
