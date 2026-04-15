import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface AdminPageHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  actions?: ReactNode;
}

export function AdminPageHeader({
  title,
  description,
  icon: Icon,
  actions,
}: AdminPageHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-3 flex-wrap">
      <div>
        <h1 className="text-2xl font-bold font-display flex items-center gap-2">
          {Icon ? <Icon className="h-6 w-6" /> : null}
          {title}
        </h1>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}
