import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { generateLiveKitToken } from "@/lib/api/livekit";
import { MeetingViewWrapper } from "./meeting-view-wrapper";

export default async function MeetingPage({ params }: { params: Promise<{ roomName: string }> }) {
  const { roomName } = await params;
  const session = await getSession();
  if (!session) redirect(`/login?redirect=/meeting/${roomName}`);

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, email: true, name: true, imageUrl: true },
  });
  if (!user) redirect("/login");

  const token = await generateLiveKitToken(user.id, roomName);
  const serverUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL || "ws://localhost:7880";

  return (
    <MeetingViewWrapper
      user={{
        id: user.id,
        name: user.name || "User",
        email: user.email,
        avatar: user.imageUrl || (user.name || "U").charAt(0).toUpperCase(),
        role: "user",
        status: "online" as const,
      }}
      roomName={roomName}
      token={token}
      serverUrl={serverUrl}
    />
  );
}
