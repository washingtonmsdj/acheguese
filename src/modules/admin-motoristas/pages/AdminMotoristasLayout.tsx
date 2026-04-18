/**
 * AdminMotoristasLayout
 * 
 * Layout wrapper para a página de gestão de motoristas
 */

import { TooltipProvider } from "@/shared/components/ui/tooltip";

interface AdminMotoristasLayoutProps {
  readonly children: React.ReactNode;
}

export function AdminMotoristasLayout({ children }: AdminMotoristasLayoutProps) {
  return (
    <TooltipProvider>
      <div className="space-y-6">{children}</div>
    </TooltipProvider>
  );
}
