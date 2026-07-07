import { Webhook } from "svix";

export function verifyClerkWebhook(payload: string, headers: Record<string, string>): any {
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET!);
  return wh.verify(payload, headers);
}
