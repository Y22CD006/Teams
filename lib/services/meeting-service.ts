import { generateLiveKitToken } from "@/lib/api/livekit";

export async function createMeetingRoom(identity: string, room: string) {
  const token = await generateLiveKitToken(identity, room);
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
