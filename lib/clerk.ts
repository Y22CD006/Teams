import { auth, currentUser } from "@clerk/nextjs/server";

export async function getAuthUserId(): Promise<string | null> {
  const { userId } = await auth();
  return userId;
}

export async function getCurrentUser() {
  return currentUser();
}

export function requireAuth(userId: string | null): asserts userId is string {
  if (!userId) throw new Error("Unauthorized");
}
