import { MessageList } from "@/components/messages/message-list";
import { MessageInput } from "@/components/messages/message-input";
import { getMessagesForDM } from "@/lib/services/message-service";

export default async function DMPage({
  params,
}: {
  params: Promise<{ dmId: string }>;
}) {
  const { dmId } = await params;
  const messages = await getMessagesForDM(dmId);

  return (
    <div className="flex h-full flex-col">
      <div className="border-b px-6 py-3">
        <h1 className="text-lg font-semibold">Direct Message</h1>
      </div>
      <MessageList messages={messages} />
      <MessageInput dmId={dmId} />
    </div>
  );
}
