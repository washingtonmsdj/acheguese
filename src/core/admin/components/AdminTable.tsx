import type { ReactNode } from "react";
import { Table } from "@/shared/components/ui/table";
import { cn } from "@/shared/utils/cn";

interface AdminTableProps {
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  tableClassName?: string;
}

export function AdminTable({
  children,
  footer,
  className,
  tableClassName,
}: AdminTableProps) {
  return (
    <div className={cn("overflow-hidden rounded-xl border border-border/70 bg-background", className)}>
      <Table className={cn("min-w-[720px]", tableClassName)}>{children}</Table>

      {footer ? <div className="border-t bg-muted/10 px-4 py-3">{footer}</div> : null}
    </div>
  );
}
