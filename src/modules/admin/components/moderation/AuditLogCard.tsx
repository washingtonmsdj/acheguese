import { History } from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";

interface AuditLogCardProps {
  log: any;
  adminUser: any;
}

export function AuditLogCard({ log, adminUser }: AuditLogCardProps) {
  return (
    <div className="bg-card rounded-xl border p-4">
      <div className="flex items-start gap-3">
        <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center shrink-0">
          <History className="h-4 w-4 text-muted-foreground" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <Badge variant="secondary" className="text-[10px] capitalize">
              {log.action_type}
            </Badge>
            <Badge variant="outline" className="text-[10px]">
              {log.target_type}
            </Badge>
            <span className="text-[10px] text-muted-foreground ml-auto">
              {log.created_at
                ? new Date(log.created_at).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : ""}
            </span>
          </div>
          {log.details && (
            <p className="text-sm text-muted-foreground">{log.details}</p>
          )}
          <p className="text-[10px] text-muted-foreground mt-1">
            Admin: {adminUser?.name || "Admin"}
          </p>
        </div>
      </div>
    </div>
  );
}
