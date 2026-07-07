import { getChannelById } from "@/lib/services/channel-service";
import { getMessagesForChannel } from "@/lib/services/message-service";
import { MessageList } from "@/components/messages/message-list";
import { MessageInput } from "@/components/messages/message-input";

export default async function ChannelPage({
  params,
}: {
  params: Promise<{ teamId: string; channelId: string }>;
}) {
  const { channelId } = await params;
  const [channel, messages] = await Promise.all([
    getChannelById(channelId),
    getMessagesForChannel(channelId),
  ]);

  return (
    <div className="flex h-full flex-col">
      <div className="border-b px-6 py-3">
        <h1 className="text-lg font-semibold"># {channel?.name}</h1>
        {channel?.description && (
          <p className="text-sm text-muted-foreground">{channel.description}</p>
        )}
      </div>
      <MessageList messages={messages} />
      <MessageInput channelId={channelId} />
    </div>
  );
}
