import { redirect } from "next/navigation";
import { getChannelsForTeam } from "@/lib/services/channel-service";
import { getAuthUserId } from "@/lib/clerk";

export default async function TeamPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;
  const userId = await getAuthUserId();
  if (!userId) redirect("/login");

  const channels = await getChannelsForTeam(teamId, userId);
  const firstChannel = channels[0];
  if (firstChannel) redirect(`/teams/${teamId}/channels/${firstChannel.id}`);

  return (
    <div className="flex h-full items-center justify-center">
      <p className="text-muted-foreground">No channels available.</p>
    </div>
  );
}
