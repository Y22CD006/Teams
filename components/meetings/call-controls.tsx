export function CallControls() {
  return (
    <div className="flex items-center justify-center gap-4 border-t bg-background p-4">
      <button className="rounded-full bg-muted p-3 hover:bg-muted/80">Mute</button>
      <button className="rounded-full bg-muted p-3 hover:bg-muted/80">Camera</button>
      <button className="rounded-full bg-muted p-3 hover:bg-muted/80">Share</button>
      <button className="rounded-full bg-destructive p-3 text-destructive-foreground">Leave</button>
    </div>
  );
}
