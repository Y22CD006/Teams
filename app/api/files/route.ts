import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { cacheGet, cacheSet, cacheDel } from "@/lib/redis";

export async function GET() {
  const { userId: authUserId } = await auth();
  const userId = authUserId as string;
  const session = userId ? { userId } : null;
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cacheKey = `user:${session.userId}:files`; const cached = await cacheGet<any>(cacheKey); if (cached) return NextResponse.json(cached);

  const files = await prisma.storedFile.findMany({
    where: {
      OR: [
        { uploadedById: session.userId },
        {
          team: {
            members: { some: { userId: session.userId } },
          },
        },
      ],
    },
    include: {
      uploadedBy: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const mapped = files.map((f) => ({
    id: f.id,
    name: f.name,
    type: f.type,
    size: f.size,
    uploadedBy: f.uploadedBy.name || f.uploadedBy.email,
    uploadedAt: f.createdAt.toISOString(),
  }));

  await cacheSet(cacheKey, { files: mapped }, 30);
  return NextResponse.json({ files: mapped });
}

export async function POST(req: NextRequest) {
  const { userId: authUserId } = await auth();
  const userId = authUserId as string;
  const session = userId ? { userId } : null;
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, type, size } = await req.json();

  const file = await prisma.storedFile.create({
    data: {
      name,
      type,
      size,
      uploadedById: session.userId,
    },
  });

  await prisma.activityEvent.create({
    data: {
      type: "FILE_UPLOADED",
      metadata: { fileName: name, fileType: type, fileSize: size },
      userId: session.userId,
    },
  });

  await cacheDel(`user:${session.userId}:files`);
  return NextResponse.json({ file }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const { userId: authUserId } = await auth();
  const userId = authUserId as string;
  const session = userId ? { userId } : null;
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await req.json();
    if (id) {
      await prisma.storedFile.deleteMany({
        where: { id, uploadedById: session.userId },
      });
    }
  } catch (err) {
    console.error("Error deleting file in DB:", err);
  }

  await cacheDel(`user:${session.userId}:files`);
  return NextResponse.json({ success: true });
}

export async function PATCH(req: NextRequest) {
  const { userId: authUserId } = await auth();
  const userId = authUserId as string;
  const session = userId ? { userId } : null;
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id, name } = await req.json();
    if (id && name) {
      await prisma.storedFile.updateMany({
        where: { id, uploadedById: session.userId },
        data: { name },
      });
    }
  } catch (err) {
    console.error("Error updating file in DB:", err);
  }

  await cacheDel(`user:${session.userId}:files`);
  return NextResponse.json({ success: true });
}
