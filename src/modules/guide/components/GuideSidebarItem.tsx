/**
 * TouristPointsSidebarItem — Item de navegação para pontos turísticos
 *
 * Segue o padrão dos outros módulos territoriais.
 * Aparece sempre que há um território ativo resolvido.
 */

import { Link, useLocation } from 'react-router-dom';
import { Camera } from 'lucide-react';
import { SidebarMenuButton, SidebarMenuItem } from '@/shared/components/ui/sidebar';
import { APP_MODULE_SLUGS, buildAppModulePath, isAppModulePath } from '@/config/moduleSlugs';

const TOURIST_POINTS_ROOT_PATH = buildAppModulePath(APP_MODULE_SLUGS.touristPoints);

export function GuideSidebarItem() {
  const { pathname } = useLocation();

  // ✅ Sempre exibe o item, mesmo sem território ativo
  // A URL do SSOT já tem fallback para cidade padrão
  const isActive = isAppModulePath(pathname, APP_MODULE_SLUGS.touristPoints);

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={isActive} tooltip="Pontos turísticos">
        <Link to={TOURIST_POINTS_ROOT_PATH}>
          <Camera className="h-4 w-4" />
          <span>Pontos turísticos</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
