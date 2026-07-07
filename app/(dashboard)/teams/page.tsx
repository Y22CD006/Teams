import { redirect } from "next/navigation";
import { getAuthUserId } from "@/lib/clerk";
import { getTeamsForUser } from "@/lib/services/team-service";

export default async function TeamsPage() {
  const userId = await getAuthUserId();
  if (!userId) redirect("/login");

  const teams = await getTeamsForUser(userId);
  const firstTeam = teams[0];
  if (firstTeam) redirect(`/teams/${firstTeam.id}`);

  return (
    <div className="flex h-full items-center justify-center">
      <p className="text-muted-foreground">No teams found. Create one to get started.</p>
    </div>
  );
}
