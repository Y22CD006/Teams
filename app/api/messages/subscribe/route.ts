import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { redis } from "@/lib/redis";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { userId: authUserId } = await auth();
  const userId = authUserId as string;
  const session = userId ? { userId } : null;
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

  let subscriber: any = null;

  const stream = new ReadableStream({
    start(controller) {
      if (!redis) {
        controller.enqueue(enc.encode("event: error\ndata: Redis not available\n\n"));
        controller.close();
        return;
      }

      subscriber = redis.duplicate();

      subscriber.on("message", (ch: string, message: string) => {
        if (ch === channelName) {
          try {
            controller.enqueue(enc.encode(`data: ${message}\n\n`));
          } catch {
            // stream closed
          }
        }
      });

      subscriber.subscribe(channelName).catch((err: any) => {
        controller.enqueue(enc.encode(`event: error\ndata: ${err.message}\n\n`));
        controller.close();
      });

      controller.enqueue(enc.encode("retry: 2000\n\n"));
      controller.enqueue(enc.encode("event: connected\ndata: {}\n\n"));

      req.signal.addEventListener("abort", () => {
        subscriber?.unsubscribe(channelName).catch(() => {});
        subscriber?.disconnect();
      });
    },
    cancel() {
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

