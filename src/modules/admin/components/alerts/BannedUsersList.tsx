import {
  User,
  AlertTriangle,
  Flag,
  Ban,
  ShieldCheck,
  ShieldBan,
  Loader2,
} from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/utils/cn";
import type { Profile, AlertPost } from "@/modules/admin/hooks/useAlertData";

interface BannedUsersListProps {
  profiles: Profile[];
  alertPosts: AlertPost[];
  search: string;
  getPostReportCount: (postId: string) => number;
  actionLoading: string | null;
  onToggleBan: (profile: Profile) => void;
}

export function BannedUsersList({
  profiles,
  alertPosts,
  search,
  getPostReportCount,
  actionLoading,
  onToggleBan,
}: BannedUsersListProps) {
  const filteredProfiles = profiles
    .filter((p) => {
      const hasAlerts = alertPosts.some((a) => a.autor_id === p.id);
      const hasBan = p.alert_banned;
      const matchSearch =
        !search ||
        p.name?.toLowerCase().includes(search.toLowerCase()) ||
        p.neighborhood?.toLowerCase().includes(search.toLowerCase());
      return (hasAlerts || hasBan) && matchSearch;
    })
    .sort((a, b) => (b.alert_banned ? 1 : 0) - (a.alert_banned ? 1 : 0));

  if (filteredProfiles.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-12">
        Nenhum usuário com atividade de alertas.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {filteredProfiles.map((profile) => {
        const userAlerts = alertPosts.filter((p) => p.autor_id === profile.id);
        const userReportCount = userAlerts.reduce(
          (acc, p) => acc + getPostReportCount(p.id),
          0,
        );
        return (
          <div
            key={profile.id}
            className={cn(
              "bg-card rounded-xl border p-4 flex items-center gap-3",
              profile.alert_banned && "border-destructive/30 bg-destructive/5",
            )}
          >
            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center overflow-hidden shrink-0">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  className="h-full w-full object-cover"
                  alt=""
                />
              ) : (
                <User className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="text-sm font-medium">
                  {profile.name || "Usuário"}
                </p>
                {profile.alert_banned && (
                  <Badge
                    variant="destructive"
                    className="text-[10px] h-4 px-1.5 gap-0.5"
                  >
                    <Ban className="h-2.5 w-2.5" /> Banido
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                {profile.neighborhood && <span>{profile.neighborhood}</span>}
                <span className="flex items-center gap-1">
                  <AlertTriangle className="h-2.5 w-2.5" /> {userAlerts.length}{" "}
                  {userAlerts.length === 1 ? "alerta" : "alertas"}
                </span>
                {userReportCount > 0 && (
                  <span className="flex items-center gap-1 text-destructive">
                    <Flag className="h-2.5 w-2.5" /> {userReportCount}{" "}
                    {userReportCount === 1 ? "denúncia" : "denúncias"}
                  </span>
                )}
              </div>
            </div>
            <Button
              variant={profile.alert_banned ? "outline" : "destructive"}
              size="sm"
              className="gap-1.5 shrink-0"
              disabled={actionLoading === profile.id}
              onClick={() => onToggleBan(profile)}
            >
              {actionLoading === profile.id ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : profile.alert_banned ? (
                <>
                  <ShieldCheck className="h-3.5 w-3.5" /> Desbanir
                </>
              ) : (
                <>
                  <ShieldBan className="h-3.5 w-3.5" /> Banir
                </>
              )}
            </Button>
          </div>
        );
      })}
    </div>
  );
}
