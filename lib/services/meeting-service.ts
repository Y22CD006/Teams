import { generateLiveKitToken } from "@/lib/api/livekit";
import { prisma } from "@/lib/prisma";

export async function createMeetingRoom(identity: string, room: string, name?: string) {
  let displayName = name;
  if (!displayName || displayName === identity) {
    try {
      const user = await prisma.user.findUnique({ where: { id: identity } });
      if (user) {
        displayName = user.name || user.username || user.email?.split('@')[0] || identity;
      }
    } catch (e) {
      console.error("Error fetching user for LiveKit name:", e);
    }
  }

  const token = await generateLiveKitToken(identity, room, displayName || identity);
  return {
    room,
    token,
    url: process.env.NEXT_PUBLIC_LIVEKIT_URL!,
  };
}

export function generateRoomName(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "room-";
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
