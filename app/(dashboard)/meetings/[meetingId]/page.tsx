import { VideoRoom } from "@/components/meetings/video-room";

export default async function MeetingPage({
  params,
}: {
  params: Promise<{ meetingId: string }>;
}) {
  const { meetingId } = await params;

  return (
    <div className="flex h-full flex-col">
      <VideoRoom roomName={meetingId} />
    </div>
  );
}
