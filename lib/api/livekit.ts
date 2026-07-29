import { AccessToken } from "livekit-server-sdk";

export async function generateLiveKitToken(identity: string, room: string, name?: string): Promise<string> {
  const at = new AccessToken(
    process.env.LIVEKIT_API_KEY!,
    process.env.LIVEKIT_API_SECRET!,
    { identity, name: name || identity },
  );

  at.addGrant({ roomJoin: true, room, canPublish: true, canSubscribe: true });
  return at.toJwt();
}
