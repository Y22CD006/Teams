import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
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

  let subscriber: import("ioredis").Redis | null = null;
  let closed = false;

  const stream = new ReadableStream({
    async start(controller) {
      subscriber = r.duplicate();
      subscriber.options.maxRetriesPerRequest = null;
      subscriber.options.retryStrategy = (times: number) => Math.min(times * 200, 10000);

      let redisChannels: string[] = [];

      const subscribeChannels = async () => {
        if (redisChannels.length > 0) {
          try {
            await subscriber!.subscribe(...redisChannels);
          } catch (err) {
            console.error("Redis re-subscribe error:", err);
          }
        }
      };

      subscriber.on("message", (_channel, message) => {
        if (closed) return;
        try {
          controller.enqueue(`data: ${message}\n\n`);
        } catch {
          // stream closed
        }
      });

      subscriber.on("reconnecting", () => {
        console.log("[SSE] Redis subscriber reconnecting...");
      });

      const pingInterval = setInterval(() => {
        if (closed) { clearInterval(pingInterval); return; }
        try {
          controller.enqueue(`: ping\n\n`);
        } catch {
          clearInterval(pingInterval);
        }
      }, 30000);

      try {
        const [teamMemberships, dmMemberships] = await Promise.all([
          prisma.teamMember.findMany({
            where: { userId: session.userId },
            include: { team: { include: { channels: { select: { id: true } } } } },
          }),
          prisma.dMMember.findMany({
            where: { userId: session.userId },
            select: { dmId: true },
          })
        ]);

        redisChannels = [
          ...dmMemberships.map(d => `message:${d.dmId}`),
          ...teamMemberships.flatMap(m => m.team.channels.map(c => `message:${c.id}`))
        ];

        if (redisChannels.length > 0) {
          await subscriber.subscribe(...redisChannels);
        }
      } catch (err) {
        console.error("Redis subscription error:", err);
        try { controller.error(err); } catch {}
      }

      subscriber.on("ready", () => {
        if (closed) return;
        subscribeChannels();
      });

      req.signal.addEventListener("abort", () => {
        closed = true;
        clearInterval(pingInterval);
        subscriber?.unsubscribe().catch(() => {});
        subscriber?.disconnect();
      });
    },
    cancel() {
      closed = true;
      subscriber?.unsubscribe().catch(() => {});
      subscriber?.disconnect();
    },
  });

  return new Response(stream, { headers });
}
