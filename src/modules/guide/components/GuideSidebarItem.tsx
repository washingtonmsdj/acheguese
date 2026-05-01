/**
 * TouristPointsSidebarItem — Item de navegação para pontos turísticos
 *
 * Segue o padrão dos outros módulos territoriais.
 * Aparece sempre que há um território ativo resolvido.
 */

import { Link, useLocation } from 'react-router-dom';
import { Camera } from 'lucide-react';
import { SidebarMenuButton, SidebarMenuItem } from '@/shared/components/ui/sidebar';

export function GuideSidebarItem() {
  const { pathname } = useLocation();

  // ✅ Sempre exibe o item, mesmo sem território ativo
  // A URL do SSOT já tem fallback para cidade padrão
  const isActive = pathname.startsWith('/pontos-turisticos');

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={isActive} tooltip="Pontos turísticos">
        <Link to="/pontos-turisticos">
          <Camera className="h-4 w-4" />
          <span>Pontos turísticos</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
