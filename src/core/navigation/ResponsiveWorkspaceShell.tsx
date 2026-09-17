import type { ReactNode } from "react";
import { BottomNav } from "@/core/navigation/BottomNav";
import { SidebarProvider } from "@/shared/components/ui/sidebar";
import { cn } from "@/shared/utils/cn";

interface ResponsiveWorkspaceShellProps {
  navigation: ReactNode;
  header: ReactNode;
  children: ReactNode;
  mainId?: string;
  mainClassName?: string;
  prefetchRoute?: (href: string) => void;
}

/** Shared responsive frame for authenticated workspaces with their own navigation. */
export function ResponsiveWorkspaceShell({
  navigation,
  header,
  children,
  mainId,
  mainClassName,
  prefetchRoute,
}: ResponsiveWorkspaceShellProps) {
  return (
    <SidebarProvider>
      <div
        className="min-h-screen flex w-full bg-background"
        data-layout-shell="workspace"
      >
        {navigation}
        <div className="flex min-w-0 w-full flex-1 flex-col">
          {header}
          <main
            id={mainId}
            className={cn("min-w-0 w-full flex-1", mainClassName)}
            tabIndex={mainId ? -1 : undefined}
          >
            {children}
          </main>
        </div>
      </div>
      <BottomNav prefetchRoute={prefetchRoute} />
    </SidebarProvider>
  );
}
