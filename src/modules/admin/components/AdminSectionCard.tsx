import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { cn } from "@/shared/utils/cn";

interface AdminSectionCardProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
  contentClassName?: string;
  headerClassName?: string;
}

export function AdminSectionCard({
  title,
  description,
  icon: Icon,
  actions,
  children,
  className,
  contentClassName,
  headerClassName,
}: AdminSectionCardProps) {
  return (
    <Card className={cn("border-border/70 shadow-sm", className)}>
      <CardHeader className={cn("space-y-3", headerClassName)}>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="min-w-0 space-y-1">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              {Icon ? (
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-primary/15 bg-primary/5 text-primary">
                  <Icon className="h-4 w-4" />
                </span>
              ) : null}
              <span>{title}</span>
            </CardTitle>
            {description ? (
              <CardDescription className="max-w-3xl">{description}</CardDescription>
            ) : null}
          </div>

          {actions ? <div className="flex items-center gap-2 flex-wrap">{actions}</div> : null}
        </div>
      </CardHeader>

      {children ? <CardContent className={cn("space-y-4", contentClassName)}>{children}</CardContent> : null}
    </Card>
  );
}
