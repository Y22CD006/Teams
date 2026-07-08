import PusherServer from 'pusher';
import PusherClient from 'pusher-js';

export const pusherServer = process.env.PUSHER_APP_ID
  ? new PusherServer({
      appId: process.env.PUSHER_APP_ID,
      key: process.env.NEXT_PUBLIC_PUSHER_KEY || '',
      secret: process.env.PUSHER_SECRET || '',
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || '',
      useTLS: true,
    })
  : null;

let pusherClientInstance: PusherClient | null = null;

export const getPusherClient = () => {
  if (!pusherClientInstance && typeof window !== 'undefined') {
    pusherClientInstance = new PusherClient(
      process.env.NEXT_PUBLIC_PUSHER_KEY || '',
      {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || '',
        authEndpoint: "/api/pusher/auth",
      }
    );
  }
  return pusherClientInstance;
};
