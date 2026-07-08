import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

  return NextResponse.json({ files: mapped });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
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

  return NextResponse.json({ file }, { status: 201 });
}
