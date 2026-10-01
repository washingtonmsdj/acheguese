import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";

export interface ActiveProfileIdentityData {
  id: string;
  displayName: string;
  avatarUrl?: string | null;
  username?: string | null;
}

/** Presentation only: show the exact profile supplied by the current session. */
export function ActiveProfileIdentity({ profile, context }: {
  profile: ActiveProfileIdentityData;
  context?: string;
}) {
  const initials = profile.displayName.split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word[0]).join("").toUpperCase();
  return (
    <section aria-label="Perfil ativo" className="flex min-w-0 shrink-0 items-center gap-2.5 rounded-xl border border-border bg-card px-3 py-2 text-foreground">
      <Avatar className="h-10 w-10 shrink-0">
        <AvatarImage src={profile.avatarUrl ?? undefined} alt="" />
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">Perfil ativo{context ? ` · ${context}` : ""}</p>
        <p className="break-words text-sm font-semibold [overflow-wrap:anywhere]">{profile.displayName}</p>
        {profile.username ? <p className="break-words text-xs text-muted-foreground [overflow-wrap:anywhere]">@{profile.username}</p> : null}
      </div>
    </section>
  );
}
