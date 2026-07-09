import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { redis } from "@/lib/redis";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const channelId = searchParams.get("channelId");
  const dmId = searchParams.get("dmId");

  if (!channelId && !dmId) {
    return new Response("channelId or dmId required", { status: 400 });
  }

  const channelName = `message:${channelId || dmId}`;
  const enc = new TextEncoder();

  let subscriber: import("ioredis").Redis | null = null;
  let closed = false;

  const stream = new ReadableStream({
    start(controller) {
      if (!redis) {
        controller.enqueue(enc.encode("event: error\ndata: Redis not available\n\n"));
        controller.close();
        return;
      }

      subscriber = redis.duplicate();
      subscriber.options.maxRetriesPerRequest = null;
      subscriber.options.retryStrategy = (times: number) => Math.min(times * 200, 10000);

      const doSubscribe = () => {
        subscriber!.subscribe(channelName).catch((err) => {
          if (closed) return;
          try {
            controller.enqueue(enc.encode(`event: error\ndata: ${err.message}\n\n`));
          } catch {}
          try { controller.close(); } catch {}
        });
      };

      subscriber.on("message", (ch, message) => {
        if (ch === channelName && !closed) {
          try {
            controller.enqueue(enc.encode(`data: ${message}\n\n`));
          } catch {
            // stream closed
          }
        }
      });

      subscriber.on("ready", () => {
        if (!closed) doSubscribe();
      });

      doSubscribe();

      controller.enqueue(enc.encode("retry: 2000\n\n"));
      controller.enqueue(enc.encode("event: connected\ndata: {}\n\n"));

      req.signal.addEventListener("abort", () => {
        closed = true;
        subscriber?.unsubscribe(channelName).catch(() => {});
        subscriber?.disconnect();
      });
    },
    cancel() {
      closed = true;
      subscriber?.unsubscribe(channelName).catch(() => {});
      subscriber?.disconnect();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
