import PusherServer from "pusher";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const PusherClient = require("pusher-js").Pusher as new (key: string, options: Record<string, unknown>) => unknown;

export const pusherServer = process.env.PUSHER_APP_ID
  ? new PusherServer({
      appId: process.env.PUSHER_APP_ID,
      key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
      secret: process.env.PUSHER_SECRET!,
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
      useTLS: true,
    })
  : null;

export const pusherClient = process.env.NEXT_PUBLIC_PUSHER_KEY
  ? new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
      authEndpoint: "/api/pusher/auth",
    })
  : null;
