import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Redis from "ioredis";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Set up Server-Sent Events headers
  const headers = new Headers({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    "Connection": "keep-alive",
  });

  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    return new Response("Redis not configured", { status: 500 });
  }

  const stream = new ReadableStream({
    async start(controller) {
      const subscriber = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        lazyConnect: true,
      });
      await subscriber.connect().catch(() => null);

      // Ping to keep connection alive
      const pingInterval = setInterval(() => {
        try {
          controller.enqueue(`: ping\n\n`);
        } catch (e) {
          clearInterval(pingInterval);
        }
      }, 30000);

      try {
        // Fetch all channels the user belongs to
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

        const redisChannels = [
          ...dmMemberships.map(d => `message:${d.dmId}`),
          ...teamMemberships.flatMap(m => m.team.channels.map(c => `message:${c.id}`))
        ];

        if (redisChannels.length > 0) {
          await subscriber.subscribe(...redisChannels);
          
          subscriber.on("message", (channel, message) => {
            try {
              // Send the event to the client
              controller.enqueue(`data: ${message}\n\n`);
            } catch (err) {
              console.error("Error enqueuing message", err);
            }
          });
        }
      } catch (err) {
        console.error("Redis subscription error:", err);
        controller.error(err);
      }

      req.signal.addEventListener("abort", () => {
        clearInterval(pingInterval);
        subscriber.quit();
        try {
          controller.close();
        } catch (e) {}
      });
    },
  });

  return new Response(stream, { headers });
}
