export function ThreadPanel() {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b px-4 py-3">
        <h3 className="font-semibold">Thread</h3>
      </div>
      <div className="flex-1 p-4">
        <p className="text-sm text-muted-foreground">Select a message to view its thread.</p>
      </div>
    </div>
  );
}
