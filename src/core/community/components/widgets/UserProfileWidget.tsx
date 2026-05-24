import { Link } from "react-router-dom";
import { memo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";
import { Badge } from "@/shared/components/ui/badge";
import { MapPin, ShieldCheck } from "lucide-react";
import { useSessionContext } from "@/core/session";
import { WidgetSkeleton } from "./WidgetSkeleton";

export const UserProfileWidget = memo(() => {
  const { activeProfile, isLoading } = useSessionContext();

  if (isLoading) {
    return <WidgetSkeleton variant="profile" hasHeader={false} />;
  }

  if (!activeProfile) return null;

  const getInitials = (name?: string | null): string => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const locationLabel = [activeProfile.neighborhood, activeProfile.city]
    .filter(Boolean)
    .join(", ");

  return (
    <Link
      to="/conta"
      className="block rounded-lg border border-border bg-card p-3 transition-all duration-200 hover:border-primary/50 hover:shadow-lg group"
    >
      <div className="flex items-start gap-2.5">
        <Avatar className="h-11 w-11 flex-shrink-0 ring-2 ring-primary/20 transition-all group-hover:ring-primary/40">
          <AvatarImage src={activeProfile.avatarUrl || undefined} />
          <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
            {getInitials(activeProfile.displayName)}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-1.5">
            <h3 className="truncate text-sm font-semibold leading-tight text-foreground transition-colors group-hover:text-primary">
              {activeProfile.displayName || "Usuario"}
            </h3>
            {activeProfile.verified ? <ShieldCheck className="h-3.5 w-3.5 flex-shrink-0 text-primary" /> : null}
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <Badge variant="secondary" className="h-5 px-1.5 text-[10px] capitalize">
              Perfil ativo
            </Badge>
            {locationLabel ? (
              <span className="inline-flex min-w-0 items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{locationLabel}</span>
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </Link>
  );
});

UserProfileWidget.displayName = "UserProfileWidget";
