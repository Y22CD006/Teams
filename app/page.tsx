import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Dashboard } from "@/components/dashboard/dashboard";
import { prisma } from "@/lib/prisma";

export default async function Home() {
  const session = await getSession();
  if (!session) redirect("/login");

  const dbUser = await prisma.user.findUnique({
    where: { id: session.userId }
  });
  if (!dbUser) redirect("/login");

  return <Dashboard dbUser={dbUser} />;
}
