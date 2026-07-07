export function SearchBar() {
  return (
    <div className="relative">
      <input
        type="text"
        placeholder="Search messages, files, people..."
        className="w-full rounded-md border bg-background px-3 py-1.5 text-sm outline-none"
      />
    </div>
  );
}
