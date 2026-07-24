import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function POST() {
  const { userId: authUserId } = await auth();
  const userId = authUserId as string;
  const session = userId ? { userId } : null;
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  return NextResponse.json({ message: "Upload endpoint ready for UploadThing integration" });
}

