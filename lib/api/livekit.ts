import { AccessToken } from "livekit-server-sdk";

export async function generateLiveKitToken(identity: string, room: string): Promise<string> {
  const at = new AccessToken(
    process.env.LIVEKIT_API_KEY!,
    process.env.LIVEKIT_API_SECRET!,
    { identity },
  );

  at.addGrant({ roomJoin: true, room });
  return at.toJwt();
}
