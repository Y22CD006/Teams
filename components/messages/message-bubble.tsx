type Message = {
  id: string;
  content: string;
  createdAt: Date;
  author: { id: string; name: string | null; username: string; imageUrl: string | null };
  threadReplies?: Array<{ id: string }>;
};

export function MessageBubble({ message }: { message: Message }) {
  return (
    <div className="group flex gap-3 rounded-lg px-4 py-2 hover:bg-muted/50">
      <div className="h-8 w-8 rounded-full bg-muted" />
      <div className="flex-1">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-semibold">{message.author.name || message.author.username}</span>
          <span className="text-xs text-muted-foreground">{message.createdAt.toLocaleTimeString()}</span>
        </div>
        <p className="text-sm">{message.content}</p>
        {message.threadReplies && message.threadReplies.length > 0 && (
          <button className="mt-1 text-xs font-medium text-brand-600 hover:underline">
            {message.threadReplies.length} {message.threadReplies.length === 1 ? "reply" : "replies"}
          </button>
        )}
      </div>
    </div>
  );
}
