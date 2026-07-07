import { MessageBubble } from "./message-bubble";

type Message = {
  id: string;
  content: string;
  createdAt: Date;
  author: { id: string; name: string | null; username: string; imageUrl: string | null };
  threadReplies?: Array<{ id: string }>;
};

export function MessageList({ messages }: { messages: Message[] }) {
  return (
    <div className="flex-1 space-y-1 overflow-auto p-4">
      {messages.map((msg) => (
        <MessageBubble key={msg.id} message={msg} />
      ))}
    </div>
  );
}
