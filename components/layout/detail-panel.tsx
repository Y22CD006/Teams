export function DetailPanel({ children }: { children?: React.ReactNode }) {
  return (
    <aside className="w-80 border-l bg-background">
      {children}
    </aside>
  );
}
