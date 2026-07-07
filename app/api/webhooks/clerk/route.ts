import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const payload = await req.text();

  try {
    const event = JSON.parse(payload);
    const { type, data } = event;

    if (type === "user.created") {
      await prisma.user.upsert({
        where: { id: data.id },
        update: { email: data.email_addresses[0]?.email_address, name: `${data.first_name} ${data.last_name}`.trim() || undefined, imageUrl: data.image_url },
        create: { id: data.id, email: data.email_addresses[0]?.email_address, username: data.username || data.email_addresses[0]?.email_address.split("@")[0], name: `${data.first_name} ${data.last_name}`.trim() || undefined, imageUrl: data.image_url },
      });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
}
