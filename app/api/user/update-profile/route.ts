import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { userId: authUserId } = await auth();
  const userId = authUserId as string;
  const session = userId ? { userId } : null;
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { firstName, middleName, lastName, phoneNumber } = await req.json();

    if (!firstName || !lastName || !phoneNumber) {
      return NextResponse.json({ error: "First name, last name, and phone number are required" }, { status: 400 });
    }

    const finalName = `${firstName} ${middleName ? middleName + " " : ""}${lastName}`.trim();

    const updatedUser = await prisma.user.update({
      where: { id: session.userId },
      data: { name: finalName, firstName, middleName, lastName, phoneNumber },
    });

    return NextResponse.json({ 
      user: { 
        id: updatedUser.id, 
        email: updatedUser.email, 
        name: updatedUser.name, 
        phoneNumber: updatedUser.phoneNumber 
      } 
    });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

