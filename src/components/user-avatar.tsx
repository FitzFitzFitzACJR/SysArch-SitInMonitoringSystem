import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export function initials(firstName: string, lastName: string) {
  return `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();
}

export function UserAvatar({
  firstName,
  lastName,
  photoUrl,
  className,
}: {
  firstName: string;
  lastName: string;
  photoUrl?: string | null;
  className?: string;
}) {
  return (
    <Avatar className={cn("size-8", className)}>
      {photoUrl && <AvatarImage src={photoUrl} alt="" className="object-cover" />}
      <AvatarFallback className="text-xs">{initials(firstName, lastName)}</AvatarFallback>
    </Avatar>
  );
}
