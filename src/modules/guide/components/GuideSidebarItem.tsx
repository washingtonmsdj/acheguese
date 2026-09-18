/**
 * TouristPointsSidebarItem — Item de navegação para pontos turísticos
 *
 * Segue o padrão dos outros módulos territoriais.
 * Aparece sempre que há um território ativo resolvido.
 */

import { Link, useLocation } from 'react-router-dom';
import { Camera } from 'lucide-react';
import { SidebarMenuButton, SidebarMenuItem } from '@/shared/components/ui/sidebar';
import { APP_MODULE_SLUGS, isAppModulePath } from '@/shared/config/moduleSlugs';
import { useTouristPointPublicUrls } from '@/core/guide/tourist-points/routes/useTouristPointPublicUrls';

export function GuideSidebarItem() {
  const { pathname } = useLocation();
  const touristPointUrls = useTouristPointPublicUrls();

  // The canonical URL owner provides the launch-city fallback when no
  // active territory is available.
  const isActive = isAppModulePath(pathname, APP_MODULE_SLUGS.touristPoints);

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={isActive} tooltip="Pontos turísticos">
        <Link to={touristPointUrls.touristPoints}>
          <Camera className="h-4 w-4" />
          <span>Pontos turísticos</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
