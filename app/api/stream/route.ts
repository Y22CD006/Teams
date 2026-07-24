import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";

export async function GET(req: NextRequest) {
  const { userId: authUserId } = await auth();
  const userId = authUserId as string;
  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (!redis) {
    return new Response("Redis not configured", { status: 500 });
  }

  const r = redis;

  const headers = new Headers({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    "Connection": "keep-alive",
  });

  const enc = new TextEncoder();
  let subscriber: any = null;

  const stream = new ReadableStream({
    async start(controller) {
      subscriber = r.duplicate();

      const pingInterval = setInterval(() => {
        try {
          controller.enqueue(enc.encode(": ping\n\n"));
        } catch {
          clearInterval(pingInterval);
        }
      }, 30000);

      try {
        const [teamMemberships, dmMemberships] = await Promise.all([
          prisma.teamMember.findMany({
            where: { userId: userId },
            include: { team: { include: { channels: { select: { id: true } } } } },
          }),
          prisma.dMMember.findMany({
            where: { userId: userId },
            select: { dmId: true },
          })
        ]);

        const redisChannels = [
          `user:${userId}`,
          ...dmMemberships.map(d => `message:${d.dmId}`),
          ...teamMemberships.flatMap(m => m.team.channels.map(c => `message:${c.id}`))
        ];

        if (redisChannels.length > 0) {
          await subscriber.subscribe(...redisChannels);
          subscriber.on("message", (_channel: string, message: string) => {
            if (!redisChannels.includes(_channel)) return;
            try {
              controller.enqueue(enc.encode(`data: ${message}\n\n`));
            } catch {
              // stream closed
            }
          });
        }
      } catch (err) {
        console.error("Redis subscription error:", err);
        controller.error(err);
      }

      req.signal.addEventListener("abort", () => {
        clearInterval(pingInterval);
        subscriber?.unsubscribe().catch(() => {});
        subscriber?.disconnect();
      });
    },
    cancel() {
      subscriber?.unsubscribe().catch(() => {});
      subscriber?.disconnect();
    },
  });

  return new Response(stream, { headers });
}
