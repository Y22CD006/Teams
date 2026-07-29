import { EventEmitter } from "events";
import { prisma } from "@/lib/prisma";

const globalForRedis = globalThis as unknown as { 
  redis: MockRedis | undefined, 
  cache: Map<string, any> 
};

if (!globalForRedis.cache) {
  globalForRedis.cache = new Map();
} else {
  globalForRedis.cache.clear();
}

class MockRedis extends EventEmitter {
  private activeIntervals: NodeJS.Timeout[] = [];
  
  async get(key: string) {
    const item = globalForRedis.cache.get(key);
    if (!item) return null;
    if (item.expiry && Date.now() > item.expiry) {
      globalForRedis.cache.delete(key);
      return null;
    }
    return item.val || null;
  }
  async set(key: string, value: string, ...args: any[]) {
    let ttlMs: number | undefined = undefined;
    if (args[0] === "EX" && typeof args[1] === "number") {
      ttlMs = args[1] * 1000;
    }
    globalForRedis.cache.set(key, {
      val: value,
      expiry: ttlMs ? Date.now() + ttlMs : undefined,
    });
  }
  async del(key: string) {
    globalForRedis.cache.delete(key);
  }
  async publish(channel: string, message: string) {
    // Write to DB for cross-worker communication
    await prisma.pubSubEvent.create({
      data: { channel, message }
    });
    // Also emit locally just in case
    this.emit("message", channel, message);
  }
  async subscribe(...channels: string[]) {
    // Basic mock: we just listen to all emissions and filter in the subscriber
    // Start DB poller for cross-worker events
    let lastId = 0;
    
    // Get current max id so we don't replay old events
    try {
      const maxEvent = await prisma.pubSubEvent.findFirst({
        orderBy: { id: 'desc' }
      });
      if (maxEvent) lastId = maxEvent.id;
    } catch {}

    const interval = setInterval(async () => {
      try {
        const newEvents = await prisma.pubSubEvent.findMany({
          where: {
            id: { gt: lastId },
            channel: { in: channels }
          },
          orderBy: { id: 'asc' }
        });
        
        for (const ev of newEvents) {
          lastId = ev.id;
          this.emit("message", ev.channel, ev.message);
        }
      } catch (err) {
        // DB error, ignore
      }
    }, 1000); // 1 second polling
    
    this.activeIntervals.push(interval);
  }
  duplicate() {
    return new MockRedis(); 
  }
  disconnect() {
    for (const i of this.activeIntervals) {
      clearInterval(i);
    }
  }
  async unsubscribe() {
    for (const i of this.activeIntervals) {
      clearInterval(i);
    }
    this.activeIntervals = [];
  }
}

export const redis = globalForRedis.redis ?? new MockRedis();

if (process.env.NODE_ENV !== "production") globalForRedis.redis = redis as any;

export async function cacheGet<T>(key: string): Promise<T | null> {
  if (!redis) return null;
  try {
    const val = await redis.get(key);
    return val ? (JSON.parse(val) as T) : null;
  } catch {
    return null;
  }
}

export async function cacheSet(key: string, value: unknown, ttl = 300): Promise<void> {
  if (!redis) return;
  try {
    await redis.set(key, JSON.stringify(value), "EX", ttl);
  } catch {
    // silent
  }
}

export async function cacheDel(key: string): Promise<void> {
  if (!redis) return;
  try {
    await redis.del(key);
  } catch {
    // silent
  }
}
