import type { ReactNode } from "react";
import { cn } from "@/shared/utils/cn";

interface AdminStatsGridProps {
  children: ReactNode;
  className?: string;
}

export function AdminStatsGrid({ children, className }: AdminStatsGridProps) {
  return <div className={cn("grid gap-4 md:grid-cols-2 xl:grid-cols-4", className)}>{children}</div>;
}
