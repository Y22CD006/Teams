export function MessageInput({ channelId, dmId }: { channelId?: string; dmId?: string }) {
  return (
    <div className="border-t p-4">
      <div className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2">
        <input
          type="text"
          placeholder="Send a message..."
          className="flex-1 bg-transparent text-sm outline-none"
        />
      </div>
    </div>
  );
}
