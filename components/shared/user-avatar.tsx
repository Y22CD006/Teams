import { UserStatus } from "@prisma/client";

const statusColors: Record<UserStatus, string> = {
  AVAILABLE: "bg-green-500",
  BUSY: "bg-red-500",
  AWAY: "bg-yellow-500",
  OFFLINE: "bg-gray-400",
};

export function UserAvatar({
  imageUrl,
  name,
  status,
  size = "md",
}: {
  imageUrl?: string | null;
  name?: string | null;
  status?: UserStatus;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClasses = { sm: "h-6 w-6", md: "h-8 w-8", lg: "h-10 w-10" };

  return (
    <div className={`relative ${sizeClasses[size]}`}>
      {imageUrl ? (
        <img src={imageUrl} alt={name || ""} className="h-full w-full rounded-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center rounded-full bg-brand-600 text-xs font-semibold text-white">
          {name?.charAt(0)?.toUpperCase() || "?"}
        </div>
      )}
      {status && (
        <span className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full ring-2 ring-background ${statusColors[status]}`} />
      )}
    </div>
  );
}
