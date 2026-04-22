/**
 * AdminIdentidadeLayout Component
 * 
 * Layout wrapper para a página de governança de identidade
 */

import type { AdminIdentidadeLayoutProps } from "../sections/types";

export function AdminIdentidadeLayout({ children }: AdminIdentidadeLayoutProps) {
  return <div className="space-y-6">{children}</div>;
}
